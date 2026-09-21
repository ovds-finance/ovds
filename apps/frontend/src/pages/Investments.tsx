/**
 * Investments — ovds-style investment portfolio
 * AppPage · AppKpi · AppTable · useApiCrud
 * IFRS 9 financial instruments · Ethiopian capital markets
 */
import {
  TrendingUp, Plus, Edit2, Trash2, RefreshCw, Download,
  Calendar,
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
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';

interface Investment {
  id: string;
  name: string;
  type: string;
  investedAmount: number;
  currentValue?: number;
  returnRate?: number;
  startDate?: string;
  maturityDate?: string;
  status: string;
  institution?: string;
  notes?: string;
  companyId?: string;
  createdAt: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'MATURED' | 'EQUITY' | 'FIXED_INCOME';

const INVESTMENT_TYPES = ['EQUITY', 'FIXED_INCOME', 'TREASURY_BILL', 'BOND', 'MUTUAL_FUND', 'REAL_ESTATE', 'OTHER'];

const InvestmentForm: React.FC<{ data: Partial<Investment>; onChange: (d: Partial<Investment>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Investment, v: any) => onChange({ ...data, [k]: v });
  const gain = data.currentValue && data.investedAmount
    ? Number(data.currentValue) - Number(data.investedAmount)
    : null;
  const gainPct = gain !== null && Number(data.investedAmount) > 0
    ? (gain / Number(data.investedAmount)) * 100
    : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Investment Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. CBE Treasury Bill" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'FIXED_INCOME'} onChange={e => set('type', e)}>
            {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Institution">
        <Input value={data.institution ?? ''} onChange={e => set('institution', e.target.value)} placeholder="e.g. Commercial Bank of Ethiopia" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Invested Amount (ETB)" required>
          <Input type="number" step="0.01" value={data.investedAmount ?? ''} onChange={e => set('investedAmount', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Current Value (ETB)">
          <Input type="number" step="0.01" value={data.currentValue ?? ''} onChange={e => set('currentValue', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
      </div>
      {gain !== null && (
        <div className={`flex items-center justify-between p-3 rounded-xl border text-[11px] ${gain >= 0 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-rose-50 border-rose-100'}`}>
          <span className={`font-semibold ${gain >= 0 ? 'text-[var(--pro-azure-dark)]' : 'text-rose-700'}`}>
            {gain >= 0 ? 'Gain' : 'Loss'}: {fmtETB(Math.abs(gain))}
          </span>
          {gainPct !== null && (
            <span className={`font-bold ${gain >= 0 ? 'text-[var(--pro-azure-dark)]' : 'text-rose-700'}`}>
              {gain >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
            </span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date">
          <Input type="date" value={data.startDate?.slice(0, 10) ?? ''} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="Maturity Date">
          <Input type="date" value={data.maturityDate?.slice(0, 10) ?? ''} onChange={e => set('maturityDate', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Investment terms, conditions…" />
      </FormField>
    </div>
  );
};

const Investments: React.FC = () => {
  usePageTitle('Investments');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Investment> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Investment>({
    endpoint: '/ovds/investments',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ACTIVE')       list = list.filter(i => i.status === 'ACTIVE');
    if (tab === 'MATURED')      list = list.filter(i => i.status === 'MATURED' || (i.maturityDate && new Date(i.maturityDate) < new Date()));
    if (tab === 'EQUITY')       list = list.filter(i => i.type === 'EQUITY');
    if (tab === 'FIXED_INCOME') list = list.filter(i => ['FIXED_INCOME', 'TREASURY_BILL', 'BOND'].includes(i.type));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => [i.name, i.type, i.institution].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    const totalInvested = rows.reduce((s, i) => s + Number(i.investedAmount ?? 0), 0);
    const totalCurrent  = rows.reduce((s, i) => s + Number(i.currentValue ?? i.investedAmount ?? 0), 0);
    const totalGain     = totalCurrent - totalInvested;
    return [
      { label: 'Investments',  value: rows.length,                                                    color: 'green' as const },
      { label: 'Invested',     value: fmtETB(totalInvested),                                          color: 'sky' as const },
      { label: 'Current Value',value: fmtETB(totalCurrent),                                           color: 'violet' as const },
      { label: totalGain >= 0 ? 'Total Gain' : 'Total Loss', value: fmtETB(Math.abs(totalGain)), color: totalGain >= 0 ? 'indigo' as const : 'rose' as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Investment name is required'); return; }
    const payload = {
      title: modal.data.name,
      investorName: modal.data.institution ?? modal.data.name,
      amount: modal.data.investedAmount,
      expectedReturn: modal.data.currentValue,
      startDate: modal.data.startDate,
      exitDate: modal.data.maturityDate,
      notes: modal.data.notes,
      // preserve id for updates
      ...(modal.data.id ? { id: modal.data.id } : {}),
    };
    const result = await save(payload as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleExport = () => {
    const headers = 'Name,Type,Institution,Invested,Current Value,Return %,Status\n';
    const csvRows = filtered.map(i =>
      `"${i.name}","${i.type}","${i.institution ?? ''}",${i.investedAmount},${i.currentValue ?? i.investedAmount},${i.returnRate ?? 0},"${i.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `investments-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Investments"
      subtitle="Investment portfolio · IFRS 9 financial instruments · Investment Trends · Market Value · Market Size · Banking & ovds · Revenue · Strategic Insights"
      icon={<TrendingUp size={18} />}
      crumbs={[{ label: 'Investments' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',          label: 'All',          count: rows.length },
            { key: 'ACTIVE',       label: 'Active',       count: rows.filter(i => i.status === 'ACTIVE').length },
            { key: 'EQUITY',       label: 'Equity',       count: rows.filter(i => i.type === 'EQUITY').length },
            { key: 'FIXED_INCOME', label: 'Fixed Income', count: rows.filter(i => ['FIXED_INCOME','TREASURY_BILL','BOND'].includes(i.type)).length },
            { key: 'MATURED',      label: 'Matured',      count: rows.filter(i => i.status === 'MATURED').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <IFRSBadge standard="9" compliant />
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('investments:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { type: 'FIXED_INCOME', status: 'ACTIVE' } })}>
              New Investment
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search investments…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} investments</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Investment</AppTh>
          <AppTh>Type</AppTh>
          <AppTh align="right">Invested</AppTh>
          <AppTh align="right">Current Value</AppTh>
          <AppTh align="right">Gain/Loss</AppTh>
          <AppTh>Maturity</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<TrendingUp size={18} />} title="No investments" desc="Track your investment portfolio here" action={can('investments:write') ? { label: 'New Investment', onClick: () => setModal({ open: true, data: { type: 'FIXED_INCOME', status: 'ACTIVE' } }) } : undefined} /></td></tr>
          ) : filtered.map(inv => {
            const current = Number(inv.currentValue ?? inv.investedAmount ?? 0);
            const invested = Number(inv.investedAmount ?? 0);
            const gain = current - invested;
            const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
            return (
              <AppTr key={inv.id}>
                <AppTd>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800">{inv.name}</p>
                    {inv.institution && <p className="ovds-caption">{inv.institution}</p>}
                  </div>
                </AppTd>
                <AppTd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${inv.type === 'EQUITY' ? 'bg-violet-50 text-violet-700 border-violet-100' : inv.type === 'TREASURY_BILL' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]'}`}>
                    {inv.type.replace(/_/g, ' ')}
                  </span>
                </AppTd>
                <AppTd align="right"><Amount value={invested} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={current} size="sm" /></AppTd>
                <AppTd align="right">
                  <div className="text-right">
                    <p className={`text-[11px] font-bold tabular-nums ${gain >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
                      {gain >= 0 ? '+' : ''}{fmtETB(gain)}
                    </p>
                    <p className={`text-[9px] ${gain >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>
                      {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                    </p>
                  </div>
                </AppTd>
                <AppTd>
                  {inv.maturityDate
                    ? <div className="flex items-center gap-1 text-[10px] text-slate-500"><Calendar size={9} className="text-slate-300" />{new Date(inv.maturityDate).toLocaleDateString()}</div>
                    : <span className="text-[10px] text-slate-300">—</span>
                  }
                </AppTd>
                <AppTd><StatusBadge status={inv.status} /></AppTd>
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {can('investments:write') && (
                      <>
                        <button onClick={() => setModal({ open: true, data: { ...inv } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                        <button onClick={async () => { if (await confirm({ title: `Delete "${inv.name}"?`, variant: 'danger' })) remove(inv.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
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
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Investment'} subtitle="IFRS 9 · Financial instruments · Ethiopian capital markets"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Add Investment'}</Btn></>}>
        <InvestmentForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Investments;

