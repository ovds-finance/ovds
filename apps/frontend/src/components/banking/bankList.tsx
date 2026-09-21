/**
 * BankList — Ovds-inspired bank accounts page
 * White cards · teal accents · icon-labeled fields · pill badges
 */
import {
  Plus, RefreshCw, Landmark, CheckCircle2, AlertTriangle,
  ArrowLeftRight, Upload, TrendingUp, TrendingDown, BarChart3, Wallet,
  Activity, ShieldCheck, ScanLine, ChevronRight, Link2, Search, Filter,
  ArrowUpDown, Building2, CircleDot, MoreHorizontal,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, Link } from 'react-router-dom';

import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

import BankAccountCard from './bankAccount';
import BankModal from './bankModal';
import BankTransactionModal from './bankTransactionModal';
import SmartReconciliationModal from './smartReconciliationModal';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

type BankTab = 'accounts' | 'transactions' | 'transfers' | 'reconciliations';

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  BANK: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  CREDIT_CARD: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  CASH: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  SAVINGS: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  LOAN: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BANK: 'Bank Account',
  CREDIT_CARD: 'Credit Card',
  CASH: 'Cash',
  SAVINGS: 'Savings',
  LOAN: 'Loan',
};

const BANK_COLORS: Record<string, string> = {
  'Commercial Bank of Ethiopia': 'bg-[#0057a8]',
  'CBE': 'bg-[#0057a8]',
  'Awash Bank': 'bg-[#e04e1e]',
  'Awash': 'bg-[#e04e1e]',
  'Dashen Bank': 'bg-[#004f9f]',
  'Dashen': 'bg-[#004f9f]',
  'Abyssinia Bank': 'bg-[#007a40]',
  'Abyssinia': 'bg-[#007a40]',
  'Wegagen Bank': 'bg-[#c8102e]',
  'Wegagen': 'bg-[#c8102e]',
  'United Bank': 'bg-[#6b21a8]',
  'Nib International Bank': 'bg-[#1d4ed8]',
  'NIB': 'bg-[#1d4ed8]',
  'Cooperative Bank of Oromia': 'bg-[#15803d]',
  'CBO': 'bg-[#15803d]',
  'Berhan Bank': 'bg-[#7c3aed]',
  'Berhan': 'bg-[#7c3aed]',
  'Bunna International Bank': 'bg-[#b45309]',
  'Bunna': 'bg-[#b45309]',
  'Zemen Bank': 'bg-[#0e7490]',
  'Zemen': 'bg-[#0e7490]',
  'Oromia International Bank': 'bg-[#166534]',
  'OIB': 'bg-[#166534]',
  'Addis International Bank': 'bg-[#9f1239]',
  'AIB': 'bg-[#9f1239]',
  'Enat Bank': 'bg-[#be185d]',
  'Enat': 'bg-[#be185d]',
  'Amhara Bank': 'bg-[#1e40af]',
  'Amhara': 'bg-[#1e40af]',
  'Tsedey Bank': 'bg-[#065f46]',
  'Tsedey': 'bg-[#065f46]',
  'Telebirr': 'bg-[#2563eb]',
};

const getBankColor = (bankName?: string) => {
  if (!bankName) return 'bg-slate-600';
  for (const [key, color] of Object.entries(BANK_COLORS)) {
    if (bankName.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return 'bg-slate-500';
};

const getBankShort = (bankName?: string) => {
  if (!bankName) return '—';
  const known = Object.keys(BANK_COLORS).filter(k => bankName.toLowerCase().includes(k.toLowerCase()));
  if (known.length > 0) {
    const match = known.sort((a, b) => b.length - a.length)[0];
    if (match.length <= 4) return match.toUpperCase();
    return match.slice(0, 3).toUpperCase();
  }
  return bankName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-[var(--pro-azure-light)]',
  INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  ARCHIVED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
};

// ── Ovds-style KPI card ──────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent: string; textColor: string;
}> = ({ label, value, sub, icon, accent, textColor }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <span className={textColor}>{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums leading-tight ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Ovds-style tab bar ───────────────────────────────────────────────

const TABS: { key: BankTab; label: string }[] = [
  { key: 'accounts',        label: 'Accounts'       },
  { key: 'transactions',    label: 'Transactions'   },
  { key: 'transfers',       label: 'Transfers'      },
  { key: 'reconciliations', label: 'Reconciliations'},
];

const TabBar: React.FC<{ active: BankTab; onChange: (t: BankTab) => void }> = ({ active, onChange }) => (
  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
    {TABS.map(t => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={[
          'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
          active === t.key
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
        ].join(' ')}
      >
        {t.label}
      </button>
    ))}
  </div>
);

// ── Section header inside panel ───────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; sub: string; icon: React.ReactNode }> = ({ title, sub, icon }) => (
  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-500 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  </div>
);

// ── Action row CTA ────────────────────────────────────────────────────────

type AccentKey = 'teal' | 'rose' | 'violet' | 'sky' | 'amber';
const ACCENT: Record<AccentKey, string> = {
  teal:   'bg-teal-50   dark:bg-teal-900/20   text-teal-500',
  rose:   'bg-rose-50   dark:bg-rose-900/20   text-rose-500',
  violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-500',
  sky:    'bg-sky-50    dark:bg-sky-900/20    text-sky-500',
  amber:  'bg-amber-50  dark:bg-amber-900/20  text-amber-500',
};

const ActionRow: React.FC<{
  label: string; sub: string; icon: React.ReactNode;
  accent?: AccentKey; onClick?: () => void; to?: string;
}> = ({ label, sub, icon, accent = 'teal', onClick, to }) => {
  const accentCls = ACCENT[accent];
  const inner = (
    <>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentCls}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
    </>
  );
  const cls = 'flex items-center gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group';
  if (to)       return <Link to={to} className={cls}>{inner}</Link>;
  if (onClick)  return <button type="button" onClick={onClick} className={cls + ' w-full text-left'}>{inner}</button>;
  return null;
};

// ── Main component ────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────────────────────

interface BankAccount {
  id: string;
  name: string;
  accountNumber?: string;
  bankName?: string;
  accountType?: string;
  accountStatus?: string;
  currencyCode?: string;
  openingBalance?: number;
  balance?: number;
  computedBalance?: number;
  unreconciledCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface ReconcSummary {
  total?: number;
  totalReconciled?: number;
  totalPending?: number;
}

// ── Main component ─────────────────────────────────────────────────────────────

const BankList: React.FC = () => {
  usePageTitle('Bank Accounts');
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<BankTab>(() => {
    const t = searchParams.get('tab') as BankTab | null;
    return t && TABS.some(tb => tb.key === t) ? t : 'accounts';
  });

  const switchTab = (tab: BankTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'accounts' ? {} : { tab }, { replace: true });
  };

  const [banks, setBanks]               = useState<BankAccount[]>([]);
  const [reconcSummary, setReconcSummary] = useState<ReconcSummary | null>(null);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingBank, setEditingBank]   = useState<BankAccount | null>(null);
  const [txnBank, setTxnBank]           = useState<{ id: string; name: string } | null>(null);
  const [showSmartReconcile, setShowSmartReconcile] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'bank' | 'date'>('balance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    if (searchParams.get('action') === 'new' && canWrite) {
      setEditingBank(null); setShowModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canWrite, setSearchParams]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [banksRes, reconcRes] = await Promise.all([
        api.get('/banking/accounts'),
        api.get('/banking/reconciliation/stats').catch(() => ({ data: null })),
      ]);
      setBanks(banksRes.data.data ?? banksRes.data ?? []);
      if (reconcRes.data) setReconcSummary(reconcRes.data.data ?? reconcRes.data);
    } catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalBalance     = useMemo(() => banks.reduce((s, b) => s + (b.computedBalance ?? Number(b.balance ?? 0)), 0), [banks]);
  const totalOpening     = useMemo(() => banks.reduce((s, b) => s + Number(b.openingBalance ?? 0), 0), [banks]);
  const netChange        = totalBalance - totalOpening;
  const totalUnreconciled = reconcSummary?.totalPending ?? banks.reduce((s, b) => s + (b.unreconciledCount ?? 0), 0);
  const currencyGroups   = useMemo(() => {
    const map: Record<string, number> = {};
    banks.forEach(b => { const c = b.currencyCode ?? 'ETB'; map[c] = (map[c] ?? 0) + (b.computedBalance ?? Number(b.balance ?? 0)); });
    return Object.entries(map);
  }, [banks]);

  const avgBalance = useMemo(() => banks.length > 0 ? totalBalance / banks.length : 0, [banks, totalBalance]);

  const accountTypes = useMemo(() => {
    const map: Record<string, number> = {};
    banks.forEach(b => { const t = b.accountType ?? 'BANK'; map[t] = (map[t] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [banks]);

  const filteredBanks = useMemo(() => {
    let result = [...banks];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.bankName?.toLowerCase().includes(q) ||
        b.accountNumber?.toLowerCase().includes(q) ||
        getBankShort(b.bankName)?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'ALL') {
      result = result.filter(b => (b.accountType ?? 'BANK') === typeFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'balance': cmp = (a.computedBalance ?? Number(a.balance ?? 0)) - (b.computedBalance ?? Number(b.balance ?? 0)); break;
        case 'bank': cmp = (a.bankName ?? '').localeCompare(b.bankName ?? ''); break;
        case 'date': cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [banks, searchQuery, sortBy, sortDir, typeFilter]);

  const QUICK_LINKS = [
    { label: 'Statement Import',   icon: <Upload    size={13} />, to: '/banking/statement-import',            accent: 'teal'   },
    { label: 'Scan Bill',          icon: <ScanLine  size={13} />, to: '/banking/statement-import?mode=scan-bill', accent: 'violet' },
    { label: 'Fund Transfers',     icon: <ArrowLeftRight size={13} />, to: '/banking/transfers',             accent: 'violet' },
    { label: 'Cash Flow Forecast', icon: <TrendingUp size={13} />, to: '/banking/treasury',                  accent: 'teal'   },
    { label: 'Reconciliation',     icon: <ShieldCheck size={13} />, onClick: () => setShowSmartReconcile(true), accent: 'amber' },
  ] as const;

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300 bg-white dark:bg-slate-950 min-h-screen">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Bank Accounts</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Manage accounts, record transactions, and reconcile balances</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-teal-500 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {canWrite && (
            <button
              onClick={() => { setEditingBank(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-teal-200 dark:shadow-none"
            >
              <Plus size={15} /> Add Bank Account
            </button>
          )}
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <TabBar active={activeTab} onChange={switchTab} />

      {/* ════════════ ACCOUNTS TAB ════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div className="space-y-5">

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Balance" value={`ETB ${fmt(totalBalance)}`}
              sub={`${banks.length} account${banks.length !== 1 ? 's' : ''}`}
              icon={<Wallet size={18} />}
              accent="bg-teal-50 dark:bg-teal-900/20" textColor="text-teal-600 dark:text-teal-400"
            />
            <KpiCard
              label="Net Change" value={`${netChange >= 0 ? '+' : ''}ETB ${fmt(netChange)}`}
              sub="vs opening balance"
              icon={netChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              accent={netChange >= 0 ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}
              textColor={netChange >= 0 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-rose-600 dark:text-rose-400'}
            />
            <KpiCard
              label="Avg Balance" value={`ETB ${fmt(avgBalance)}`}
              sub="per account"
              icon={<BarChart3 size={18} />}
              accent="bg-violet-50 dark:bg-violet-900/20" textColor="text-violet-600 dark:text-violet-400"
            />
            <KpiCard
              label="Unreconciled" value={String(totalUnreconciled)}
              sub="pending transactions"
              icon={<Activity size={18} />}
              accent={totalUnreconciled > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-[var(--pro-azure-50)] dark:bg-green-900/20'}
              textColor={totalUnreconciled > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}
            />
          </div>

          {/* Account type breakdown */}
          {!loading && accountTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-1">Types:</span>
              {accountTypes.map(([type, count]) => (
                <span key={type} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${ACCOUNT_TYPE_COLORS[type] ?? 'bg-slate-100 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                  <Building2 size={10} />
                  {ACCOUNT_TYPE_LABELS[type] ?? type} ({count})
                </span>
              ))}
            </div>
          )}

          {/* Reconciliation alert */}
          {!loading && totalUnreconciled > 0 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {totalUnreconciled} transaction{totalUnreconciled !== 1 ? 's' : ''} pending reconciliation
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Expand an account below and click "Reconcile All" to clear pending items
                </p>
              </div>
              <button
                onClick={() => setShowSmartReconcile(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex-shrink-0"
              >
                <ShieldCheck size={12} /> Smart Reconcile
              </button>
            </div>
          )}

          {!loading && totalUnreconciled === 0 && banks.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--pro-azure-50)] dark:bg-green-900/20 border border-[var(--pro-azure-100)] dark:border-green-700 rounded-2xl">
              <CheckCircle2 size={15} className="text-[var(--pro-azure)] flex-shrink-0" />
              <p className="text-sm font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">All transactions reconciled — books are clean</p>
            </div>
          )}

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((l: any) => {
              const LINK_ACCENT: Record<string, string> = {
                teal:   'bg-teal-50   dark:bg-teal-900/20   text-teal-600   dark:text-teal-400   border-teal-200   dark:border-teal-700   hover:bg-teal-100',
                violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700 hover:bg-violet-100',
                amber:  'bg-amber-50  dark:bg-amber-900/20  text-amber-600  dark:text-amber-400  border-amber-200  dark:border-amber-700  hover:bg-amber-100',
              };
              const cls = `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${LINK_ACCENT[l.accent] ?? LINK_ACCENT.teal}`;
              if (l.onClick) return <button key={l.label} onClick={l.onClick} className={cls}>{l.icon}{l.label}</button>;
              return <Link key={l.label} to={l.to} className={cls}>{l.icon}{l.label}</Link>;
            })}
          </div>

          {/* Search / Filter / Sort toolbar */}
          {!loading && banks.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-md">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search accounts by name, bank, or number…"
                  className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {['ALL', ...accountTypes.map(t => t[0])].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      typeFilter === t
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t === 'ALL' ? 'All' : (ACCOUNT_TYPE_LABELS[t] ?? t)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
                >
                  <option value="balance">Sort: Balance</option>
                  <option value="name">Sort: Name</option>
                  <option value="bank">Sort: Bank</option>
                  <option value="date">Sort: Date Added</option>
                </select>
                <button
                  onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 transition-colors"
                  title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown size={12} className={sortDir === 'asc' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          )}

          {/* Account cards */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg w-48" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-32" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-lg w-28" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : banks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-4">
                <Landmark size={28} className="text-teal-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">No bank accounts yet</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-xs mb-6">
                Add your first bank account to start recording transactions and reconciling balances
              </p>
              {canWrite && (
                <button
                  onClick={() => { setEditingBank(null); setShowModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <Plus size={15} /> Add First Account
                </button>
              )}
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Search size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No accounts match your search</p>
              <button onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); }} className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-semibold">Clear filters</button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBanks.map(bank => (
                <BankAccountCard
                  key={bank.id} bank={bank}
                  onRecordTxn={() => setTxnBank({ id: bank.id, name: bank.name })}
                  onEdit={() => { setEditingBank(bank); setShowModal(true); }}
                  onDeleted={fetchAll}
                />
              ))}
            </div>
          )}

          {/* Multi-currency breakdown */}
          {!loading && currencyGroups.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2 mb-4">
                <BarChart3 size={11} /> Balance by Currency
              </p>
              <div className="space-y-3">
                {currencyGroups.map(([currency, balance]) => {
                  const pct = totalBalance > 0 ? Math.round((balance / totalBalance) * 100) : 0;
                  return (
                    <div key={currency} className="flex items-center gap-3">
                      <span className="w-10 text-xs font-bold text-slate-600 dark:text-slate-300 text-right flex-shrink-0">{currency}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums w-32 text-right flex-shrink-0">
                        {fmt(balance)}
                      </span>
                      <span className="text-[10px] text-slate-400 w-8 text-right flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ TRANSACTIONS TAB ════════════════════════════════════ */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Account summary table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3 bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
              {['Name', 'Account No.', 'Bank', 'Type', 'Status', 'Balance'].map((h, i) => (
                <p key={h} className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ${i === 5 ? 'text-right' : ''}`}>{h}</p>
              ))}
            </div>
            {filteredBanks.map(b => {
              const statusColor = STATUS_COLORS[(b as any).status ?? 'ACTIVE'] ?? STATUS_COLORS.ACTIVE;
              const typeLabel = ACCOUNT_TYPE_LABELS[b.accountType ?? 'BANK'] ?? b.accountType ?? 'Bank Account';
              return (
                <div key={b.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors last:border-b-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getBankColor(b.bankName)}`}>
                      <span className="text-white text-[9px] font-bold">{getBankShort(b.bankName)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{b.name}</p>
                  </div>
                  <p className="text-sm text-slate-500 font-mono">{b.accountNumber ? `****${String(b.accountNumber).slice(-4)}` : '—'}</p>
                  <p className="text-sm text-slate-500 truncate">{b.bankName ?? '—'}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${ACCOUNT_TYPE_COLORS[b.accountType ?? 'BANK'] ?? 'bg-slate-100 text-slate-500'}`}>
                    {typeLabel}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${statusColor}`}>
                    {(b as any).status ?? 'ACTIVE'}
                  </span>
                  <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 text-right tabular-nums">
                    {(b.currencyCode ?? 'ETB')} {fmt(b.computedBalance ?? Number(b.balance ?? 0))}
                  </p>
                </div>
              );
            })}
            {filteredBanks.length === 0 && !loading && (
              <p className="px-6 py-6 text-sm text-slate-400 text-center">No bank accounts — add one in the Accounts tab.</p>
            )}
          </div>

          {/* Transaction actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <SectionHeader title="Transactions" icon={<ArrowLeftRight size={16} />}
              sub="Record incomes or expenses. Invoice/bill payments are also listed here." />
            <ActionRow label="New Income" accent="teal"
              sub="Enter the details and create your first income transaction"
              icon={<TrendingUp size={15} />}
              onClick={() => { const first = banks[0]; if (first) setTxnBank({ id: first.id, name: first.name }); else { setEditingBank(null); setShowModal(true); } }} />
            <ActionRow label="New Expense" accent="rose"
              sub="Enter the details and create your first expense transaction"
              icon={<TrendingDown size={15} />}
              onClick={() => { const first = banks[0]; if (first) setTxnBank({ id: first.id, name: first.name }); else { setEditingBank(null); setShowModal(true); } }} />
            <ActionRow label="Connect Your Bank" accent="teal"
              sub="Import transactions securely to automate your bookkeeping"
              icon={<Link2 size={15} />} to="/banking/statement-import" />
          </div>
        </div>
      )}

      {/* ════════════ TRANSFERS TAB ═══════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <SectionHeader title="Transfers" icon={<ArrowLeftRight size={16} />}
            sub="Move money between accounts, whether the same currency or not." />
          <ActionRow label="New Transfer" accent="violet"
            sub="Enter the details and create your first transfer"
            icon={<ArrowLeftRight size={15} />} to="/banking/transfers" />
          <ActionRow label="Import Transfers" accent="sky"
            sub="Import your existing transfers with a single click"
            icon={<Upload size={15} />} to="/banking/statement-import" />
          <ActionRow label="Connect Your Bank" accent="teal"
            sub="Import transactions securely to automate your bookkeeping"
            icon={<Link2 size={15} />} to="/banking/statement-import" />
        </div>
      )}

      {/* ════════════ RECONCILIATIONS TAB ════════════════════════════════ */}
      {activeTab === 'reconciliations' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <SectionHeader title="Reconciliations" icon={<ShieldCheck size={16} />}
              sub="Ensure your company bank records match your actual bank statements." />
            <ActionRow label="New Reconciliation" accent="amber"
              sub="Enter the details and create your first reconciliation"
              icon={<ShieldCheck size={15} />} onClick={() => setShowSmartReconcile(true)} />
            <ActionRow label="Connect Your Bank" accent="teal"
              sub="Import statements to reconcile automatically"
              icon={<Link2 size={15} />} to="/banking/statement-import" />
          </div>

          {reconcSummary && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total',       value: reconcSummary.total              ?? 0, color: 'text-slate-700 dark:text-slate-200',       accent: 'bg-white dark:bg-slate-800' },
                { label: 'Reconciled',  value: reconcSummary.totalReconciled    ?? 0, color: 'text-teal-600 dark:text-teal-400',          accent: 'bg-teal-50 dark:bg-teal-900/20' },
                { label: 'Pending',     value: reconcSummary.totalPending       ?? 0,
                  color: (reconcSummary.totalPending ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400',
                  accent: (reconcSummary.totalPending ?? 0) > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-teal-50 dark:bg-teal-900/20' },
              ].map(s => (
                <div key={s.label} className={`${s.accent} rounded-2xl border border-slate-100 dark:border-slate-700 p-5 text-center`}>
                  <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/banking/reconciliation"
            className="flex items-center justify-center gap-2 w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-sm font-semibold transition-colors"
          >
            <ShieldCheck size={15} /> Open Smart Reconciliation Workspace
          </Link>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showModal && (
        <BankModal
          editAccount={editingBank}
          onClose={() => { setShowModal(false); setEditingBank(null); }}
          onSave={() => { fetchAll(); toast.success(editingBank ? 'Account updated' : 'Account added'); }}
        />
      )}
      {txnBank && (
        <BankTransactionModal bankAccountId={txnBank.id} bankName={txnBank.name}
          onClose={() => setTxnBank(null)} onSave={fetchAll} />
      )}
      {showSmartReconcile && (
        <SmartReconciliationModal onClose={() => setShowSmartReconcile(false)} onRefresh={fetchAll} />
      )}

    </div>
  );
};

export default BankList;
