/**
 * ExpenseClaims — Ovds-inspired UI
 * Clean white cards · teal accents · pill status badges · icon-labeled fields
 */
import { evalMath } from '@ovds/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, Plus, Edit2, Trash2, RefreshCw, MoreHorizontal,
  CheckCircle2, XCircle, Wallet, FileText, Clock,
  Tag, User, AlignLeft, Link2, DollarSign, ChevronDown,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, EmptyState, Pagination, Amount, SearchBar,
  StatusBadge,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtCurrency, fmtDate } from '../utils/fmt';



// ── Types ──────────────────────────────────────────────────────────────────

interface ExpenseClaim {
  id: string;
  title: string;
  amount: number;
  currencyCode: string;
  category: string;
  status: string;
  description?: string;
  receiptUrl?: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  submittedAt: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  reimbursed: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
}

const CATEGORIES = [
  'Travel', 'Accommodation', 'Meals & Entertainment', 'Office Supplies',
  'Software & Subscriptions', 'Training & Education', 'Communication',
  'Medical', 'Transportation', 'Maintenance & Repairs', 'Other',
];

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'] as const;
type Tab = typeof TABS[number];

const fmt = (n: number, code = 'ETB') => fmtCurrency(n, code);

// ── Status pill (Ovds style) ──────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:    { label: 'Pending',    dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'  },
  APPROVED:   { label: 'Approved',   dot: 'bg-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)]', text: 'text-[var(--pro-azure-dark)]'},
  REJECTED:   { label: 'Rejected',   dot: 'bg-rose-400',    bg: 'bg-rose-50',    text: 'text-rose-700'   },
  REIMBURSED: { label: 'Reimbursed', dot: 'bg-sky-400',     bg: 'bg-sky-50',     text: 'text-sky-700'    },
};

const Pill: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] ?? { label: status, dot: 'bg-slate-400', bg: 'bg-white', text: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

// ── KPI card (Ovds style) ─────────────────────────────────────────────

interface KpiProps { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string }
const KpiCard: React.FC<KpiProps> = ({ label, value, sub, icon, accent }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

// ── Field label with icon (Ovds style) ────────────────────────────────

const FieldLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode; required?: boolean }> = ({ icon, children, required }) => (
  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
    <span className="text-slate-300 dark:text-slate-600">{icon}</span>
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

// ── Shared input styles (Ovds clean look) ─────────────────────────────

const inputCls = [
  'w-full px-3.5 py-2.5 rounded-xl text-sm',
  'bg-white dark:bg-slate-900',
  'border border-slate-200 dark:border-slate-600',
  'text-slate-800 dark:text-slate-100',
  'placeholder:text-slate-300 dark:placeholder:text-slate-600',
  'focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400',
  'transition-all',
].join(' ');

const selectCls = inputCls + ' appearance-none cursor-pointer pr-9';

// ── Tab bar ────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  ALL: 'All Claims', PENDING: 'Pending', APPROVED: 'Approved',
  REJECTED: 'Rejected', REIMBURSED: 'Reimbursed',
};

const TabBar: React.FC<{ active: Tab; counts: Partial<Record<Tab, number>>; onChange: (t: Tab) => void }> = ({ active, counts, onChange }) => (
  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap">
    {TABS.map((t) => {
      const isActive = t === active;
      const count = counts[t];
      return (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={[
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all',
            isActive
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          ].join(' ')}
        >
          {TAB_LABELS[t]}
          {count != null && count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────

const ExpenseClaims: React.FC = () => {
  usePageTitle('Expense Claims');
  const { user } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const qc = useQueryClient();

  const canApprove = user?.role === 'ADMIN' || user?.role === 'OVDS';
  const canCreate  = ['ADMIN', 'OVDS', 'HR'].includes(user?.role ?? '');

  const [tab,      setTab]      = useState<Tab>('ALL');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<ExpenseClaim | null>(null);

  const params: Record<string, string> = { page: String(page), limit: '20' };
  if (tab !== 'ALL') params.status = tab;
  if (search)            params.search    = search;
  if (selectedCompanyId) params.companyId = selectedCompanyId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['expense-claims', params],
    queryFn: () => api.get('/expense-claims', { params }).then((r: { data: any }) => r.data),
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['expense-claims-stats', selectedCompanyId],
    queryFn: () =>
      api.get('/expense-claims/stats', { params: { companyId: selectedCompanyId } })
         .then((r: { data: any }) => r.data?.data ?? r.data),
  });

  // TransformInterceptor wraps: { statusCode, data: { data: [], total, pages } }
  const paginated  = data?.data ?? data;
  const claims: ExpenseClaim[] = Array.isArray(paginated?.data) ? paginated.data
    : Array.isArray(paginated) ? paginated : [];
  const total: number = paginated?.total ?? 0;
  const pages: number = paginated?.pages ?? 1;

  const tabCounts: Partial<Record<Tab, number>> = {
    PENDING:    stats?.pending    ?? 0,
    APPROVED:   stats?.approved   ?? 0,
    REJECTED:   stats?.rejected   ?? 0,
    REIMBURSED: stats?.reimbursed ?? 0,
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/expense-claims/${id}`),
    onSuccess: () => {
      toast.success('Claim deleted');
      qc.invalidateQueries({ queryKey: ['expense-claims'] });
      qc.invalidateQueries({ queryKey: ['expense-claims-stats'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Delete failed'),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' | 'reimburse' }) =>
      api.post(`/expense-claims/${id}/${action}`),
    onSuccess: (_, { action }) => {
      toast.success(`Claim ${action}d`);
      qc.invalidateQueries({ queryKey: ['expense-claims'] });
      qc.invalidateQueries({ queryKey: ['expense-claims-stats'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Action failed'),
  });

  const handleDelete = useCallback(async (claim: ExpenseClaim) => {
    if (!(await confirm({ title: 'Delete Claim?', message: `Delete "${claim.title}"? This cannot be undone.`, variant: 'danger' }))) return;
    deleteMut.mutate(claim.id);
  }, [deleteMut]);

  const handleAction = useCallback(async (claim: ExpenseClaim, action: 'approve' | 'reject' | 'reimburse') => {
    const labels = { approve: 'Approve', reject: 'Reject', reimburse: 'Mark as Reimbursed' };
    if (!(await confirm({ title: `${labels[action]} Claim?`, message: `${labels[action]} "${claim.title}"?` }))) return;
    actionMut.mutate({ id: claim.id, action });
  }, [actionMut]);

  // ── Claim form modal ───────────────────────────────────────────────────────

  const ClaimForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [form, setForm] = useState({
      title:       editing?.title          ?? '',
      amount:      editing?.amount?.toString() ?? '',
      currencyCode:editing?.currencyCode   ?? 'ETB',
      category:    editing?.category       ?? '',
      description: editing?.description    ?? '',
      receiptUrl:  editing?.receiptUrl     ?? '',
      submittedBy: editing?.submittedBy    ?? '',
    });
    const [saving, setSaving] = useState(false);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.title.trim() || !form.category || !form.amount) {
        toast.error('Title, category, and amount are required'); return;
      }
      setSaving(true);
      try {
        const payload = { ...form, amount: parseFloat(form.amount), companyId: selectedCompanyId };
        if (editing) { await api.patch(`/expense-claims/${editing.id}`, payload); toast.success('Claim updated'); }
        else         { await api.post('/expense-claims', payload);               toast.success('Claim submitted'); }
        qc.invalidateQueries({ queryKey: ['expense-claims'] });
        qc.invalidateQueries({ queryKey: ['expense-claims-stats'] });
        onClose();
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Save failed');
      } finally { setSaving(false); }
    };

    return (
      <Modal open onClose={onClose} title={editing ? 'Edit Expense Claim' : 'New Expense Claim'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">

          {/* Title */}
          <div>
            <FieldLabel icon={<AlignLeft size={11} />} required>Title</FieldLabel>
            <input className={inputCls} value={form.title} onChange={set('title')}
              placeholder="e.g. Client lunch — Addis Ababa" required />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel icon={<DollarSign size={11} />} required>Amount</FieldLabel>
              <input type="text" min="0" step="0.01" className={inputCls}
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} onBlur={e => setForm(f => ({ ...f, amount: String(evalMath(e.target.value) ?? e.target.value) }))} placeholder="0.00" required />
            </div>
            <div>
              <FieldLabel icon={<DollarSign size={11} />}>Currency</FieldLabel>
              <div className="relative">
                <select className={selectCls} value={form.currencyCode} onChange={set('currencyCode')}>
                  <option value="ETB">ETB — Birr</option>
                  <option value="USD">USD — Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <FieldLabel icon={<Tag size={11} />} required>Category</FieldLabel>
            <div className="relative">
              <select className={selectCls} value={form.category} onChange={set('category')} required>
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Submitted by */}
          <div>
            <FieldLabel icon={<User size={11} />}>Submitted By</FieldLabel>
            <input className={inputCls} value={form.submittedBy} onChange={set('submittedBy')} placeholder="Employee name" />
          </div>

          {/* Description */}
          <div>
            <FieldLabel icon={<AlignLeft size={11} />}>Description</FieldLabel>
            <textarea className={inputCls + ' resize-none'} rows={3}
              value={form.description} onChange={set('description')}
              placeholder="Details about the expense…" />
          </div>

          {/* Receipt URL */}
          <div>
            <FieldLabel icon={<Link2 size={11} />}>Receipt URL</FieldLabel>
            <input className={inputCls} value={form.receiptUrl} onChange={set('receiptUrl')} placeholder="https://…" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-60 transition-colors flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {editing ? 'Save Changes' : 'Submit Claim'}
            </button>
          </div>

        </form>
      </Modal>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppPage
      title="Expense Claims"
      subtitle="Manage, review, and approve employee expenses"
      icon={<Receipt size={22} />}
      actions={
        canCreate ? (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-colors shadow-sm shadow-teal-200 dark:shadow-none"
          >
            <Plus size={15} />
            New Claim
          </button>
        ) : undefined
      }
    >

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending"      value={stats?.pending ?? 0}
          sub={stats ? fmt(stats.pendingAmount) : undefined}
          icon={<Clock size={18} className="text-amber-500" />}
          accent="bg-amber-50 dark:bg-amber-900/20" />
        <KpiCard label="Approved"     value={stats?.approved ?? 0}
          sub={stats ? fmt(stats.approvedAmount) : undefined}
          icon={<CheckCircle2 size={18} className="text-[var(--pro-azure)]" />}
          accent="bg-[var(--pro-azure-50)] dark:bg-green-900/20" />
        <KpiCard label="Reimbursed"   value={stats?.reimbursed ?? 0}
          icon={<Wallet size={18} className="text-sky-500" />}
          accent="bg-sky-50 dark:bg-sky-900/20" />
        <KpiCard label="Total Claims" value={stats?.total ?? 0}
          sub={stats ? fmt(stats.totalAmount) : undefined}
          icon={<Receipt size={18} className="text-teal-500" />}
          accent="bg-teal-50 dark:bg-teal-900/20" />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <TabBar active={tab} counts={tabCounts} onChange={(t) => { setTab(t); setPage(1); }} />
        <div className="flex items-center gap-2 sm:ml-auto">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search claims…" />
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-teal-500 hover:border-teal-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <AppTable loading={isLoading}>
          <thead>
            <tr className="bg-white dark:bg-slate-800/80">
              <AppTh>Claim</AppTh>
              <AppTh>Category</AppTh>
              <AppTh>Submitted By</AppTh>
              <AppTh align="right">Amount</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Date</AppTh>
              <AppTh align="right">Actions</AppTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {claims.map((claim) => (
              <AppTr key={claim.id}>

                {/* Claim title + description */}
                <AppTd>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[220px]">
                    {claim.title}
                  </div>
                  {claim.description && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[220px] mt-0.5">
                      {claim.description}
                    </div>
                  )}
                </AppTd>

                {/* Category chip */}
                <AppTd>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Tag size={10} className="text-slate-400" />
                    {claim.category}
                  </span>
                </AppTd>

                {/* Submitted by */}
                <AppTd>
                  <div className="flex items-center gap-2">
                    {claim.submittedBy ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                            {claim.submittedBy.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{claim.submittedBy}</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </div>
                </AppTd>

                {/* Amount */}
                <AppTd align="right">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    <Amount value={claim.amount} currency={claim.currencyCode} />
                  </span>
                </AppTd>

                {/* Status pill */}
                <AppTd><Pill status={claim.status} /></AppTd>

                {/* Date */}
                <AppTd>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{fmtDate(claim.submittedAt)}</span>
                </AppTd>

                {/* Actions */}
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-1">
                    {canApprove && claim.status === 'PENDING' && (
                      <>
                        <ActionBtn
                          icon={<CheckCircle2 size={13} />}
                          cls="text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20"
                          title="Approve"
                          onClick={() => handleAction(claim, 'approve')}
                        />
                        <ActionBtn
                          icon={<XCircle size={13} />}
                          cls="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Reject"
                          onClick={() => handleAction(claim, 'reject')}
                        />
                      </>
                    )}
                    {canApprove && claim.status === 'APPROVED' && (
                      <ActionBtn
                        icon={<Wallet size={13} />}
                        cls="text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                        title="Mark Reimbursed"
                        onClick={() => handleAction(claim, 'reimburse')}
                      />
                    )}
                    {canCreate && (claim.status === 'PENDING' || claim.status === 'REJECTED') && (
                      <ActionBtn
                        icon={<Edit2 size={13} />}
                        cls="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Edit"
                        onClick={() => { setEditing(claim); setShowForm(true); }}
                      />
                    )}
                    {claim.receiptUrl && (
                      <a
                        href={claim.receiptUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                        title="View Receipt"
                      >
                        <FileText size={13} />
                      </a>
                    )}
                    {canCreate && (claim.status === 'PENDING' || claim.status === 'REJECTED') && (
                      <ActionBtn
                        icon={<Trash2 size={13} />}
                        cls="text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title="Delete"
                        onClick={() => handleDelete(claim)}
                      />
                    )}
                  </div>
                </AppTd>

              </AppTr>
            ))}
          </tbody>
        </AppTable>

        {claims.length === 0 && !isLoading && (
          <div className="py-16">
            <EmptyState
              title="No expense claims"
              description={tab !== 'ALL' ? `No ${tab.toLowerCase()} claims found.` : 'Submit your first expense claim to get started.'}
              action={canCreate ? { label: 'New Claim', onClick: () => { setEditing(null); setShowForm(true); } } : undefined}
            />
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="mt-4">
          <Pagination page={page} pages={pages} total={total} onChange={setPage} />
        </div>
      )}

      {/* ── Form modal ──────────────────────────────────────────────────── */}
      {showForm && <ClaimForm onClose={() => { setShowForm(false); setEditing(null); }} />}

    </AppPage>
  );
};

// ── Tiny icon button ────────────────────────────────────────────────────────

const ActionBtn: React.FC<{ icon: React.ReactNode; cls: string; title: string; onClick: () => void }> = ({ icon, cls, title, onClick }) => (
  <button
    onClick={onClick} title={title}
    className={`p-1.5 rounded-lg transition-colors ${cls}`}
  >
    {icon}
  </button>
);

export default ExpenseClaims;
