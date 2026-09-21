/**
 * SMEs — Small & Medium Enterprise Dashboard
 * Simplified financial overview tailored for SMEs in Ethiopia.
 * Covers: cash position, VAT obligations, payroll summary, quick actions,
 * IFRS for SMEs tier guidance, and ERCA compliance checklist.
 * Inspired by ovds's clean, actionable SME-first design.
 */
import { Skeleton, AppPage } from '@ovds/ui';
import {
  Store, TrendingUp, TrendingDown, DollarSign, FileText,
  Users2, ShieldCheck, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight, Banknote, Receipt, BarChart3,
  Zap, BookOpen, RefreshCw, ExternalLink, Info, Calendar,
  CreditCard, Package, PiggyBank,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { usePageTitle, useInterval } from '../hooks';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { fmtCurrency } from '../utils/fmt';


// -- Types ---------------------------------------------------------------------
interface SMESnapshot {
  cashBalance:       number;
  monthRevenue:      number;
  monthExpenses:     number;
  netProfit:         number;
  unpaidInvoices:    number;
  unpaidInvoiceAmt:  number;
  overdueInvoices:   number;
  pendingBills:      number;
  pendingBillAmt:    number;
  vatDue:            number;
  vatPeriod:         string;
  employeeCount:     number;
  payrollDue:        number;
  currency:          string;
}

interface ComplianceItem {
  label:    string;
  done:     boolean;
  link?:    string;
  urgent?:  boolean;
}

// -- IFRS for SMEs tier info ---------------------------------------------------
const IFRS_TIERS = [
  {
    tier: 'Tier 3 — Micro-entity',
    desc: 'Annual turnover < ETB 500K. Cash-basis bookkeeping, simplified tax returns.',
    color: 'text-amber-700 dark:text-amber-400',
    bg:   'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  },
  {
    tier: 'Tier 2 — IFRS for SMEs',
    desc: 'Turnover ETB 500K–50M. Accrual accounting, full financial statements required.',
    color: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    bg:   'bg-[var(--pro-azure-50)] dark:bg-green-950/20 border-[var(--pro-azure-100)] dark:border-green-800',
  },
  {
    tier: 'Tier 1 — Full IFRS',
    desc: 'Turnover > ETB 50M or publicly listed. Full IFRS compliance mandatory (AABE).',
    color: 'text-violet-700 dark:text-violet-400',
    bg:   'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
  },
];

// -- Quick actions -------------------------------------------------------------
const QUICK_ACTIONS = [
  { label: 'New Invoice',    icon: <FileText size={16} />,   to: '/sales/invoices',    color: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white' },
  { label: 'Record Expense', icon: <CreditCard size={16} />, to: '/purchases/expenses',    color: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white' },
  { label: 'Add Customer',   icon: <Users2 size={16} />,     to: '/customers',   color: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white' },
  { label: 'VAT Filing',     icon: <ShieldCheck size={16} />,to: '/tax/vat',         color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { label: 'View Reports',   icon: <BarChart3 size={16} />,  to: '/reports',     color: 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white' },
  { label: 'Payroll',        icon: <Banknote size={16} />,   to: '/hr/payroll',     color: 'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white' },
];

// -- Component -----------------------------------------------------------------
const SMEs: React.FC = () => {
  usePageTitle('SME Dashboard');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [snap, setSnap]       = useState<SMESnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  const canRead = can('ovds:read');
  const fmt = (n: number) => fmtCurrency(n, snap?.currency ?? 'ETB');

  const loadData = async () => {
    if (!canRead) return;
    try {
      const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const [dashRes, settingsRes] = await Promise.all([
        api.get(`/dashboard/stats${cq}`, { headers: { 'x-background': '1' } } as any).catch(() => null),
        api.get('/settings', { headers: { 'x-background': '1' } } as any).catch(() => null),
      ]);

      const d = dashRes?.data?.data ?? dashRes?.data ?? {};
      const s = settingsRes?.data?.data ?? settingsRes?.data ?? {};
      setSettings(s);

      setSnap({
        cashBalance:      d.cashBalance      ?? d.totalCash      ?? 0,
        monthRevenue:     d.monthRevenue     ?? d.totalRevenue   ?? 0,
        monthExpenses:    d.monthExpenses    ?? d.totalExpenses  ?? 0,
        netProfit:        d.netProfit        ?? (d.totalRevenue ?? 0) - (d.totalExpenses ?? 0),
        unpaidInvoices:   d.unpaidInvoices   ?? d.overdueInvoices ?? 0,
        unpaidInvoiceAmt: d.unpaidInvoiceAmt ?? d.totalReceivables ?? 0,
        overdueInvoices:  d.overdueInvoices  ?? 0,
        pendingBills:     d.pendingBills     ?? 0,
        pendingBillAmt:   d.pendingBillAmt   ?? d.totalPayables ?? 0,
        vatDue:           d.vatDue           ?? 0,
        vatPeriod:        d.vatPeriod        ?? '',
        employeeCount:    d.employeeCount    ?? d.totalEmployees ?? 0,
        payrollDue:       d.payrollDue       ?? 0,
        currency:         s.default_currency ?? s.ovds_base_currency ?? 'ETB',
      });
    } catch {
      // non-critical — show empty state
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [selectedCompanyId, canRead]);
  useInterval(loadData, 60_000);

  // Build compliance checklist from settings
  const compliance: ComplianceItem[] = [
    { label: 'Company name set',      done: !!settings?.company_name,         link: '/settings?tab=company' },
    { label: 'TIN registered (ERCA)', done: !!settings?.company_tin,          link: '/settings?tab=company', urgent: !settings?.company_tin },
    { label: 'VAT rate configured',   done: !!settings?.vat_rate,             link: '/settings?tab=taxes' },
    { label: 'Base currency set',     done: !!settings?.default_currency,     link: '/settings?tab=currencies' },
    { label: 'SMTP email configured', done: !!settings?.smtp_host,            link: '/settings?tab=notifications' },
    { label: 'Bank account linked',   done: false,                            link: '/banking/accounts' },
  ];
  const doneCount = compliance.filter(c => c.done).length;
  const setupPct  = Math.round((doneCount / compliance.length) * 100);

  return (
    <AppPage
      title="SME Dashboard"
      subtitle="Simplified financial overview for small and medium enterprises — Ethiopia-focused · Retail & E-commerce · Accounting & ovds Software · Market Segmentation · Growth"
      icon={<Store size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'System Administration' }, { label: 'SME Profiles' }]}
      actions={
        <button onClick={() => { setLoading(true); loadData(); }}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      }
    >

      {/* -- Quick actions ------------------------------------------------------ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.label} to={a.to}
            className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${a.color}`}>
            {a.icon}
            <span className="text-center leading-tight">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* -- KPI strip --------------------------------------------------------- */}
      {loading ? (
        <div className="ovds-grid-layout cols-4">
          {[1,2,3,4].map(i => <Skeleton.Line key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : snap && (
        <div className="ovds-grid-layout cols-4">
          {[
            {
              label: 'Cash Balance',
              value: fmt(snap.cashBalance),
              sub:   'Available cash',
              icon:  <PiggyBank size={18} />,
              color: snap.cashBalance >= 0 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-rose-600 dark:text-rose-400',
              bg:    snap.cashBalance >= 0 ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30' : 'bg-rose-50 dark:bg-rose-950/30',
            },
            {
              label: 'This Month Revenue',
              value: fmt(snap.monthRevenue),
              sub:   snap.netProfit >= 0 ? `+${fmt(snap.netProfit)} net` : `${fmt(snap.netProfit)} net`,
              icon:  <TrendingUp size={18} />,
              color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
              bg:    'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
            },
            {
              label: 'Unpaid Invoices',
              value: fmt(snap.unpaidInvoiceAmt),
              sub:   `${snap.unpaidInvoices} invoice${snap.unpaidInvoices !== 1 ? 's' : ''}${snap.overdueInvoices > 0 ? ` · ${snap.overdueInvoices} overdue` : ''}`,
              icon:  snap.overdueInvoices > 0 ? <AlertTriangle size={18} /> : <FileText size={18} />,
              color: snap.overdueInvoices > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400',
              bg:    snap.overdueInvoices > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-white dark:bg-slate-800',
            },
            {
              label: 'Pending Bills',
              value: fmt(snap.pendingBillAmt),
              sub:   `${snap.pendingBills} bill${snap.pendingBills !== 1 ? 's' : ''} to pay`,
              icon:  <Receipt size={18} />,
              color: snap.pendingBills > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400',
              bg:    snap.pendingBills > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-white dark:bg-slate-800',
            },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.label}</p>
                <p className={`text-base font-bold tabular-nums mt-0.5 truncate ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-slate-400 truncate">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ovds-grid-layout cols-2 gap-lg">

        {/* -- Setup checklist ------------------------------------------------- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Setup Checklist</h3>
              <span className={`text-xs font-bold tabular-nums ${setupPct === 100 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : setupPct >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {setupPct}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${setupPct === 100 ? 'bg-[var(--pro-azure-50)]0' : setupPct >= 60 ? 'bg-amber-500' : 'bg-rose-400'}`}
                style={{ width: `${setupPct}%` }}
              />
            </div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {compliance.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {item.done
                  ? <CheckCircle2 size={15} className="text-[var(--pro-azure)] shrink-0" />
                  : item.urgent
                    ? <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />}
                <span className={`text-sm flex-1 ${item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.label}
                </span>
                {!item.done && item.link && (
                  <Link to={item.link} className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0">
                    Fix →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* -- IFRS tier guide ------------------------------------------------- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <BookOpen size={15} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">IFRS Tier Guide — Ethiopia (AABE)</h3>
          </div>
          <div className="p-4 space-y-3">
            {IFRS_TIERS.map((t, i) => (
              <div key={i} className={`rounded-xl border p-3.5 ${t.bg}`}>
                <p className={`text-xs font-bold ${t.color}`}>{t.tier}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
              </div>
            ))}
            <Link to="/ifrs"
              className="flex items-center gap-2 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline mt-1">
              <ExternalLink size={12} /> View IFRS Standards Dashboard
            </Link>
          </div>
        </div>

      </div>

      {/* -- Tax & payroll obligations ------------------------------------------ */}
      {snap && (
        <div className="ovds-grid-layout cols-3">
          {[
            {
              label:   'VAT Due',
              value:   fmt(snap.vatDue),
              sub:     snap.vatPeriod ? `Period: ${snap.vatPeriod}` : 'Current period',
              icon:    <ShieldCheck size={18} />,
              link:    '/tax/vat',
              linkLabel: 'File VAT',
              color:   snap.vatDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
              bg:      snap.vatDue > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
            },
            {
              label:   'Payroll Due',
              value:   fmt(snap.payrollDue),
              sub:     'This month',
              icon:    <Banknote size={18} />,
              link:    '/hr/payroll',
              linkLabel: 'Run Payroll',
              color:   'text-rose-600 dark:text-rose-400',
              bg:      'bg-rose-50 dark:bg-rose-950/30',
            },
            {
              label:   'Employees',
              value:   snap.employeeCount.toString(),
              sub:     'Active staff',
              icon:    <Users2 size={18} />,
              link:    '/hr/employees',
              linkLabel: 'Manage',
              color:   'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
              bg:      'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
            },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.label}</p>
                <p className={`text-lg font-bold tabular-nums mt-0.5 ${c.color}`}>{c.value}</p>
                <p className="ovds-caption">{c.sub}</p>
              </div>
              <Link to={c.link}
                className="shrink-0 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
                {c.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* -- Resources --------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-slate-400" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SME Resources</p>
        </div>
        <div className="ovds-grid-layout cols-3">
          {[
            { label: 'ERCA Tax Portal',       href: 'https://etax.erca.gov.et',       desc: 'File VAT, BIT, and withholding tax online' },
            { label: 'AABE IFRS Standards',   href: 'https://www.aabe.gov.et',        desc: 'Ethiopian accounting and auditing standards' },
            { label: 'MoR Business Registry', href: 'https://www.mor.gov.et',         desc: 'Ministry of Revenues — business registration' },
          ].map(r => (
            <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)]/40 dark:hover:border-[var(--pro-azure)]/60 transition-colors group">
              <ExternalLink size={13} className="text-[var(--pro-azure)] shrink-0 mt-0.5 group-hover:text-[var(--pro-azure)]" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] transition-colors">{r.label}</p>
                <p className="ovds-caption mt-0.5">{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </AppPage>
  );
};

export default SMEs;


