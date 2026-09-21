/**
 * ModuleQuickAccessPanel
 * Ovds-style module launcher panel on the dashboard.
 * Sections: Items · Sales · Customers · Purchase · Vendors · Banking · Reports
 *
 * Each section has a header + a grid of chevron-right action cards.
 * The Reports section uses pinnable report cards (push_pin).
 */
import {
  Package, ChevronRight, FileText, Users, ShoppingCart,
  Receipt, Landmark, BarChart2, FileCheck, TrendingUp,
  ArrowLeftRight, Shield, Star, Link2, Plus,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useLocalStorage } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import type { Permission } from '../../rbac/rbac';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleAction {
  label: string;
  desc: string;
  to: string;
  icon: React.ReactNode;
  permission?: Permission;
  isNew?: boolean;
}

interface ModuleSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  permission?: Permission;
  actions: ModuleAction[];
}

interface PinnableReport {
  key: string;
  label: string;
  desc: string;
  to: string;
  icon: React.ReactNode;
  category: 'income-expense' | 'accounting';
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PINNABLE_REPORTS: PinnableReport[] = [
  { key: 'income-expense',  label: 'Income & Expense',  desc: 'Overview of income and expenses.',        to: '/reports?type=income-expense',  icon: <BarChart2 size={14} />, category: 'income-expense' },
  { key: 'expense-summary', label: 'Expense Summary',   desc: 'Monthly expense summary by category.',    to: '/reports?type=expense-summary', icon: <ShoppingCart size={14} />, category: 'income-expense' },
  { key: 'income-summary',  label: 'Income Summary',    desc: 'Monthly income summary by category.',     to: '/reports?type=income-expense',  icon: <TrendingUp size={14} />, category: 'income-expense' },
  { key: 'income-vs-expense',label: 'Income vs Expense',desc: 'Monthly income vs expense by category.',  to: '/reports?type=income-expense',  icon: <ArrowLeftRight size={14} />, category: 'income-expense' },
  { key: 'pl',              label: 'Profit & Loss',     desc: 'Quarterly profit & loss by category.',    to: '/reports?type=pl',              icon: <FileCheck size={14} />, category: 'accounting' },
  { key: 'tax-summary',     label: 'Tax Summary',       desc: 'Quarterly tax summary.',                  to: '/reports?type=tax',             icon: <Shield size={14} />, category: 'accounting' },
];

const SECTIONS: ModuleSection[] = [
  // ── Items ──────────────────────────────────────────────────────────────────
  {
    key: 'items',
    title: 'Items',
    icon: <Package size={15} />,
    iconBg: 'bg-amber-50 text-amber-600',
    permission: 'items:read',
    actions: [
      { label: 'New Item',     desc: 'Enter the details and create your first item',          to: '/items?action=new',         icon: <Plus size={13} />,        permission: 'items:write' },
      { label: 'Import Items', desc: 'Import your existing items with a single click',        to: '/settings/import?type=items', icon: <FileText size={13} /> },
      { label: 'Inventory',    desc: 'Manage your stock, variants, transfers, adjustments',  to: '/inventory',                icon: <Package size={13} />,     permission: 'inventory:read' },
    ],
  },

  // ── Sales ──────────────────────────────────────────────────────────────────
  {
    key: 'sales-invoices',
    title: 'Sales — Invoices',
    icon: <FileText size={15} />,
    iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]',
    permission: 'invoices:read',
    actions: [
      { label: 'New Invoice',        desc: 'Enter the details and create your first invoice',           to: '/sales/invoices?action=new',      icon: <Plus size={13} />,        permission: 'invoices:write' },
      { label: 'Import Invoices',    desc: 'Import your existing invoices with a single click',         to: '/settings/import?type=invoices', icon: <FileText size={13} /> },
      { label: 'Estimates (Quotes)', desc: 'Create estimates, get approval, convert into invoices',     to: '/sales/estimates',                icon: <FileCheck size={13} /> },
      { label: 'Credit Notes',       desc: 'Issue credit notes to customers for returning goods',       to: '/sales/credit-notes',             icon: <Receipt size={13} />,     permission: 'invoices:write' },
      { label: 'Sales Debit Notes',  desc: 'MoR EIMS debit memos (DBN) for additional charges',        to: '/sales/debit-notes',              icon: <Receipt size={13} />,     permission: 'invoices:write' },
      { label: 'Sales Orders',       desc: 'Create documents for items ready to be shipped',            to: '/sales/orders',             icon: <ShoppingCart size={13} /> },
    ],
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  {
    key: 'customers',
    title: 'Customers',
    icon: <Users size={15} />,
    iconBg: 'bg-sky-50 text-sky-600',
    permission: 'crm:read',
    actions: [
      { label: 'New Customer',     desc: 'Enter the details and create your first customer',     to: '/crm/contacts?action=new',  icon: <Plus size={13} />,    permission: 'crm:read' },
      { label: 'Import Customers', desc: 'Import your existing customers with a single click',   to: '/settings/import?type=customers', icon: <FileText size={13} /> },
      { label: 'CRM',              desc: 'Track every step of your customer journey',             to: '/crm/contacts',             icon: <TrendingUp size={13} />, permission: 'crm:read' },
    ],
  },

  // ── Purchase ───────────────────────────────────────────────────────────────
  {
    key: 'purchase-bills',
    title: 'Purchase — Bills',
    icon: <Receipt size={15} />,
    iconBg: 'bg-rose-50 text-rose-600',
    permission: 'bills:read',
    actions: [
      { label: 'New Bill',          desc: 'Enter the details and create your first bill',                  to: '/purchases/bills?action=new',          icon: <Plus size={13} />,       permission: 'bills:write' },
      { label: 'Import Bills',      desc: 'Import your existing bills with a single click',               to: '/settings/import?type=bills',  icon: <FileText size={13} /> },
      { label: 'Receipts',          desc: 'Save time recording receipts by uploading images',             to: '/purchases/receipts',         icon: <FileCheck size={13} /> },
      { label: 'Debit Notes',       desc: 'Issue debit notes to vendors for returning goods',             to: '/purchases/debit-notes',               icon: <Receipt size={13} />,    permission: 'bills:write' },
      { label: 'Purchase Orders',   desc: 'Create documents for items ready to be shipped',              to: '/purchases/orders',           icon: <ShoppingCart size={13} />, permission: 'purchase_orders:read' },
    ],
  },

  // ── Vendors ────────────────────────────────────────────────────────────────
  {
    key: 'vendors',
    title: 'Vendors',
    icon: <Users size={15} />,
    iconBg: 'bg-violet-50 text-violet-600',
    permission: 'bills:read',
    actions: [
      { label: 'New Vendor',     desc: 'Enter the details and create your first vendor',    to: '/accounting?tab=vendors&action=new', icon: <Plus size={13} />,    permission: 'bills:write' },
      { label: 'Import Vendors', desc: 'Import your existing vendors with a single click',  to: '/settings/import?type=vendors',        icon: <FileText size={13} /> },
      { label: 'Payroll',        desc: 'Reduce time spent on employee payments',            to: '/hr/payroll',                           icon: <Receipt size={13} />,  permission: 'payroll:read' },
    ],
  },

  // ── Banking ────────────────────────────────────────────────────────────────
  {
    key: 'banking',
    title: 'Banking',
    icon: <Landmark size={15} />,
    iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]',
    permission: 'fund_transfers:read',
    actions: [
      { label: 'New Income',         desc: 'Enter the details and create your first income',        to: '/banking/transactions?action=income',   icon: <Plus size={13} />,           permission: 'ovds:write' },
      { label: 'New Expense',        desc: 'Enter the details and create your first expense',       to: '/banking/transactions?action=expense',  icon: <Plus size={13} />,           permission: 'expenses:write' },
      { label: 'Connect Your Bank',  desc: 'Import transactions securely to automate bookkeeping',  to: '/banking/statement-import',        icon: <Link2 size={13} /> },
      { label: 'New Transfer',       desc: 'Enter the details and create your first transfer',      to: '/banking/transfers?action=new',    icon: <ArrowLeftRight size={13} />, permission: 'fund_transfers:write' },
      { label: 'Import Transfers',   desc: 'Import your existing transfers with a single click',    to: '/settings/import?type=transfers', icon: <FileText size={13} /> },
      { label: 'New Reconciliation', desc: 'Enter the details and start your first reconciliation', to: '/banking/reconciliation?action=new', icon: <FileCheck size={13} />,   permission: 'bank_reconciliation:write' },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single action row: icon + label + description + chevron */
const ActionRow: React.FC<{ action: ModuleAction; onClick?: () => void }> = ({ action, onClick }) => (
  <Link
    to={action.to}
    onClick={onClick}
    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50"
  >
    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-[var(--pro-azure-50)] dark:group-hover:bg-green-950/30 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] transition-colors shrink-0">
      {action.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[var(--pro-azure-dark)] dark:group-hover:text-green-300 transition-colors leading-tight">
        {action.label}
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 truncate">{action.desc}</p>
    </div>
    {action.isNew && (
      <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] uppercase tracking-wide">
        New
      </span>
    )}
    <ChevronRight size={13} className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] transition-colors" />
  </Link>
);

/** One module section block */
const ModuleSectionBlock: React.FC<{ section: ModuleSection }> = ({ section }) => {
  const { can } = useAuth();
  const visibleActions = section.actions.filter(a => !a.permission || can(a.permission));
  if (visibleActions.length === 0) return null;

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${section.iconBg}`}>
          {section.icon}
        </div>
        <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
      </div>
      {/* Action rows */}
      <div className="p-2 space-y-0.5">
        {visibleActions.map(action => (
          <ActionRow key={action.to + action.label} action={action} />
        ))}
      </div>
    </div>
  );
};

/** Pinnable report card */
const ReportCard: React.FC<{
  report: PinnableReport;
  pinned: boolean;
  onTogglePin: (key: string) => void;
}> = ({ report, pinned, onTogglePin }) => (
  <div className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-[var(--pro-azure-50)] dark:group-hover:bg-green-950/30 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] transition-colors shrink-0">
      {report.icon}
    </div>
    <Link to={report.to} className="flex-1 min-w-0">
      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[var(--pro-azure-dark)] dark:group-hover:text-green-300 transition-colors leading-tight">
        {report.label}
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{report.desc}</p>
    </Link>
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); onTogglePin(report.key); }}
      title={pinned ? 'Unpin report' : 'Pin report'}
      className={`shrink-0 p-1 rounded transition-all ${
        pinned
          ? 'text-[var(--pro-azure)] opacity-100'
          : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-[var(--pro-azure)]'
      }`}
    >
      <Star size={12} className={pinned ? 'fill-current' : ''} />
    </button>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ModuleQuickAccessPanel: React.FC = () => {
  const { can } = useAuth();
  const [pinnedReports, setPinnedReports] = useLocalStorage<string[]>('dashboard_pinned_reports', ['pl', 'income-expense']);

  const togglePin = (key: string) => {
    setPinnedReports(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const visibleSections = SECTIONS.filter(s => !s.permission || can(s.permission));

  const incomeExpenseReports = PINNABLE_REPORTS.filter(r => r.category === 'income-expense');
  const accountingReports    = PINNABLE_REPORTS.filter(r => r.category === 'accounting');

  return (
    <div className="space-y-4">

      {/* Module sections — 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleSections.map(section => (
          <ModuleSectionBlock key={section.key} section={section} />
        ))}
      </div>

      {/* Reports section */}
      {can('reports:read') && (
        <div className="ovds-widget-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
                <BarChart2 size={15} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Reports</h3>
            </div>
            <Link
              to="/reports?action=new"
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-lg text-[10px] font-bold transition-colors"
            >
              <Plus size={10} /> New Report
            </Link>
          </div>

          <div className="p-2">
            {/* Income & Expense group */}
            <p className="px-3 pt-2 pb-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Income &amp; Expense
            </p>
            <div className="space-y-0.5">
              {incomeExpenseReports.map(r => (
                <ReportCard key={r.key} report={r} pinned={pinnedReports.includes(r.key)} onTogglePin={togglePin} />
              ))}
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3 my-2" />

            {/* Accounting group */}
            <p className="px-3 pt-1 pb-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Accounting
            </p>
            <div className="space-y-0.5">
              {accountingReports.map(r => (
                <ReportCard key={r.key} report={r} pinned={pinnedReports.includes(r.key)} onTogglePin={togglePin} />
              ))}
            </div>

            {/* View all */}
            <div className="px-3 pt-2 pb-1">
              <Link
                to="/reports"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
              >
                View all reports <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleQuickAccessPanel;
