import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../rbac/AuthContext';
import { useAuditLog } from '../hooks/useAuditLog';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';
import { Send } from 'lucide-react';
import DOMPurify from 'dompurify';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Select, Toolbar,
  Icon, Amount, StatusBadge,
} from '../components/ui';
import { downloadCSV } from '../utils/download';
import LoansPanel from '../components/payroll/loansPanel';
import FinancialCyclesPanel from '../components/payroll/financialCyclesPanel';
import PayrollSettingsPanel from '../components/payroll/payrollSettingsPanel';
import BulkUploadPanel from '../components/payroll/bulkUploadPanel';
import EmployeePayrollConfigPanel from '../components/payroll/employeePayrollConfigPanel';
import IncrementPanel from '../components/payroll/incrementPanel';
import ArrearPanel from '../components/payroll/arrearPanel';
import OtherPaymentPanel from '../components/payroll/otherPaymentPanel';
import PFSubscriptionsPanel from '../components/payroll/pfSubscriptionsPanel';
import ReimbursementPanel from '../components/payroll/reimbursementPanel';
import { EmptyState } from '../components';
import { PipelineStageHeader } from '../components/pipelineComponents';
import { useBusiness } from '../context/businessContext';
import { payCalendarsApi } from '@ovds/features/hr';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  GENERATED: 'bg-emerald-100 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300',
  VERIFIED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  FINALIZED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  PAID: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  PENDING: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const WORKFLOW_STEPS = [
  { key: 'GENERATED', label: 'Generated', role: 'PDA', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  { key: 'VERIFIED', label: 'Verified', role: 'PVO', color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  { key: 'FINALIZED', label: 'Finalized', role: 'PFO', color: 'bg-teal-500', light: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' },
  { key: 'APPROVED', label: 'Approved', role: 'AR', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
];

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PayrollAdministration: React.FC = () => {
  usePageTitle('Payroll Administration');
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as any;
  const [adminTab, setAdminTab] = useState<string>(tabFromUrl ?? 'salary');

  useEffect(() => { if (tabFromUrl) setAdminTab(tabFromUrl); }, [tabFromUrl]);

  const { can } = useAuth();
  const { log, logExport } = useAuditLog();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('payroll:generate');
  const canApprove = can('payroll:approve');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [payCalendarId, setPayCalendarId] = useState<string>('');
  const [payCalendars, setPayCalendars] = useState<any[]>([]);
  const [variableAdjustments, setVariableAdjustments] = useState<Record<string, { bonus: number; deduction: number; notes: string }>>({});

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const fetchPayCalendars = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await payCalendarsApi.list({ companyId: selectedCompanyId, take: 50 });
      const list = Array.isArray(res.data) ? res.data : [];
      setPayCalendars(list.filter((c: any) => c.isActive));
      if (list.length > 0 && !payCalendarId) setPayCalendarId(list[0].id);
    } catch { /* silent */ }
  }, [selectedCompanyId, payCalendarId]);

  useEffect(() => { fetchPayCalendars(); }, [fetchPayCalendars]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { year, month, take: 200 };
      if (selectedCompanyId) params.companyId = selectedCompanyId;
      const [recRes, statsRes] = await Promise.all([
        api.get('/payroll', { params }),
        api.get('/payroll/dashboard-stats', { params: { ...(selectedCompanyId ? { companyId: selectedCompanyId } : {}) } }).catch(() => ({ data: { data: null } })),
      ]);
      const data = recRes.data?.data?.data ?? recRes.data?.data ?? [];
      setRecords(Array.isArray(data) ? data : []);
      setStats(statsRes.data?.data ?? null);
    } catch {
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [year, month, selectedCompanyId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleGenerateAll = async () => {
    const ok = await confirm({
      title: `Generate Payroll — ${monthName}`,
      message: `This will generate salary records for all employees for ${monthName}. Existing records will be recalculated.`,
      confirmLabel: 'Generate All',
      variant: 'warning',
    });
    if (!ok) return;
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate-all', { month, year });
      const result = res.data?.data ?? res.data;
      toast.success(`Generated ${result.success?.length ?? 0} records${result.errors?.length ? `, ${result.errors.length} errors` : ''}`);
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (selectedIds.size === 0) return toast.error('Select records to approve');
    setApproving(true);
    try {
      await api.post('/payroll/approve', { payrollIds: [...selectedIds] });
      log('PAYROLL_APPROVED', { count: selectedIds.size, month, year, ids: [...selectedIds] }, 'Payroll');
      toast.success(`${selectedIds.size} records approved`);
      setSelectedIds(new Set());
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleExport = () => {
    const header = 'Employee,Dept,Month,Year,Gross,OT Pay,Tax,Pension (7%),Employer Pension,Loan,Net Pay,Worked Days,Status\n';
    const rows = records.map(r => `"${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}","${r.employee?.department?.name ?? ''}",${r.month},${r.year},${fmt(Number(r.grossTotal ?? r.grossPay ?? 0))},${fmt(Number(r.otPay ?? 0))},${fmt(Number(r.incomeTax ?? 0))},${fmt(Number(r.employeePension ?? 0))},${fmt(Number(r.employerPension ?? 0))},${fmt(Number(r.loanDeduction ?? 0))},${fmt(Number(r.netPay ?? 0))},${r.workedDays ?? ''},${r.status}`).join('\n');
    downloadCSV(header + rows, `payroll_${year}_${String(month).padStart(2, '0')}.csv`);
    logExport('Payroll', 'csv', records.length);
  };

  const handleBulkAdvance = async (toStatus: string) => {
    if (selectedIds.size === 0) return toast.error('Select records first');
    try {
      await api.post('/payroll/bulk-status', { payrollIds: [...selectedIds], status: toStatus });
      toast.success(`${selectedIds.size} records moved to ${toStatus}`);
      setSelectedIds(new Set());
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const printPayrollSummary = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (v: any) => DOMPurify.sanitize(String(v ?? ''));
    const totalGross = records.reduce((s, r) => s + Number(r.grossTotal ?? r.grossPay ?? 0), 0);
    const totalNet = records.reduce((s, r) => s + Number(r.netPay ?? 0), 0);
    const totalTax = records.reduce((s, r) => s + Number(r.incomeTax ?? 0), 0);
    const totalPension = records.reduce((s, r) => s + Number(r.employeePension ?? 0), 0);
    const totalErPension = records.reduce((s, r) => s + Number(r.employerPension ?? 0), 0);
    const rows = records.map(r => `<tr><td>${esc(r.employee?.firstName ?? '')} ${esc(r.employee?.lastName ?? '')}</td><td>${esc(r.employee?.department?.name ?? '—')}</td><td style="text-align:right">${fmt(Number(r.grossTotal ?? r.grossPay ?? 0))}</td><td style="text-align:right;color:#ef4444">${fmt(Number(r.incomeTax ?? 0))}</td><td style="text-align:right;color:#8b5cf6">${fmt(Number(r.employeePension ?? 0))}</td><td style="text-align:right;font-weight:900;color:#00E784">${fmt(Number(r.netPay ?? 0))}</td><td>${esc(r.status)}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Payroll Summary — ${esc(monthName)}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:11px}h1{font-size:18px;font-weight:900;margin-bottom:4px}.sub{font-size:10px;color:#64748b;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f8fafc;padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px}.total{font-weight:900;background:#f8fafc;border-top:2px solid #e2e8f0}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}.card-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:4px}.card-value{font-size:16px;font-weight:900;color:#1e293b}</style></head><body><h1>Payroll Summary — ${esc(monthName)}</h1><p class="sub">Generated: ${esc(new Date().toLocaleString())} · ${records.length} employees</p><div class="summary"><div class="card"><div class="card-label">Total Gross</div><div class="card-value">ETB ${fmt(totalGross)}</div></div><div class="card"><div class="card-label">Income Tax (PIT)</div><div class="card-value" style="color:#ef4444">ETB ${fmt(totalTax)}</div></div><div class="card"><div class="card-label">Pension (7% + 11%)</div><div class="card-value" style="color:#8b5cf6">ETB ${fmt(totalPension + totalErPension)}</div></div><div class="card"><div class="card-label">Total Net Pay</div><div class="card-value" style="color:#00E784">ETB ${fmt(totalNet)}</div></div></div><table><thead><tr><th>Employee</th><th>Dept</th><th>Gross</th><th>Tax</th><th>Pension</th><th>Net Pay</th><th>Status</th></tr></thead><tbody>${rows}<tr class="total"><td colspan="2">TOTAL (${records.length})</td><td style="text-align:right">${fmt(totalGross)}</td><td style="text-align:right;color:#ef4444">${fmt(totalTax)}</td><td style="text-align:right;color:#8b5cf6">${fmt(totalPension)}</td><td style="text-align:right;color:#00E784">${fmt(totalNet)}</td><td></td></tr></tbody></table><p style="margin-top:20px;font-size:9px;color:#94a3b8">Ethiopian PIT brackets per Proclamation No. 1395/2025 · Pension: 7% employee + 11% employer</p></body></html>`);
    w.document.close(); w.print();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const unapproved = records.filter(r => r.status !== 'APPROVED').map(r => r.id);
    if (selectedIds.size === unapproved.length && unapproved.length > 0) setSelectedIds(new Set()); else setSelectedIds(new Set(unapproved));
  };

  const filteredRecords = useMemo(() => records.filter(r => {
    const name = `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''} ${r.employee?.employeeId ?? ''}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || (r.employee?.department?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [records, search, statusFilter]);

  const coverage = stats ? Math.round((stats.processed / Math.max(stats.totalEmployees, 1)) * 100) : 0;

  const summaryCards = [
    { label: 'Total Employees', value: stats?.totalEmployees ?? records.length, icon: <Icon name="USERS" size={16} /> },
    { label: 'Processed', value: `${stats?.processed ?? records.length} / ${stats?.totalEmployees ?? '—'}`, icon: <Icon name="SUCCESS" size={16} /> },
    { label: 'Total Gross', value: `ETB ${fmt(stats?.totalGross ?? records.reduce((s, r) => s + Number(r.grossTotal ?? r.grossPay ?? 0), 0))}`, icon: <Icon name="BANKNOTE" size={16} /> },
    { label: 'Total Net', value: `ETB ${fmt(stats?.totalNet ?? records.reduce((s, r) => s + Number(r.netPay ?? 0), 0))}`, icon: <Icon name="TRENDING_UP" size={16} /> },
    { label: 'Income Tax', value: `ETB ${fmt(stats?.totalTax ?? 0)}`, icon: <Icon name="SHIELD_CHECK" size={16} /> },
    { label: 'Pension (7%)', value: `ETB ${fmt(stats?.totalPension ?? 0)}`, icon: <Icon name="CHART" size={16} /> },
    { label: 'Approved', value: stats?.approved ?? records.filter(r => r.status === 'APPROVED').length, icon: <Icon name="SUCCESS" size={16} /> },
    { label: 'Pending', value: stats?.pending ?? records.filter(r => r.status === 'GENERATED').length, icon: <Icon name="CLOCK" size={16} /> },
  ];

  return (
    <AppPage
      title="Payroll Administration"
      subtitle={`${monthName} — ${records.length} records · ${coverage}% coverage · Healthcare & Pharmaceuticals · Manufacturing & Logistics · ERP · Consumer Insights · Market Segments`}
      icon={<Icon name="USERS" size={18} />}
      crumbs={[{ label: 'Payroll' }]}
      actions={
        <>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 mr-2">
            <Icon name="CALENDAR" size={13} className="text-slate-400" />
            <select value={month} onChange={(e) => setMonth(Number(e))} className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en-US', { month: 'short' })}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e))} className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none">
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {payCalendars.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 mr-2">
              <Icon name="CLOCK" size={13} className="text-slate-400" />
              <select value={payCalendarId} onChange={(e) => setPayCalendarId(e)} className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none">
                <option value="">Select Calendar</option>
                {payCalendars.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.frequency.replace(/_/g, ' ')})</option>)}
              </select>
            </div>
          )}
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={fetchRecords}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="PRINTER" size={12} />} onClick={printPayrollSummary}>Print</Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={12} />} onClick={handleExport}>Export</Btn>
          {canWrite && <Btn variant="primary" size="sm" icon={<Icon name={generating ? 'REFRESH' : 'ZAP'} size={12} className={generating ? 'animate-spin' : ''} />} onClick={handleGenerateAll} disabled={generating}>{generating ? 'Generating…' : 'Generate All'}</Btn>}
        </>
      }
      tabs={
          <AppTabs
            tabs={[
              { key: 'salary', label: 'Salary Records' },
              { key: 'variable_input', label: 'Variable Input' },
              { key: 'emp_config', label: 'Employee Config' },
              { key: 'increment', label: 'Increment' },
              { key: 'arrear', label: 'Arrears' },
              { key: 'other_payment', label: 'Other Payments' },
              { key: 'loans', label: 'Loans & Advances' },
              { key: 'reimbursement', label: 'Reimbursement' },
              { key: 'pf', label: 'PF Subscriptions' },
              { key: 'cycles', label: 'Financial Cycles' },
              { key: 'bulk_upload', label: 'Bulk Upload' },
              { key: 'settings', label: 'Settings' },
              { key: 'reports', label: 'Analytics' },
              { key: 'bank_file', label: '🏦 Bank File' },
              { key: 'pssa', label: '📋 PSSA Report' },
            ]}
            active={adminTab}
            onChange={(k) => setAdminTab(k as any)}
          />
      }
    >
      <div className="space-y-5">
        <PipelineStageHeader
          stages={[
            { key: 'DRAFT', label: 'Draft', count: records.filter((r: any) => r.status === 'DRAFT').length, color: '#94a3b8' },
            { key: 'APPROVED', label: 'Approved', count: records.filter((r: any) => r.status === 'APPROVED').length, color: '#00E784' },
            { key: 'PAID', label: 'Paid', count: records.filter((r: any) => r.status === 'PAID').length, color: '#00E784', completed: true },
          ]}
        />

        {adminTab === 'salary' && (
          <div className="space-y-5">
            {!loading && stats && (
              <div className="ovds-widget-card p-4 flex items-center gap-4 shadow-sm">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                    <span>Payroll Coverage</span>
                    <span>{stats.processed} / {stats.totalEmployees} employees ({coverage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${coverage}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                  <span className="flex items-center gap-1 text-emerald-600"><Icon name="SUCCESS" size={12} /> {stats.approved} approved</span>
                  <span className="flex items-center gap-1 text-amber-600"><Icon name="CLOCK" size={12} /> {stats.pending} pending</span>
                </div>
              </div>
            )}

            <AppKpi cells={summaryCards.map((c) => ({ label: c.label, value: String(c.value), icon: c.icon, color: 'emerald' }))} />

            <div className="ovds-widget-card p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Payroll Workflow — {monthName}</p>
              <div className="flex items-center gap-0">
                {WORKFLOW_STEPS.map((step, i) => {
                  const count = records.filter((r) => r.status === step.key).length;
                  const isDone = records.length > 0 && count === 0 && i < WORKFLOW_STEPS.findIndex((s) => records.some((r) => r.status === s.key));
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all ${count > 0 ? step.light : isDone ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                        <div className={`text-lg font-semibold ${count > 0 ? '' : isDone ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`}>{count > 0 ? count : isDone ? '✓' : '—'}</div>
                        <div className="text-[10px] font-medium uppercase tracking-wider">{step.label}</div>
                        <div className="text-[8px] text-slate-400">{step.role}</div>
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && <Icon name="CHEVRON_RIGHT" size={14} className="text-slate-300 dark:text-slate-600 shrink-0 mx-0.5" />}
                    </div>
                  );
                })}
              </div>


              {selectedIds.size > 0 && canApprove && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="ovds-caption">{selectedIds.size} selected — advance to:</span>
                  {['VERIFIED', 'FINALIZED', 'APPROVED'].map((s) => (
                    <button key={s} onClick={() => (s === 'APPROVED' ? handleApprove() : handleBulkAdvance(s))} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${WORKFLOW_STEPS.find((w) => w.key === s)?.light ?? 'bg-slate-100 text-slate-600'}`}>→ {s}</button>
                  ))}
                </div>
              )}
            </div>

            <Toolbar
              search={{ value: search, onChange: setSearch, placeholder: 'Search employees...' }}
              filters={
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e)} className="w-32">
                  <option value="ALL">All Status</option>
                  {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              }
              actions={canApprove && selectedIds.size > 0 && <Btn variant="primary" size="sm" icon={<Icon name="SUCCESS" size={12} />} onClick={handleApprove} loading={approving}>Approve {selectedIds.size}</Btn>}
              count={filteredRecords.length}
            />

            <AppTable>
              <thead>
                <tr>
                  <AppTh width="40px"><input type="checkbox" onChange={toggleAll} checked={selectedIds.size === records.filter((r) => r.status !== 'APPROVED').length && records.length > 0} className="accent-emerald-500" /></AppTh>
                  <AppTh>Employee</AppTh>
                  <AppTh>Dept</AppTh>
                  <AppTh align="right">Gross Total</AppTh>
                  <AppTh align="right">Income Tax</AppTh>
                  <AppTh align="right">Net Pay</AppTh>
                  <AppTh>Status</AppTh>
                  <th className="px-3 py-2 text-right w-10" />
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <AppTr key={i}>{Array.from({ length: 8 }).map((__, j) => (<AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>))}</AppTr>
                )) : filteredRecords.length === 0 ? (
                  <AppTr><td colSpan={8} className="py-12 text-center"><EmptyState title="No payroll records found" /></td></AppTr>
                ) : (
                  filteredRecords.map((r) => (
                    <AppTr key={r.id} selected={selectedIds.has(r.id)} onClick={() => r.status !== 'APPROVED' && toggleSelect(r.id)} className="cursor-pointer">
                      <AppTd onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} disabled={r.status === 'APPROVED'} className="accent-emerald-500" /></AppTd>
                      <AppTd><div className="font-bold">{r.employee?.firstName} {r.employee?.lastName}</div><div className="ovds-caption">{r.employee?.employeeId}</div></AppTd>
                      <AppTd>{r.employee?.department?.name ?? '—'}</AppTd>
                      <AppTd align="right"><Amount value={r.grossTotal ?? r.grossPay} size="sm" /></AppTd>
                      <AppTd align="right"><Amount value={r.incomeTax} size="sm" negative /></AppTd>
                      <AppTd align="right"><Amount value={r.netPay ?? r.calculatedSalary} size="sm" /></AppTd>
                      <AppTd><StatusBadge status={r.status} /></AppTd>
                      <AppTd align="right"><Icon name="CHEVRON_RIGHT" size={12} className="text-slate-300" /></AppTd>
                    </AppTr>
                  ))
                )}
              </tbody>
            </AppTable>
          </div>
        )}

        {adminTab === 'variable_input' && (
          <VariableInputPanel
            records={filteredRecords}
            adjustments={variableAdjustments}
            onChange={setVariableAdjustments}
            year={year}
            month={month}
            companyId={selectedCompanyId}
            onApply={fetchRecords}
          />
        )}

        {adminTab === 'emp_config' && <EmployeePayrollConfigPanel />}
        {adminTab === 'increment' && <IncrementPanel year={year} month={month} />}
        {adminTab === 'arrear' && <ArrearPanel year={year} month={month} />}
        {adminTab === 'other_payment' && <OtherPaymentPanel year={year} month={month} />}
        {adminTab === 'loans' && <LoansPanel />}
        {adminTab === 'reimbursement' && <ReimbursementPanel companyId={selectedCompanyId} />}
        {adminTab === 'pf' && <PFSubscriptionsPanel />}
        {adminTab === 'cycles' && <FinancialCyclesPanel />}
        {adminTab === 'bulk_upload' && <BulkUploadPanel />}
        {adminTab === 'settings' && <PayrollSettingsPanel />}
        {adminTab === 'reports' && (
          <div className="ovds-grid-layout cols-2 gap-lg">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Salary Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={records.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="employee.firstName" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <RechartTooltip />
                    <Area type="monotone" dataKey="grossTotal" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Tax vs Net</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={records.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="employee.firstName" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <RechartTooltip />
                    <Legend />
                    <Bar dataKey="incomeTax" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netPay" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* -- Bank Payment File Export -------------------------------------- */}
        {adminTab === 'bank_file' && (
          <BankFileTab year={year} month={month} monthName={monthName} companyId={selectedCompanyId ?? undefined} />
        )}

        {/* -- PSSA Pension Contribution Schedule --------------------------- */}
        {adminTab === 'pssa' && (
          <PssaReportTab year={year} month={month} monthName={monthName} companyId={selectedCompanyId ?? undefined} />
        )}
      </div>
    </AppPage>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Bank Payment File Export Tab
// ══════════════════════════════════════════════════════════════════════════════
const BANKS = [
  { id: 'CBE',     label: 'Commercial Bank of Ethiopia (CBE)',  logo: '🏦', columns: 'AccountNo, AccountName, Amount, Narration' },
  { id: 'AWASH',   label: 'Awash Bank',                         logo: '🏦', columns: 'AccountNumber, BeneficiaryName, Amount, Reference' },
  { id: 'DASHEN',  label: 'Dashen Bank',                        logo: '🏦', columns: 'AcctNum, Name, Amount, Ref' },
  { id: 'GENERIC', label: 'Generic / Other Bank',               logo: '📋', columns: 'EmployeeID, Name, Bank, AccountNo, Amount, Month' },
] as const;
type BankFormat = typeof BANKS[number]['id'];

const BankFileTab: React.FC<{
  year: number; month: number; monthName: string; companyId?: string;
}> = ({ year, month, monthName, companyId }) => {
  const [bank, setBank]         = useState<BankFormat>('CBE');
  const [downloading, setDl]    = useState(false);
  const [result, setResult]     = useState<{ count: number; total: number } | null>(null);

  const handleDownload = async () => {
    setDl(true);
    setResult(null);
    try {
      const q = new URLSearchParams({ bank });
      if (companyId) q.set('companyId', companyId);
      const res = await api.get(`/payroll/bank-file/${year}/${month}?${q}`, { responseType: 'blob' });
      const count   = Number(res.headers['x-record-count']  ?? 0);
      const total   = Number(res.headers['x-total-amount']  ?? 0);
      const cd      = res.headers['content-disposition'] ?? '';
      const fname   = cd.match(/filename="?([^";\n]+)"?/)?.[1] ?? `bank_payment_${bank}_${year}-${String(month).padStart(2,'0')}.csv`;
      const blob    = new Blob([res.data], { type: 'text/csv' });
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement('a'); a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      setResult({ count, total });
      toast.success(`Bank file downloaded — ${count} employees, ETB ${total.toLocaleString()}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Download failed');
    } finally {
      setDl(false);
    }
  };

  const chosen = BANKS.find(b => b.id === bank)!;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px]">
        <p className="font-bold text-emerald-800 dark:text-emerald-200 text-[12px] mb-1">💳 Bank Payment File</p>
        <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
          Generates a bank-formatted CSV for <strong>{monthName}</strong> salary disbursement.
          Only <span className="font-bold">APPROVED</span> records with a bank account on file are included.
          Upload the file directly to your bank's bulk payment portal.
        </p>
      </div>

      {/* Bank selector */}
      <div className="ovds-widget-card p-5 space-y-4">
        <p className="ovds-card-title">Select Target Bank</p>
        <div className="grid grid-cols-2 gap-3">
          {BANKS.map(b => (
            <button
              key={b.id}
              onClick={() => setBank(b.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                bank === b.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <span className="text-xl mt-0.5">{b.logo}</span>
              <div>
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{b.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{b.columns}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Icon name="DOWNLOAD" size={14} />
            {downloading ? 'Generating…' : `Download ${chosen.id} File`}
          </button>
          {result && (
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-bold text-emerald-700">{result.count}</span> employees ·{' '}
              <span className="font-bold">ETB {result.total.toLocaleString()}</span> total
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 space-y-1 px-1">
        <p>• Only <strong>APPROVED</strong> salary records for <strong>{monthName}</strong> are included</p>
        <p>• Employees without a bank account number are excluded from the file</p>
        <p>• Reference column is auto-set to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">PAY-{year}-{String(month).padStart(2,'0')}</code></p>
        <p>• CBE format follows the CBE Corporate Internet Banking bulk upload specification</p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PSSA Pension Contribution Schedule Tab
// ══════════════════════════════════════════════════════════════════════════════
const PssaReportTab: React.FC<{
  year: number; month: number; monthName: string; companyId?: string;
}> = ({ year, month, monthName, companyId }) => {
  const [downloading, setDl]    = useState(false);
  const [result, setResult]     = useState<{
    count: number; empContrib: number; emplrContrib: number;
  } | null>(null);

  const handleDownload = async () => {
    setDl(true);
    setResult(null);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      const qs = q.toString() ? `?${q}` : '';
      const res = await api.get(`/payroll/pssa-report/${year}/${month}${qs}`, { responseType: 'blob' });
      const count       = Number(res.headers['x-record-count']     ?? 0);
      const empContrib  = Number(res.headers['x-employee-contrib']  ?? 0);
      const emplrContrib = Number(res.headers['x-employer-contrib'] ?? 0);
      const cd = res.headers['content-disposition'] ?? '';
      const fname = cd.match(/filename="?([^";\n]+)"?/)?.[1] ?? `pssa_${year}-${String(month).padStart(2,'0')}.csv`;
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a'); a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      setResult({ count, empContrib, emplrContrib });
      toast.success(`PSSA report downloaded — ${count} employees`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Download failed');
    } finally {
      setDl(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-[11px]">
        <p className="font-bold text-violet-800 dark:text-violet-200 text-[12px] mb-1">📋 PSSA Pension Contribution Schedule</p>
        <p className="text-violet-700 dark:text-violet-300 leading-relaxed">
          Generates the monthly pension contribution report for submission to the{' '}
          <strong>Private Organizations' Employees Social Security Agency (PSSA)</strong>.
          Includes employee and employer contributions per Proclamation No. 1395/2025.
        </p>
      </div>

      {/* Summary cards */}
      <div className="ovds-grid-layout cols-3 gap-sm">
        {[
          { label: 'Employee Rate',   value: '7%',  desc: 'of insurable earnings',    accent: 'bg-violet-500' },
          { label: 'Employer Rate',   value: '11%', desc: 'of insurable earnings',    accent: 'bg-emerald-500' },
          { label: 'Earnings Cap',    value: 'ETB 15,000', desc: 'insurable earnings cap', accent: 'bg-amber-500' },
        ].map(c => (
          <div key={c.label} className="ovds-widget-card p-4">
            <div className={`w-1 h-6 rounded-full ${c.accent} mb-2`} />
            <p className="ovds-value-sm font-black">{c.value}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{c.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Download panel */}
      <div className="ovds-widget-card p-5 space-y-4">
        <p className="ovds-card-title">Download Pension Schedule — {monthName}</p>
        <p className="text-[11px] text-slate-500">
          Columns: EmployeeID · FullName · TIN · BaseSalary · InsurableEarnings ·
          EmployeeContribution7% · EmployerContribution11% · TotalContribution · AccountNo · PFAccountNo
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Icon name="DOWNLOAD" size={14} />
            {downloading ? 'Generating…' : 'Download PSSA Report'}
          </button>

          {result && (
            <div className="p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-700 rounded-xl text-[11px] space-y-1">
              <p><span className="font-bold text-violet-700">{result.count}</span> employees included</p>
              <p>Employee contribution: <span className="font-bold text-violet-700">ETB {result.empContrib.toLocaleString()}</span></p>
              <p>Employer contribution: <span className="font-bold text-emerald-700">ETB {result.emplrContrib.toLocaleString()}</span></p>
              <p className="font-bold">Total: ETB {(result.empContrib + result.emplrContrib).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 space-y-1 px-1">
        <p>• Only <strong>APPROVED</strong> salary records for <strong>{monthName}</strong> are included</p>
        <p>• InsurableEarnings = min(BaseSalary, ETB 15,000) per Proclamation No. 1395/2025</p>
        <p>• Submit this file to your PSSA branch office by the <strong>15th of the following month</strong></p>
        <p>• Retain copies for 10 years per Ethiopian Labour Proclamation 1156/2019</p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Variable Input Panel — per-employee adjustments before approval
// ══════════════════════════════════════════════════════════════════════════════
const VariableInputPanel: React.FC<{
  records: any[];
  adjustments: Record<string, { bonus: number; deduction: number; notes: string }>;
  onChange: (adjustments: Record<string, { bonus: number; deduction: number; notes: string }>) => void;
  year: number;
  month: number;
  companyId?: string;
  onApply: () => void;
}> = ({ records, adjustments, onChange, year, month, companyId, onApply }) => {
  const [saving, setSaving] = useState(false);
  const [localAdj, setLocalAdj] = useState(records.reduce((acc, r) => {
    acc[r.id] = adjustments[r.id] ?? { bonus: 0, deduction: 0, notes: '' };
    return acc;
  }, {} as Record<string, { bonus: number; deduction: number; notes: string }>));

  const updateAdj = (id: string, field: 'bonus' | 'deduction' | 'notes', value: number | string) => {
    setLocalAdj(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const applyAdjustments = async () => {
    setSaving(true);
    try {
      await Promise.all(
        records.map(r => {
          const adj = localAdj[r.id] ?? { bonus: 0, deduction: 0, notes: '' };
          const totalAdj = Number(adj.bonus || 0) - Number(adj.deduction || 0);
          if (totalAdj === 0) return Promise.resolve();
          return api.post('/payroll/transactions', {
            employeeId: r.employee?.id ?? r.employeeId,
            type: totalAdj > 0 ? 'bonus' : 'deduction',
            amount: Math.abs(totalAdj),
            description: adj.notes || (totalAdj > 0 ? 'Variable bonus' : 'Variable deduction'),
            year,
            month,
          });
        })
      );
      onChange(localAdj);
      toast.success('Variable adjustments applied');
      onApply();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to apply adjustments');
    } finally {
      setSaving(false);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const totalBonuses = records.reduce((s, r) => s + Number(localAdj[r.id]?.bonus || 0), 0);
  const totalDeductions = records.reduce((s, r) => s + Number(localAdj[r.id]?.deduction || 0), 0);
  const netAdjustment = totalBonuses - totalDeductions;

  return (
    <div className="space-y-5">
      <div className="ovds-widget-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="ovds-card-title">Variable Input — {monthName}</p>
            <p className="text-[11px] text-slate-500 mt-1">Add bonuses, overtime, expense claims, or benefit deductions on top of base payroll before approval.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-[11px]">
              <p className="text-slate-500">Bonuses</p>
              <p className="font-bold text-emerald-700">{fmtETB(totalBonuses)}</p>
            </div>
            <div className="text-right text-[11px]">
              <p className="text-slate-500">Deductions</p>
              <p className="font-bold text-rose-700">{fmtETB(totalDeductions)}</p>
            </div>
            <div className="text-right text-[11px] pl-3 border-l border-slate-200">
              <p className="text-slate-500">Net Adjustment</p>
              <p className={`font-bold ${netAdjustment >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmtETB(netAdjustment)}</p>
            </div>
            <Btn variant="primary" size="sm" icon={<Send size={12} />} onClick={applyAdjustments} loading={saving}>
              Apply Adjustments
            </Btn>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Employee</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Base Gross</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Bonus</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Deduction</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Net Adj</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map(r => {
                const adj = localAdj[r.id] ?? { bonus: 0, deduction: 0, notes: '' };
                const net = Number(adj.bonus || 0) - Number(adj.deduction || 0);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold">
                          {String(r.employee?.firstName ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700">{r.employee?.firstName} {r.employee?.lastName}</p>
                          <p className="text-[9px] text-slate-400">{r.employee?.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[11px] font-mono text-slate-600">{fmtETB(Number(r.grossTotal ?? r.grossPay ?? 0))}</td>
                    <td className="px-3 py-2.5 text-right">
                      <input type="number" step="0.01" min="0" value={adj.bonus ?? 0} onChange={e => updateAdj(r.id, 'bonus', parseFloat(e.target.value) || 0)} className="w-24 text-right text-[11px] border border-emerald-200 rounded-lg px-2 py-1 bg-emerald-50/50 focus:border-emerald-400 focus:outline-none" placeholder="0.00" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input type="number" step="0.01" min="0" value={adj.deduction ?? 0} onChange={e => updateAdj(r.id, 'deduction', parseFloat(e.target.value) || 0)} className="w-24 text-right text-[11px] border border-rose-200 rounded-lg px-2 py-1 bg-rose-50/50 focus:border-rose-400 focus:outline-none" placeholder="0.00" />
                    </td>
                    <td className={`px-3 py-2.5 text-right text-[11px] font-bold tabular-nums ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmtETB(net)}</td>
                    <td className="px-3 py-2.5">
                      <input type="text" value={adj.notes ?? ''} onChange={e => updateAdj(r.id, 'notes', e.target.value)} placeholder="e.g. Overtime, bonus, deduction reason…" className="w-48 text-[11px] border border-slate-200 rounded-lg px-2 py-1 focus:border-emerald-400 focus:outline-none" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollAdministration;

