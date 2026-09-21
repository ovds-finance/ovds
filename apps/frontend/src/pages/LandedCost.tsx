import {
  Calculator, Plus, Edit2, Trash2, Download, RefreshCw,
  Package,
 } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Textarea, Select,
  SearchBar, Amount, Pagination, Icon, EmptyState,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';

 const toCsv = (rows: any[], filename: string) => {
   if (!rows.length) { toast.error('No data to export'); return; }
   const headers = Object.keys(rows[0]).filter(k => !k.startsWith('_'));
   const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
   const blob = new Blob([csv], { type: 'text/csv' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
   a.click();
   URL.revokeObjectURL(url);
 };

type AllocationStatus = 'ALL' | 'DRAFT' | 'ALLOCATED' | 'APPROVED';

interface LandedCost {
  id: string;
  poNumber: string;
  billReference: string;
  cifValue: number;
  freight: number;
  insurance: number;
  customsDuty: number;
  excise: number;
  surtax: number;
  vat: number;
  advanceBit: number;
  otherCosts: number;
  totalLandedCost: number;
  costPerUnit: number;
  allocationMethod: string;
  status: string;
  companyId?: string;
  createdAt: string;
}

const ALLOCATION_TABS: AllocationStatus[] = ['ALL', 'DRAFT', 'ALLOCATED', 'APPROVED'];

const ALLOCATION_METHODS = ['DIRECT', 'WEIGHTED_AVERAGE', 'UNIT_BASED'];

const LandedCostForm: React.FC<{ data: Partial<LandedCost>; onChange: (d: Partial<LandedCost>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof LandedCost, v: any) => onChange({ ...data, [k]: v });

  const calcTotal = () => {
    const cif = Number(data.cifValue || 0);
    const freight = Number(data.freight || 0);
    const insurance = Number(data.insurance || 0);
    const customs = Number(data.customsDuty || 0);
    const excise = Number(data.excise || 0);
    const surtax = Number(data.surtax || 0);
    const vat = Number(data.vat || 0);
    const advanceBit = Number(data.advanceBit || 0);
    const other = Number(data.otherCosts || 0);
    return cif + freight + insurance + customs + excise + surtax + vat + advanceBit + other;
  };

  const total = calcTotal();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="PO Number" required>
          <Input value={data.poNumber ?? ''} onChange={e => set('poNumber', e.target.value)} placeholder="PO-2026-001" />
        </FormField>
        <FormField label="Bill Reference">
          <Input value={data.billReference ?? ''} onChange={e => set('billReference', e.target.value)} placeholder="BILL-001" />
        </FormField>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost Breakdown</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="CIF Value">
            <Input type="number" min="0" step="0.01" value={data.cifValue ?? ''} onChange={e => set('cifValue', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
          <FormField label="Freight">
            <Input type="number" min="0" step="0.01" value={data.freight ?? ''} onChange={e => set('freight', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Insurance">
            <Input type="number" min="0" step="0.01" value={data.insurance ?? ''} onChange={e => set('insurance', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
          <FormField label="Customs Duty">
            <Input type="number" min="0" step="0.01" value={data.customsDuty ?? ''} onChange={e => set('customsDuty', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Excise">
            <Input type="number" min="0" step="0.01" value={data.excise ?? ''} onChange={e => set('excise', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
          <FormField label="Surtax">
            <Input type="number" min="0" step="0.01" value={data.surtax ?? ''} onChange={e => set('surtax', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="VAT">
            <Input type="number" min="0" step="0.01" value={data.vat ?? ''} onChange={e => set('vat', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
          <FormField label="Advance BIT">
            <Input type="number" min="0" step="0.01" value={data.advanceBit ?? ''} onChange={e => set('advanceBit', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Other Costs">
            <Input type="number" min="0" step="0.01" value={data.otherCosts ?? ''} onChange={e => set('otherCosts', parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </FormField>
          <FormField label="Total Landed Cost">
            <Input type="number" value={total.toFixed(2)} readOnly className="bg-white font-semibold" />
          </FormField>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cost Per Unit">
          <Input type="number" min="0" step="0.01" value={data.costPerUnit ?? ''} onChange={e => set('costPerUnit', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Allocation Method">
          <Select value={data.allocationMethod ?? 'DIRECT'} onChange={e => set('allocationMethod', e)}>
            {ALLOCATION_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
    </div>
  );
};

const LandedCost: React.FC = () => {
  usePageTitle('Landed Cost Allocation');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab] = useState<AllocationStatus>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<LandedCost> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<LandedCost>({
    endpoint: '/procurement/landed-cost',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(lc => lc.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(lc => [lc.poNumber, lc.billReference].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total Allocations', value: rows.length, color: 'green' as const },
    { label: 'Draft', value: rows.filter(lc => lc.status === 'DRAFT').length, color: 'slate' as const },
    { label: 'Allocated', value: rows.filter(lc => lc.status === 'ALLOCATED').length, color: 'sky' as const },
    { label: 'Total Cost', value: fmtETB(rows.reduce((s, lc) => s + Number(lc.totalLandedCost || 0), 0)), color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.poNumber?.trim()) { toast.error('PO Number is required'); return; }
    const payload = {
      ...modal.data,
      totalLandedCost: Number(modal.data.cifValue || 0) + Number(modal.data.freight || 0) + Number(modal.data.insurance || 0) + Number(modal.data.customsDuty || 0) + Number(modal.data.excise || 0) + Number(modal.data.surtax || 0) + Number(modal.data.vat || 0) + Number(modal.data.advanceBit || 0) + Number(modal.data.otherCosts || 0),
    };
    await save(payload as any);
    setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleCalculate = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.post(`/procurement/landed-cost/${id}/calculate`);
      toast.success('Costs calculated'); refetch();
    } catch { toast.error('Failed to calculate'); }
  };

  const blankLC = () => ({
    poNumber: '',
    billReference: '',
    status: 'DRAFT',
    cifValue: 0,
    freight: 0,
    insurance: 0,
    customsDuty: 0,
    excise: 0,
    surtax: 0,
    vat: 0,
    advanceBit: 0,
    otherCosts: 0,
    totalLandedCost: 0,
    costPerUnit: 0,
    allocationMethod: 'DIRECT',
  });

  return (
    <AppPage
      title="Landed Cost Allocation"
      subtitle="Allocate import costs to purchase orders · Trade ovds · Supply Chain"
      icon={<Calculator size={18} />}
      crumbs={[{ label: 'Landed Cost' }]}
      tabs={
        <AppTabs
          tabs={ALLOCATION_TABS.map(t => ({ key: t, label: t.replace(/_/g, ' ') }))}
          active={tab}
          onChange={k => { setTab(k as AllocationStatus); }}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={() => toCsv(rows, 'landed-cost')}>Export</Btn>
          {can('purchase_orders:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: blankLC() })}>New Allocation</Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by PO or Bill…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} records</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>PO Number</AppTh>
          <AppTh>Bill Reference</AppTh>
          <AppTh align="right">CIF Value</AppTh>
          <AppTh align="right">Freight</AppTh>
          <AppTh align="right">Insurance</AppTh>
          <AppTh align="right">Customs Duty</AppTh>
          <AppTh align="right">Excise</AppTh>
          <AppTh align="right">Surtax</AppTh>
          <AppTh align="right">VAT</AppTh>
          <AppTh align="right">Advance BIT</AppTh>
          <AppTh align="right">Other</AppTh>
          <AppTh align="right">Total</AppTh>
          <AppTh align="right">Unit Cost</AppTh>
          <AppTh>Method</AppTh>
          <AppTh align="right" width="120px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={15} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={15}>
              <EmptyState icon={<Package size={18} />} title="No landed cost allocations" desc="Create your first allocation to track import costs" action={can('purchase_orders:write') ? { label: 'New Allocation', onClick: () => setModal({ open: true, data: blankLC() }) } : undefined} />
            </td></tr>
          ) : filtered.map(lc => (
            <AppTr key={lc.id}>
              <AppTd><span className="font-mono text-[11px] font-semibold text-slate-800">{lc.poNumber}</span></AppTd>
              <AppTd><span className="font-mono text-[11px] text-slate-600">{lc.billReference ?? '—'}</span></AppTd>
              <AppTd align="right"><Amount value={Number(lc.cifValue)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.freight)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.insurance)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.customsDuty)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.excise)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.surtax)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.vat)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.advanceBit)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.otherCosts)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.totalLandedCost)} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={Number(lc.costPerUnit)} size="sm" /></AppTd>
              <AppTd><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{lc.allocationMethod}</span></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleCalculate(lc.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Calculate"><Calculator size={11} /></button>
                  <button onClick={() => setModal({ open: true, data: { ...lc } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Edit"><Edit2 size={11} /></button>
                  <button onClick={async () => { if (await confirm({ title: `Delete allocation for "${lc.poNumber}"?`, variant: 'danger' })) remove(lc.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>

      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? 'Edit Landed Cost' : 'New Landed Cost Allocation'}
        subtitle="Import cost tracking · Customs duty · Trade ovds"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Allocation'}</Btn></>}
      >
        <LandedCostForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default LandedCost;

