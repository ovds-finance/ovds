/**
 * @ovds/ui — ERP Accounting Sidebar Menu
 *
 * Complete ERP/Accounting Software Sidebar Menu structure aligned with:
 *   - IFRS (International Financial Reporting Standards)
 *   - Commercial Code of Ethiopia (Proclamation No. 1243/2021)
 *   - AABE (Accounting and Auditing Board of Ethiopia) regulations
 *
 * Organized as a professional Tree-View (Main Menu + Sub-Menu) designed
 * to match modern accounting applications like Akaunting.
 *
 * Usage:
 *   import { erpMenuSections } from '@ovds/ui';
 *   <SidebarNavigation sections={erpMenuSections} variant="sidebar" />
 */

import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  FileText,
  Receipt,
  CreditCard,
  Landmark,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  PiggyBank,
  FileBarChart,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  CalendarDays,
  ShieldCheck,
  Scale,
  ClipboardList,
  Banknote,
  ArrowLeftRight,
  FileCheck2,
  Globe2,
  Truck,
  Warehouse,
  Briefcase,
  HandCoins,
  ReceiptText,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  FileSpreadsheet,
  Stamp,
  Vault,
  ScrollText,
  UserCog,
  Workflow,
} from 'lucide-react';
import type { NavSection, NavItem } from './types';

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN MENU SECTIONS
   ══════════════════════════════════════════════════════════════════════════════ */

export const erpMenuSections: NavSection[] = [
  /* ── 1. DASHBOARD ───────────────────────────────────────────────────────── */
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    items: [
      { id: 'dash-main',    label: 'Main Dashboard',       icon: <LayoutDashboard size={15} />, keywords: ['overview', 'home'], to: '/dashboard' },
      { id: 'dash-finance', label: 'Financial Overview',    icon: <TrendingUp size={15} />,      keywords: ['kpi', 'metrics'], to: '/dashboard' },
      { id: 'dash-cash',    label: 'Cash Position',         icon: <Banknote size={15} />,        keywords: ['liquidity'], to: '/banking/cash-flow' },
      { id: 'dash-budget',  label: 'Budget vs Actual',      icon: <PiggyBank size={15} />,       keywords: ['variance'], to: '/accounting/budgets/variance' },
    ],
  },

  /* ── 2. ACCOUNTING (IFRS-aligned) ───────────────────────────────────────── */
  {
    id: 'accounting',
    label: 'Accounting',
    icon: <BookOpen size={18} />,
    items: [
      {
        id: 'acc-chart',
        label: 'Chart of Accounts',
        icon: <ClipboardList size={15} />,
        keywords: ['coa', 'gl', 'accounts'],
        to: '/ovds/accounts',
        children: [
          { id: 'acc-chart-list',    label: 'All Accounts',          icon: <ClipboardList size={14} />, to: '/ovds/accounts' },
          { id: 'acc-chart-create',  label: 'New Account',           icon: <Plus size={14} />, to: '/ovds/accounts' },
          { id: 'acc-chart-groups',  label: 'Account Groups',        icon: <BookOpen size={14} />, to: '/ovds/accounts' },
          { id: 'acc-chart-import',  label: 'Import CoA',            icon: <FileSpreadsheet size={14} />, to: '/ovds/accounts' },
        ],
      },
      {
        id: 'acc-journal',
        label: 'Journal Entries',
        icon: <FileText size={15} />,
        keywords: ['manual', 'adjusting', 'recurring'],
        to: '/double-entry/journals',
        children: [
          { id: 'acc-journal-list',   label: 'All Entries',           icon: <FileText size={14} />, to: '/double-entry/journals' },
          { id: 'acc-journal-new',    label: 'New Journal Entry',     icon: <Plus size={14} />, to: '/double-entry/journals' },
          { id: 'acc-journal-recur',  label: 'Recurring Entries',     icon: <Workflow size={14} />, to: '/double-entry/journals' },
          { id: 'acc-journal-adj',    label: 'Adjusting Entries',     icon: <Calculator size={14} />, keywords: ['ifrs', 'accruals'], to: '/double-entry/journals' },
        ],
      },
      {
        id: 'acc-ledger',
        label: 'General Ledger',
        icon: <BookOpen size={15} />,
        keywords: ['gl', 'detail', 'ifrs'],
        to: '/ovds/reports/general-ledger',
        children: [
          { id: 'acc-ledger-detail',  label: 'GL Detail',             icon: <BookOpen size={14} />, to: '/ovds/reports/general-ledger' },
          { id: 'acc-ledger-tb',      label: 'Trial Balance',         icon: <Scale size={14} />, keywords: ['ifrs', 'balance'], to: '/reports/trial-balance' },
          { id: 'acc-ledger-journal', label: 'Journal Register',      icon: <ScrollText size={14} />, to: '/ovds/reports/general-ledger' },
        ],
      },
      {
        id: 'acc-recon',
        label: 'Reconciliations',
        icon: <ArrowLeftRight size={15} />,
        keywords: ['bank', 'match', 'aabe'],
        to: '/banking/reconciliation',
        children: [
          { id: 'acc-recon-bank',    label: 'Bank Reconciliation',   icon: <Landmark size={14} />, to: '/banking/reconciliation' },
          { id: 'acc-recon-ap',      label: 'AP Reconciliation',     icon: <ReceiptText size={14} />, to: '/accounting/hub' },
          { id: 'acc-recon-ar',      label: 'AR Reconciliation',     icon: <ArrowUpRight size={14} />, to: '/accounting/hub' },
          { id: 'acc-recon-credit',  label: 'Credit Card Reconciliation', icon: <CreditCard size={14} />, to: '/banking/reconciliation' },
        ],
      },
      {
        id: 'acc-periods',
        label: 'Period Control',
        icon: <CalendarDays size={15} />,
        keywords: ['close', 'lock', 'ifrs'],
        to: '/accounting/period-close',
        children: [
          { id: 'acc-periods-list',  label: 'Open / Close Periods',  icon: <CalendarDays size={14} />, to: '/accounting/period-close' },
          { id: 'acc-periods-lock',  label: 'Period Lock',           icon: <Vault size={14} />, to: '/accounting/period-close' },
          { id: 'acc-periods-adjust',label: 'Post-Close Adjustments', icon: <FileCheck2 size={14} />, keywords: ['ifrs'], to: '/accounting/period-close' },
        ],
      },
    ],
  },

  /* ── 3. FINANCIAL STATEMENTS (IFRS compliant) ───────────────────────────── */
  {
    id: 'statements',
    label: 'Financial Statements',
    icon: <FileBarChart size={18} />,
    items: [
      {
        id: 'st-income',
        label: 'Income Statement',
        icon: <TrendingUp size={15} />,
        keywords: ['p&l', 'profit', 'loss', 'ifrs', 'ias1'],
        children: [
          { id: 'st-income-multi',  label: 'Multi-Period P&L',      icon: <FileBarChart size={14} /> },
          { id: 'st-income-comp',   label: 'Comparative P&L',       icon: <ArrowLeftRight size={14} /> },
          { id: 'st-income-notes',  label: 'Notes to P&L',          icon: <ScrollText size={14} />, keywords: ['disclosure', 'ifrs'] },
        ],
      },
      {
        id: 'st-balance',
        label: 'Statement of Financial Position',
        icon: <Scale size={15} />,
        keywords: ['balance sheet', 'ifrs', 'ias1'],
        children: [
          { id: 'st-balance-full',  label: 'Full Balance Sheet',    icon: <Scale size={14} /> },
          { id: 'st-balance-comp',  label: 'Comparative BS',        icon: <ArrowLeftRight size={14} /> },
          { id: 'st-balance-notes', label: 'Notes to BS',           icon: <ScrollText size={14} />, keywords: ['disclosure', 'ifrs'] },
        ],
      },
      {
        id: 'st-cashflow',
        label: 'Cash Flow Statement',
        icon: <ArrowDownRight size={15} />,
        keywords: ['ifrs', 'ias7', 'operating', 'investing', 'financing'],
        children: [
          { id: 'st-cf-direct',     label: 'Direct Method',         icon: <ArrowDownRight size={14} />, keywords: ['ifrs', 'ias7'] },
          { id: 'st-cf-indirect',   label: 'Indirect Method',       icon: <ArrowUpRight size={14} /> },
          { id: 'st-cf-comp',       label: 'Comparative CF',        icon: <ArrowLeftRight size={14} /> },
        ],
      },
      {
        id: 'st-equity',
        label: 'Statement of Changes in Equity',
        icon: <PiggyBank size={15} />,
        keywords: ['ifrs', 'ias1', 'retained earnings'],
      },
      {
        id: 'st-fs-notes',
        label: 'Financial Statement Notes',
        icon: <ScrollText size={15} />,
        keywords: ['disclosure', 'ifrs', 'ias1', 'aabe'],
      },
    ],
  },

  /* ── 4. ACCOUNTS RECEIVABLE ─────────────────────────────────────────────── */
  {
    id: 'ar',
    label: 'Accounts Receivable',
    icon: <ArrowUpRight size={18} />,
    items: [
      { id: 'ar-customers',  label: 'Customers',             icon: <Users size={15} />,       keywords: ['counterparty', 'commercial code'] },
      { id: 'ar-invoices',   label: 'Invoices',              icon: <ReceiptText size={15} />, keywords: ['sales', 'vat', 'ifrs15'] },
      { id: 'ar-credit',     label: 'Credit Notes',          icon: <FileCheck2 size={15} /> },
      { id: 'ar-receipts',   label: 'Receipts',              icon: <ArrowUpRight size={15} /> },
      { id: 'ar-aging',      label: 'Aged Receivables',      icon: <CalendarDays size={15} />, keywords: ['ifrs9', 'ecl'] },
      { id: 'ar-ecl',        label: 'ECL Provision (IFRS 9)', icon: <ShieldCheck size={15} />, keywords: ['ifrs9', 'aabe'] },
    ],
  },

  /* ── 5. ACCOUNTS PAYABLE ────────────────────────────────────────────────── */
  {
    id: 'ap',
    label: 'Accounts Payable',
    icon: <ArrowDownRight size={18} />,
    items: [
      { id: 'ap-vendors',    label: 'Vendors / Suppliers',   icon: <Truck size={15} />,       keywords: ['counterparty', 'commercial code'] },
      { id: 'ap-bills',      label: 'Bills',                 icon: <ReceiptText size={15} />, keywords: ['purchases', 'vat'] },
      { id: 'ap-payments',   label: 'Payments',              icon: <ArrowDownRight size={15} /> },
      { id: 'ap-aging',      label: 'Aged Payables',         icon: <CalendarDays size={15} /> },
      { id: 'ap-1099',       label: 'WHT Certificates (Art. 25)', icon: <Stamp size={15} />, keywords: ['ethiopia', 'wht', 'aabe'] },
    ],
  },

  /* ── 6. BANKING ─────────────────────────────────────────────────────────── */
  {
    id: 'banking',
    label: 'Banking',
    icon: <Landmark size={18} />,
    items: [
      { id: 'bank-accounts', label: 'Bank Accounts',          icon: <Landmark size={15} /> },
      { id: 'bank-transfers',label: 'Transfers',              icon: <ArrowLeftRight size={15} /> },
      { id: 'bank-petty',    label: 'Petty Cash',             icon: <Wallet size={15} /> },
      { id: 'bank-recon',    label: 'Bank Reconciliation',    icon: <FileCheck2 size={15} />, keywords: ['aabe'] },
      { id: 'bank-fx',       label: 'FX Rates',               icon: <Globe2 size={15} />,      keywords: ['ifrs', 'currency'] },
    ],
  },

  /* ── 7. INVENTORY (IAS 2) ───────────────────────────────────────────────── */
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Warehouse size={18} />,
    items: [
      { id: 'inv-items',     label: 'Items / Products',       icon: <Package size={15} /> },
      { id: 'inv-stock',     label: 'Stock Adjustments',      icon: <Calculator size={15} /> },
      { id: 'inv-valuation', label: 'Valuation Methods (IAS 2)', icon: <Scale size={15} />, keywords: ['ifrs', 'ias2', 'fifo', 'weighted avg'] },
      { id: 'inv-warehouses',label: 'Warehouses',             icon: <Warehouse size={15} /> },
      { id: 'inv-reports',   label: 'Inventory Reports',      icon: <FileBarChart size={15} /> },
    ],
  },

  /* ── 8. PURCHASES ───────────────────────────────────────────────────────── */
  {
    id: 'purchases',
    label: 'Purchases',
    icon: <ShoppingCart size={18} />,
    items: [
      { id: 'pur-orders',    label: 'Purchase Orders',        icon: <FileText size={15} /> },
      { id: 'pur-bills',     label: 'Bills',                  icon: <ReceiptText size={15} /> },
      { id: 'pur-quotes',    label: 'Quotes',                 icon: <FileText size={15} /> },
    ],
  },

  /* ── 9. SALES ───────────────────────────────────────────────────────────── */
  {
    id: 'sales',
    label: 'Sales',
    icon: <HandCoins size={18} />,
    items: [
      { id: 'sal-invoices',  label: 'Invoices',               icon: <ReceiptText size={15} />, keywords: ['ifrs15', 'revenue'] },
      { id: 'sal-quotes',    label: 'Quotes',                 icon: <FileText size={15} /> },
      { id: 'sal-credits',   label: 'Credit Notes',           icon: <FileCheck2 size={15} /> },
      { id: 'sal-recurring', label: 'Recurring Invoices',     icon: <Workflow size={15} /> },
    ],
  },

  /* ── 10. PAYROLL ────────────────────────────────────────────────────────── */
  {
    id: 'payroll',
    label: 'Payroll',
    icon: <Users size={18} />,
    items: [
      { id: 'pay-employees', label: 'Employees',              icon: <Users size={15} /> },
      { id: 'pay-run',       label: 'Payroll Run',            icon: <Calculator size={15} /> },
      { id: 'pay-deductions',label: 'Deductions & Benefits',  icon: <Wallet size={15} />, keywords: ['ifrs', 'ias19'] },
      { id: 'pay-pension',   label: 'Pension (Art. 67)',     icon: <PiggyBank size={15} />, keywords: ['ethiopia', 'commercial code'] },
      { id: 'pay-leave',     label: 'Leave Accruals (IAS 19)', icon: <CalendarDays size={15} />, keywords: ['ifrs', 'ias19', 'aabe'] },
      { id: 'pay-severance', label: 'Severance Provision',    icon: <Briefcase size={15} />, keywords: ['ethiopia', 'commercial code', 'aabe'] },
    ],
  },

  /* ── 11. FIXED ASSETS (IAS 16) ──────────────────────────────────────────── */
  {
    id: 'assets',
    label: 'Fixed Assets',
    icon: <Building2 size={18} />,
    items: [
      { id: 'fa-register',   label: 'Asset Register',         icon: <ClipboardList size={15} /> },
      { id: 'fa-depreciation',label: 'Depreciation Schedules', icon: <Calculator size={15} />, keywords: ['ifrs', 'ias16'] },
      { id: 'fa-disposals',  label: 'Disposals & Sales',      icon: <TrendingDown size={15} /> },
      { id: 'fa-revaluation',label: 'Revaluation (IAS 16)',   icon: <Scale size={15} />, keywords: ['ifrs', 'aabe'] },
      { id: 'fa-impairment', label: 'Impairment Testing (IAS 36)', icon: <ShieldCheck size={15} />, keywords: ['ifrs', 'aabe'] },
    ],
  },

  /* ── 12. TAX (Ethiopian tax compliance) ─────────────────────────────────── */
  {
    id: 'tax',
    label: 'Tax',
    icon: <Stamp size={18} />,
    items: [
      {
        id: 'tax-vat',
        label: 'VAT',
        icon: <Receipt size={15} />,
        keywords: ['ethiopia', 'proclamation', 'aabe'],
        children: [
          { id: 'tax-vat-return',   label: 'VAT Returns',           icon: <FileText size={14} /> },
          { id: 'tax-vat-summary',  label: 'VAT Summary Report',    icon: <FileBarChart size={14} /> },
          { id: 'tax-vat-recon',    label: 'VAT Reconciliation',    icon: <ArrowLeftRight size={14} /> },
        ],
      },
      {
        id: 'tax-wht',
        label: 'Withholding Tax',
        icon: <ArrowDownRight size={15} />,
        keywords: ['ethiopia', 'article 25', 'aabe'],
        children: [
          { id: 'tax-wht-return',   label: 'WHT Returns',          icon: <FileText size={14} /> },
          { id: 'tax-wht-certs',    label: 'WHT Certificates',     icon: <Stamp size={14} /> },
          { id: 'tax-wht-summary',  label: 'WHT Summary',          icon: <FileBarChart size={14} /> },
        ],
      },
      {
        id: 'tax-bit',
        label: 'Business Income Tax (BIT)',
        icon: <Calculator size={15} />,
        keywords: ['ethiopia', 'proclamation', 'aabe'],
        children: [
          { id: 'tax-bit-return',   label: 'BIT Returns',           icon: <FileText size={14} /> },
          { id: 'tax-bit-sched',    label: 'Schedule D (Capital Gains)', icon: <ScrollText size={14} />, keywords: ['proclamation 1395/2025'] },
          { id: 'tax-bit-recon',    label: 'Tax Reconciliation',    icon: <ArrowLeftRight size={14} />, keywords: ['ifrs', 'ias12'] },
        ],
      },
      {
        id: 'tax-other',
        label: 'Other Taxes',
        icon: <Stamp size={15} />,
        children: [
          { id: 'tax-excise',       label: 'Excise Tax (1186/2020)', icon: <Banknote size={14} /> },
          { id: 'tax-stamp',        label: 'Stamp Duty (110/1998)',  icon: <Stamp size={14} /> },
          { id: 'tax-property',     label: 'Property Tax (1161/2019)', icon: <Building2 size={14} /> },
          { id: 'tax-customs',      label: 'Customs Duty',           icon: <Truck size={14} /> },
        ],
      },
    ],
  },

  /* ── 13. COMPLIANCE (IFRS, Commercial Code, AABE) ───────────────────────── */
  {
    id: 'compliance',
    label: 'Compliance',
    icon: <ShieldCheck size={18} />,
    items: [
      {
        id: 'comp-ifrs',
        label: 'IFRS Compliance',
        icon: <Globe2 size={15} />,
        keywords: ['ifrs', 'ias', 'ifric'],
        children: [
          { id: 'comp-ifrs-matrix', label: 'IFRS Adoption Matrix',   icon: <ClipboardList size={14} /> },
          { id: 'comp-ifrs-check',  label: 'IFRS Readiness Check',   icon: <ShieldCheck size={14} /> },
          { id: 'comp-ifrs-notes',  label: 'Disclosure Notes',       icon: <ScrollText size={14} /> },
        ],
      },
      {
        id: 'comp-aabe',
        label: 'AABE Standards',
        icon: <Scale size={15} />,
        keywords: ['aabe', 'audit', 'accounting standards'],
        children: [
          { id: 'comp-aabe-audit',  label: 'Audit Requirements',     icon: <FileCheck2 size={14} /> },
          { id: 'comp-aabe-fs',     label: 'Financial Std. Filing',  icon: <FileText size={14} /> },
          { id: 'comp-aabe-ethics', label: 'Code of Ethics',         icon: <Scale size={14} /> },
        ],
      },
      {
        id: 'comp-company',
        label: 'Commercial Code (1243/2021)',
        icon: <ScrollText size={15} />,
        keywords: ['ethiopia', 'proclamation', 'company'],
        children: [
          { id: 'comp-company-reg', label: 'Registration & Records', icon: <FileText size={14} /> },
          { id: 'comp-company-books',label: 'Books of Account (Art. 72-83)', icon: <BookOpen size={14} /> },
          { id: 'comp-company-audit',label: 'Statutory Audit',       icon: <ShieldCheck size={14} /> },
          { id: 'comp-company-dis',  label: 'Disclosure Requirements', icon: <ScrollText size={14} /> },
        ],
      },
      {
        id: 'comp-audit',
        label: 'Internal Audit',
        icon: <UserCog size={15} />,
        children: [
          { id: 'comp-audit-plan',  label: 'Audit Plan',            icon: <ClipboardList size={14} /> },
          { id: 'comp-audit-findings',label: 'Findings & Reports',  icon: <FileBarChart size={14} /> },
          { id: 'comp-audit-track', label: 'Action Tracker',        icon: <Workflow size={14} /> },
        ],
      },
    ],
  },

  /* ── 14. REPORTS ────────────────────────────────────────────────────────── */
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileBarChart size={18} />,
    items: [
      {
        id: 'rpt-fin',
        label: 'Financial Reports',
        icon: <FileBarChart size={15} />,
        children: [
          { id: 'rpt-fin-pl',       label: 'Profit & Loss',         icon: <TrendingUp size={14} /> },
          { id: 'rpt-fin-bs',       label: 'Balance Sheet',         icon: <Scale size={14} /> },
          { id: 'rpt-fin-cf',       label: 'Cash Flow',             icon: <ArrowDownRight size={14} /> },
          { id: 'rpt-fin-tb',       label: 'Trial Balance',         icon: <ClipboardList size={14} /> },
          { id: 'rpt-fin-gl',       label: 'General Ledger',        icon: <BookOpen size={14} /> },
          { id: 'rpt-fin-journal',  label: 'Journal Report',        icon: <ScrollText size={14} /> },
        ],
      },
      {
        id: 'rpt-tax',
        label: 'Tax Reports',
        icon: <Stamp size={15} />,
        children: [
          { id: 'rpt-tax-vat',      label: 'VAT Report',            icon: <Receipt size={14} /> },
          { id: 'rpt-tax-wht',      label: 'WHT Report',            icon: <ArrowDownRight size={14} /> },
          { id: 'rpt-tax-bit',      label: 'BIT Report',            icon: <Calculator size={14} /> },
          { id: 'rpt-tax-summary',  label: 'Tax Summary',           icon: <FileBarChart size={14} /> },
        ],
      },
      {
        id: 'rpt-std',
        label: 'Standard Reports',
        icon: <FileBarChart size={15} />,
        children: [
          { id: 'rpt-std-ar',       label: 'AR Aging',              icon: <CalendarDays size={14} /> },
          { id: 'rpt-std-ap',       label: 'AP Aging',              icon: <CalendarDays size={14} /> },
          { id: 'rpt-std-inv',      label: 'Inventory Valuation',   icon: <Warehouse size={14} /> },
          { id: 'rpt-std-payroll',  label: 'Payroll Register',      icon: <Users size={14} /> },
          { id: 'rpt-std-petty',    label: 'Petty Cash',            icon: <Wallet size={14} /> },
        ],
      },
      {
        id: 'rpt-custom',
        label: 'Custom Reports',
        icon: <FileText size={15} />,
      },
    ],
  },

  /* ── 15. BUDGETING ──────────────────────────────────────────────────────── */
  {
    id: 'budget',
    label: 'Budgeting',
    icon: <PiggyBank size={18} />,
    items: [
      { id: 'bud-master',   label: 'Master Budget',       icon: <ClipboardList size={15} /> },
      { id: 'bud-dept',     label: 'Department Budgets',  icon: <Building2 size={15} /> },
      { id: 'bud-forecast', label: 'Forecasts',           icon: <TrendingUp size={15} /> },
      { id: 'bud-variance', label: 'Variance Analysis',   icon: <Calculator size={15} />, keywords: ['ifrs', 'performance'] },
    ],
  },

  /* ── 16. PROJECTS / COST CENTERS ────────────────────────────────────────── */
  {
    id: 'projects',
    label: 'Projects',
    icon: <Briefcase size={18} />,
    items: [
      { id: 'proj-list',    label: 'All Projects',        icon: <Briefcase size={15} /> },
      { id: 'proj-new',     label: 'New Project',         icon: <Plus size={15} /> },
      { id: 'proj-tasks',   label: 'Tasks',               icon: <ClipboardList size={15} /> },
      { id: 'proj-expenses',label: 'Project Expenses',    icon: <ReceiptText size={15} /> },
      { id: 'proj-reports', label: 'Project Reports',     icon: <FileBarChart size={15} /> },
    ],
  },

  /* ── 17. COST CENTERS (AABE / IFRS) ─────────────────────────────────────── */
  {
    id: 'costcenters',
    label: 'Cost Centers',
    icon: <Building2 size={18} />,
    items: [
      { id: 'cc-list',    label: 'All Cost Centers',     icon: <Building2 size={15} /> },
      { id: 'cc-create',  label: 'New Cost Center',      icon: <Plus size={15} /> },
      { id: 'cc-allocate',label: 'Allocation Rules',     icon: <Workflow size={15} />, keywords: ['ifrs', 'costing'] },
      { id: 'cc-reports', label: 'Cost Center Reports',  icon: <FileBarChart size={15} /> },
    ],
  },

  /* ── 18. SETTINGS ───────────────────────────────────────────────────────── */
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={18} />,
    items: [
      { id: 'set-general',   label: 'General',            icon: <Settings size={15} /> },
      { id: 'set-local',     label: 'Localization',        icon: <Globe2 size={15} />, keywords: ['ethiopia', 'birr', 'efy'] },
      { id: 'set-users',     label: 'Users & Roles',       icon: <UserCog size={15} /> },
      { id: 'set-companies', label: 'Companies / Entities',icon: <Building2 size={15} /> },
      { id: 'set-currencies',label: 'Currencies',          icon: <Globe2 size={15} /> },
      { id: 'set-tax',       label: 'Tax Settings',        icon: <Stamp size={15} /> },
      { id: 'set-inv',       label: 'Invoice Templates',   icon: <FileText size={15} /> },
      { id: 'set-print',     label: 'Print Templates',     icon: <FileText size={15} /> },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════════
   QUICK-ACCESS FAVORITES (top-level shortcuts for common actions)
   ══════════════════════════════════════════════════════════════════════════════ */

export const erpQuickActions: NavItem[] = [
  { id: 'qa-invoice',   label: 'New Invoice',     icon: <Plus size={15} />,  shortcut: '⌘N', keywords: ['sales', 'ifrs15'] },
  { id: 'qa-bill',      label: 'New Bill',        icon: <Plus size={15} />,  shortcut: '⌘B', keywords: ['purchases'] },
  { id: 'qa-expense',   label: 'New Expense',     icon: <Plus size={15} />,  shortcut: '⌘E' },
  { id: 'qa-journal',   label: 'New Journal',     icon: <Plus size={15} />,  shortcut: '⌘J', keywords: ['accounting', 'ifrs'] },
  { id: 'qa-payment',   label: 'Record Payment',  icon: <ArrowDownRight size={15} />, keywords: ['ar', 'ap'] },
  { id: 'qa-receipt',   label: 'Record Receipt',  icon: <ArrowUpRight size={15} /> },
];

/* ══════════════════════════════════════════════════════════════════════════════
   IFRS COVERAGE MAP (for compliance dashboards)
   ══════════════════════════════════════════════════════════════════════════════ */

export const ifrsStandards: Record<string, string> = {
  'IAS 1':  'Presentation of Financial Statements',
  'IAS 2':  'Inventories',
  'IAS 7':  'Statement of Cash Flows',
  'IAS 8':  'Accounting Policies, Changes in Estimates and Errors',
  'IAS 10': 'Events after the Reporting Period',
  'IAS 12': 'Income Taxes',
  'IAS 16': 'Property, Plant and Equipment',
  'IAS 19': 'Employee Benefits',
  'IAS 36': 'Impairment of Assets',
  'IAS 37': 'Provisions, Contingent Liabilities and Contingent Assets',
  'IAS 38': 'Intangible Assets',
  'IAS 40': 'Investment Property',
  'IAS 41': 'Agriculture',
  'IFRS 7': 'Financial Instruments: Disclosures',
  'IFRS 9': 'Financial Instruments (ECL / Classification)',
  'IFRS 15': 'Revenue from Contracts with Customers',
  'IFRS 16': 'Leases',
  'IFRS 17': 'Insurance Contracts',
};

/* ══════════════════════════════════════════════════════════════════════════════
   ETHIOPIAN COMMERCIAL CODE ARTICLES MAP
   ══════════════════════════════════════════════════════════════════════════════ */

export const commercialCodeArticles: Record<string, string> = {
  'Art. 25':  'Withholding Tax on Payments to Residents',
  'Art. 67':  'Pension Fund Contributions',
  'Art. 72':  'Books of Account to be Kept',
  'Art. 73':  'Form and Contents of Books of Account',
  'Art. 74':  'Preservation of Books',
  'Art. 83':  'Inspection of Books by Shareholders',
  'Art. 237': 'Annual Report to Shareholders',
  'Art. 238': 'Balance Sheet and Profit & Loss Account',
  'Art. 240': 'Audit of Accounts',
  'Art. 241': 'Auditor\'s Report',
  'Art. 337': 'Accounts of Liquidator',
  'Art. 338': 'Audit of Liquidation Accounts',
};

/* ══════════════════════════════════════════════════════════════════════════════
   AABE REGULATIONS MAP
   ══════════════════════════════════════════════════════════════════════════════ */

export const aabeRegulations: Record<string, string> = {
  'AABE 001': 'Ethiopian Accounting Standards (EAS) — Framework',
  'AABE 002': 'Audit Quality Assurance',
  'AABE 003': 'Code of Ethics for Professional Accountants',
  'AABE 004': 'Continuing Professional Development (CPD)',
  'AABE 005': 'Audit Documentation Standards',
  'AABE 006': 'Financial Reporting Templates',
  'AABE 007': 'Review Engagement Standards',
  'AABE 008': 'Agreed-Upon Procedures Standards',
};

/** Optional route mapper for ERP menu items that do not declare `to` inline. */
export const erpMenuRouteMap: Record<string, string> = {
  // Dashboard
  'dash-main': '/dashboard',
  'dash-finance': '/dashboard',
  'dash-cash': '/banking/cash-flow',
  'dash-budget': '/accounting/budgets/variance',
  // Accounting
  'acc-chart-list': '/ovds/accounts',
  'acc-chart-create': '/ovds/accounts',
  'acc-chart-groups': '/ovds/accounts',
  'acc-chart-import': '/ovds/accounts',
  'acc-journal-list': '/double-entry/journals',
  'acc-journal-new': '/double-entry/journals',
  'acc-journal-recur': '/double-entry/journals',
  'acc-journal-adj': '/double-entry/journals',
  'acc-ledger-detail': '/ovds/reports/general-ledger',
  'acc-ledger-tb': '/reports/trial-balance',
  'acc-ledger-journal': '/ovds/reports/general-ledger',
  'acc-recon-bank': '/banking/reconciliation',
  'acc-recon-ap': '/accounting/hub',
  'acc-recon-ar': '/accounting/hub',
  'acc-recon-credit': '/banking/reconciliation',
  'acc-periods-list': '/accounting/period-close',
  'acc-periods-lock': '/accounting/period-close',
  'acc-periods-adjust': '/accounting/period-close',
  // Financial Statements
  'st-income-multi': '/reports/financial-statements',
  'st-income-comp': '/reports/financial-statements',
  'st-income-notes': '/reports/notes',
  'st-balance-full': '/reports/financial-statements',
  'st-balance-comp': '/reports/financial-statements',
  'st-balance-notes': '/reports/notes',
  'st-cf-direct': '/reports/financial-statements',
  'st-cf-indirect': '/reports/financial-statements',
  'st-cf-comp': '/reports/financial-statements',
  'st-equity': '/reports/financial-statements',
  'st-fs-notes': '/reports/notes',
  // AR / AP
  'ar-customers': '/customers',
  'ar-invoices': '/sales/invoices',
  'ar-credit': '/sales/credit-notes',
  'ar-receipts': '/sales/receipts',
  'ar-aging': '/reports/aged-receivables',
  'ar-ecl': '/ifrs/ecl-provision',
  'ap-vendors': '/vendors',
  'ap-bills': '/purchases/bills',
  'ap-payments': '/purchases/payments',
  'ap-aging': '/reports/aged-payables',
  'ap-1099': '/tax/wht-certificates',
  // Banking
  'bank-accounts': '/banking/accounts',
  'bank-transfers': '/banking/transfers',
  'bank-petty': '/banking/petty-cash',
  'bank-recon': '/banking/reconciliation',
  'bank-fx': '/banking/fx-rates',
  // Inventory
  'inv-items': '/items',
  'inv-stock': '/inventory/adjustments',
  'inv-valuation': '/inventory/valuation',
  'inv-warehouses': '/warehouses',
  'inv-reports': '/reports/inventory',
  // Purchases / Sales / Payroll
  'pur-orders': '/purchases/orders',
  'pur-bills': '/purchases/bills',
  'pur-quotes': '/purchases/quotes',
  'sal-invoices': '/sales/invoices',
  'sal-quotes': '/sales/quotes',
  'sal-credits': '/sales/credit-notes',
  'sal-recurring': '/sales/recurring-invoices',
  'pay-employees': '/hr/employees',
  'pay-run': '/hr/payroll',
  'pay-deductions': '/hr/payroll',
  'pay-pension': '/hr/pension',
  'pay-leave': '/hr/leaves',
  'pay-severance': '/hr/provisions',
  // Fixed Assets
  'fa-register': '/accounting/fixed-assets',
  'fa-depreciation': '/accounting/fixed-assets',
  'fa-disposals': '/accounting/fixed-assets',
  'fa-revaluation': '/accounting/fixed-assets',
  'fa-impairment': '/accounting/fixed-assets',
  // Tax
  'tax-vat-return': '/tax/vat',
  'tax-vat-summary': '/tax/vat',
  'tax-vat-recon': '/tax/vat',
  'tax-wht-return': '/tax/wht-certificates',
  'tax-wht-certs': '/tax/wht-certificates',
  'tax-wht-summary': '/tax/wht-certificates',
  'tax-bit-return': '/tax/schedule-d',
  'tax-bit-sched': '/tax/schedule-d',
  'tax-bit-recon': '/tax/vat',
  'tax-excise': '/tax/excise-tax',
  'tax-stamp': '/tax/stamp-duty',
  'tax-property': '/property-tax',
  'tax-customs': '/trade',
  // Compliance
  'comp-ifrs-matrix': '/ifrs',
  'comp-ifrs-check': '/ifrs',
  'comp-ifrs-notes': '/reports/notes',
  'comp-aabe-audit': '/accounting/aabe-audit',
  'comp-aabe-fs': '/reports/financial-statements',
  'comp-aabe-ethics': '/compliance/ethics',
  'comp-company-reg': '/settings/business-registration',
  'comp-company-books': '/accounting/hub',
  'comp-company-audit': '/compliance/audit-outsourcing',
  'comp-company-dis': '/reports/financial-statements',
  'comp-audit-plan': '/compliance/audit-outsourcing',
  'comp-audit-findings': '/compliance/audit-outsourcing',
  'comp-audit-track': '/compliance/audit-outsourcing',
  // Reports
  'rpt-fin-pl': '/reports/financial-statements',
  'rpt-fin-bs': '/reports/financial-statements',
  'rpt-fin-cf': '/reports/financial-statements',
  'rpt-fin-tb': '/reports/trial-balance',
  'rpt-fin-gl': '/ovds/reports/general-ledger',
  'rpt-fin-journal': '/ovds/reports/general-ledger',
  'rpt-tax-vat': '/tax/vat',
  'rpt-tax-wht': '/tax/wht-certificates',
  'rpt-tax-bit': '/tax/schedule-d',
  'rpt-tax-summary': '/tax/filing',
  'rpt-std-ar': '/reports/aged-receivables',
  'rpt-std-ap': '/reports/aged-payables',
  'rpt-std-inv': '/reports/inventory',
  'rpt-std-payroll': '/hr/payroll',
  'rpt-std-petty': '/banking/petty-cash',
  'rpt-custom': '/reports',
  // Budgeting / Projects
  'bud-master': '/accounting/budgets',
  'bud-dept': '/accounting/budgets',
  'bud-forecast': '/accounting/budgets',
  'bud-variance': '/accounting/budgets/variance',
  'proj-list': '/projects',
  'proj-new': '/projects',
  'proj-tasks': '/projects',
  'proj-expenses': '/projects',
  'proj-reports': '/projects',
};
