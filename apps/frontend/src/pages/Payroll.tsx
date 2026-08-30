/**
 * Payroll — ovds-style payroll management
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian PIT brackets · Pension 7%/11% · DRRF 1%
 * ERCA Proclamation No. 1395/2025
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Banknote, Play, CheckCircle2, Download, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { fmtETB, ETH_TAX } from '../utils/ethiopianTax';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, SearchBar, EmptyState, Pagination,
  Amount, IFRSBadge, Banner,
} from '../components/ui';

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  grossSalary: number;
  pensionEmployee: number;
  taxableIncome: number;
  incomeTax: number;
  pensionEmployer: number;
  drrf: number;
  netSalary: number;
  status: string;
  companyId?: string;
}

type FilterTab = 'ALL' | 'DRAFT' | 'APPROVED' | 'PAID';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Payroll: React.FC = () => {
  usePageTitle('Payroll');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const qc = useQueryClient();

  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['payroll', selectedCompanyId, year, month, page],
    queryFn: () => {
      const params = new URLSearchParams({ year: String(year), month: String(month), page: String(page), limit: String(PAGE_SIZE) });
      if (selectedCompanyId) params.set('companyId', selectedCompanyId);
      return api.get(`/payroll?${params}`).then((r: any) => r.data).catch(() => null);
    },
    staleTime: 30_000,
  });

  const rows: PayrollRecord[] = useMemo(() => {
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? d : (d?.records ?? d?.data ?? []);
  }, [raw]);
  const total = raw?.total ?? rows.length;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(r => r.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => String(r.employeeName ?? r.employeeId ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [rows, tab, search]);

  // -- Aggregates ------------------------------------------------------------
  const totals = useMemo(() => ({
    gross:          rows.reduce((s, r) => s + Number(r.grossSalary ?? 0), 0),
    net:            rows.reduce((s, r) => s + Number(r.netSalary ?? 0), 0),
    incomeTax:      rows.reduce((s, r) => s + Number(r.incomeTax ?? 0), 0),
    pensionEmployee:rows.reduce((s, r) => s + Number(r.pensionEmployee ?? 0), 0),
    pensionEmployer:rows.reduce((s, r) => s + Number(r.pensionEmployer ?? 0), 0),
    drrf:           rows.reduce((s, r) => s + Number(r.drrf ?? 0), 0),
  }), [rows]);

  const kpiCells = useMemo(() => [
    { label: 'Employees',    value: rows.length,                  color: 'emerald' as const },
    { label: 'Gross Payroll',value: fmtETB(totals.gross),         color: 'sky' as const },
    { label: 'Net Payroll',  value: fmtETB(totals.net),           color: 'emerald' as const },
    { label: 'Income Tax',   value: fmtETB(totals.incomeTax),     color: 'rose' as const },
    { label: 'Pension (Emp)',value: fmtETB(totals.pensionEmployee),color: 'violet' as const },
    { label: 'DRRF (1%)',    value: fmtETB(totals.drrf),          color: 'amber' as const },
  ], [rows, totals]);

  // -- Run payroll mutation --------------------------------------------------
  const runPayroll = useMutation({
    mutationFn: () => api.post('/payroll/generate', { year, month }),
    onSuccess: () => { toast.success('Payroll generated successfully'); qc.invalidateQueries({ queryKey: ['payroll'] }); },
    onError: () => toast.error('Payroll generation failed'),
  });

  const approvePayroll = useMutation({
    mutationFn: (id: string) => api.post('/payroll/approve', { ids: [id] }),
    onSuccess: () => { toast.success('Approved'); qc.invalidateQueries({ queryKey: ['payroll'] }); },
    onError: () => toast.error('Failed'),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.patch(`/payroll/${id}`, { status: 'PAID' }),
    onSuccess: () => { toast.success('Marked as paid'); qc.invalidateQueries({ queryKey: ['payroll'] }); },
    onError: () => toast.error('Failed'),
  });

  const handleExport = () => {
    const headers = 'Employee,Gross,Pension(7%),Taxable,Income Tax,Net,Employer Pension(11%),DRRF(1%),Status\n';
    const csvRows = filtered.map(r =>
      `"${r.employeeName ?? r.employeeId}",${r.grossSalary},${r.pensionEmployee},${r.taxableIncome},${r.incomeTax},${r.netSalary},${r.pensionEmployer},${r.drrf},"${r.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `payroll-${year}-${String(month).padStart(2,'0')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <AppPage
      title="Payroll"
      subtitle={`${MONTHS[month - 1]} ${year} · Ethiopian PIT · Pension · DRRF · Healthcare & Pharmaceuticals · Manufacturing & Logistics · ERP · Accounting & ovds Software`}
      icon={<Banknote size={18} />}
      crumbs={[{ label: 'Payroll' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',      label: 'All',      count: rows.length },
            { key: 'DRAFT',    label: 'Draft',    count: rows.filter(r => r.status === 'DRAFT').length },
            { key: 'APPROVED', label: 'Approved', count: rows.filter(r => r.status === 'APPROVED').length },
            { key: 'PAID',     label: 'Paid',     count: rows.filter(r => r.status === 'PAID').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <IFRSBadge compliant />
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetch()}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('payroll:admin') && (
            <Btn variant="primary" size="sm" icon={<Play size={11} />} loading={runPayroll.isPending} onClick={() => runPayroll.mutate()}>
              Run Payroll
            </Btn>
          )}
        </>
      }
    >
      {/* Month navigator */}
      <div className="flex items-center gap-3 mb-4 p-3 ovds-widget-card">
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-500/40 hover:text-emerald-600 transition-all">
          <ChevronLeft size={13} />
        </button>
        <div className="flex-1 text-center">
          <p className="ovds-card-title">{MONTHS[month - 1]} {year}</p>
          <p className="ovds-caption">Ethiopian Fiscal Year</p>
        </div>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-500/40 hover:text-emerald-600 transition-all">
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Ethiopian tax reference */}
      <Banner
        variant="tax"
        title="Ethiopian Payroll Tax Rates (ERCA)"
        message={`PIT: progressive brackets · Employee Pension: ${ETH_TAX.PENSION_EMPLOYEE * 100}% · Employer Pension: ${ETH_TAX.PENSION_EMPLOYER * 100}% · DRRF: ${ETH_TAX.DRRF_RATE * 100}% · Proclamation No. 1395/2025`}
        compact
      />

      <div className="mt-4">
        <AppKpi cells={kpiCells} />
      </div>

      <div className="flex items-center gap-2 mb-3 mt-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search employees…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} records</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Employee</AppTh>
          <AppTh align="right">Gross</AppTh>
          <AppTh align="right">Pension (7%)</AppTh>
          <AppTh align="right">Income Tax</AppTh>
          <AppTh align="right">Net Pay</AppTh>
          <AppTh align="right">Emp. Pension (11%)</AppTh>
          <AppTh align="right">DRRF (1%)</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={9} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={9}>
              <EmptyState
                icon={<Banknote size={18} />}
                title="No payroll records"
                desc={`Run payroll for ${MONTHS[month - 1]} ${year} to generate records`}
                action={can('payroll:admin') ? { label: 'Run Payroll', onClick: () => runPayroll.mutate() } : undefined}
              />
            </td></tr>
          ) : filtered.map(r => (
            <AppTr key={r.id}>
              <AppTd>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {String(r.employeeName ?? r.employeeId ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">{r.employeeName ?? r.employeeId}</span>
                </div>
              </AppTd>
              <AppTd align="right"><span className="font-mono-num"><Amount value={Number(r.grossSalary)} size="sm" /></span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold font-mono-num text-ovds-accent-600 tabular-nums">{fmtETB(Number(r.pensionEmployee))}</span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold font-mono-num text-ovds-danger tabular-nums">{fmtETB(Number(r.incomeTax))}</span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold font-mono-num text-ovds-success tabular-nums">{fmtETB(Number(r.netSalary))}</span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold font-mono-num text-ovds-accent-600 tabular-nums">{fmtETB(Number(r.pensionEmployer))}</span></AppTd>
              <AppTd align="right"><span className="text-[11px] font-bold font-mono-num text-ovds-warning tabular-nums">{fmtETB(Number(r.drrf))}</span></AppTd>
              <AppTd><StatusBadge status={r.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {r.status === 'DRAFT' && can('payroll:admin') && (
                    <button onClick={() => approvePayroll.mutate(r.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve">
                      <CheckCircle2 size={11} />
                    </button>
                  )}
                  {r.status === 'APPROVED' && can('payroll:admin') && (
                    <button onClick={() => markPaid.mutate(r.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Mark Paid">
                      <Banknote size={11} />
                    </button>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
        {/* Totals row */}
        {filtered.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <td className="px-3 py-2.5 text-[10px] font-medium text-slate-400">Totals ({filtered.length})</td>
              <td className="px-3 py-2.5 text-right text-[12px] font-bold font-mono-num tabular-nums text-slate-700 dark:text-slate-200">{fmtETB(filtered.reduce((s, r) => s + Number(r.grossSalary ?? 0), 0))}</td>
              <td className="px-3 py-2.5 text-right text-[12px] font-bold font-mono-num text-ovds-accent-600 tabular-nums">{fmtETB(filtered.reduce((s, r) => s + Number(r.pensionEmployee ?? 0), 0))}</td>
              <td className="px-3 py-2.5 text-right text-[12px] font-bold font-mono-num text-ovds-danger tabular-nums">{fmtETB(filtered.reduce((s, r) => s + Number(r.incomeTax ?? 0), 0))}</td>
              <td className="px-3 py-2.5 text-right text-[12px] font-bold font-mono-num text-ovds-success tabular-nums">{fmtETB(filtered.reduce((s, r) => s + Number(r.netSalary ?? 0), 0))}</td>
              <td className="px-3 py-2.5 text-right text-[12px] font-bold font-mono-num text-ovds-accent-600 tabular-nums">{fmtETB(filtered.reduce((s, r) => s + Number(r.pensionEmployer ?? 0), 0))}</td>
              <td className="px-3 py-2.5 text-right text-[12px] font-bold font-mono-num text-ovds-warning tabular-nums">{fmtETB(filtered.reduce((s, r) => s + Number(r.drrf ?? 0), 0))}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </AppTable>

      {total > PAGE_SIZE && (
        <div className="mt-3"><Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} /></div>
      )}
    </AppPage>
  );
};

export default Payroll;

