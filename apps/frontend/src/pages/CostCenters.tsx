/**
 * Cost Centers & Profit Centers
 * Management accounting — allocate income/expenses to cost/profit centers
 * Required for multi-department P&L reporting and project costing
 */
import { evalMath } from '@ovds/ui';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, Icon, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useInterval } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import {
  useCostCenters,
  useCostCenterAllocations,
  useCostCenterPerformance,
} from '../services/newTaxApi';

type CenterType = 'COST' | 'PROFIT' | 'INVESTMENT';

interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: CenterType;
  department?: string;
  managerId?: string;
  managerName?: string;
  budget?: number;
  actualCost?: number;
  actualRevenue?: number;
  variance?: number;
  isActive: boolean;
  notes?: string;
}

interface CostAllocation {
  id: string;
  costCenterId: string;
  costCenterName: string;
  journalEntryId?: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  period: string;
  date: string;
  accountCode?: string;
  accountName?: string;
}

const currentPeriod = new Date().toISOString().slice(0, 7);
const fmt  = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (n: number) => Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : fmt(n);

const TYPE_COLORS: Record<CenterType, string> = {
  COST:       'bg-rose-50 text-rose-700 border-rose-200',
  PROFIT:     'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  INVESTMENT: 'bg-violet-50 text-violet-700 border-violet-200',
};

// -- Add Cost Center Modal -----------------------------------------------------
function AddCenterModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    code: '', name: '', type: 'COST' as CenterType, department: '', budget: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) { toast.error('Code and name are required'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/cost-centers', {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
      });
      toast.success('Cost center created'); onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Create Cost Center" onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={save}>Create</Btn></>}
    >
      <form onSubmit={save} className="space-y-4">
        <div className="ovds-grid-layout cols-2">
          <FormField label="Code" required hint="e.g. CC-001, HR, ovds">
            <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="CC-001" />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={e => set('type', e)}>
              <option value="COST">Cost Center</option>
              <option value="PROFIT">Profit Center</option>
              <option value="INVESTMENT">Investment Center</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Human Resources Department" />
        </FormField>
        <div className="ovds-grid-layout cols-2">
          <FormField label="Department">
            <Input value={form.department} onChange={e => set('department', e.target.value)} />
          </FormField>
          <FormField label="Annual Budget (ETB)">
            <Input type="number" min="0" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)} onBlur={e => set('budget', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))} />
          </FormField>
        </div>
        <FormField label="Notes">
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}

// -- Performance Tab -----------------------------------------------------------
const PerformanceTab: React.FC<{ centers: CostCenter[]; period: string; companyId?: string }> = ({ centers, period, companyId }) => {
  const { performance: perfData, loading } = useCostCenterPerformance(period, companyId);

  return (
    <div className="space-y-4">
      <AppTable>
        <thead><tr>
          <AppTh>Cost Center</AppTh>
          <AppTh>Type</AppTh>
          <AppTh align="right">Budget</AppTh>
          <AppTh align="right">Actual Expense</AppTh>
          <AppTh align="right">Actual Revenue</AppTh>
          <AppTh align="right">Variance</AppTh>
          <AppTh align="right">% Budget Used</AppTh>
        </tr></thead>
        <tbody>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <AppTr key={i}>{Array.from({ length: 7 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
          )) : centers.length === 0 ? (
            <AppTr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No cost centers. Create one to begin tracking.</td></AppTr>
          ) : centers.map(c => {
            const perf = perfData.find(p => p.costCenterId === c.id) ?? {};
            const actualExpense = perf.actualExpense ?? c.actualCost ?? 0;
            const actualRevenue = perf.actualRevenue ?? c.actualRevenue ?? 0;
            const budget        = c.budget ?? 0;
            const variance      = budget > 0 ? budget - actualExpense : 0;
            const pctUsed       = budget > 0 ? Math.round(actualExpense / budget * 100) : null;
            return (
              <AppTr key={c.id}>
                <AppTd>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{c.code}</p>
                  </div>
                </AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[c.type]}`}>
                    {c.type}
                  </span>
                </AppTd>
                <AppTd align="right"><Amount value={budget} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={actualExpense} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={actualRevenue} size="sm" /></AppTd>
                <AppTd align="right">
                  <span className={`font-bold tabular-nums text-[12px] ${variance < 0 ? 'text-rose-600' : 'text-[var(--pro-azure-dark)]'}`}>
                    {variance < 0 ? `(${fmt(Math.abs(variance))})` : fmt(variance)}
                  </span>
                </AppTd>
                <AppTd align="right">
                  {pctUsed !== null && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pctUsed > 100 ? 'bg-rose-500' : pctUsed > 80 ? 'bg-amber-500' : 'bg-[var(--pro-azure-50)]0'}`}
                          style={{ width: `${Math.min(pctUsed, 100)}%` }} />
                      </div>
                      <span className={`text-[11px] font-bold ${pctUsed > 100 ? 'text-rose-600' : pctUsed > 80 ? 'text-amber-600' : 'text-[var(--pro-azure-dark)]'}`}>
                        {pctUsed}%
                      </span>
                    </div>
                  )}
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const CostCenters: React.FC = () => {
  usePageTitle('Cost Centers');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('ovds:write');

  const [activeTab, setActiveTab] = useState<'centers' | 'allocations' | 'performance' | 'pnl'>('centers');
  const [showAdd, setShowAdd]     = useState(false);
  const [period, setPeriod]       = useState(currentPeriod);
  const [search, setSearch]       = useState('');

  const { centers: centersRaw, loading: cLoading, refetch: refetchCenters }        = useCostCenters(selectedCompanyId ?? undefined);
  const { allocations: allocsRaw, loading: aLoading, refetch: refetchAllocs }      = useCostCenterAllocations(period, selectedCompanyId ?? undefined);

  const centers     = (centersRaw     ?? []) as CostCenter[];
  const allocations = (allocsRaw      ?? []) as CostAllocation[];
  const loading     = cLoading || aLoading;
  const fetchAll    = useCallback(() => { refetchCenters(); refetchAllocs(); }, [refetchCenters, refetchAllocs]);
  useInterval(fetchAll, 120_000);

  const filtered    = search ? centers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  ) : centers;

  const totalBudget = centers.reduce((s, c) => s + (c.budget ?? 0), 0);
  const totalActual = centers.reduce((s, c) => s + (c.actualCost ?? 0), 0);

  const TABS = [
    { key: 'centers',     label: `Centers (${centers.length})` },
    { key: 'allocations', label: `Allocations (${allocations.length})` },
    { key: 'performance', label: 'Performance' },
    { key: 'pnl',         label: 'Segment P&L' },
  ] as const;

  return (
    <AppPage
      title="Cost & Profit Centers"
      subtitle="Departmental P&L · Budget vs actual · Management accounting"
      icon={<Icon name="CHART" size={18} />}
      crumbs={[{ label: 'Accounting', to: '/accounting' }, { label: 'Cost Centers' }]}
      actions={
        <>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
            <Icon name="CALENDAR" size={13} className="text-slate-400" />
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-24" />
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={fetchAll}>Refresh</Btn>
          {canWrite && <Btn variant="primary" size="sm" icon={<Icon name="PLUS" size={12} />} onClick={() => setShowAdd(true)}>New Center</Btn>}
        </>
      }
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />}
    >
      <AppKpi cells={[
        { label: 'Cost Centers',   value: String(centers.filter(c => c.type === 'COST').length),    icon: <Icon name="MONEY" size={14} />, color: 'rose' },
        { label: 'Profit Centers', value: String(centers.filter(c => c.type === 'PROFIT').length),  icon: <Icon name="TREND_UP" size={14} />, color: "indigo" },
        { label: 'Total Budget',   value: `ETB ${fmtK(totalBudget)}`,    icon: <Icon name="CHART" size={14} />, color: 'violet' },
        { label: 'Total Actual',   value: `ETB ${fmtK(totalActual)}`,    icon: <Icon name="RECEIPT" size={14} />, color: totalActual > totalBudget ? 'rose' : 'indigo' },
      ]} />

      {activeTab === 'centers' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Icon name="SEARCH" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search centers…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800" />
            </div>
          </div>
          <AppTable>
            <thead><tr>
              <AppTh>Code</AppTh>
              <AppTh>Name</AppTh>
              <AppTh>Type</AppTh>
              <AppTh>Department</AppTh>
              <AppTh align="right">Budget</AppTh>
              <AppTh>Status</AppTh>
            </tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <AppTr key={i}>{Array.from({ length: 6 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
              )) : filtered.length === 0 ? (
                <AppTr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No cost centers yet. Create your first one to track departmental spending.</td></AppTr>
              ) : filtered.map(c => (
                <AppTr key={c.id}>
                  <AppTd className="font-mono font-bold text-[11px]">{c.code}</AppTd>
                  <AppTd className="font-semibold">{c.name}</AppTd>
                  <AppTd>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[c.type]}`}>{c.type}</span>
                  </AppTd>
                  <AppTd>{c.department ?? '—'}</AppTd>
                  <AppTd align="right"><Amount value={c.budget ?? 0} size="sm" /></AppTd>
                  <AppTd>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-slate-100 text-slate-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {activeTab === 'allocations' && (
        <AppTable>
          <thead><tr>
            <AppTh>Date</AppTh>
            <AppTh>Cost Center</AppTh>
            <AppTh>Description</AppTh>
            <AppTh>Account</AppTh>
            <AppTh>Type</AppTh>
            <AppTh align="right">Amount</AppTh>
            <AppTh>Period</AppTh>
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <AppTr key={i}>{Array.from({ length: 7 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
            )) : allocations.length === 0 ? (
              <AppTr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No allocations for this period. Cost center codes are assigned during journal entry posting.</td></AppTr>
            ) : allocations.map((a, i) => (
              <AppTr key={i}>
                <AppTd>{a.date ? new Date(a.date).toLocaleDateString() : '—'}</AppTd>
                <AppTd className="font-semibold">{a.costCenterName}</AppTd>
                <AppTd className="max-w-[200px] truncate">{a.description}</AppTd>
                <AppTd className="text-[11px] text-slate-500">{a.accountCode} {a.accountName}</AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${a.type === 'INCOME' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-rose-50 text-rose-700'}`}>
                    {a.type}
                  </span>
                </AppTd>
                <AppTd align="right"><Amount value={a.amount} size="sm" /></AppTd>
                <AppTd>{a.period}</AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}

      {activeTab === 'performance' && (
        <PerformanceTab centers={centers} period={period} companyId={selectedCompanyId ?? undefined} />
      )}

      {activeTab === 'pnl' && (
        <div className="space-y-5">
          <div className="p-4 bg-violet-50 border border-violet-200 dark:bg-violet-950/20 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300">
            <p className="font-bold flex items-center gap-2 mb-1"><Icon name="INFO" size={12} /> Segment P&L — IFRS 8</p>
            <p>IFRS 8 requires disclosure of operating segments that are reviewed by the chief operating decision maker. Each profit center constitutes a segment. The segment P&L shows revenue minus directly allocated costs per center, with unallocated central costs shown separately.</p>
          </div>
          <AppTable>
            <thead><tr>
              <AppTh>Profit Center</AppTh>
              <AppTh align="right">Revenue</AppTh>
              <AppTh align="right">Direct Costs</AppTh>
              <AppTh align="right">Contribution</AppTh>
              <AppTh align="right">Allocated Overhead</AppTh>
              <AppTh align="right">Net Profit/(Loss)</AppTh>
              <AppTh align="right">Margin %</AppTh>
            </tr></thead>
            <tbody>
              {centers.filter(c => c.type === 'PROFIT').length === 0 ? (
                <AppTr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No profit centers configured. Create profit centers to generate segment P&L.</td></AppTr>
              ) : centers.filter(c => c.type === 'PROFIT').map(c => {
                const rev  = c.actualRevenue ?? 0;
                const cost = c.actualCost    ?? 0;
                const cont = rev - cost;
                const net  = cont; // overhead allocation requires more setup
                const margin = rev > 0 ? (net / rev * 100) : 0;
                return (
                  <AppTr key={c.id}>
                    <AppTd className="font-semibold">{c.name}<br/><span className="text-[10px] font-mono text-slate-400">{c.code}</span></AppTd>
                    <AppTd align="right"><Amount value={rev} size="sm" /></AppTd>
                    <AppTd align="right"><Amount value={cost} size="sm" /></AppTd>
                    <AppTd align="right"><span className={`font-bold tabular-nums text-[12px] ${cont < 0 ? 'text-rose-600' : 'text-[var(--pro-azure-dark)]'}`}>{cont < 0 ? `(${fmt(Math.abs(cont))})` : fmt(cont)}</span></AppTd>
                    <AppTd align="right" className="text-slate-400">—</AppTd>
                    <AppTd align="right"><span className={`font-bold tabular-nums text-[12px] ${net < 0 ? 'text-rose-600' : 'text-[var(--pro-azure-dark)]'}`}>{net < 0 ? `(${fmt(Math.abs(net))})` : fmt(net)}</span></AppTd>
                    <AppTd align="right"><span className={`font-bold text-[12px] ${margin < 0 ? 'text-rose-600' : margin < 15 ? 'text-amber-600' : 'text-[var(--pro-azure-dark)]'}`}>{margin.toFixed(1)}%</span></AppTd>
                  </AppTr>
                );
              })}
            </tbody>
          </AppTable>
        </div>
      )}

      {showAdd && <AddCenterModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
    </AppPage>
  );
};

export default CostCenters;


