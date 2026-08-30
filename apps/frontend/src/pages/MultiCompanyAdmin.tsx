/**
 * MultiCompanyAdmin — ovds-style multi-company administration
 * AppPage · AppKpi · AppTable · useApiCrud
 * Cross-company reporting · Consolidated financials
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Columns, RefreshCw, Building2, Users2, BarChart3,
  Settings, ArrowRight, CheckCircle2, Globe,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtETB } from '../utils/ethiopianTax';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, SearchBar, EmptyState, IFRSBadge,
} from '../components/ui';

interface CompanySnapshot {
  id: string;
  name: string;
  type: string;
  currencyCode?: string;
  tin?: string;
  environment?: string;
  employeeCount?: number;
  invoiceCount?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  cashBalance?: number;
  vatPayable?: number;
  currentVersion?: string;
}

const MultiCompanyAdmin: React.FC = () => {
  usePageTitle('Multi-Company Admin');
  const navigate  = useNavigate();
  const { can }   = useAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['multi-company-admin'],
    queryFn: () => api.get('/ovds/companies').then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }).catch(() => [] as any[]),
    staleTime: 60_000,
  });

  const companies: CompanySnapshot[] = Array.isArray(raw) ? raw : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c => [c.name, c.type, c.tin].some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [companies, search]);

  const kpiCells = useMemo(() => {
    const totalRevenue  = companies.reduce((s, c) => s + (c.totalRevenue ?? 0), 0);
    const totalExpenses = companies.reduce((s, c) => s + (c.totalExpenses ?? 0), 0);
    const totalCash     = companies.reduce((s, c) => s + (c.cashBalance ?? 0), 0);
    return [
      { label: 'Companies',    value: companies.length,                                                    color: 'emerald' as const },
      { label: 'Consolidated Revenue', value: fmtETB(totalRevenue),                                       color: 'sky' as const },
      { label: 'Consolidated Expenses',value: fmtETB(totalExpenses),                                      color: 'rose' as const },
      { label: 'Total Cash',   value: fmtETB(totalCash),                                                   color: 'violet' as const },
    ];
  }, [companies]);

  return (
    <AppPage
      title="Multi-Company Admin"
      subtitle="Consolidated view · Cross-company management · IFRS group reporting"
      icon={<Columns size={18} />}
      crumbs={[{ label: 'System Administration' }, { label: 'Multi-Company' }]}
      actions={
        <>
          <IFRSBadge compliant />
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          {can('companies:write') && (
            <Btn variant="primary" size="sm" icon={<Building2 size={12} />} onClick={() => navigate('/companies/new')}>
              New Company
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* Consolidated summary bar */}
      <div className="ovds-widget-card p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Consolidated Financial Position</p>
        <div className="ovds-grid-layout cols-4">
          {[
            { label: 'Total Revenue',  value: fmtETB(companies.reduce((s, c) => s + (c.totalRevenue ?? 0), 0)),  color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Expenses', value: fmtETB(companies.reduce((s, c) => s + (c.totalExpenses ?? 0), 0)), color: 'text-rose-600',    bg: 'bg-rose-50' },
            { label: 'Net Position',   value: fmtETB(companies.reduce((s, c) => s + ((c.totalRevenue ?? 0) - (c.totalExpenses ?? 0)), 0)), color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'VAT Payable',    value: fmtETB(companies.reduce((s, c) => s + (c.vatPayable ?? 0), 0)),    color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">{item.label}</p>
              <p className={`text-[14px] font-bold tabular-nums ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search companies…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} companies</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Company</AppTh>
          <AppTh>Type</AppTh>
          <AppTh>TIN</AppTh>
          <AppTh align="right">Revenue</AppTh>
          <AppTh align="right">Cash</AppTh>
          <AppTh align="right">Employees</AppTh>
          <AppTh>Environment</AppTh>
          <AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<Building2 size={18} />} title="No companies" desc="Create companies to manage them here" /></td></tr>
          ) : filtered.map(c => (
            <AppTr key={c.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedCompanyId(c.id)}
                      className={`text-[12px] font-semibold hover:text-emerald-600 transition-colors text-left ${c.id === selectedCompanyId ? 'text-emerald-700' : 'text-slate-800'}`}
                    >
                      {c.name}
                    </button>
                    {c.id === selectedCompanyId && <span className="text-[9px] text-emerald-500 font-bold block">● Active</span>}
                  </div>
                </div>
              </AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{c.type.replace(/_/g, ' ')}</span></AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-500">{c.tin ?? '—'}</span></AppTd>
              <AppTd align="right">
                {c.totalRevenue ? <span className="text-[11px] font-bold text-emerald-600 tabular-nums">{fmtETB(c.totalRevenue)}</span> : <span className="text-[10px] text-slate-300">—</span>}
              </AppTd>
              <AppTd align="right">
                {c.cashBalance ? <span className="text-[11px] font-bold text-sky-600 tabular-nums">{fmtETB(c.cashBalance)}</span> : <span className="text-[10px] text-slate-300">—</span>}
              </AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1">
                  <Users2 size={10} className="text-slate-300" />
                  <span className="text-[11px] font-semibold text-slate-600">{c.employeeCount ?? 0}</span>
                </div>
              </AppTd>
              <AppTd><StatusBadge status={c.environment ?? 'PRODUCTION'} label={c.environment ?? 'PROD'} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setSelectedCompanyId(c.id); navigate('/dashboard'); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                    title="Switch to company"
                  >
                    <ArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all"
                    title="Settings"
                  >
                    <Settings size={11} />
                  </button>
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
    </AppPage>
  );
};

export default MultiCompanyAdmin;

