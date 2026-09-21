/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { AppPage, Skeleton, EmptyState, fmtNum, type IconType, MetricCard } from '@ovds/ui';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePageTitle, useAuditLog, useInterval, useErrorHandler } from '../hooks';
import { confirm } from '../utils/confirm';
import { downloadCSV } from '../utils/download';
import BankAccountCard from '../components/banking/bankAccount';
import BankModal from '../components/banking/bankModal';
import AccountModal from '../components/accounting/accountModal';
import JournalModal from '../components/accounting/journalModal';
import VendorModal from '../components/accounting/vendorModal';
import VendorBillSummary from '../components/accounting/vendorBillSummary';
import BankTransactionModal from '../components/banking/bankTransactionModal';
import LedgerModal from '../components/accounting/ledgerModal';
import ReportsPanel from '../components/accounting/reportsPanel';
import PeriodManager from '../components/accounting/periodManager';
import { PipelineJourney } from '../components/pipelineComponents';
import { Icon } from '../components/ui';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  CreditCard,
  Download,
  Edit2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  HeartHandshake,
  History,
  Info,
  Kanban,
  Keyboard,
  Landmark,
  Link2,
  List,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  StarOff,
  Sun,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlink,
  Unlock,
  Upload,
  User,
  UserCheck,
  Users,
  Users2,
  Wallet,
  X,
  Zap,
  BarChart2,
  MapPin,
  Grid3x3,
  GitCompare,
  Download as DownloadIcon,
PiggyBank,
} from 'lucide-react';

/** Format a number with 2 decimal places (ETB locale) */
const fmt = (n: number) => fmtNum(n);

type Tab =
  | 'accounts'
  | 'journal'
  | 'banks'
  | 'vendors'
  | 'recurring'
  | 'reports';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

// Static color map — prevents Tailwind purge removing dynamic class strings
const STAT_CARD_COLORS: Record<string, {
  iconBg: string; iconText: string; trendUp: string; trendDown: string;
}> = {
  indigo: {
    iconBg:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
    iconText: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendUp:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendDown: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
  teal: {
    iconBg:   'bg-teal-50 dark:bg-teal-950/30',
    iconText: 'text-teal-600 dark:text-teal-400',
    trendUp:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendDown: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
  amber: {
    iconBg:   'bg-amber-50 dark:bg-amber-950/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    trendUp:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendDown: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
  violet: {
    iconBg:   'bg-violet-50 dark:bg-violet-950/30',
    iconText: 'text-violet-600 dark:text-violet-400',
    trendUp:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendDown: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
  rose: {
    iconBg:   'bg-rose-50 dark:bg-rose-950/30',
    iconText: 'text-rose-600 dark:text-rose-400',
    trendUp:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendDown: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
  sky: {
    iconBg:   'bg-sky-50 dark:bg-sky-950/30',
    iconText: 'text-sky-600 dark:text-sky-400',
    trendUp:   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    trendDown: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  },
};

const StatCard = ({ title, value, icon, color, trend, onClick }: {
  title: string;
  value: string | number;
  icon: IconType;
  color: string;
  trend?: number;
  onClick?: () => void;
}) => {
  const c = STAT_CARD_COLORS[color] ?? STAT_CARD_COLORS.indigo;
  return (
    <button
      onClick={onClick}
      className="ovds-widget-card p-5 hover:border-[var(--pro-azure-100)] dark:hover:border-green-800 hover:-translate-y-0.5 transition-all duration-150 group text-left w-full relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon name={icon} size={20} strokeWidth={2} className={c.iconText} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide ${
            trend > 0 ? c.trendUp : c.trendDown
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 leading-none">{title}</p>
      <p className="text-[20px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none tabular-nums">{value}</p>
    </button>
  );
};

// -- Main Accounting Page ------------------------------------------------------
const Accounting: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle('Accounting');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [searchParams] = useSearchParams();
  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
  const ca = selectedCompanyId ? `&companyId=${selectedCompanyId}` : '';
  const { log, logExport } = useAuditLog();
  const canDelete = can('ovds:delete');
  const [tab, setTab] = useState<Tab>(() => {
    const urlTab = searchParams.get('tab') as Tab | null;
    return urlTab && ['accounts','journal','banks','vendors','recurring','reports'].includes(urlTab) ? urlTab : 'accounts';
  });
  const [journalView, setJournalView] = useState<'list' | 'golden-rules'>(() => {
    const urlView = searchParams.get('view');
    return urlView === 'golden-rules' ? 'golden-rules' : 'list';
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountBalances, setAccountBalances] = useState<{
    accounts: any[];
    totals: any;
  } | null>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]);
  const [reconcSummary, setReconcSummary] = useState<any>(null);
  const [lockedPeriods, setLockedPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalModalIsTemplate, setJournalModalIsTemplate] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [txnBank, setTxnBank] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [ledgerAccount, setLedgerAccount] = useState<any>(null);
  /* Journal filters */ const [jSearch, setJSearch] = useState('');
  const [jDateFrom, setJDateFrom] = useState('');
  const [jDateTo, setJDateTo] = useState('');

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch('');
  };

  const fetchJournals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (jSearch) params.set('search', jSearch);
      if (jDateFrom) params.set('dateFrom', jDateFrom);
      if (jDateTo) params.set('dateTo', jDateTo);
      const res = await api.get(`/ovds/journal-entries?${params}`);
      setJournals(res.data.data?.data ?? res.data.data ?? res.data ?? []);
    } catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to load journal entries');
    }
  }, [jSearch, jDateFrom, jDateTo]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, balRes, jRes, bRes, vRes, recRes, reconcRes, periodsRes] =
        await Promise.all([
          api.get('/ovds/accounts' + cq),
          api
            .get('/ovds/accounts/balances' + cq)
            .catch(() => ({ data: null })),
          api.get('/ovds/journal-entries' + cq),
          api.get('/ovds/bank-accounts' + cq),
          api.get('/ovds/vendors' + cq),
          api
            .get('/ovds/journal-entries/recurring' + cq)
            .catch(() => ({ data: null })),
          api
            .get('/ovds/reconciliation/summary' + cq)
            .catch(() => ({ data: null })),
          api.get('/ovds/periods/locked' + cq).catch(() => ({ data: null })),
        ]);
      setAccounts(accRes.data.data?.data ?? accRes.data.data ?? accRes.data ?? []);
      if (balRes.data) setAccountBalances(balRes.data.data || balRes.data);
      setJournals(jRes.data.data?.data ?? jRes.data.data ?? jRes.data ?? []);
      setBanks(bRes.data.data?.data ?? bRes.data.data ?? bRes.data ?? []);
      setVendors(vRes.data.data?.data ?? vRes.data.data ?? vRes.data ?? []);
      if (recRes.data)
        setRecurringTemplates(recRes.data.data?.data ?? recRes.data.data ?? recRes.data ?? []);
      if (reconcRes.data)
        setReconcSummary(reconcRes.data.data || reconcRes.data);
      if (periodsRes.data)
        setLockedPeriods(periodsRes.data.data?.data ?? periodsRes.data.data ?? periodsRes.data ?? []);
    } catch (err: any) {
      if (!err?.isRateLimited) toast.error('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  }, [cq]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useInterval(fetchAll, 60_000);

  const TYPE_COLORS: Record<string, string> = {
    ASSET: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10',
    LIABILITY: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10',
    EQUITY: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10',
    INCOME: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10',
    EXPENSE: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = !accountTypeFilter || a.type === accountTypeFilter;
    const matchesActive = showInactive || a.isActive;
    return matchesSearch && matchesType && matchesActive;
  });

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'accounts',
      label: 'Chart of Accounts',
      icon: <BookOpen size={16} />,
    },
    { key: 'journal', label: 'Journal Entries', icon: <FileText size={16} /> },
    { key: 'recurring', label: 'Recurring', icon: <RefreshCw size={16} /> },
    { key: 'banks', label: 'Bank Accounts', icon: <Landmark size={16} /> },
    { key: 'vendors', label: 'Vendors', icon: <Users2 size={16} /> },
    {
      key: 'reports',
      label: 'Financial Reports',
      icon: <BarChart3 size={16} />,
    },
  ];

  return (
    <AppPage
      title="Financial Ledger"
      subtitle="IFRS-Compliant Core · Bank Reconciliation · VAT 1341/2024 · DRRF 570/2025 · Accounting & ovds Software · ERP · Banking & ovds · Revenue · Market Value"
      icon={<BookOpen size={16} />}
      iconBg="bg-teal-500"
      actions={
        <button onClick={fetchAll} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >

      {/* -- Pipeline Journey — IFRS accounting chain -- */}
      <PipelineJourney
        stages={[
          { key: 'accounts',  label: 'Chart of Accounts', status: tab === 'accounts'  ? 'active' : 'completed' },
          { key: 'journal',   label: 'Journal Entries',   status: tab === 'journal'   ? 'active' : tab === 'accounts' ? 'pending' : 'completed' },
          { key: 'banks',     label: 'Bank Accounts',     status: tab === 'banks'     ? 'active' : 'pending' },
          { key: 'vendors',   label: 'Vendors',           status: tab === 'vendors'   ? 'active' : 'pending' },
          { key: 'reports',   label: 'Reports',           status: tab === 'reports'   ? 'active' : 'pending' },
        ]}
      />

      {/* Summary KPIs */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Accounts"
            amount={accounts.length}
            percentage={0}
            isPositive={true}
          />
          <MetricCard
            title="Journal Entries"
            amount={journals.length}
            percentage={0}
            isPositive={true}
          />
          <MetricCard
            title="Bank Balance"
            amount={fmt(
              banks.reduce(
                (s, b) => s + (b.computedBalance ?? Number(b.balance ?? 0)),
                0,
              ),
            )}
            percentage={0}
            isPositive={true}
          />
          <MetricCard
            title="Pending Reconciliations"
            amount={reconcSummary?.totalPending ?? 0}
            percentage={0}
            isPositive={true}
          />
          <MetricCard
            title="Total Assets"
            amount={
              accountBalances?.totals
                ? fmt(Math.abs(accountBalances.totals.assets))
                : '—'
            }
            percentage={0}
            isPositive={true}
          />
          <MetricCard
            title="Net Equity"
            amount={
              accountBalances?.totals
                ? fmt(
                    Math.abs(accountBalances.totals.equity) +
                      (Math.abs(accountBalances.totals.income) -
                        Math.abs(accountBalances.totals.expenses)),
                  )
                : '—'
            }
            percentage={0}
            isPositive={true}
          />
        </div>
      )}

      {/* Tabs — AppTabs-consistent style, no dynamic class strings */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit flex-wrap border border-slate-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150',
              tab === t.key
                ? 'bg-white dark:bg-slate-900 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50',
            ].join(' ')}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Chart of Accounts */}
      {tab === 'accounts' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative group">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--pro-azure)] transition-colors"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 w-64 dark:text-slate-200 transition-all shadow-sm"
                />
              </div>
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 transition-all shadow-sm"
              >
                <option value="">All Types</option>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-800/50 rounded-xl cursor-pointer select-none border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 rounded-lg border-slate-300 text-[var(--pro-azure)] focus:ring-teal-400"
                />
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                  Show Inactive
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (!w) return;
                  const rows = filteredAccounts
                    .map(
                      (a) =>
                        `<tr><td>${a.code}</td><td>${a.name}</td><td>${a.type}</td><td>${a.category?.replace(/_/g, ' ')}</td><td>${a.isActive ? 'Active' : 'Inactive'}</td></tr>`,
                    )
                    .join('');
                  w.document
                    .write(`<!DOCTYPE html><html><head><title>Chart of Accounts</title>                <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;font-size:11px}                h1{font-size:14px;font-weight:900;margin-bottom:16px}                table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:6px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}                td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:10px}</style></head>                <body><h1>Chart of Accounts</h1>                <table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Category</th><th>Status</th></tr></thead>                <tbody>${rows}</tbody></table>                <p
  style="margin-top:16px;font-size:9px;color:#94a3b8">Generated ${new Date().toLocaleString()}</p>                </body></html>`);
                  w.document.close();
                  w.print();
                  w.addEventListener('afterprint', () => w.close());
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[13px] font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={() => {
                  const balMap = new Map(
                    (accountBalances?.accounts || []).map((a: any) => [
                      a.id,
                      a.balance,
                    ]),
                  );
                  const header = 'Code,Name,Type,Category,Balance,Status\n';
                  const rows = filteredAccounts
                    .map(
                      (a) =>
                        `${a.code},"${a.name}",${a.type},${a.category?.replace(/_/g, ' ')},${(balMap.get(a.id) ?? 0).toFixed(2)},${a.isActive ? 'Active' : 'Inactive'}`,
                    )
                    .join('\n');
                  downloadCSV(
                    header + rows,
                    `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`,
                  );
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[13px] font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <ArrowUpRight size={14} /> Export
              </button>
<button
                 onClick={() => {
                   setEditingAccount(null);
                   setShowAccountModal(true);
                 }}
                 className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[13px] font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95"
               >
                 <Plus size={16} /> New Account
               </button>
            </div>
          </div>

          {loading ? (
            <Skeleton.Table rows={8} cols={6} />
          ) : (
            <div className="ovds-doc-shell">
              <table className="ovds-table w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Code
                    </th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Account Name
                    </th>
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Category
                    </th>
                    <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Balance
                    </th>
                    <th className="text-center px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const balMap = new Map(
                      (accountBalances?.accounts || []).map((a: any) => [
                        a.id,
                        a.balance,
                      ]),
                    );
                    const TYPE_LABELS: Record<string, string> = {
                      ASSET: 'Assets',
                      LIABILITY: 'Liabilities',
                      EQUITY: 'Equity',
                      INCOME: 'Income',
                      EXPENSE: 'Expenses',
                    };
                    const grouped = [
                      'ASSET',
                      'LIABILITY',
                      'EQUITY',
                      'INCOME',
                      'EXPENSE',
                    ].reduce(
                      (acc, type) => {
                        const items = filteredAccounts.filter(
                          (a) => a.type === type,
                        );
                        if (items.length) acc[type] = items;
                        return acc;
                      },
                      {} as Record<string, any[]>,
                    );
                    return Object.entries(grouped).map(([type, items]) => (
                      <React.Fragment key={type}>
                        <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-700">
                          <td
                            colSpan={6}
                            className="px-6 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${TYPE_COLORS[type] || 'text-slate-500'}`}
                              >
                                {TYPE_LABELS[type]}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                ({items.length} accounts)
                              </span>
                              {accountBalances && (
                                <span className="ml-auto text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  Total:{' '}
                                  {fmt(
                                    items.reduce(
                                      (s, a) => s + (balMap.get(a.id) ?? 0),
                                      0,
                                    ),
                                  )}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {items.map((a) => {
                          const bal = balMap.get(a.id) ?? 0;
                          return (
                            <tr
                              key={a.id}
                              className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-[var(--pro-azure-50)]/30 dark:hover:bg-green-900/10 transition-colors group"
                            >
                              <td className="px-6 py-4 text-[12px] font-mono font-bold text-slate-400 dark:text-slate-500">
                                {a.code}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-[13px] font-black text-slate-800 dark:text-white group-hover:text-[var(--pro-azure)] transition-colors">
                                  {a.name}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                  {a.category?.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td
                                className={`px-6 py-4 text-[13px] font-black text-right ${bal > 0 ? 'text-slate-900 dark:text-white' : bal < 0 ? 'text-rose-600' : 'text-slate-300 dark:text-slate-600'}`}
                              >
                                {bal !== 0 ? fmt(bal) : '—'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${a.isActive ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] dark:bg-[var(--pro-azure-50)]0/10' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}
                                >
                                  {a.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setLedgerAccount(a)}
                                    className="px-3 py-1.5 text-[11px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                  >
                                    Ledger
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAccount(a);
                                      setShowAccountModal(true);
                                    }}
                                    className="px-3 py-1.5 text-[11px] font-black text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20 rounded-lg transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (
                                        !(await confirm({
                                          title: 'Delete account?',
                                          message: 'This cannot be undone.',
                                          variant: 'danger',
                                          confirmLabel: 'Delete',
                                        }))
                                      )
                                        return;
                                      try {
                                        await api.patch(
                                          `/ovds/accounts/${a.id}`,
                                          { isActive: false },
                                        );
                                        toast.success('Account deactivated');
                                        log('SETTINGS_CHANGED', {
                                          action: 'account_deactivated',
                                          id: a.id,
                                          name: a.name,
                                        });
                                        fetchAll();
                                      } catch {
                                        toast.error('Failed to deactivate');
                                      }
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}
                  {!filteredAccounts.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-slate-400 text-sm"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <BookOpen
                            size={48}
                            className="text-slate-200 dark:text-slate-700"
                          />
                          <div>
                            <p className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[11px]">
                              No accounts found
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Journal Entries */}
      {tab === 'journal' && (
        <div className="space-y-6">
          {/* View toggle: List vs Golden Rules */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setJournalView('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${journalView === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <FileText size={13} /> Journal Entries
            </button>
            <button
              onClick={() => setJournalView('golden-rules')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${journalView === 'golden-rules' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <BookOpen size={13} /> Golden Rules
            </button>
          </div>

          {/* Golden Rules Reference Panel */}
          {journalView === 'golden-rules' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-[var(--pro-azure)] to-violet-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen size={20} />
                  <h2 className="text-lg font-black tracking-tight">Golden Rules of Double-Entry Accounting</h2>
                </div>
                <p className="text-sm text-green-100/80">Every transaction has two equal and opposite effects. Debits always equal Credits.</p>
              </div>

              <div className="ovds-grid-layout cols-3">
                {[
                  {
                    rule: 'Rule 1',
                    account: 'Real Accounts',
                    subtitle: 'Assets, Liabilities, Equity',
                    debit: 'What comes IN',
                    credit: 'What goes OUT',
                    color: 'blue',
                    examples: ['Cash received → Debit Cash', 'Equipment purchased → Debit Equipment', 'Loan repaid → Credit Cash'],
                    icon: <Landmark size={20} />,
                  },
                  {
                    rule: 'Rule 2',
                    account: 'Personal Accounts',
                    subtitle: 'Debtors & Creditors',
                    debit: 'The RECEIVER',
                    credit: 'The GIVER',
                    color: 'violet',
                    examples: ['Customer owes us → Debit Accounts Receivable', 'We owe vendor → Credit Accounts Payable', 'Owner invests → Credit Capital'],
                    icon: <Users size={20} />,
                  },
                  {
                    rule: 'Rule 3',
                    account: 'Nominal Accounts',
                    subtitle: 'Income & Expenses',
                    debit: 'All EXPENSES & LOSSES',
                    credit: 'All INCOME & GAINS',
                    color: 'green',
                    examples: ['Salary paid → Debit Salary Expense', 'Revenue earned → Credit Sales Revenue', 'Interest earned → Credit Interest Income'],
                    icon: <BarChart3 size={20} />,
                  },
                ].map((r) => {
                  // Static color map — avoids Tailwind purging dynamic class fragments
                  const ruleColors: Record<string, { card: string; header: string; icon: string; label: string }> = {
                    violet:  {
                      card:   'bg-white dark:bg-slate-900 rounded-2xl border border-violet-200 dark:border-violet-800 overflow-hidden shadow-sm',
                      header: 'bg-violet-50 dark:bg-violet-950/30 px-5 py-4 border-b border-violet-100 dark:border-violet-900',
                      icon:   'text-violet-600 dark:text-violet-400',
                      label:  'text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest',
                    },
                    amber: {
                      card:   'bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden shadow-sm',
                      header: 'bg-amber-50 dark:bg-amber-950/30 px-5 py-4 border-b border-amber-100 dark:border-amber-900',
                      icon:   'text-amber-600 dark:text-amber-400',
                      label:  'text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest',
                    },
                    indigo: {
                      card:   'bg-white dark:bg-slate-900 rounded-2xl border border-[var(--pro-azure-100)] dark:border-green-800 overflow-hidden shadow-sm',
                      header: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-5 py-4 border-b border-[var(--pro-azure-100)] dark:border-green-900',
                      icon:   'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                      label:  'text-[10px] font-black text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] uppercase tracking-widest',
                    },
                  };
                  const rc = ruleColors[r.color] ?? ruleColors.indigo;
                  return (
                  <div key={r.rule} className={rc.card}>
                    <div className={rc.header}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={rc.icon}>{r.icon}</span>
                        <span className={rc.label}>{r.rule}</span>
                      </div>
                      <h3 className="font-black text-slate-800 dark:text-slate-100">{r.account}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.subtitle}</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-black text-[var(--pro-azure)] uppercase tracking-widest mb-1">DEBIT (Dr)</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.debit}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">CREDIT (Cr)</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.credit}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {r.examples.map((ex, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 mt-1.5" />
                            {ex}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* IFRS Account Types */}
              <div className="ovds-widget-card overflow-hidden">
                <div className="ovds-widget-header">
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                    <h3 className="ovds-card-title">IFRS Account Types — Normal Balances</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="ovds-table w-full text-sm">
                    <thead>
                      <tr className="bg-white dark:bg-slate-800/50">
                        {['Account Type', 'Normal Balance', 'Increases With', 'Decreases With', 'IFRS Standard', 'Examples'].map(h => (
                          <th key={h} className="px-4 py-3 text-left ovds-label">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {[
                        { type: 'Asset', normal: 'Debit', inc: 'Debit', dec: 'Credit', std: 'IAS 1', ex: 'Cash, Receivables, Inventory, PPE', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30' },
                        { type: 'Liability', normal: 'Credit', inc: 'Credit', dec: 'Debit', std: 'IAS 1', ex: 'Payables, Loans, Deferred Revenue', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
                        { type: 'Equity', normal: 'Credit', inc: 'Credit', dec: 'Debit', std: 'IAS 1', ex: 'Share Capital, Retained Earnings', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
                        { type: 'Revenue', normal: 'Credit', inc: 'Credit', dec: 'Debit', std: 'IFRS 15', ex: 'Sales, Service Revenue, Interest Income', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30' },
                        { type: 'Expense', normal: 'Debit', inc: 'Debit', dec: 'Credit', std: 'IAS 1', ex: 'COGS, Salaries, Depreciation, Tax', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
                      ].map(r => (
                        <tr key={r.type} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${r.color}`}>{r.type}</span></td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">{r.normal}</td>
                          <td className="px-4 py-3 text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold">{r.inc}</td>
                          <td className="px-4 py-3 text-xs text-rose-600 dark:text-rose-400 font-bold">{r.dec}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 font-mono">{r.std}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{r.ex}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Common Journal Entry Templates */}
              <div className="ovds-widget-card overflow-hidden">
                <div className="ovds-widget-header">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-violet-600 dark:text-violet-400" />
                    <h3 className="ovds-card-title">Common Journal Entry Templates</h3>
                  </div>
                  <button
                    onClick={() => { setJournalView('list'); setShowJournalModal(true); }}
                    className="ovds-btn-primary"
                  >
                    <Plus size={12} /> New Entry
                  </button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {[
                    { title: 'Cash Sale', dr: 'Cash / Bank', cr: 'Sales Revenue', note: 'IFRS 15 — Revenue recognition on delivery' },
                    { title: 'Credit Sale (Invoice)', dr: 'Accounts Receivable', cr: 'Sales Revenue', note: 'IFRS 15 — Revenue recognized, payment deferred' },
                    { title: 'Cash Received from Customer', dr: 'Cash / Bank', cr: 'Accounts Receivable', note: 'Settles the receivable balance' },
                    { title: 'Purchase on Credit', dr: 'Inventory / Expense', cr: 'Accounts Payable', note: 'IAS 2 — Inventory at cost; IAS 37 — Provisions' },
                    { title: 'Payment to Vendor', dr: 'Accounts Payable', cr: 'Cash / Bank', note: 'Settles the payable balance' },
                    { title: 'Salary Payment', dr: 'Salary Expense', cr: 'Cash / Bank', note: 'IAS 19 — Employee benefits; PIT withheld separately' },
                    { title: 'Depreciation', dr: 'Depreciation Expense', cr: 'Accumulated Depreciation', note: 'IAS 16 — Straight-line or declining balance' },
                    { title: 'VAT Collected (Output)', dr: 'Cash / Accounts Receivable', cr: 'VAT Payable', note: 'Proc. 1341/2024 — 15% standard rate' },
                    { title: 'VAT Paid (Input)', dr: 'VAT Receivable / Input VAT', cr: 'Cash / Accounts Payable', note: 'Claimable against output VAT' },
                    { title: 'Dividend Distribution', dr: 'Retained Earnings', cr: 'Dividends Payable', note: 'IAS 1.106 — Equity movement' },
                  ].map((t, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-slate-500">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.title}</p>
                        <p className="ovds-caption mt-0.5">{t.note}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold">Dr: {t.dr}</span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Cr: {t.cr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Journal Entries List */}
          <div className={journalView === 'list' ? '' : 'hidden'}>
            <div className="ovds-toolbar rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative group">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--pro-azure)] transition-colors"
                />
                <input
                  value={jSearch}
                  onChange={(e) => setJSearch(e.target.value)}
                  placeholder="Search entries..."
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 w-64 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={jDateFrom}
                  onChange={(e) => setJDateFrom(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 transition-all"
                />
                <span className="text-slate-400 text-xs font-bold">to</span>
                <input
                  type="date"
                  value={jDateTo}
                  onChange={(e) => setJDateTo(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 transition-all"
                />
              </div>
              <button
                onClick={fetchJournals}
                className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-[13px] font-black hover:bg-slate-900 transition-all shadow-sm"
              >
                Apply Filters
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  /* ... export logic ... */
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[13px] font-black hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowUpRight size={14} /> Export CSV
              </button>
<button
                 onClick={() => setShowJournalModal(true)}
                 className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[13px] font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95"
               >
                 <Plus size={16} /> New Entry
               </button>
<button
                 onClick={() => {
                   // Opening Balance — pre-fill a journal entry for opening balances
                   setShowJournalModal(true);
                   setTimeout(() => {
                     window.dispatchEvent(new CustomEvent('ovds:prefill-journal', {
                       detail: { memo: 'Opening Balance', category: 'OPENING_BALANCE', ref: `OB-${new Date().getFullYear()}` }
                     }));
                   }, 100);
                 }}
                 className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[13px] font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                 title="Enter Opening Balance — IAS 1 · Retained Earnings"
               >
                 <PiggyBank size={16} /> Opening Balance
               </button>
<button
                 onClick={() => {
                   // Dividend — pre-fill a dividend journal entry
                   setShowJournalModal(true);
                   setTimeout(() => {
                     window.dispatchEvent(new CustomEvent('ovds:prefill-journal', {
                       detail: { memo: 'Dividend Distribution', category: 'DIVIDEND', ref: `DIV-${new Date().getFullYear()}` }
                     }));
                   }, 100);
                 }}
                 className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[13px] font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                 title="Record Dividend — IAS 1.106 · Equity"
               >
                 <PiggyBank size={16} /> Dividend
               </button>
            </div>
          </div>

          {loading ? (
            <Skeleton.Table rows={6} cols={5} />
          ) : (
            <div className="space-y-3">
              {journals.map((j) => {
                const totalDebit = (j.lines || []).reduce(
                  (s: number, l: any) => s + Number(l.debit),
                  0,
                );
                return (
                  <div
                    key={j.id}
                    className="ovds-doc-shell hover:border-[var(--pro-azure-100)] dark:hover:border-green-900 transition-all"
                  >
                    <button
                      onClick={() =>
                        setExpandedEntry(expandedEntry === j.id ? null : j.id)
                      }
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                          <FileText
                            size={20}
                            className="text-slate-500 dark:text-slate-400"
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-[14px] font-black text-slate-800 dark:text-white">
                            {j.description}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {j.reference && (
                              <span className="text-[11px] font-mono font-black text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 px-2 py-0.5 rounded">
                                {j.reference}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-slate-400">
                              {new Date(j.date).toLocaleDateString()}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                              {fmt(totalDebit)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${j.status === 'POSTED' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] dark:bg-[var(--pro-azure-50)]0/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}
                        >
                          {j.status}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-slate-300 transition-transform duration-300 ${expandedEntry === j.id ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {expandedEntry === j.id && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 px-6 py-5">
                        <table className="ovds-table w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                              <th className="text-left py-3 ovds-label">
                                Account
                              </th>
                              <th className="text-left py-3 ovds-label">
                                Line Description
                              </th>
                              <th className="text-right py-3 ovds-label">
                                Debit
                              </th>
                              <th className="text-right py-3 ovds-label">
                                Credit
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(j.lines || []).map((l: any) => (
                              <tr
                                key={l.id}
                                className="border-b border-slate-50/50 dark:border-slate-700/50 last:border-0"
                              >
                                <td className="py-3 pr-4">
                                  <p className="text-[12px] font-black text-slate-700 dark:text-slate-300">
                                    {l.account?.code} — {l.account?.name}
                                  </p>
                                </td>
                                <td className="py-3 text-[12px] text-slate-500 dark:text-slate-400 italic">
                                  {l.description || '—'}
                                </td>
                                <td className="py-3 text-right text-[13px] font-black text-[var(--pro-azure)]">
                                  {l.debit > 0 ? fmt(l.debit) : '—'}
                                </td>
                                <td className="py-3 text-right text-[13px] font-black text-rose-600">
                                  {l.credit > 0 ? fmt(l.credit) : '—'}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-white/50 dark:bg-slate-800/50 font-black">
                              <td
                                colSpan={2}
                                className="py-3 px-2 text-[10px] uppercase tracking-widest text-slate-400"
                              >
                                Balanced Totals
                              </td>
                              <td className="py-3 text-right text-[13px] text-[var(--pro-azure)]">
                                {fmt(totalDebit)}
                              </td>
                              <td className="py-3 text-right text-[13px] text-rose-600">
                                {fmt(totalDebit)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <button
                            onClick={async () => {
                              if (!canDelete) {
                                toast.error('Insufficient permissions');
                                return;
                              }
                              if (
                                !(await confirm({
                                  title: 'Delete journal entry?',
                                  message:
                                    'All lines will be removed. Cannot be undone.',
                                  variant: 'danger',
                                  confirmLabel: 'Delete',
                                }))
                              )
                                return;
                              try {
                                await api.delete(
                                  `/ovds/journal-entries/${j.id}`,
                                );
                                toast.success('Entry deleted');
                                log('JOURNAL_ENTRY_POSTED', {
                                  action: 'deleted',
                                  id: j.id,
                                });
                                fetchJournals();
                              } catch {
                                toast.error('Failed to delete');
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[12px] font-black transition-all"
                          >
                            <Trash2 size={14} /> Delete Entry
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-[var(--pro-azure-dark)] dark:bg-slate-900 text-white rounded-xl text-[12px] font-black transition-all">
                            <Printer size={14} /> Print Voucher
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!journals.length && (
                <div className="ovds-widget-card p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <FileText
                      size={48}
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <div>
                      <p className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[11px]">
                        No entries found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try adjusting your search or date filters
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}
      {tab === 'banks' && (
        <div className="space-y-6">
          {reconcSummary && (reconcSummary.totalPending > 0 || reconcSummary.totalReconciled > 0) && (
            <div className={`rounded-2xl border px-6 py-5 flex items-center justify-between gap-6 shadow-sm ${reconcSummary.totalPending > 0 ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-900/30' : 'bg-[var(--pro-azure-50)]/50 border-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/5 dark:border-green-900/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reconcSummary.totalPending > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-[var(--pro-azure-100)] dark:bg-green-900/30'}`}>
                  <GitCompare size={24} className={reconcSummary.totalPending > 0 ? 'text-amber-600' : 'text-[var(--pro-azure)]'} />
                </div>
                <div>
                  <h4 className={`text-base font-black ${reconcSummary.totalPending > 0 ? 'text-amber-900 dark:text-amber-200' : 'text-[var(--pro-azure-dark)] dark:text-green-200'}`}>
                    {reconcSummary.totalPending > 0 ? `${reconcSummary.totalPending} Unreconciled Transactions` : 'Full Reconciled Status'}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {reconcSummary.totalReconciled} matched · {reconcSummary.total} total across {reconcSummary.accounts?.length} accounts
                  </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                {(reconcSummary.accounts || []).filter((a: any) => a.pendingCount > 0).map((a: any) => (
                  <div key={a.id} className="bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{a.name}</p>
                    <p className="text-xs font-black text-amber-600">{a.pendingCount} pending</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Bank & Cash Accounts</h3>
              <p className="text-xs font-bold text-slate-400">Manage your financial institutions and liquidity</p>
            </div>
            <button
              onClick={() => {
                setEditingBank(null);
                setShowBankModal(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-[13px] font-black shadow-lg transition-all active:scale-95"
            >
              <Plus size={16} /> Add Bank Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {banks.map((b) => (
              <BankAccountCard
                key={b.id}
                bank={b}
                onEdit={() => {
                  setEditingBank(b);
                  setShowBankModal(true);
                }}
                onRecordTxn={() => setTxnBank({ id: b.id, name: b.name })}
                onDeleted={fetchAll}
              />
            ))}
            {!banks.length && !loading && (
              <div className="col-span-full ovds-widget-card p-20 text-center">
                <Landmark size={64} className="text-slate-100 dark:text-slate-700 mx-auto mb-6" />
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">No Bank Accounts</h4>
                <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Connect your bank accounts or cash boxes to track balances and reconcile transactions.</p>
<button
                   onClick={() => setShowBankModal(true)}
                   className="mt-8 px-8 py-3 bg-teal-500 text-white rounded-xl font-black text-[13px] hover:bg-teal-500-dark transition-all shadow-xl shadow-teal-500/20"
                 >
                   Configure First Account
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendors */}
      {tab === 'vendors' && (
        <div className="space-y-6">
          <div className="ovds-toolbar rounded-2xl">
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--pro-azure)] transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors by name, TIN or email..."
                className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-bold outline-none focus:ring-4 focus:ring-teal-400/10 w-96 transition-all"
              />
            </div>
<button
               onClick={() => {
                 setEditingVendor(null);
                 setShowVendorModal(true);
               }}
               className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[14px] font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95"
             >
               <Plus size={18} /> Add New Vendor
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {vendors
              .filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
              .map((v) => (
                <div key={v.id} className="ovds-widget-card p-6 space-y-4 hover:shadow-lg transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center font-black text-violet-600 dark:text-violet-400 text-lg uppercase tracking-tight shadow-sm border border-violet-100 dark:border-violet-900/50">
                        {v.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-base leading-tight">{v.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded uppercase tracking-widest border border-violet-100/50 dark:border-violet-900/30">
                            {v.paymentTerms || 'No Terms'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setEditingVendor(v); setShowVendorModal(true); }}
                        className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!(await confirm({ title: 'Delete vendor?', variant: 'danger' }))) return;
                          try {
                            await api.delete(`/ovds/vendors/${v.id}`);
                            toast.success('Vendor deleted');
                            fetchAll();
                          } catch { toast.error('Failed to delete'); }
                        }}
                        className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      <Mail size={14} className="text-slate-300" />
                      <span className="truncate">{v.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      <Phone size={14} className="text-slate-300" />
                      <span>{v.phone || 'No phone'}</span>
                    </div>
                    {v.tin && (
                      <div className="flex items-center gap-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        <Code2 size={14} className="text-slate-300" />
                        <span>TIN: {v.tin}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <VendorBillSummary vendorId={v.id} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recurring Templates */}
      {tab === 'recurring' && (
        <div className="space-y-6">
          <div className="ovds-toolbar rounded-2xl p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Recurring Ledger Templates</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5 max-w-xl">Templates for standardized periodic entries like IAS 16 depreciation, Rent (IFRS 16), and Insurance prepayments.</p>
            </div>
<button
               onClick={() => { setJournalModalIsTemplate(true); setShowJournalModal(true); }}
               className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[14px] font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95"
             >
               <Plus size={18} /> New Template
             </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {recurringTemplates.map((t) => {
              const totalDebit = (t.lines || []).reduce((s: number, l: any) => s + Number(l.debit), 0);
              return (
                <div key={t.id} className="ovds-widget-card overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--pro-azure-50)] dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                        <RefreshCw size={24} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-base">{t.description}</h4>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t.reference} · Total {fmt(totalDebit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="relative group">
                          <input
                            type="date"
                            id={`post-date-${t.id}`}
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[12px] font-black outline-none focus:ring-4 focus:ring-teal-400/10 transition-all shadow-inner"
                          />
                       </div>
<button
                           onClick={async () => {
                             const dateInput = document.getElementById(`post-date-${t.id}`) as HTMLInputElement;
                             try {
                               await api.post(`/ovds/journal-entries/recurring/${t.id}/post`, { date: dateInput.value });
                               toast.success('Template posted to Journal');
                               fetchAll();
                             } catch (err: any) { toast.error(err.response?.data?.message || 'Posting failed'); }
                           }}
                           className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[12px] font-black shadow-lg shadow-teal-500/20 transition-all"
                         >
                           Execute Post
                         </button>
                        <button
                          onClick={async () => {
                            if (!(await confirm({ title: 'Delete template?', variant: 'danger' }))) return;
                            try {
                              await api.delete(`/ovds/journal-entries/${t.id}`);
                              toast.success('Template removed');
                              fetchAll();
                            } catch { toast.error('Failed to remove'); }
                          }}
                          className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                  <div className="bg-slate-50/30 dark:bg-slate-900/10 p-5 ovds-grid-layout cols-2">
                    {(t.lines || []).map((l: any) => (
                      <div key={l.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <p className="text-[11px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">{l.account?.code} {l.account?.name}</p>
                        <p className={`text-[12px] font-black mt-1 ${l.debit > 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
                          {l.debit > 0 ? `DR ${fmt(l.debit)}` : `CR ${fmt(l.credit)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Reports */}
      {tab === 'reports' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <ReportsPanel />
          <PeriodManager />
        </div>
      )}

      {/* Modals */}
      {showAccountModal && (
        <AccountModal
          account={editingAccount}
           companyId={selectedCompanyId ?? undefined}
          onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
          onSave={fetchAll}
        />
      )}
      {showJournalModal && (
        <JournalModal
          accounts={accounts}
          onClose={() => { setShowJournalModal(false); setJournalModalIsTemplate(false); }}
          onSave={fetchAll}
          isTemplate={journalModalIsTemplate}
        />
      )}
      {showBankModal && (
        <BankModal
          editAccount={editingBank}
          onClose={() => { setShowBankModal(false); setEditingBank(null); }}
          onSave={fetchAll}
        />
      )}
      {showVendorModal && (
        <VendorModal
          vendor={editingVendor}
           companyId={selectedCompanyId ?? undefined}
          onClose={() => { setShowVendorModal(false); setEditingVendor(null); }}
          onSave={fetchAll}
        />
      )}
      {txnBank && (
        <BankTransactionModal
          bankAccountId={txnBank.id}
          bankName={txnBank.name}
          onClose={() => setTxnBank(null)}
          onSave={fetchAll}
        />
      )}
      {ledgerAccount && (
        <LedgerModal
          account={ledgerAccount}
          onClose={() => setLedgerAccount(null)}
        />
      )}
    </AppPage>
  );
};

export default Accounting;

