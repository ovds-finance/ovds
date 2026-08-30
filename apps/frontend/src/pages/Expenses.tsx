/**
 * Expenses — ovds-style expense claim management
 * Enhanced with policy enforcement and spend analytics
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian WHT · ERCA compliance
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CreditCard, Plus, Edit2, Trash2, Download, RefreshCw,
  CheckCircle2, XCircle, User, DollarSign, WifiOff,
  AlertTriangle, BarChart3, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';
import { evalMath } from '@ovds/ui';
import api from '../services/api';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, Amount, Pagination, Card, Banner,
} from '../components/ui';
import { OvdsEmptyState } from '../components/ovds';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, Legend, PieChart as RechartsPie, Pie, Cell,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  title: string;
  amount: number;
  currencyCode?: string;
  category: string;
  status: string;
  description?: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
  receiptUrl?: string;
  companyId?: string;
  workflowType?: string;
  candidateName?: string;
  recoveryClause?: boolean;
  policyWarnings?: string[];
  requiresApprovalLevel?: number;
}

interface ExpenseAnalytics {
  totalClaims: number;
  totalAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  pendingAmount: number;
  paidAmount: number;
  avgClaimAmount: number;
  approvalRate: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
  topSpenders: TopSpender[];
}

interface CategoryBreakdown {
  category: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  pctOfTotal: number;
}

interface MonthlyTrend {
  month: string;
  totalAmount: number;
  count: number;
  approvedAmount: number;
  rejectedAmount: number;
}

interface TopSpender {
  submittedBy: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'SUPPLIES',
  'COMMUNICATION', 'TRAINING', 'MAINTENANCE', 'UTILITIES',
  'RECRUITMENT_INTERVIEW', 'RECRUITMENT_RELOCATION', 'RECRUITMENT_MEDICAL', 'OTHER',
];

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
type ViewTab = 'CLAIMS' | 'ANALYTICS' | 'POLICIES';

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

// ── Form Component ─────────────────────────────────────────────────────────

const ExpenseForm: React.FC<{
  data: Partial<Expense>;
  onChange: (d: Partial<Expense>) => void;
  onValidate?: (amount: number, category: string, hasReceipt: boolean) => Promise<{ allowed: boolean; violations: string[]; warnings: string[] }> | { allowed: boolean; violations: string[]; warnings: string[] };
}> = ({ data, onChange, onValidate }) => {
  const set = (k: keyof Expense, v: any) => onChange({ ...data, [k]: v });
  const evalField = (value: string) => {
    const result = evalMath(value);
    return result !== null ? result : parseFloat(value) || 0;
  };
  const isCandidate = data.workflowType === 'CANDIDATE_REIMBURSEMENT';

  const [policyWarnings, setPolicyWarnings] = useState<string[]>([]);
  const [policyViolations, setPolicyViolations] = useState<string[]>([]);

  const validateField = useCallback(async (amount: number, category: string, hasReceipt: boolean) => {
    if (!onValidate) {
      setPolicyWarnings([]);
      setPolicyViolations([]);
      return;
    }
    const result = await Promise.resolve(onValidate(amount, category, hasReceipt));
    setPolicyWarnings(result.warnings);
    setPolicyViolations(result.violations);
  }, [onValidate]);

  useEffect(() => {
    const amount = Number(data.amount) || 0;
    const category = data.category || 'OTHER';
    const hasReceipt = Boolean(data.receiptUrl);
    validateField(amount, category, hasReceipt);
  }, [data.amount, data.category, data.receiptUrl, validateField]);

  return (
    <div className="space-y-3">
      {policyViolations.length > 0 && (
        <Banner variant="error" title="Policy Violations" message={policyViolations.join('; ')} compact />
      )}
      {policyWarnings.length > 0 && (
        <Banner variant="warning" title="Policy Warnings" message={policyWarnings.join('; ')} compact />
      )}
      <FormField label="Claim Type">
        <Select value={data.workflowType ?? 'EMPLOYEE_EXPENSE'} onChange={e => set('workflowType', e)}>
          <option value="EMPLOYEE_EXPENSE">Employee Expense</option>
          <option value="CANDIDATE_REIMBURSEMENT">Candidate Reimbursement — Workflow B</option>
        </Select>
      </FormField>
      <FormField label="Title" required>
          <Input value={data.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Interview travel to Addis Ababa" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount (ETB)" required>
          <Input type="number" step="0.01" value={data.amount ?? ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} onBlur={e => set('amount', evalField(e.target.value))} placeholder="0.00" />
        </FormField>
        <FormField label="Category">
            <Select value={data.category ?? 'OTHER'} onChange={e => set('category', e)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
      </div>
      {isCandidate && (
        <>
          <FormField label="Candidate Name" required>
            <Input value={data.candidateName ?? ''} onChange={e => set('candidateName', e.target.value)} placeholder="Full name of the external candidate" />
          </FormField>
          <FormField label="Cost Recovery Clause in Offer Letter?">
            <Select value={data.recoveryClause ? 'yes' : 'no'} onChange={e => set('recoveryClause', e === 'yes')}>
              <option value="no">No — expense immediately</option>
              <option value="yes">Yes — track as staff advance, recover via payroll</option>
            </Select>
          </FormField>
        </>
      )}
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Details about this expense…" />
      </FormField>
      <FormField label="Receipt URL">
          <Input value={data.receiptUrl ?? ''} onChange={e => set('receiptUrl', e.target.value)} placeholder="https://..." />
      </FormField>
      {!isCandidate && (
        <FormField label="Submitted By">
            <Input value={data.submittedBy ?? ''} onChange={e => set('submittedBy', e.target.value)} placeholder="Employee name" />
        </FormField>
      )}
    </div>
  );
};

// ── Analytics Components ───────────────────────────────────────────────────

const CategoryPieChart: React.FC<{ data: CategoryBreakdown[] }> = ({ data }) => {
  if (!data.length) return <p className="text-xs text-slate-400 text-center py-8">No data available</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsPie>
        <Pie cx="50%" cy="50%" outerRadius={90} dataKey="totalAmount" nameKey="category" label={({ category, pctOfTotal }: any) => `${category} ${pctOfTotal.toFixed(0)}%`}>
          {data.map((entry, idx) => (
            <Cell key={entry.category} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
          ))}
        </Pie>
      </RechartsPie>
      <RechartTooltip formatter={(value: any) => [`ETB ${Number(value).toLocaleString()}`, 'Amount']} />
    </ResponsiveContainer>
  );
};

const TrendBarChart: React.FC<{ data: MonthlyTrend[] }> = ({ data }) => {
  if (!data.length) return <p className="text-xs text-slate-400 text-center py-8">No data available</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <RechartTooltip formatter={(value: any) => [`ETB ${Number(value).toLocaleString()}`, '']} />
        <Legend />
        <Bar dataKey="totalAmount" name="Total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="approvedAmount" name="Approved" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="rejectedAmount" name="Rejected" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const Expenses: React.FC = () => {
  usePageTitle('Expenses');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [viewTab, setViewTab] = useState<ViewTab>('CLAIMS');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Expense> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Expense>({
    endpoint: '/ovds/expenses',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const { submitOfflineSafe, queueCount } = useOfflineQueue();

  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(e => e.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => [e.title, e.category, e.submittedBy].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    if (viewTab === 'ANALYTICS' && analytics) {
      return [
        { label: 'Total Claims', value: analytics.totalClaims, color: 'emerald' as const },
        { label: 'Total Amount', value: fmtETB(analytics.totalAmount), color: 'violet' as const },
        { label: 'Approved', value: fmtETB(analytics.approvedAmount), color: 'sky' as const },
        { label: 'Rejected', value: fmtETB(analytics.rejectedAmount), color: 'rose' as const },
        { label: 'Avg Claim', value: fmtETB(analytics.avgClaimAmount), color: 'amber' as const },
      ];
    }
    return [
      { label: 'Total',    value: rows.length,                                                    color: 'emerald' as const },
      { label: 'Pending',  value: rows.filter(e => e.status === 'PENDING').length,               color: 'amber' as const },
      { label: 'Approved', value: rows.filter(e => e.status === 'APPROVED').length,              color: 'sky' as const },
      { label: 'Paid',     value: rows.filter(e => e.status === 'PAID').length,                  color: 'teal' as const },
      { label: 'Total ETB',value: fmtETB(rows.reduce((s, e) => s + Number(e.amount ?? 0), 0)),  color: 'violet' as const },
    ];
  }, [rows, viewTab, analytics]);

  // ── Analytics fetch ───────────────────────────────────────────────────────

  useEffect(() => {
    if (viewTab !== 'ANALYTICS' || !selectedCompanyId) return;
    let cancelled = false;
    setAnalyticsLoading(true);
    api.get('/ovds/expenses/analytics', { params: { companyId: selectedCompanyId } })
      .then((res: any) => { if (!cancelled) setAnalytics(res.data); })
      .catch(() => { if (!cancelled) setAnalytics(null); })
      .finally(() => { if (!cancelled) setAnalyticsLoading(false); });
    return () => { cancelled = true; };
  }, [viewTab, selectedCompanyId]);

  // ── Policies fetch ────────────────────────────────────────────────────────

  useEffect(() => {
    if (viewTab !== 'POLICIES' || !selectedCompanyId) return;
    let cancelled = false;
    setPoliciesLoading(true);
    api.get('/ovds/expenses/policies', { params: { companyId: selectedCompanyId } })
      .then((res: any) => { if (!cancelled) setPolicies(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setPolicies([]); })
      .finally(() => { if (!cancelled) setPoliciesLoading(false); });
    return () => { cancelled = true; };
  }, [viewTab, selectedCompanyId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleValidate = useCallback(async (amount: number, category: string, hasReceipt: boolean): Promise<{ allowed: boolean; violations: string[]; warnings: string[] }> => {
    try {
      const { default: api } = await import('../services/api');
      const res = await api.post('/ovds/expenses/validate-policy', { amount, category, hasReceipt });
      return res.data as { allowed: boolean; violations: string[]; warnings: string[] };
    } catch {
      return { allowed: true, violations: [], warnings: [] };
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!modal.data.title?.trim()) { toast.error('Title is required'); return; }
    if (!modal.data.amount || Number(modal.data.amount) <= 0) { toast.error('Amount must be greater than 0'); return; }

    if (!modal.data.id) {
      const payload = {
        ...modal.data,
        status: 'PENDING',
        workflowType: modal.data.workflowType ?? 'EMPLOYEE_EXPENSE',
        candidateName: modal.data.candidateName ?? undefined,
        recoveryClause: modal.data.recoveryClause ?? false,
        companyId: selectedCompanyId,
      };
      const label = `Expense: ${modal.data.title} (ETB ${fmtETB(Number(modal.data.amount))})`;
      try {
        const ok = await submitOfflineSafe('EXPENSE_CREATE', payload, label, selectedCompanyId ?? undefined);
        if (ok) {
          setModal(m => ({ ...m, open: false }));
          if (navigator.onLine) refetch();
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to submit expense');
      }
      return;
    }

    const result = await save({ ...modal.data } as any);
    if (result) setModal(m => ({ ...m, open: false }));
  }, [modal.data, save, submitOfflineSafe, selectedCompanyId, refetch]);

  const handleApprove = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/expenses/${id}/approve`, {});
      toast.success('Approved — Dr Expense / Cr AP journal posted'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string) => {
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/expenses/${id}/reject`, {});
      toast.success('Rejected'); refetch();
    } catch { toast.error('Failed'); }
  };

  const handlePay = async (id: string, title: string) => {
    if (!await confirm({
      title:        `Mark "${title}" as Paid?`,
      message:      'This will post a journal entry: Dr Accounts Payable / Cr Cash.',
      confirmLabel: 'Mark as Paid',
      variant:      'warning',
    })) return;
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/ovds/expenses/${id}/pay`, {});
      toast.success('Expense marked as paid — Dr AP / Cr Cash journal posted');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Payment failed');
    }
  };

  const handleExport = () => {
    const headers = 'Title,Category,Amount,Status,Submitted By,Date\n';
    const csvRows = filtered.map(e =>
      `"${e.title}","${e.category}",${e.amount},"${e.status}","${e.submittedBy ?? ''}","${e.submittedAt ?? ''}"`
    ).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const handleResetPolicies = async () => {
    if (!await confirm({ title: 'Reset Policies?', message: 'This will reset all expense policies to system defaults.', variant: 'warning' })) return;
    try {
      const { default: api } = await import('../services/api');
      await api.post('/ovds/expenses/policies/reset');
      toast.success('Policies reset to defaults');
      // Refresh policies
      api.get('/ovds/expenses/policies').then((res: any) => setPolicies(Array.isArray(res.data) ? res.data : []));
    } catch { toast.error('Failed to reset policies'); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppPage
      title="Expenses"
      subtitle="Expense claims & reimbursements · Policy enforcement · Spend analytics"
      icon={<CreditCard size={18} />}
      crumbs={[{ label: 'Expenses' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'CLAIMS',    label: 'Claims',     icon: <CreditCard size={12} /> },
            { key: 'ANALYTICS', label: 'Analytics',  icon: <BarChart3 size={12} /> },
            { key: 'POLICIES',  label: 'Policies',   icon: <ShieldCheck size={12} /> },
          ]}
          active={viewTab}
          onChange={k => setViewTab(k as ViewTab)}
        />
      }
      actions={
        <>
          {queueCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <WifiOff size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{queueCount} queued</span>
            </div>
          )}
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {viewTab === 'CLAIMS' && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { category: 'OTHER', status: 'PENDING' } })}>
              New Claim
            </Btn>
          )}
        </>
      }
    >
      {/* ── Claims Tab ─────────────────────────────────────────────────────── */}
      {viewTab === 'CLAIMS' && (
        <>
          <AppKpi cells={kpiCells} />
          <div className="flex items-center gap-2 mb-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search expenses…" className="w-52" />
            <div className="flex-1" />
            <span className="text-[11px] text-slate-400">{filtered.length} claims</span>
          </div>
          <AppTable>
            <thead><tr>
              <AppTh>Title</AppTh>
              <AppTh>Category</AppTh>
              <AppTh align="right">Amount</AppTh>
              <AppTh>Submitted By</AppTh>
              <AppTh>Date</AppTh>
              <AppTh>Status</AppTh>
              <AppTh align="right" width="100px">Actions</AppTh>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <OvdsEmptyState
                    type="expense"
                    isFiltered={!!(search || tab !== 'ALL')}
                    onClearFilters={() => { setSearch(''); setTab('ALL'); }}
                    onAction={() => setModal({ open: true, data: { category: 'OTHER', status: 'PENDING' } })}
                  />
                </td></tr>
              ) : filtered.map(e => (
                <AppTr key={e.id}>
                  <AppTd>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{e.title}</p>
                      {e.policyWarnings && e.policyWarnings.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={10} className="text-amber-500" />
                          <span className="text-[9px] text-amber-600">{e.policyWarnings.length} warning{e.policyWarnings.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </AppTd>
                  <AppTd><span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{e.category.replace(/_/g, ' ')}</span></AppTd>
                  <AppTd align="right"><span className="font-mono-num"><Amount value={Number(e.amount)} size="sm" /></span></AppTd>
                  <AppTd><div className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><User size={10} className="text-[#3B82F6]" />{e.submittedBy ?? '—'}</div></AppTd>
                  <AppTd><span className="ovds-caption">{e.submittedAt ? new Date(e.submittedAt).toLocaleDateString() : '—'}</span></AppTd>
                  <AppTd><StatusBadge status={e.status} /></AppTd>
                  <AppTd align="right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {e.status === 'PENDING' && can('ovds:write') && (
                        <>
                          <button onClick={() => handleApprove(e.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve"><CheckCircle2 size={11} /></button>
                          <button onClick={() => handleReject(e.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Reject"><XCircle size={11} /></button>
                        </>
                      )}
                      {e.status === 'APPROVED' && can('ovds:write') && (
                        <button onClick={() => handlePay(e.id, e.title)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all" title="Mark as Paid"><DollarSign size={11} /></button>
                      )}
                      <button onClick={() => setModal({ open: true, data: { ...e } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Edit"><Edit2 size={11} /></button>
                      <button onClick={async () => { if (await confirm({ title: `Delete "${e.title}"?`, variant: 'danger' })) remove(e.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 size={11} /></button>
                    </div>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
          <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
        </>
      )}

      {/* ── Analytics Tab ──────────────────────────────────────────────────── */}
      {viewTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card padding="p-4">
                  <h3 className="ovds-card-title mb-3">Spend by Category</h3>
                  <CategoryPieChart data={analytics.categoryBreakdown} />
                </Card>
                <Card padding="p-4">
                  <h3 className="ovds-card-title mb-3">Monthly Trend</h3>
                  <TrendBarChart data={analytics.monthlyTrend} />
                </Card>
              </div>

              <Card padding="p-4">
                <h3 className="ovds-card-title mb-3">Category Breakdown</h3>
                <AppTable>
                  <thead><tr>
                    <AppTh>Category</AppTh>
                    <AppTh align="right">Claims</AppTh>
                    <AppTh align="right">Total Amount</AppTh>
                    <AppTh align="right">Avg Amount</AppTh>
                    <AppTh align="right">% of Total</AppTh>
                  </tr></thead>
                  <tbody>
                    {analytics.categoryBreakdown.map(c => (
                      <AppTr key={c.category}>
                        <AppTd><span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{c.category.replace(/_/g, ' ')}</span></AppTd>
                        <AppTd align="right">{c.count}</AppTd>
                        <AppTd align="right"><Amount value={c.totalAmount} size="sm" /></AppTd>
                        <AppTd align="right"><Amount value={c.avgAmount} size="sm" /></AppTd>
                        <AppTd align="right">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(c.pctOfTotal, 100)}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-500 tabular-nums">{c.pctOfTotal.toFixed(1)}%</span>
                          </div>
                        </AppTd>
                      </AppTr>
                    ))}
                  </tbody>
                </AppTable>
              </Card>

              <Card padding="p-4">
                <h3 className="ovds-card-title mb-3">Top Spenders</h3>
                <AppTable>
                  <thead><tr>
                    <AppTh>Submitted By</AppTh>
                    <AppTh align="right">Claims</AppTh>
                    <AppTh align="right">Total Amount</AppTh>
                    <AppTh align="right">Avg Amount</AppTh>
                  </tr></thead>
                  <tbody>
                    {analytics.topSpenders.map(s => (
                      <AppTr key={s.submittedBy}>
                        <AppTd><div className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><User size={10} className="text-[#3B82F6]" />{s.submittedBy}</div></AppTd>
                        <AppTd align="right">{s.count}</AppTd>
                        <AppTd align="right"><Amount value={s.totalAmount} size="sm" /></AppTd>
                        <AppTd align="right"><Amount value={s.avgAmount} size="sm" /></AppTd>
                      </AppTr>
                    ))}
                  </tbody>
                </AppTable>
              </Card>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">No analytics data available</div>
          )}
        </div>
      )}

      {/* ── Policies Tab ───────────────────────────────────────────────────── */}
      {viewTab === 'POLICIES' && (
        <div className="space-y-4">
          {policiesLoading ? (
            <div className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="ovds-card-title">Expense Policies</h3>
                {can('ovds:write') && (
                  <Btn variant="secondary" size="sm" onClick={handleResetPolicies}>Reset to Defaults</Btn>
                )}
              </div>
              {policies.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No policies configured. Using system defaults.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {policies.map((p: any) => (
                    <Card key={p.id || p.category} hover padding="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.category}</span>
                        {p.isActive !== false && <ShieldCheck size={14} className="text-emerald-500" />}
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">ETB {Number(p.maxAmount).toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{p.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
                        <span className={p.requiresReceipt ? 'text-emerald-600' : 'text-slate-400'}>
                          {p.requiresReceipt ? 'Receipt required' : 'No receipt needed'}
                        </span>
                        <span>{p.approvalLevels} level{p.approvalLevels !== 1 ? 's' : ''} approval</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Claim Modal ────────────────────────────────────────────────────── */}
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? 'Edit Expense' : 'New Expense Claim'} subtitle="Submit for approval · Policy enforced · Ethiopian ERCA compliance"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.data.id ? 'Save Changes' : navigator.onLine ? 'Submit Claim' : 'Queue Offline'}
            </Btn>
          </>
        }
      >
        <ExpenseForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} onValidate={handleValidate} />
      </Modal>
    </AppPage>
  );
};

export default Expenses;

