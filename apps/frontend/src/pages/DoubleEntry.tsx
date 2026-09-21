/**
 * DoubleEntry — Chart of Accounts, General Ledger, Trial Balance, Balance Sheet,
 *               Income Statement (P&L), Manual Journals
 * OVDS style: AppPage · AppKpi · AppTable · tabs · modals
 */
import type { KpiCell } from '@ovds/features/reporting';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Edit2, Trash2, RefreshCw, FileText,
  Scale, List, BarChart2, PlusCircle, MinusCircle, TrendingUp,
} from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, EmptyState, Pagination, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtCurrency, fmtDate } from '../utils/fmt';


// ── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string; code: string; name: string; type: string; category: string;
  description?: string | null; isActive: boolean; parentId?: string | null;
}

interface JournalLineInput {
  accountId: string; description?: string; debit: number; credit: number; costCenterId?: string;
}

interface JournalLine extends JournalLineInput {
  account: { id: string; code: string; name: string };
}

interface JournalEntry {
  id: string; date: string; reference?: string | null; description: string;
  status: string; postedBy?: string | null; createdAt: string;
  journalLine: JournalLine[];
}

interface TrialBalanceRow {
  accountId: string; accountCode: string; accountName: string;
  accountType: string; accountCategory: string;
  totalDebit: number; totalCredit: number; balance: number;
}

interface PLRow extends TrialBalanceRow { netAmount: number }
interface PLSection { rows: PLRow[]; total: number }
interface IncomeStatementData {
  from: string | null; to: string | null;
  revenue: PLSection; cogs: PLSection; expenses: PLSection;
  grossProfit: number; netIncome: number;
}

interface BSSection { rows: TrialBalanceRow[]; total: number }
interface BalanceSheetData {
  asOf: string;
  assets: BSSection; liabilities: BSSection; equity: BSSection;
  totalLiabilitiesAndEquity: number;
}

type Tab = 'coa' | 'journals' | 'trial-balance' | 'general-ledger' | 'balance-sheet' | 'income-statement';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'coa',              label: 'Chart of Accounts', icon: <List       size={14} /> },
  { key: 'journals',         label: 'Manual Journals',   icon: <FileText   size={14} /> },
  { key: 'trial-balance',    label: 'Trial Balance',     icon: <Scale      size={14} /> },
  { key: 'general-ledger',   label: 'General Ledger',    icon: <BookOpen   size={14} /> },
  { key: 'balance-sheet',    label: 'Balance Sheet',     icon: <BarChart2  size={14} /> },
  { key: 'income-statement', label: 'Income Statement',  icon: <TrendingUp size={14} /> },
];

const ACCOUNT_TYPES     = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const ACCOUNT_CATEGORIES = [
  'CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY',
  'FIXED_ASSET', 'CURRENT_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
  'EQUITY', 'REVENUE', 'OTHER_INCOME', 'OPERATING_EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_EXPENSE',
];

const fmt = (n: number) => fmtCurrency(n, 'ETB');

// ── Account Form (CoA CRUD) ──────────────────────────────────────────────────

const AccountForm: React.FC<{
  editing: Account | null;
  accounts: Account[];
  companyId?: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ editing, accounts, companyId, onClose, onSaved }) => {
  const [form, setForm] = useState({
    code:        editing?.code        ?? '',
    name:        editing?.name        ?? '',
    type:        editing?.type        ?? 'ASSET',
    category:    editing?.category    ?? 'CURRENT_ASSET',
    description: editing?.description ?? '',
    parentId:    editing?.parentId    ?? '',
    isActive:    editing?.isActive    ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parentId: form.parentId || undefined, companyId };
      if (editing) {
        await api.patch(`/ovds/accounts/${editing.id}`, payload);
        toast.success('Account updated');
      } else {
        await api.post('/ovds/accounts', payload);
        toast.success('Account created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={editing ? `Edit Account — ${editing.code}` : 'New Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Account Code *">
            <Input value={form.code} onChange={set('code')} placeholder="e.g. 1001" required disabled={!!editing} />
          </FormField>
          <FormField label="Account Name *">
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Cash on Hand" required />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type *">
            <select value={form.type} onChange={set('type') as any}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20">
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Category *">
            <select value={form.category} onChange={set('category') as any}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20">
              {ACCOUNT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Parent Account">
          <select value={form.parentId} onChange={set('parentId') as any}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20">
            <option value="">None (top-level)</option>
            {accounts.filter(a => a.id !== editing?.id).map(a => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Description">
          <Input value={form.description} onChange={set('description')} placeholder="Optional description" />
        </FormField>
        {editing && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="rounded" />
            <span>Account is active</span>
          </label>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="ghost" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create Account'}</Btn>
        </div>
      </form>
    </Modal>
  );
};

const EMPTY_LINE = (): JournalLineInput => ({ accountId: '', debit: 0, credit: 0 });

const JournalForm: React.FC<{
  accounts: Account[];
  companyId?: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ accounts, companyId, onClose, onSaved }) => {
  const [desc, setDesc] = useState('');
  const [ref, setRef]   = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<JournalLineInput[]>([EMPTY_LINE(), EMPTY_LINE()]);

  const addLine    = () => setLines(l => [...l, EMPTY_LINE()]);
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i));
  const setLine    = (i: number, k: keyof JournalLineInput, v: any) =>
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [k]: v } : line));

  const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) { toast.error('Description is required'); return; }
    if (!balanced)    { toast.error(`Not balanced: Dr ${fmt(totalDebit)} ≠ Cr ${fmt(totalCredit)}`); return; }
    setSaving(true);
    try {
      await api.post('/double-entry/journals', { date, reference: ref || undefined, description: desc, companyId, lines });
      toast.success('Journal entry posted');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to post entry');
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="New Manual Journal Entry" width="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Date *">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </FormField>
          <FormField label="Reference">
            <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="JE-0001" />
          </FormField>
          <FormField label="Description *">
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Purpose of entry" required />
          </FormField>
        </div>

        {/* Lines grid */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white dark:bg-slate-800/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase">Account</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase">Note</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 uppercase w-28">Debit</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 uppercase w-28">Credit</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-1.5">
                    <select
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                      value={line.accountId}
                      onChange={e => setLine(i, 'accountId', e.target.value)}
                      required
                    >
                      <option value="">Select account…</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm focus:outline-none"
                      value={line.description ?? ''}
                      onChange={e => setLine(i, 'description', e.target.value)}
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" min="0" step="0.01"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-right focus:outline-none"
                      value={line.debit || ''}
                      onChange={e => setLine(i, 'debit', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" min="0" step="0.01"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-right focus:outline-none"
                      value={line.credit || ''}
                      onChange={e => setLine(i, 'credit', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {lines.length > 2 && (
                      <button type="button" onClick={() => removeLine(i)}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400">
                        <MinusCircle size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="px-3 py-2">
                  <button type="button" onClick={addLine}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--pro-azure)] hover:text-[var(--pro-azure)]">
                    <PlusCircle size={13} /> Add Line
                  </button>
                </td>
                <td className={`px-3 py-2 text-right text-sm font-bold ${balanced ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>{fmt(totalDebit)}</td>
                <td className={`px-3 py-2 text-right text-sm font-bold ${balanced ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>{fmt(totalCredit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {!balanced && (
          <p className="text-xs text-rose-500 font-semibold">
            ⚠ Difference: {fmt(Math.abs(totalDebit - totalCredit))}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="ghost" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" type="submit" loading={saving} disabled={!balanced}>Post Entry</Btn>
        </div>
      </form>
    </Modal>
  );
};

// ── Balance-Sheet Section ────────────────────────────────────────────────────

const BsSection: React.FC<{ title: string; rows: TrialBalanceRow[]; total: number; colorClass: string }> = ({ title, rows, total, colorClass }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
    <div className={`px-4 py-2.5 flex justify-between items-center ${colorClass}`}>
      <span className="font-bold text-sm">{title}</span>
      <Amount value={total} currency="ETB" />
    </div>
    {rows.map(r => (
      <div key={r.accountId} className="flex justify-between items-center px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-sm">
        <span className="text-slate-500">{r.accountCode} — {r.accountName}</span>
        <Amount value={r.balance} currency="ETB" />
      </div>
    ))}
    {rows.length === 0 && <div className="px-4 py-3 text-sm text-slate-400 italic">No accounts</div>}
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────

const DoubleEntry: React.FC = () => {
  usePageTitle('Chart of Accounts');
  const { user } = useAuth();
  const { selectedCompanyId: cp } = useBusiness();
  const qc = useQueryClient();
  const location = useLocation();

  const canWrite = ['ADMIN', 'OVDS', 'ACCOUNTING'].includes(user?.role ?? '');

  // Derive active tab from URL path so sidebar nav links work
  const tabFromPath = (p: string): Tab => {
    if (p.includes('journals'))         return 'journals';
    if (p.includes('trial-balance'))    return 'trial-balance';
    if (p.includes('general-ledger'))   return 'general-ledger';
    if (p.includes('balance-sheet'))    return 'balance-sheet';
    if (p.includes('profit-loss') || p.includes('income-statement')) return 'income-statement';
    return 'coa';
  };

  const [tab, setTab]             = useState<Tab>(() => tabFromPath(location.pathname));
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [showAccForm, setShowAccForm] = useState(false);
  const [editingAcc, setEditingAcc]   = useState<Account | null>(null);
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo,   setDateTo]     = useState('');

  // Keep tab in sync when user navigates via sidebar
  useEffect(() => {
    setTab(tabFromPath(location.pathname));
    setPage(1);
    setSearch('');
   
  }, [location.pathname]);

  // Chart of Accounts
  const { data: _accountsRaw, isLoading: loadingCoa, refetch: refetchCoa } =
    useQuery({
      queryKey: ['de-accounts', cp],
      queryFn: () => api.get('/ovds/accounts', { params: { companyId: cp } }).then((r: { data: any }) => r.data),
      enabled: tab === 'coa',
    });
  const accounts: Account[] = Array.isArray(_accountsRaw)
    ? _accountsRaw
    : Array.isArray(_accountsRaw?.data)
      ? _accountsRaw.data
      : [];

  const filteredAccounts = accounts.filter(a =>
    !search || a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Journal Entries
  const journalParams = { companyId: cp, page: String(page), limit: '20', ...(search && { search }), ...(dateFrom && { from: dateFrom }), ...(dateTo && { to: dateTo }) };
  const { data: journalData, isLoading: loadingJournals, refetch: refetchJournals } =
    useQuery({
      queryKey: ['de-journals', journalParams],
      queryFn: () => api.get('/double-entry/journals', { params: journalParams }).then((r: { data: any }) => r.data),
      enabled: tab === 'journals',
    });

  const journals: JournalEntry[] = Array.isArray(journalData)
    ? journalData
    : Array.isArray(journalData?.data)
      ? journalData.data
      : [];
  const journalPages: number = journalData?.pages ?? journalData?.totalPages ?? 1;

  // Trial Balance
  const { data: _tbRaw, isLoading: loadingTB } =
    useQuery({
      queryKey: ['de-trial-balance', cp, dateFrom, dateTo],
      queryFn: () => api.get('/ovds/reports/trial-balance', { params: { companyId: cp, from: dateFrom || undefined, to: dateTo || undefined } }).then((r: { data: any }) => r.data),
      enabled: tab === 'trial-balance',
    });
  const trialBalance: TrialBalanceRow[] = Array.isArray(_tbRaw)
    ? _tbRaw
    : Array.isArray(_tbRaw?.data)
      ? _tbRaw.data
      : [];

  const tbDebit  = trialBalance.reduce((s, r: TrialBalanceRow) => s + r.totalDebit, 0);
  const tbCredit = trialBalance.reduce((s, r: TrialBalanceRow) => s + r.totalCredit, 0);

  // General Ledger
  const glParams = { companyId: cp, page: String(page), limit: '20', ...(dateFrom && { from: dateFrom }), ...(dateTo && { to: dateTo }) };
  const { data: glData, isLoading: loadingGL } =
    useQuery({
      queryKey: ['de-gl', glParams],
      queryFn: () => api.get('/ovds/reports/general-ledger', { params: glParams }).then((r: { data: any }) => r.data),
      enabled: tab === 'general-ledger',
    });

  const glEntries: JournalEntry[] = Array.isArray(glData)
    ? glData
    : Array.isArray(glData?.data)
      ? glData.data
      : [];
  const glPages: number = glData?.pages ?? glData?.totalPages ?? 1;

  // Balance Sheet
  const { data: _bsRaw, isLoading: loadingBS } =
    useQuery({
      queryKey: ['de-balance-sheet', cp, dateTo],
      queryFn: () => api.get('/ovds/reports/balance-sheet', { params: { companyId: cp, asOf: dateTo || undefined } }).then((r: { data: any }) => r.data),
      enabled: tab === 'balance-sheet',
    });
  const bs: BalanceSheetData | undefined = _bsRaw
    ? (_bsRaw?.assets !== undefined ? _bsRaw : _bsRaw?.data)
    : undefined;

  // Income Statement (P&L)
  const { data: _plRaw, isLoading: loadingPL } =
    useQuery({
      queryKey: ['de-income-statement', cp, dateFrom, dateTo],
      queryFn: () => api.get('/ovds/reports/profit-loss', { params: { companyId: cp, from: dateFrom || undefined, to: dateTo || undefined } }).then((r: { data: any }) => r.data),
      enabled: tab === 'income-statement',
    });
  const pl: IncomeStatementData | undefined = _plRaw
    ? (_plRaw?.revenue !== undefined ? _plRaw : _plRaw?.data)
    : undefined;

  // Delete journal entry
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/double-entry/journals/${id}`),
    onSuccess: () => { toast.success('Entry deleted'); qc.invalidateQueries({ queryKey: ['de-journals'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Delete failed'),
  });

  // Delete account
  const deleteAccMut = useMutation({
    mutationFn: (id: string) => api.delete(`/ovds/accounts/${id}`),
    onSuccess: () => { toast.success('Account deleted'); qc.invalidateQueries({ queryKey: ['de-accounts'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Delete failed'),
  });

  const handleDelete = useCallback(async (entry: JournalEntry) => {
    if (!(await confirm({ title: 'Delete Journal Entry?', message: `Delete "${entry.description}"?`, variant: 'danger' }))) return;
    deleteMut.mutate(entry.id);
  }, [deleteMut]);

  const handleDeleteAccount = useCallback(async (acc: Account) => {
    if (!(await confirm({ title: 'Delete Account?', message: `Delete "${acc.code} — ${acc.name}"? This cannot be undone.`, variant: 'danger' }))) return;
    deleteAccMut.mutate(acc.id);
  }, [deleteAccMut]);

  const handleTabChange = (t: Tab) => { setTab(t); setPage(1); setSearch(''); };

  const invalidateDE = () => {
    qc.invalidateQueries({ queryKey: ['de-journals'] });
    qc.invalidateQueries({ queryKey: ['de-trial-balance'] });
    qc.invalidateQueries({ queryKey: ['de-balance-sheet'] });
    qc.invalidateQueries({ queryKey: ['de-income-statement'] });
    qc.invalidateQueries({ queryKey: ['de-gl'] });
  };

  // Shared date filter
  const DateFilter = () => (
    <div className="flex items-center gap-2 ml-auto flex-wrap">
      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
      <span className="text-xs text-slate-400">to</span>
      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20" />
      {(dateFrom || dateTo) && <Btn variant="ghost" size="xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</Btn>}
    </div>
  );

  const tbKpis: KpiCell[] = [
    { label: 'Total Debits',  value: fmt(tbDebit),           icon: <PlusCircle size={16} className="text-sky-500" /> },
    { label: 'Total Credits', value: fmt(tbCredit),          icon: <MinusCircle size={16} className="text-violet-500" /> },
    { label: 'Net Balance',   value: fmt(tbDebit - tbCredit), icon: <Scale size={16} className={Math.abs(tbDebit - tbCredit) < 0.01 ? 'text-[var(--pro-azure)]' : 'text-rose-500'} /> },
  ];

  return (
    <AppPage
      title="Double-Entry Accounting"
      subtitle="Chart of Accounts · General Ledger · Trial Balance · Manual Journals"
      icon={<Scale size={22} />}
      actions={
        canWrite && tab === 'journals' ? (
          <Btn variant="primary" icon={<Plus size={15} />} onClick={() => setShowForm(true)}>New Journal Entry</Btn>
        ) : canWrite && tab === 'coa' ? (
          <Btn variant="primary" icon={<Plus size={15} />} onClick={() => { setEditingAcc(null); setShowAccForm(true); }}>New Account</Btn>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex flex-wrap gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        {tab !== 'coa' && <DateFilter />}
        {tab === 'coa' && (
          <div className="ml-auto flex items-center gap-2">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search accounts…"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 w-52"
            />
            <Btn variant="ghost" icon={<RefreshCw size={14} />} onClick={() => refetchCoa()} title="Refresh" />
          </div>
        )}
        {tab === 'journals' && (
          <div className="ml-auto flex items-center gap-2">
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search entries…"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 w-52"
            />
            <Btn variant="ghost" icon={<RefreshCw size={14} />} onClick={() => refetchJournals()} title="Refresh" />
          </div>
        )}
      </div>

      {/* ── Chart of Accounts ─────────────────────────────────────────────── */}
      {tab === 'coa' && (
        <>
          {loadingCoa ? (
            <div className="flex justify-center py-16 text-slate-400">Loading accounts…</div>
          ) : filteredAccounts.length === 0 ? (
            <EmptyState
              icon={<List size={36} className="text-slate-300" />}
              title="No accounts found"
              description="Chart of accounts is empty or nothing matches your search."
              action={canWrite ? { label: 'New Account', onClick: () => { setEditingAcc(null); setShowAccForm(true); } } : undefined}
            />
          ) : (
            <AppTable loading={loadingCoa}>
              <thead>
                <tr>
                  <AppTh>Code</AppTh>
                  <AppTh>Account Name</AppTh>
                  <AppTh>Type</AppTh>
                  <AppTh>Category</AppTh>
                  <AppTh>Status</AppTh>
                  {canWrite && <AppTh align="right">Actions</AppTh>}
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(a => (
                  <AppTr key={a.id}>
                    <AppTd><span className="font-mono text-sm font-bold text-[var(--pro-azure)]">{a.code}</span></AppTd>
                    <AppTd>
                      <div className="font-semibold text-sm">{a.name}</div>
                      {a.description && <div className="text-xs text-slate-400 truncate max-w-[220px]">{a.description}</div>}
                    </AppTd>
                    <AppTd>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {a.type}
                      </span>
                    </AppTd>
                    <AppTd muted>{a.category.replace(/_/g, ' ')}</AppTd>
                    <AppTd>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${a.isActive ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-900/20 dark:text-[var(--pro-azure-light)] dark:border-green-800' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </AppTd>
                    {canWrite && (
                      <AppTd align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Btn variant="ghost" size="xs" icon={<Edit2 size={13} />}
                            onClick={() => { setEditingAcc(a); setShowAccForm(true); }} title="Edit" />
                          <Btn variant="ghost" size="xs" icon={<Trash2 size={13} className="text-rose-400" />}
                            onClick={() => handleDeleteAccount(a)} title="Delete" />
                        </div>
                      </AppTd>
                    )}
                  </AppTr>
                ))}
              </tbody>
            </AppTable>
          )}
        </>
      )}

      {/* ── Manual Journals ───────────────────────────────────────────────── */}
      {tab === 'journals' && (
        <>
          {journals.length === 0 && !loadingJournals ? (
            <EmptyState
              icon={<FileText size={36} className="text-slate-300" />}
              title="No journal entries"
              description="Post your first manual journal entry to get started."
              action={canWrite ? { label: 'New Entry', onClick: () => setShowForm(true) } : undefined}
            />
          ) : (
            <AppTable loading={loadingJournals}>
              <thead>
                <tr>
                  <AppTh>Date</AppTh>
                  <AppTh>Reference</AppTh>
                  <AppTh>Description</AppTh>
                  <AppTh align="right">Debit</AppTh>
                  <AppTh align="right">Credit</AppTh>
                  <AppTh>Status</AppTh>
                  <AppTh>Posted By</AppTh>
                  {canWrite && <AppTh align="right">Actions</AppTh>}
                </tr>
              </thead>
              <tbody>
                {journals.map(je => {
                  const dr = je.journalLine?.reduce((s: number, l: JournalLine) => s + (Number(l.debit)  || 0), 0) ?? 0;
                  const cr = je.journalLine?.reduce((s: number, l: JournalLine) => s + (Number(l.credit) || 0), 0) ?? 0;
                  return (
                    <AppTr key={je.id}>
                      <AppTd muted>{fmtDate(je.date)}</AppTd>
                      <AppTd muted>{je.reference ?? '—'}</AppTd>
                      <AppTd>
                        <div className="font-semibold text-sm max-w-[220px] truncate">{je.description}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{je.journalLine?.length ?? 0} lines</div>
                      </AppTd>
                      <AppTd align="right"><Amount value={dr} currency="ETB" /></AppTd>
                      <AppTd align="right"><Amount value={cr} currency="ETB" /></AppTd>
                      <AppTd>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          je.status === 'POSTED'   ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-900/20 dark:text-[var(--pro-azure-light)] dark:border-green-800' :
                          je.status === 'REVERSED' ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700' :
                                                     'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                        }`}>{je.status}</span>
                      </AppTd>
                      <AppTd muted>{je.postedBy ?? '—'}</AppTd>
                      {canWrite && (
                        <AppTd align="right">
                          {je.status !== 'POSTED' && (
                            <Btn variant="ghost" size="xs"
                              icon={<Trash2 size={13} className="text-rose-400" />}
                              onClick={() => handleDelete(je)}
                              title="Delete"
                            />
                          )}
                        </AppTd>
                      )}
                    </AppTr>
                  );
                })}
              </tbody>
            </AppTable>
          )}
          {journalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} pages={journalPages} total={journalData?.total ?? 0} onChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* ── Trial Balance ─────────────────────────────────────────────────── */}
      {tab === 'trial-balance' && (
        <>
          <AppKpi cells={tbKpis} cols={3} className="mb-5" />
          {trialBalance.length === 0 && !loadingTB ? (
            <EmptyState
              icon={<Scale size={36} className="text-slate-300" />}
              title="No trial balance data"
              description="Post journal entries to generate a trial balance."
            />
          ) : (
            <AppTable loading={loadingTB}>
              <thead>
                <tr>
                  <AppTh>Code</AppTh>
                  <AppTh>Account Name</AppTh>
                  <AppTh>Category</AppTh>
                  <AppTh align="right">Debit</AppTh>
                  <AppTh align="right">Credit</AppTh>
                  <AppTh align="right">Balance</AppTh>
                </tr>
              </thead>
              <tbody>
                {trialBalance.map(r => (
                  <AppTr key={r.accountId}>
                    <AppTd><span className="font-mono text-sm font-bold text-[var(--pro-azure)]">{r.accountCode}</span></AppTd>
                    <AppTd><span className="font-semibold text-sm">{r.accountName}</span></AppTd>
                    <AppTd muted>{r.accountCategory}</AppTd>
                    <AppTd align="right"><Amount value={r.totalDebit}  currency="ETB" /></AppTd>
                    <AppTd align="right"><Amount value={r.totalCredit} currency="ETB" /></AppTd>
                    <AppTd align="right">
                      <span className={`font-bold text-sm ${r.balance >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>
                        {fmt(r.balance)}
                      </span>
                    </AppTd>
                  </AppTr>
                ))}
              </tbody>
              {trialBalance.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50">
                    <td colSpan={3} className="px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-200">TOTALS</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{fmt(tbDebit)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{fmt(tbCredit)}</td>
                    <td className={`px-4 py-3 text-right text-sm font-black ${Math.abs(tbDebit - tbCredit) < 0.01 ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>
                      {fmt(tbDebit - tbCredit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </AppTable>
          )}
        </>
      )}

      {/* ── General Ledger ────────────────────────────────────────────────── */}
      {tab === 'general-ledger' && (
        <>
          {glEntries.length === 0 && !loadingGL ? (
            <EmptyState
              icon={<BookOpen size={36} className="text-slate-300" />}
              title="No ledger entries"
              description="No posted journal entries found for this date range."
            />
          ) : (
            <AppTable loading={loadingGL}>
              <thead>
                <tr>
                  <AppTh>Date</AppTh>
                  <AppTh>Reference</AppTh>
                  <AppTh>Description</AppTh>
                  <AppTh>Lines</AppTh>
                  <AppTh>Status</AppTh>
                  <AppTh>Posted By</AppTh>
                </tr>
              </thead>
              <tbody>
                {glEntries.map(je => (
                  <AppTr key={je.id}>
                    <AppTd muted>{fmtDate(je.date)}</AppTd>
                    <AppTd muted>{je.reference ?? '—'}</AppTd>
                    <AppTd>
                      <div className="font-semibold text-sm max-w-[240px] truncate">{je.description}</div>
                    </AppTd>
                    <AppTd>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        {je.journalLine?.slice(0, 3).map((l, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-[var(--pro-azure)] w-14 shrink-0 truncate">{l.account?.code}</span>
                            <span className="truncate max-w-[120px]">{l.account?.name}</span>
                            {Number(l.debit)  > 0 && <span className="ml-auto text-[var(--pro-azure)] shrink-0">Dr {fmt(Number(l.debit))}</span>}
                            {Number(l.credit) > 0 && <span className="ml-auto text-sky-600 shrink-0">Cr {fmt(Number(l.credit))}</span>}
                          </div>
                        ))}
                        {(je.journalLine?.length ?? 0) > 3 && (
                          <span className="text-slate-400">+{(je.journalLine?.length ?? 0) - 3} more</span>
                        )}
                      </div>
                    </AppTd>
                    <AppTd>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)] dark:bg-green-900/20 dark:text-[var(--pro-azure-light)] dark:border-green-800">
                        {je.status}
                      </span>
                    </AppTd>
                    <AppTd muted>{je.postedBy ?? '—'}</AppTd>
                  </AppTr>
                ))}
              </tbody>
            </AppTable>
          )}
          {glPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} pages={glPages} total={glData?.total ?? 0} onChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* ── Balance Sheet ─────────────────────────────────────────────────── */}
      {tab === 'balance-sheet' && (
        loadingBS ? (
          <div className="flex justify-center py-16 text-slate-400">Loading balance sheet…</div>
        ) : !bs ? (
          <EmptyState
            icon={<BarChart2 size={36} className="text-slate-300" />}
            title="No balance sheet data"
            description="Post journal entries to see the balance sheet."
          />
        ) : (
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-slate-400 text-right mb-4">
              As of: {bs.asOf ? fmtDate(bs.asOf) : 'Today'}
            </p>
            <BsSection
              title="ASSETS"
              rows={bs.assets.rows}
              total={bs.assets.total}
              colorClass="bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-green-300"
            />
            <BsSection
              title="LIABILITIES"
              rows={bs.liabilities.rows}
              total={bs.liabilities.total}
              colorClass="bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300"
            />
            <BsSection
              title="EQUITY"
              rows={bs.equity.rows}
              total={bs.equity.total}
              colorClass="bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-300"
            />
            <div className="rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-3 flex justify-between items-center mt-2">
              <span className="font-black text-sm text-slate-700 dark:text-slate-200">
                TOTAL LIABILITIES &amp; EQUITY
              </span>
              <Amount value={bs.totalLiabilitiesAndEquity} currency="ETB" />
            </div>
            {Math.abs(bs.assets.total - bs.totalLiabilitiesAndEquity) > 0.01 && (
              <p className="text-xs text-rose-500 font-semibold text-center mt-3">
                ⚠ Sheet does not balance — Assets: {fmt(bs.assets.total)} vs L+E: {fmt(bs.totalLiabilitiesAndEquity)}
              </p>
            )}
          </div>
        )
      )}

      {/* ── Income Statement (P&L) ────────────────────────────────────────── */}
      {tab === 'income-statement' && (
        loadingPL ? (
          <div className="flex justify-center py-16 text-slate-400">Loading income statement…</div>
        ) : !pl ? (
          <EmptyState
            icon={<TrendingUp size={36} className="text-slate-300" />}
            title="No income statement data"
            description="Post journal entries to generate an income statement."
          />
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Period header */}
            <p className="text-xs text-slate-400 text-right mb-4">
              Period: {pl.from ? fmtDate(pl.from) : 'All time'} — {pl.to ? fmtDate(pl.to) : 'Today'}
            </p>

            {/* KPI strip */}
            <AppKpi cells={[
              { label: 'Total Revenue',  value: fmt(pl.revenue.total),  icon: <TrendingUp  size={15} className="text-[var(--pro-azure)]" /> },
              { label: 'Gross Profit',   value: fmt(pl.grossProfit),    icon: <BarChart2   size={15} className={pl.grossProfit  >= 0 ? 'text-sky-500'     : 'text-rose-500'} /> },
              { label: 'Net Income',     value: fmt(pl.netIncome),      icon: <Scale       size={15} className={pl.netIncome    >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-500'} /> },
            ]} cols={3} className="mb-5" />

            {/* Revenue */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
              <div className="px-4 py-2.5 flex justify-between items-center bg-[var(--pro-azure-50)] dark:bg-green-900/20">
                <span className="font-bold text-sm text-[var(--pro-azure-dark)] dark:text-green-300">REVENUE</span>
                <Amount value={pl.revenue.total} currency="ETB" />
              </div>
              {pl.revenue.rows.map(r => (
                <div key={r.accountId} className="flex justify-between items-center px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-500">{r.accountCode} — {r.accountName}</span>
                  <Amount value={r.netAmount} currency="ETB" />
                </div>
              ))}
              {pl.revenue.rows.length === 0 && <div className="px-4 py-3 text-sm text-slate-400 italic">No revenue accounts</div>}
            </div>

            {/* COGS */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
              <div className="px-4 py-2.5 flex justify-between items-center bg-amber-50 dark:bg-amber-900/20">
                <span className="font-bold text-sm text-amber-800 dark:text-amber-300">COST OF GOODS SOLD</span>
                <Amount value={pl.cogs.total} currency="ETB" />
              </div>
              {pl.cogs.rows.map(r => (
                <div key={r.accountId} className="flex justify-between items-center px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-500">{r.accountCode} — {r.accountName}</span>
                  <Amount value={r.netAmount} currency="ETB" />
                </div>
              ))}
              {pl.cogs.rows.length === 0 && <div className="px-4 py-3 text-sm text-slate-400 italic">No COGS accounts</div>}
            </div>

            {/* Gross profit subtotal */}
            <div className="flex justify-between items-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 bg-white dark:bg-slate-800/50">
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">GROSS PROFIT</span>
              <span className={`font-black text-sm ${pl.grossProfit >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>{fmt(pl.grossProfit)}</span>
            </div>

            {/* Operating expenses */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
              <div className="px-4 py-2.5 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20">
                <span className="font-bold text-sm text-rose-800 dark:text-rose-300">OPERATING EXPENSES</span>
                <Amount value={pl.expenses.total} currency="ETB" />
              </div>
              {pl.expenses.rows.map(r => (
                <div key={r.accountId} className="flex justify-between items-center px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-500">{r.accountCode} — {r.accountName}</span>
                  <Amount value={r.netAmount} currency="ETB" />
                </div>
              ))}
              {pl.expenses.rows.length === 0 && <div className="px-4 py-3 text-sm text-slate-400 italic">No expense accounts</div>}
            </div>

            {/* Net income */}
            <div className={`flex justify-between items-center px-4 py-3 rounded-xl border-2 mt-2 ${pl.netIncome >= 0 ? 'border-[var(--pro-azure-light)] dark:border-green-700' : 'border-rose-300 dark:border-rose-700'}`}>
              <span className="font-black text-sm text-slate-700 dark:text-slate-200">NET INCOME</span>
              <span className={`font-black text-base ${pl.netIncome >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>{fmt(pl.netIncome)}</span>
            </div>
          </div>
        )
      )}

      {/* ── New Journal Entry Modal ──────────────────────────────────────── */}
      {showForm && (
        <JournalForm
          accounts={accounts.length ? accounts : []}
          companyId={cp ?? undefined}
          onClose={() => setShowForm(false)}
          onSaved={invalidateDE}
        />
      )}

      {/* ── Account Form Modal ───────────────────────────────────────────── */}
      {showAccForm && (
        <AccountForm
          editing={editingAcc}
          accounts={accounts}
          companyId={cp ?? undefined}
          onClose={() => { setShowAccForm(false); setEditingAcc(null); }}
          onSaved={() => qc.invalidateQueries({ queryKey: ['de-accounts'] })}
        />
      )}
    </AppPage>
  );
};

export default DoubleEntry;
