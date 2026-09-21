/**
 * Leases — IFRS 16 lease accounting
 * AppPage · AppKpi · AppTable · useApiCrud
 * Right-of-use assets · Lease liabilities · Ethiopian IFRS adoption
 * New: Amortisation Schedule tab — effective interest method
 */
import {
  ScrollText, Plus, Edit2, Trash2, RefreshCw, Download,
  Calendar, Building2, BarChart3,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination, Amount, IFRSBadge,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';

interface Lease {
  id: string;
  assetDescription: string;
  lessor?: string;
  leaseType?: string;
  commencementDate: string;
  endDate: string;
  monthlyPayment: number;
  totalLeaseLiability?: number;
  rouAssetValue?: number;
  interestRate?: number;
  status: string;
  companyId?: string;
  notes?: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'ovds' | 'OPERATING' | 'SCHEDULE';

/** IFRS 16: calculate ROU asset and lease liability */
const calcIFRS16 = (monthly: number, months: number, rate: number) => {
  if (rate <= 0) return { rou: monthly * months, liability: monthly * months };
  const r = rate / 12;
  const pv = monthly * (1 - Math.pow(1 + r, -months)) / r;
  return { rou: pv, liability: pv };
};

const LeaseForm: React.FC<{ data: Partial<Lease>; onChange: (d: Partial<Lease>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Lease, v: any) => onChange({ ...data, [k]: v });
  const months = data.commencementDate && data.endDate
    ? Math.max(1, Math.round((new Date(data.endDate).getTime() - new Date(data.commencementDate).getTime()) / (30 * 86400000)))
    : 0;
  const ifrs16 = data.monthlyPayment && months > 0
    ? calcIFRS16(Number(data.monthlyPayment), months, Number(data.interestRate ?? 0.08))
    : null;

  return (
    <div className="space-y-3">
      <FormField label="Asset Description" required>
        <Input value={data.assetDescription ?? ''} onChange={e => set('assetDescription', e.target.value)} placeholder="e.g. Office Space — Bole, Addis Ababa" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Lessor">
          <Input value={data.lessor ?? ''} onChange={e => set('lessor', e.target.value)} placeholder="Landlord / lessor name" />
        </FormField>
        <FormField label="Lease Type">
          <Select value={data.leaseType ?? 'OPERATING'} onChange={e => set('leaseType', e)}>
            <option value="OPERATING">Operating Lease</option>
            <option value="ovds">ovds Lease</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Commencement Date" required>
          <Input type="date" value={data.commencementDate?.slice(0, 10) ?? ''} onChange={e => set('commencementDate', e.target.value)} />
        </FormField>
        <FormField label="End Date" required>
          <Input type="date" value={data.endDate?.slice(0, 10) ?? ''} onChange={e => set('endDate', e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Monthly Payment (ETB)" required>
          <Input type="number" step="0.01" value={data.monthlyPayment ?? ''} onChange={e => set('monthlyPayment', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Discount Rate (%)" hint="IFRS 16 incremental borrowing rate">
          <Input type="number" step="0.01" value={data.interestRate != null ? (Number(data.interestRate) * 100).toFixed(2) : ''} onChange={e => set('interestRate', parseFloat(e.target.value) / 100 || 0)} placeholder="8.00" />
        </FormField>
      </div>
      {/* IFRS 16 preview */}
      {ifrs16 && months > 0 && (
        <div className="p-3 bg-[var(--pro-azure-50)] rounded-xl border border-[var(--pro-azure-100)] space-y-1.5">
          <p className="text-[10px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wider">IFRS 16 Calculation ({months} months)</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div><p className="text-slate-500">ROU Asset</p><p className="font-bold text-[var(--pro-azure-dark)]">{fmtETB(ifrs16.rou)}</p></div>
            <div><p className="text-slate-500">Lease Liability</p><p className="font-bold text-[var(--pro-azure-dark)]">{fmtETB(ifrs16.liability)}</p></div>
            <div><p className="text-slate-500">Total Payments</p><p className="font-bold text-slate-700">{fmtETB(Number(data.monthlyPayment) * months)}</p></div>
            <div><p className="text-slate-500">Lease Term</p><p className="font-bold text-slate-700">{months} months</p></div>
          </div>
        </div>
      )}
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Contract terms, renewal options…" />
      </FormField>
    </div>
  );
};

const Leases: React.FC = () => {
  usePageTitle('Leases');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Lease> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Lease>({
    endpoint: '/ovds/leases',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ACTIVE')    list = list.filter(l => l.status === 'ACTIVE');
    if (tab === 'EXPIRED')   list = list.filter(l => l.status === 'EXPIRED' || new Date(l.endDate) < new Date());
    if (tab === 'ovds')   list = list.filter(l => l.leaseType === 'ovds');
    if (tab === 'OPERATING') list = list.filter(l => l.leaseType === 'OPERATING');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => [l.assetDescription, l.lessor].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    const totalLiability = rows.reduce((s, l) => s + (l.totalLeaseLiability ?? 0), 0);
    const totalROU       = rows.reduce((s, l) => s + (l.rouAssetValue ?? 0), 0);
    return [
      { label: 'Total',       value: rows.length,                                                    color: 'green' as const },
      { label: 'Active',      value: rows.filter(l => l.status === 'ACTIVE').length,                 color: 'sky' as const },
      { label: 'ROU Assets',  value: fmtETB(totalROU),                                               color: 'violet' as const },
      { label: 'Liabilities', value: fmtETB(totalLiability),                                         color: 'rose' as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.assetDescription?.trim()) { toast.error('Asset description is required'); return; }
    // Auto-calculate IFRS 16 values
    const months = modal.data.commencementDate && modal.data.endDate
      ? Math.max(1, Math.round((new Date(modal.data.endDate).getTime() - new Date(modal.data.commencementDate).getTime()) / (30 * 86400000)))
      : 0;
    const ifrs16 = modal.data.monthlyPayment && months > 0
      ? calcIFRS16(Number(modal.data.monthlyPayment), months, Number(modal.data.interestRate ?? 0.08))
      : null;

    // Only send editable fields — never send DB-computed/read-only fields
    const payload: any = {
      ...(modal.data.id ? { id: modal.data.id } : {}),
      assetDescription: modal.data.assetDescription,
      lessor:           modal.data.lessor,
      leaseType:        modal.data.leaseType,
      commencementDate: modal.data.commencementDate,
      endDate:          modal.data.endDate,
      monthlyPayment:   modal.data.monthlyPayment,
      interestRate:     modal.data.interestRate,
      notes:            modal.data.notes,
      ...(ifrs16 ? { rouAssetValue: ifrs16.rou, totalLeaseLiability: ifrs16.liability } : {}),
    };

    const result = await save(payload as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleExport = () => {
    const headers = 'Asset,Lessor,Type,Start,End,Monthly,ROU Asset,Liability,Status\n';
    const csvRows = filtered.map(l =>
      `"${l.assetDescription}","${l.lessor ?? ''}","${l.leaseType ?? ''}","${l.commencementDate}","${l.endDate}",${l.monthlyPayment},${l.rouAssetValue ?? 0},${l.totalLeaseLiability ?? 0},"${l.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `leases-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="IFRS 16 Leases"
      subtitle="Right-of-use assets · Lease liabilities · Ethiopian IFRS adoption"
      icon={<ScrollText size={18} />}
      crumbs={[{ label: 'Leases' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',       label: 'All',         count: rows.length },
            { key: 'ACTIVE',    label: 'Active',      count: rows.filter(l => l.status === 'ACTIVE').length },
            { key: 'ovds',   label: 'ovds',     count: rows.filter(l => l.leaseType === 'ovds').length },
            { key: 'OPERATING', label: 'Operating',   count: rows.filter(l => l.leaseType === 'OPERATING').length },
            { key: 'EXPIRED',   label: 'Expired',     count: rows.filter(l => l.status === 'EXPIRED').length },
            { key: 'SCHEDULE',  label: '📊 Amortisation Schedule' },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <IFRSBadge standard="16" compliant />
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('ovds:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { leaseType: 'OPERATING', status: 'ACTIVE', interestRate: 0.08 } })}>
              New Lease
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search leases…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} leases</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Asset</AppTh>
          <AppTh>Lessor</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>End Date</AppTh>
          <AppTh align="right">Monthly</AppTh>
          <AppTh align="right">ROU Asset</AppTh>
          <AppTh align="right">Liability</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={9}><EmptyState icon={<ScrollText size={18} />} title="No leases" desc="Add IFRS 16 lease contracts to track ROU assets and liabilities" action={can('ovds:write') ? { label: 'New Lease', onClick: () => setModal({ open: true, data: { leaseType: 'OPERATING', status: 'ACTIVE', interestRate: 0.08 } }) } : undefined} /></td></tr>
          ) : filtered.map(l => {
            const isExpired = new Date(l.endDate) < new Date();
            return (
              <AppTr key={l.id}>
                <AppTd>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--pro-azure-50)] flex items-center justify-center shrink-0"><Building2 size={12} className="text-[var(--pro-azure)]" /></div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800 truncate max-w-[160px]">{l.assetDescription}</p>
                    </div>
                  </div>
                </AppTd>
                <AppTd><span className="text-[11px] text-slate-600">{l.lessor ?? '—'}</span></AppTd>
                <AppTd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${l.leaseType === 'ovds' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-sky-50 text-sky-700 border-sky-100'}`}>
                    {l.leaseType ?? 'OPERATING'}
                  </span>
                </AppTd>
                <AppTd>
                  <div className={`flex items-center gap-1 text-[10px] font-mono ${isExpired ? 'text-rose-500' : 'text-slate-600'}`}>
                    <Calendar size={9} className="text-slate-300" />
                    {new Date(l.endDate).toLocaleDateString()}
                  </div>
                </AppTd>
                <AppTd align="right"><Amount value={l.monthlyPayment} size="sm" /></AppTd>
                <AppTd align="right">
                  {l.rouAssetValue ? <span className="text-[11px] font-bold text-[var(--pro-azure)] tabular-nums">{fmtETB(l.rouAssetValue)}</span> : <span className="text-[10px] text-slate-300">—</span>}
                </AppTd>
                <AppTd align="right">
                  {l.totalLeaseLiability ? <span className="text-[11px] font-bold text-rose-600 tabular-nums">{fmtETB(l.totalLeaseLiability)}</span> : <span className="text-[10px] text-slate-300">—</span>}
                </AppTd>
                <AppTd><StatusBadge status={isExpired ? 'EXPIRED' : (l.status ?? 'ACTIVE')} label={isExpired ? 'Expired' : (l.status ?? 'Active')} /></AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can('ovds:write') && (
                      <>
                        <button onClick={() => setModal({ open: true, data: { ...l } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                        <button onClick={async () => { if (await confirm({ title: `Delete lease?`, variant: 'danger' })) remove(l.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                      </>
                    )}
                  </div>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Lease' : 'New Lease'} subtitle="IFRS 16 · ROU asset · Lease liability · Ethiopian adoption" width="max-w-xl"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Create Lease'}</Btn></>}>
        <LeaseForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Amortisation Schedule Tab */}
      {tab === 'SCHEDULE' && (
        <LeaseScheduleTab leases={rows.filter(l => l.status === 'ACTIVE')} companyId={selectedCompanyId ?? undefined} />
      )}
    </AppPage>
  );
};

// -- Lease Amortisation Schedule Tab ------------------------------------------

interface ScheduleRow {
  period: string;
  openingLiability: number;
  totalPayment: number;
  interestPortion: number;
  principalPortion: number;
  closingLiability: number;
  rouDepreciation: number;
  status: string;
}

const LeaseScheduleTab: React.FC<{ leases: Lease[]; companyId?: string }> = ({ leases, companyId }) => {
  const [selectedId, setSelectedId] = useState<string>(leases[0]?.id ?? '');
  const [schedule, setSchedule]     = useState<{ lease: any; schedule: ScheduleRow[] } | null>(null);
  const [loading, setLoading]       = useState(false);
  const [posting, setPosting]       = useState<string | null>(null);

  const load = React.useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api.get(`/ovds/leases/${id}/amortisation-schedule${q}`);
      setSchedule(res.data?.data ?? res.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load schedule');
    } finally { setLoading(false); }
  }, [companyId]);

  React.useEffect(() => {
    if (selectedId) load(selectedId);
  }, [selectedId, load]);

  const handlePost = async (period: string) => {
    setPosting(period);
    try {
      await api.post(`/ovds/leases/${selectedId}/post-payment`, { period, companyId });
      toast.success(`Payment for ${period} posted to GL`);
      load(selectedId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post payment');
    } finally { setPosting(null); }
  };

  const handleExport = () => {
    if (!schedule) return;
    const header = 'Period,Opening Liability,Payment,Interest,Principal,Closing Liability,ROU Depreciation,Status\n';
    const rows = schedule.schedule.map(r =>
      `${r.period},${r.openingLiability},${r.totalPayment},${r.interestPortion},${r.principalPortion},${r.closingLiability},${r.rouDepreciation},${r.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `lease-schedule-${selectedId.slice(0, 8)}.csv`; a.click();
    toast.success('Exported');
  };

  if (leases.length === 0) {
    return (
      <div className="py-16 text-center">
        <ScrollText size={28} className="mx-auto text-slate-200 mb-3" />
        <p className="text-sm text-slate-400">No active leases. Add a lease first to view its amortisation schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Lease selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Select Lease</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none hover:border-[var(--pro-azure-light)] transition-colors w-full max-w-sm"
          >
            {leases.map(l => (
              <option key={l.id} value={l.id}>{l.assetDescription} — {l.lessor ?? 'unknown lessor'}</option>
            ))}
          </select>
        </div>
        {schedule && (
          <div className="pt-5 flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export CSV</Btn>
          </div>
        )}
      </div>

      {/* Lease summary KPIs */}
      {schedule?.lease && (
        <div className="ovds-grid-layout cols-4 gap-sm">
          {[
            { label: 'ROU Asset',        value: fmtETB(schedule.lease.rouAssetValue ?? 0),          accent: 'bg-[var(--pro-azure-50)]0' },
            { label: 'Lease Liability',  value: fmtETB(schedule.lease.totalLeaseLiability ?? 0),    accent: 'bg-rose-500'   },
            { label: 'Interest Rate',    value: `${((schedule.lease.interestRate ?? 0) * 100).toFixed(1)}% p.a.`, accent: 'bg-amber-500' },
            { label: 'Monthly Payment',  value: fmtETB(schedule.lease.monthlyPayment ?? 0),          accent: 'bg-slate-500'  },
          ].map(k => (
            <div key={k.label} className="ovds-widget-card p-4">
              <div className={`w-1 h-6 rounded-full ${k.accent} mb-2`} />
              <p className="ovds-value-sm font-black tabular-nums">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Schedule table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="ovds-widget-header">
          <BarChart3 size={13} className="text-[var(--pro-azure)]" />
          <p className="ovds-card-title">Amortisation Schedule — Effective Interest Method</p>
          <p className="ovds-caption ml-auto">IFRS 16.26 · All amounts in ETB</p>
        </div>
        {loading ? (
          <div className="py-10 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></div>
        ) : !schedule?.schedule?.length ? (
          <div className="py-10 text-center text-sm text-slate-400">No schedule data. The schedule is generated when a lease is created.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {['Period', 'Opening Liability', 'Payment', 'Interest', 'Principal', 'Closing Liability', 'ROU Dep.', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {schedule.schedule.map((row) => {
                  const isPaid   = row.status === 'PAID';
                  const isOverdue = row.status === 'OVERDUE';
                  return (
                    <tr key={row.period} className={`hover:bg-[var(--pro-azure-50)]/30 dark:hover:bg-green-950/10 transition-colors ${isPaid ? 'opacity-60' : ''} ${isOverdue ? 'bg-rose-50/40 dark:bg-rose-950/10' : ''}`}>
                      <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.period}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-300 text-right">{fmtETB(Number(row.openingLiability))}</td>
                      <td className="px-3 py-2 tabular-nums font-bold text-slate-700 dark:text-slate-200 text-right">{fmtETB(Number(row.totalPayment))}</td>
                      <td className="px-3 py-2 tabular-nums text-rose-500 text-right">{fmtETB(Number(row.interestPortion))}</td>
                      <td className="px-3 py-2 tabular-nums text-[var(--pro-azure)] text-right">{fmtETB(Number(row.principalPortion))}</td>
                      <td className="px-3 py-2 tabular-nums font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] text-right">{fmtETB(Number(row.closingLiability))}</td>
                      <td className="px-3 py-2 tabular-nums text-amber-600 text-right">{fmtETB(Number(row.rouDepreciation))}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isPaid    ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' :
                          isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-white text-slate-500 border-slate-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {!isPaid && (
                          <button
                            onClick={() => handlePost(row.period)}
                            disabled={posting === row.period}
                            className="px-2 py-1 bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap"
                          >
                            {posting === row.period ? '…' : 'Post'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {schedule.schedule.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-800 dark:bg-slate-700 text-white">
                    <td className="px-3 py-2.5 text-[11px] font-black" colSpan={2}>TOTALS</td>
                    <td className="px-3 py-2.5 tabular-nums text-[11px] font-black text-[var(--pro-azure-light)] text-right">
                      {fmtETB(schedule.schedule.reduce((s: number, r: ScheduleRow) => s + Number(r.totalPayment), 0))}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-[11px] font-bold text-rose-300 text-right">
                      {fmtETB(schedule.schedule.reduce((s: number, r: ScheduleRow) => s + Number(r.interestPortion), 0))}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-[11px] font-bold text-green-300 text-right">
                      {fmtETB(schedule.schedule.reduce((s: number, r: ScheduleRow) => s + Number(r.principalPortion), 0))}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-3 px-4 py-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900 rounded-xl text-[10px] text-[var(--pro-azure-dark)] dark:text-green-300">
        <BarChart3 size={12} className="shrink-0 mt-0.5" />
        <span><strong>IFRS 16.26</strong>: The lease liability is measured using the effective interest method — interest is allocated over the lease term to produce a constant periodic rate. Click <strong>Post</strong> on a period to record Dr Interest Expense + Dr Lease Liability / Cr Cash in the GL.</span>
      </div>
    </div>
  );
};

export default Leases;

