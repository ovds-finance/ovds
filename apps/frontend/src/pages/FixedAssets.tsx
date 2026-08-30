/**
 * FixedAssets — ovds-style fixed asset register
 * AppPage · AppKpi · AppTable · useApiCrud
 * IAS 16 (cost + revaluation + disposal model) · IAS 36 (impairment) · Ethiopian depreciation rules
 * New: Depreciation Schedule modal · Asset Disposal workflow (IAS 16.67)
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Building2, Plus, Edit2, Trash2, Download, RefreshCw,
  TrendingDown, Zap, Scale, AlertTriangle, BarChart3, PackageX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';
import { revalueFixedAsset, testAssetImpairment } from '../services/ifrsApi';
import api from '../services/api';
import { fixedAssetDisposalsApi } from '../services/ovdsApi';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, Amount, EmptyState, Pagination, IFRSBadge,
} from '../components/ui';

interface FixedAsset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  status: string;
  location?: string;
  serialNumber?: string;
  companyId?: string;
  notes?: string;
  accumulatedDepreciation?: number;
  netBookValue?: number;
}

interface ScheduleRow {
  year: number;
  openingNBV: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;
  closingNBV: number;
}

interface ScheduleData {
  assetName: string;
  method: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  currentNBV: number;
  accumulatedDepreciation: number;
  schedule: ScheduleRow[];
}

type FilterTab = 'ALL' | 'ACTIVE' | 'DISPOSED' | 'UNDER_MAINTENANCE';

const CATEGORIES = ['BUILDING', 'VEHICLE', 'MACHINERY', 'FURNITURE', 'COMPUTER', 'EQUIPMENT', 'LAND', 'OTHER'];

/** IAS 16 straight-line depreciation */
const calcAnnualDepreciation = (cost: number, salvage: number, life: number) =>
  life > 0 ? (cost - salvage) / life : 0;

const AssetForm: React.FC<{ data: Partial<FixedAsset>; onChange: (d: Partial<FixedAsset>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof FixedAsset, v: any) => onChange({ ...data, [k]: v });
  const annualDep = calcAnnualDepreciation(
    Number(data.purchaseCost ?? 0),
    Number(data.salvageValue ?? 0),
    Number(data.usefulLifeYears ?? 1),
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Asset Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Office Building" />
        </FormField>
        <FormField label="Category">
          <Select value={data.category ?? 'EQUIPMENT'} onChange={e => set('category', e)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Purchase Date" required>
          <Input type="date" value={data.purchaseDate?.slice(0, 10) ?? ''} onChange={e => set('purchaseDate', e.target.value)} />
        </FormField>
        <FormField label="Purchase Cost (ETB)" required>
          <Input type="number" step="0.01" value={data.purchaseCost ?? ''} onChange={e => set('purchaseCost', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Salvage Value (ETB)">
          <Input type="number" step="0.01" value={data.salvageValue ?? ''} onChange={e => set('salvageValue', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Useful Life (Years)">
          <Input type="number" value={data.usefulLifeYears ?? ''} onChange={e => set('usefulLifeYears', parseInt(e.target.value) || 1)} placeholder="5" />
        </FormField>
      </div>
      <FormField label="Depreciation Method" hint="IAS 16.62 — choose the method that best reflects the pattern of consumption">
        <Select value={data.depreciationMethod ?? 'STRAIGHT_LINE'} onChange={e => set('depreciationMethod', e)}>
          <option value="STRAIGHT_LINE">Straight-Line (IAS 16.62a)</option>
          <option value="DECLINING_BALANCE">Declining Balance (IAS 16.62b)</option>
          <option value="UNITS_OF_PRODUCTION">Units of Production (IAS 16.62c)</option>
        </Select>
      </FormField>
      {annualDep > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[11px]">
          <span className="text-indigo-700 font-semibold">IAS 16 Annual Depreciation (SL estimate):</span>
          <span className="font-bold text-indigo-800">{fmtETB(annualDep)}/year</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Location">
          <Input value={data.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="Office, Warehouse…" />
        </FormField>
        <FormField label="Serial Number">
          <Input value={data.serialNumber ?? ''} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-XXXX" />
        </FormField>
      </div>
    </div>
  );
};

const FixedAssets: React.FC = () => {
  usePageTitle('Fixed Assets');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<FixedAsset> }>({ open: false, data: {} });

  // IAS 16 Revaluation state
  const [revalAsset, setRevalAsset]   = useState<FixedAsset | null>(null);
  const [revalSaving, setRevalSaving] = useState(false);
  const [revalForm, setRevalForm]     = useState({ fairValue: '', valuationDate: new Date().toISOString().slice(0, 10), valuationBasis: 'MARKET_VALUE', notes: '' });

  // IAS 36 Impairment state
  const [impairAsset, setImpairAsset]   = useState<FixedAsset | null>(null);
  const [impairSaving, setImpairSaving] = useState(false);
  const [impairForm, setImpairForm]     = useState({ recoverableAmount: '', testDate: new Date().toISOString().slice(0, 10), basis: 'VALUE_IN_USE' as const, notes: '' });

  // IAS 16.67 Disposal state
  const [disposeAsset, setDisposeAsset]   = useState<FixedAsset | null>(null);
  const [disposeSaving, setDisposeSaving] = useState(false);
  const [disposeForm, setDisposeForm]     = useState({
    disposalDate:   new Date().toISOString().slice(0, 10),
    proceedsAmount: '',
    disposalMethod: 'SALE' as 'SALE' | 'SCRAP' | 'DONATION' | 'WRITE_OFF',
    notes: '',
  });

  // Depreciation Schedule state
  const [scheduleAsset,  setScheduleAsset]  = useState<FixedAsset | null>(null);
  const [scheduleData,   setScheduleData]   = useState<ScheduleData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<FixedAsset>({
    endpoint: '/ovds/fixed-assets',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(a => a.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => [a.name, a.category, a.location, a.serialNumber].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    const totalCost   = rows.reduce((s, a) => s + Number(a.purchaseCost ?? 0), 0);
    const totalNbv    = rows.reduce((s, a) => s + Number(a.netBookValue ?? a.purchaseCost ?? 0), 0);
    const totalAccDep = rows.reduce((s, a) => s + Number(a.accumulatedDepreciation ?? 0), 0);
    return [
      { label: 'Total Assets',     value: rows.length,                                   color: 'emerald' as const },
      { label: 'Active',           value: rows.filter(a => a.status === 'ACTIVE').length, color: 'sky'     as const },
      { label: 'Total Cost',       value: fmtETB(totalCost),                              color: 'violet'  as const },
      { label: 'Net Book Value',   value: fmtETB(totalNbv),                               color: 'amber'   as const },
      { label: 'Accumulated Dep.', value: fmtETB(totalAccDep),                            color: 'rose'    as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Asset name is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  // -- IAS 16 Revaluation -----------------------------------------------------
  const handleRevalue = async () => {
    if (!revalAsset || !revalForm.fairValue || parseFloat(revalForm.fairValue) <= 0) { toast.error('Enter a valid fair value'); return; }
    setRevalSaving(true);
    try {
      const result = await revalueFixedAsset(revalAsset.id, { fairValue: parseFloat(revalForm.fairValue), valuationDate: revalForm.valuationDate, valuationBasis: revalForm.valuationBasis, notes: revalForm.notes || undefined });
      toast.success(`Revalued — ${result.direction === 'INCREASE' ? 'Surplus to OCI' : 'Decrease to P&L'}: ${fmtETB(Math.abs(result.revaluationDiff))}`);
      setRevalAsset(null); refetch();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Revaluation failed'); }
    finally { setRevalSaving(false); }
  };

  // -- IAS 36 Impairment ------------------------------------------------------
  const handleImpairment = async () => {
    if (!impairAsset || !impairForm.recoverableAmount || parseFloat(impairForm.recoverableAmount) < 0) { toast.error('Enter a valid recoverable amount'); return; }
    setImpairSaving(true);
    try {
      const result = await testAssetImpairment(impairAsset.id, { recoverableAmount: parseFloat(impairForm.recoverableAmount), testDate: impairForm.testDate, basis: impairForm.basis, notes: impairForm.notes || undefined });
      if (result.result === 'NO_IMPAIRMENT') toast.success('No impairment — carrying amount ≤ recoverable amount');
      else toast.success(`Impairment loss ${fmtETB(result.impairmentLoss)} posted to P&L`);
      setImpairAsset(null); refetch();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Impairment test failed'); }
    finally { setImpairSaving(false); }
  };

  // -- IAS 16.67 Disposal -----------------------------------------------------
  const handleDispose = async () => {
    if (!disposeAsset) return;
    if (!await confirm({
      title:        `Dispose "${disposeAsset.name}"?`,
      message:      `This will derecognise the asset and post a gain/loss on disposal journal entry (IAS 16.67). This action cannot be undone.`,
      confirmLabel: 'Dispose Asset',
      variant:      'danger',
    })) return;

    setDisposeSaving(true);
    try {
      const d = await fixedAssetDisposalsApi.dispose({
        companyId: selectedCompanyId!,
        assetId: disposeAsset.id,
        disposalType: disposeForm.disposalMethod,
        disposalDate: disposeForm.disposalDate,
        proceeds: disposeForm.proceedsAmount ? parseFloat(disposeForm.proceedsAmount) : 0,
        notes: disposeForm.notes || undefined,
      });
      const gl = d.gainLoss >= 0
        ? `Gain on disposal: ${fmtETB(d.gainLoss)}`
        : `Loss on disposal: ${fmtETB(Math.abs(d.gainLoss))}`;
      toast.success(`Asset disposed — ${gl}`);
      setDisposeAsset(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Disposal failed');
    } finally {
      setDisposeSaving(false);
    }
  };

  // -- Depreciation Schedule --------------------------------------------------
  const [postedSchedule, setPostedSchedule] = useState<any>(null);
  const [postedLoading,  setPostedLoading]  = useState(false);
  const [scheduleTab,    setScheduleTab]    = useState<'preview' | 'posted'>('preview');

  const openSchedule = useCallback(async (asset: FixedAsset) => {
    setScheduleAsset(asset);
    setScheduleData(null);
    setPostedSchedule(null);
    setScheduleTab('preview');
    setScheduleLoading(true);
    try {
      const q = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const res = await api.get(`/ovds/fixed-assets/${asset.id}/schedule${q}`);
      setScheduleData(res.data?.data ?? res.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedCompanyId]);

  const loadPostedSchedule = useCallback(async (assetId: string) => {
    setPostedLoading(true);
    try {
      const q = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const res = await api.get(`/ovds/fixed-assets/${assetId}/posted-schedule${q}`);
      setPostedSchedule(res.data?.data ?? res.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load posted schedule');
    } finally {
      setPostedLoading(false);
    }
  }, [selectedCompanyId]);

  const handleExport = () => {
    const headers = 'Name,Category,Purchase Date,Cost,Salvage,Life,Method,Status\n';
    const csvRows = filtered.map(a =>
      `"${a.name}","${a.category}","${a.purchaseDate}",${a.purchaseCost},${a.salvageValue},${a.usefulLifeYears},"${a.depreciationMethod}","${a.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `fixed-assets-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const [depreciating, setDepreciating] = useState(false);
  const handleDepreciateAll = async () => {
    if (!await confirm({ title: 'Post Monthly Depreciation?', message: `This will post IAS 16 depreciation journal entries for all ${rows.filter(a => a.status === 'ACTIVE').length} active assets for the current period. Entries already posted this period will be skipped.`, variant: 'warning' })) return;
    setDepreciating(true);
    try {
      const period = new Date().toISOString().slice(0, 7);
      const res = await api.post('/ovds/fixed-assets/depreciate-all', { period });
      const d = res.data?.data ?? res.data;
      toast.success(`Depreciation posted: ${d?.posted ?? 0} entries (${d?.skipped ?? 0} skipped, ${d?.errors ?? 0} errors)`);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post depreciation');
    } finally {
      setDepreciating(false);
    }
  };

  // Dispose gain/loss preview
  const disposeNBV     = Number(disposeAsset?.netBookValue ?? disposeAsset?.purchaseCost ?? 0);
  const disposeProceeds = disposeForm.proceedsAmount ? parseFloat(disposeForm.proceedsAmount) : 0;
  const disposeGainLoss = disposeProceeds - disposeNBV;

  return (
    <AppPage
      title="Fixed Assets"
      subtitle="Asset register · IAS 16 depreciation · IAS 16.67 disposal · IFRS compliance · Manufacturing & Logistics · Healthcare & Pharmaceuticals · Banking & ovds · Investment Trends · Market Value"
      icon={<Building2 size={18} />}
      crumbs={[{ label: 'Fixed Assets' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',               label: 'All',         count: rows.length },
            { key: 'ACTIVE',            label: 'Active',      count: rows.filter(a => a.status === 'ACTIVE').length },
            { key: 'DISPOSED',          label: 'Disposed',    count: rows.filter(a => a.status === 'DISPOSED').length },
            { key: 'UNDER_MAINTENANCE', label: 'Maintenance', count: rows.filter(a => a.status === 'UNDER_MAINTENANCE').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <IFRSBadge standard="IAS 16" compliant />
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('fixed_assets:write') && (
            <Btn variant="secondary" size="sm" icon={depreciating ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />} onClick={handleDepreciateAll} loading={depreciating}>
              Post Depreciation
            </Btn>
          )}
          {can('fixed_assets:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { status: 'ACTIVE', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 5 } })}>
              Add Asset
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search assets…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} assets</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Asset</AppTh>
          <AppTh>Category</AppTh>
          <AppTh align="right">Cost</AppTh>
          <AppTh align="right">Acc. Dep.</AppTh>
          <AppTh align="right">NBV</AppTh>
          <AppTh>Method</AppTh>
          <AppTh>Life</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={9}><EmptyState icon={<Building2 size={18} />} title="No fixed assets" desc="Register your first asset to track depreciation" action={can('fixed_assets:write') ? { label: 'Add Asset', onClick: () => setModal({ open: true, data: { status: 'ACTIVE', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 5 } }) } : undefined} /></td></tr>
          ) : filtered.map(a => (
            <AppTr key={a.id}>
              <AppTd>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{a.name}</p>
                  {a.location && <p className="ovds-caption">{a.location}</p>}
                </div>
              </AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{a.category.replace(/_/g, ' ')}</span></AppTd>
              <AppTd align="right"><Amount value={Number(a.purchaseCost)} size="sm" /></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold text-amber-600 tabular-nums">{fmtETB(Number(a.accumulatedDepreciation ?? 0))}</span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold text-emerald-700 tabular-nums">{fmtETB(Number(a.netBookValue ?? a.purchaseCost))}</span></AppTd>
              <AppTd><span className="text-[10px] text-slate-500">{a.depreciationMethod.replace(/_/g, ' ').split(' ')[0]}</span></AppTd>
              <AppTd><span className="text-[11px] font-semibold text-slate-600">{a.usefulLifeYears}y</span></AppTd>
              <AppTd><StatusBadge status={a.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Depreciation Schedule */}
                  <button title="Depreciation Schedule" onClick={() => openSchedule(a)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all"><BarChart3 size={11} /></button>
                  {can('fixed_assets:write') && a.status !== 'DISPOSED' && (
                    <>
                      {/* Revalue */}
                      <button title="IAS 16 Revalue" onClick={() => { setRevalForm({ fairValue: '', valuationDate: new Date().toISOString().slice(0, 10), valuationBasis: 'MARKET_VALUE', notes: '' }); setRevalAsset(a); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all"><Scale size={11} /></button>
                      {/* Impairment */}
                      <button title="IAS 36 Impairment Test" onClick={() => { setImpairForm({ recoverableAmount: '', testDate: new Date().toISOString().slice(0, 10), basis: 'VALUE_IN_USE', notes: '' }); setImpairAsset(a); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all"><AlertTriangle size={11} /></button>
                      {/* Dispose */}
                      <button title="Dispose Asset (IAS 16.67)" onClick={() => { setDisposeForm({ disposalDate: new Date().toISOString().slice(0, 10), proceedsAmount: '', disposalMethod: 'SALE', notes: '' }); setDisposeAsset(a); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><PackageX size={11} /></button>
                      {/* Edit */}
                      <button title="Edit" onClick={() => setModal({ open: true, data: { ...a } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Edit2 size={11} /></button>
                    </>
                  )}
                  {/* Delete */}
                  <button title="Delete" onClick={async () => { if (await confirm({ title: `Delete "${a.name}"?`, variant: 'danger' })) remove(a.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>

      {/* -- Add / Edit Modal ------------------------------------------------- */}
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.name}` : 'Add Fixed Asset'} subtitle="IAS 16 · Cost model · IFRS"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Add Asset'}</Btn></>}>
        <AssetForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* -- IAS 16 Revaluation Modal ----------------------------------------- */}
      <Modal open={!!revalAsset} onClose={() => setRevalAsset(null)} title={`Revalue: ${revalAsset?.name ?? ''}`} subtitle="IAS 16.31 — Revaluation Model · Posts journal entry to OCI or P&L"
        footer={<><Btn variant="secondary" onClick={() => setRevalAsset(null)}>Cancel</Btn><Btn variant="primary" loading={revalSaving} onClick={handleRevalue}>Post Revaluation</Btn></>}>
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[11px] space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Current NBV</span><span className="font-bold">{fmtETB(Number(revalAsset?.netBookValue ?? revalAsset?.purchaseCost ?? 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Accumulated Dep.</span><span className="font-semibold text-amber-600">{fmtETB(Number(revalAsset?.accumulatedDepreciation ?? 0))}</span></div>
          </div>
          <FormField label="Fair Value (ETB)" required hint="Determined by independent valuer or active market price">
            <Input type="number" step="0.01" value={revalForm.fairValue} onChange={e => setRevalForm(f => ({ ...f, fairValue: e.target.value }))} placeholder="0.00" autoFocus />
          </FormField>
          {revalForm.fairValue && (() => { const diff = parseFloat(revalForm.fairValue) - Number(revalAsset?.netBookValue ?? revalAsset?.purchaseCost ?? 0); return <div className={`flex items-center justify-between p-3 rounded-xl border text-[11px] font-bold ${diff >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}><span>{diff >= 0 ? '▲ Increase → Cr Revaluation Surplus (OCI)' : '▼ Decrease → Dr P&L'}</span><span>{fmtETB(Math.abs(diff))}</span></div>; })()}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valuation Date"><Input type="date" value={revalForm.valuationDate} onChange={e => setRevalForm(f => ({ ...f, valuationDate: e.target.value }))} /></FormField>
            <FormField label="Basis"><Select value={revalForm.valuationBasis} onChange={e => setRevalForm(f => ({ ...f, valuationBasis: e }))}><option value="MARKET_VALUE">Market Value</option><option value="DEPRECIATED_REPLACEMENT_COST">Depreciated Replacement Cost</option><option value="INDEPENDENT_VALUATION">Independent Valuation</option></Select></FormField>
          </div>
          <FormField label="Notes"><Textarea value={revalForm.notes} onChange={e => setRevalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Valuer name, report reference…" rows={2} /></FormField>
        </div>
      </Modal>

      {/* -- IAS 36 Impairment Modal ------------------------------------------ */}
      <Modal open={!!impairAsset} onClose={() => setImpairAsset(null)} title={`Impairment Test: ${impairAsset?.name ?? ''}`} subtitle="IAS 36 — Impairment of Assets · Carrying amount vs recoverable amount"
        footer={<><Btn variant="secondary" onClick={() => setImpairAsset(null)}>Cancel</Btn><Btn variant="primary" loading={impairSaving} onClick={handleImpairment}>Run Test</Btn></>}>
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-500">Carrying Amount (NBV)</span><span className="font-bold">{fmtETB(Number(impairAsset?.netBookValue ?? impairAsset?.purchaseCost ?? 0))}</span></div>
          </div>
          <FormField label="Recoverable Amount (ETB)" required hint="Higher of Value in Use and Fair Value less Costs of Disposal (IAS 36.18)">
            <Input type="number" step="0.01" value={impairForm.recoverableAmount} onChange={e => setImpairForm(f => ({ ...f, recoverableAmount: e.target.value }))} placeholder="0.00" autoFocus />
          </FormField>
          {impairForm.recoverableAmount && (() => { const loss = Math.max(0, Number(impairAsset?.netBookValue ?? impairAsset?.purchaseCost ?? 0) - parseFloat(impairForm.recoverableAmount)); return <div className={`flex items-center justify-between p-3 rounded-xl border text-[11px] font-bold ${loss > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}><span>{loss > 0 ? '▼ Impairment Loss → Dr P&L' : '✓ No impairment required'}</span>{loss > 0 && <span>{fmtETB(loss)}</span>}</div>; })()}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Test Date"><Input type="date" value={impairForm.testDate} onChange={e => setImpairForm(f => ({ ...f, testDate: e.target.value }))} /></FormField>
            <FormField label="Basis"><Select value={impairForm.basis} onChange={e => setImpairForm(f => ({ ...f, basis: e as any }))}><option value="VALUE_IN_USE">Value in Use (DCF)</option><option value="FAIR_VALUE_LESS_COSTS_OF_DISPOSAL">Fair Value less Costs of Disposal</option></Select></FormField>
          </div>
          <FormField label="Notes"><Textarea value={impairForm.notes} onChange={e => setImpairForm(f => ({ ...f, notes: e.target.value }))} placeholder="Discount rate, assumptions…" rows={2} /></FormField>
        </div>
      </Modal>

      {/* -- IAS 16.67 Disposal Modal ----------------------------------------- */}
      <Modal
        open={!!disposeAsset}
        onClose={() => setDisposeAsset(null)}
        title={`Dispose Asset: ${disposeAsset?.name ?? ''}`}
        subtitle="IAS 16.67 — Derecognition · Posts gain/loss on disposal to P&L"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setDisposeAsset(null)}>Cancel</Btn>
            <Btn variant="danger" loading={disposeSaving} onClick={handleDispose} icon={<PackageX size={12} />}>
              Dispose Asset
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          {/* Asset summary */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[11px] grid grid-cols-3 gap-3">
            <div><p className="text-slate-400">Cost</p><p className="font-bold">{fmtETB(Number(disposeAsset?.purchaseCost ?? 0))}</p></div>
            <div><p className="text-slate-400">Acc. Dep.</p><p className="font-bold text-amber-600">{fmtETB(Number(disposeAsset?.accumulatedDepreciation ?? 0))}</p></div>
            <div><p className="text-slate-400">Net Book Value</p><p className="font-bold text-emerald-700">{fmtETB(disposeNBV)}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Disposal Date" required>
              <Input type="date" value={disposeForm.disposalDate} onChange={e => setDisposeForm(f => ({ ...f, disposalDate: e.target.value }))} />
            </FormField>
            <FormField label="Disposal Method">
              <Select value={disposeForm.disposalMethod} onChange={e => setDisposeForm(f => ({ ...f, disposalMethod: e as any }))}>
                <option value="SALE">Sale</option>
                <option value="SCRAP">Scrap / Write-Off</option>
                <option value="DONATION">Donation</option>
                <option value="WRITE_OFF">Write-Off</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Sale Proceeds (ETB)" hint="Enter 0 for scrap, donation, or write-off">
            <Input
              type="number" step="0.01" min="0"
              value={disposeForm.proceedsAmount}
              onChange={e => setDisposeForm(f => ({ ...f, proceedsAmount: e.target.value }))}
              placeholder="0.00"
            />
          </FormField>

          {/* Live gain/loss preview */}
          {disposeForm.proceedsAmount !== '' && (
            <div className={`flex items-center justify-between p-3 rounded-xl border text-[11px] font-bold ${
              disposeGainLoss >= 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400'
                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-400'
            }`}>
              <span>
                {disposeGainLoss >= 0
                  ? '▲ Gain on Disposal → Cr P&L'
                  : '▼ Loss on Disposal → Dr P&L'}
              </span>
              <span>{fmtETB(Math.abs(disposeGainLoss))}</span>
            </div>
          )}

          {/* Journal entry preview */}
          <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-xl text-[10px] space-y-1">
            <p className="font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">Journal Entry Preview (IAS 16.67)</p>
            <div className="space-y-0.5 text-sky-700 dark:text-sky-400">
              {Number(disposeAsset?.accumulatedDepreciation ?? 0) > 0 && (
                <p>Dr Accumulated Depreciation ……… {fmtETB(Number(disposeAsset?.accumulatedDepreciation ?? 0))}</p>
              )}
              {disposeProceeds > 0 && (
                <p>Dr Cash / Proceeds Receivable …… {fmtETB(disposeProceeds)}</p>
              )}
              <p>Cr Fixed Asset (at cost) ……………… {fmtETB(Number(disposeAsset?.purchaseCost ?? 0))}</p>
              {disposeGainLoss > 0 && <p>Cr Gain on Disposal (P&L) ……… {fmtETB(disposeGainLoss)}</p>}
              {disposeGainLoss < 0 && <p>Dr Loss on Disposal (P&L) ……… {fmtETB(Math.abs(disposeGainLoss))}</p>}
            </div>
          </div>

          <FormField label="Notes">
            <Textarea value={disposeForm.notes} onChange={e => setDisposeForm(f => ({ ...f, notes: e.target.value }))} placeholder="Buyer name, auction reference…" rows={2} />
          </FormField>
        </div>
      </Modal>

      {/* -- Depreciation Schedule Modal -------------------------------------- */}
      <Modal
        open={!!scheduleAsset}
        onClose={() => { setScheduleAsset(null); setScheduleData(null); setPostedSchedule(null); setScheduleTab('preview'); }}
        title={`Depreciation Schedule: ${scheduleAsset?.name ?? ''}`}
        subtitle="IAS 16 — Year-by-year opening NBV, annual depreciation, closing NBV"
        width="max-w-3xl"
      >
        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800 mb-4 -mt-1">
          <button
            onClick={() => setScheduleTab('preview')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${scheduleTab === 'preview' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Projected Schedule
          </button>
          <button
            onClick={() => {
              setScheduleTab('posted');
              if (!postedSchedule && scheduleAsset) loadPostedSchedule(scheduleAsset.id);
            }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${scheduleTab === 'posted' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Posted (DB Audit Trail)
          </button>
        </div>

        {/* -- Projected Schedule -- */}
        {scheduleTab === 'preview' && (
          scheduleLoading ? (
            <div className="py-12 text-center">
              <RefreshCw size={18} className="animate-spin text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Loading schedule…</p>
            </div>
          ) : scheduleData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Purchase Cost',    value: fmtETB(scheduleData.purchaseCost),          accent: 'bg-slate-500' },
                  { label: 'Salvage Value',    value: fmtETB(scheduleData.salvageValue),            accent: 'bg-amber-400' },
                  { label: 'Current NBV',      value: fmtETB(scheduleData.currentNBV),              accent: 'bg-emerald-500' },
                  { label: 'Acc. Depreciation',value: fmtETB(scheduleData.accumulatedDepreciation), accent: 'bg-rose-400' },
                ].map(k => (
                  <div key={k.label} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className={`w-1 h-5 rounded-full ${k.accent} mb-1.5`} />
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                    <p className="text-[13px] font-black tabular-nums text-slate-800 dark:text-slate-100 mt-0.5">{k.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Method: <strong>{scheduleData.method.replace(/_/g, ' ')}</strong> · Useful life: <strong>{scheduleData.usefulLifeYears} years</strong></p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      {['Year', 'Opening NBV', 'Annual Depreciation', 'Acc. Depreciation', 'Closing NBV'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {scheduleData.schedule.map((row: any, i: number) => (
                      <tr key={row.year} className={i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                        <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">{row.year}</td>
                        <td className="px-4 py-2 tabular-nums text-slate-600 dark:text-slate-300">{fmtETB(row.openingNBV)}</td>
                        <td className="px-4 py-2 tabular-nums text-amber-600 font-semibold">{fmtETB(row.annualDepreciation)}</td>
                        <td className="px-4 py-2 tabular-nums text-rose-500">{fmtETB(row.accumulatedDepreciation)}</td>
                        <td className="px-4 py-2 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">{fmtETB(row.closingNBV)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">No schedule data available.</div>
          )
        )}

        {/* -- Posted (DB Audit Trail) -- */}
        {scheduleTab === 'posted' && (
          postedLoading ? (
            <div className="py-12 text-center">
              <RefreshCw size={18} className="animate-spin text-violet-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Loading posted schedule…</p>
            </div>
          ) : postedSchedule ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Periods Posted</p>
                  <p className="text-[18px] font-black text-violet-600 mt-0.5">{postedSchedule.summary?.periodsPosted ?? 0}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Depreciated</p>
                  <p className="text-[13px] font-black tabular-nums text-rose-600 mt-0.5">{fmtETB(postedSchedule.summary?.totalDepreciated ?? 0)}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current NBV</p>
                  <p className="text-[13px] font-black tabular-nums text-emerald-700 mt-0.5">{fmtETB(postedSchedule.summary?.currentNBV ?? 0)}</p>
                </div>
              </div>
              {postedSchedule.schedules?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-violet-50 dark:bg-violet-950/20 border-b border-slate-200 dark:border-slate-700">
                        {['Period', 'Opening', 'Depreciation', 'Closing', 'Acc. Dep.', 'Status', 'Journal Ref'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {postedSchedule.schedules.map((row: any, i: number) => (
                        <tr key={row.id} className={i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                          <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200 font-mono">{row.period}</td>
                          <td className="px-3 py-2 tabular-nums text-slate-600">{fmtETB(row.openingCarrying)}</td>
                          <td className="px-3 py-2 tabular-nums text-amber-600 font-semibold">{fmtETB(row.depreciationAmt)}</td>
                          <td className="px-3 py-2 tabular-nums font-bold text-emerald-700">{fmtETB(row.closingCarrying)}</td>
                          <td className="px-3 py-2 tabular-nums text-rose-500">{fmtETB(row.accumulatedDepr)}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              row.status === 'POSTED'    ? 'bg-emerald-100 text-emerald-700' :
                              row.status === 'SKIPPED'   ? 'bg-slate-100 text-slate-500' :
                              'bg-amber-100 text-amber-700'
                            }`}>{row.status}</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[9px] text-slate-400">{row.journalEntryId ? row.journalEntryId.slice(0, 8) + '…' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  No depreciation entries have been posted to the DB yet for this asset.
                  <br />
                  <span className="text-[11px]">Use "Post Depreciation" to start building the audit trail.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">No posted schedule data available.</div>
          )
        )}
      </Modal>
    </AppPage>
  );
};

export default FixedAssets;


