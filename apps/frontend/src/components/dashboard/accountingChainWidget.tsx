/**
 * AccountingChainWidget — Full IFRS + Ethiopian Tax Dual Flow
 *
 * Shows the complete accounting lifecycle:
 *   INCOME SIDE:  Sales → Invoice → Journal → P&L → VAT/TOT → Tax → ERCA
 *   EXPENSE SIDE: Purchase → Bill → Journal → P&L → WHT → Payroll → Cost
 *
 * Modules: Core Operations → People → ovds → Compliance → Reporting → Admin → Developer
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, FileText, BookOpen, TrendingUp, Globe, Banknote,
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp, Shield,
  Receipt, BarChart3, Zap, Users, Building2, PieChart,
  ArrowDown, ArrowUp, Lock, Code2, GitBranch,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlowStep {
  step: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  link: string;
  legal: string;
  auto?: boolean;
  color: string;
  bg: string;
  border: string;
}

interface ModuleCard {
  module: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  link: string;
  tag: string;
  tagColor: string;
  items: { label: string; value: string; color?: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const iconWrap = (icon: React.ReactNode, bg = 'bg-emerald-600') => (
  <div className={`w-7 h-7 rounded-lg ${bg} text-white flex items-center justify-center shadow-sm shrink-0`}>
    {icon}
  </div>
);

// ---------------------------------------------------------------------------
// Income Flow (Sales side)
// ---------------------------------------------------------------------------

const INCOME_CHAIN: FlowStep[] = [
  {
    step: '1', label: 'Item / Service', sub: 'IAS 2 NRV · IAS 16',
    icon: iconWrap(<Package size={13} />), link: '/items', auto: false,
    legal: 'IAS 2 Inventories · IAS 16 PPE',
    color: 'text-emerald-800 dark:text-emerald-200',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    step: '2', label: 'Invoice / Revenue', sub: 'IFRS 15 · TIN · QR',
    icon: iconWrap(<FileText size={13} />), link: '/sales/invoices', auto: false,
    legal: 'IFRS 15 Revenue Recognition',
    color: 'text-sky-800 dark:text-sky-200',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
  },
  {
    step: '3', label: 'Journal Entry', sub: 'Dr AR · Cr Revenue · VAT',
    icon: iconWrap(<BookOpen size={13} />), link: '/accounting', auto: true,
    legal: 'IAS 1 Double-Entry Ledger',
    color: 'text-violet-800 dark:text-violet-200',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    step: '4', label: 'P&L — Income', sub: 'IAS 1.81A · IFRS 18',
    icon: iconWrap(<TrendingUp size={13} />), link: '/reports/mor-report', auto: true,
    legal: 'IAS 1 Comprehensive Income',
    color: 'text-teal-800 dark:text-teal-200',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
  },
  {
    step: '5', label: 'VAT 15% / TOT', sub: 'Output − Input = Net',
    icon: iconWrap(<Shield size={13} />, 'bg-orange-500'), link: '/tax/vat', auto: true,
    legal: 'Proc. 1341/2024 · TOT Proc. 1395/2025',
    color: 'text-orange-800 dark:text-orange-200',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    step: '6', label: 'ERCA eTax', sub: 'Monthly / Annual filing',
    icon: iconWrap(<Globe size={13} />, 'bg-emerald-700'), link: 'https://etax.erca.gov.et', auto: false,
    legal: 'MoR / SIGTAS API Submission',
    color: 'text-emerald-900 dark:text-emerald-100',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
];

// ---------------------------------------------------------------------------
// Expense Flow (Purchases side)
// ---------------------------------------------------------------------------

const EXPENSE_CHAIN: FlowStep[] = [
  {
    step: '1', label: 'Vendor / PO', sub: 'IAS 2 Cost · WHT check',
    icon: iconWrap(<Building2 size={13} />, 'bg-slate-600'), link: '/purchases/vendors', auto: false,
    legal: 'IAS 2 Acquisition Cost',
    color: 'text-slate-800 dark:text-slate-200',
    bg: 'bg-white dark:bg-slate-800/60',
    border: 'border-slate-200 dark:border-slate-700',
  },
  {
    step: '2', label: 'Bill / Invoice', sub: 'WHT 3% goods/services',
    icon: iconWrap(<Receipt size={13} />, 'bg-rose-600'), link: '/purchases/bills', auto: false,
    legal: 'WHT Proc. 1395/2025 Art. 62',
    color: 'text-rose-800 dark:text-rose-200',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
  },
  {
    step: '3', label: 'Journal Entry', sub: 'Dr Expense · Cr AP · WHT',
    icon: iconWrap(<BookOpen size={13} />, 'bg-violet-600'), link: '/accounting', auto: true,
    legal: 'IAS 1 Double-Entry Ledger',
    color: 'text-violet-800 dark:text-violet-200',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    step: '4', label: 'P&L — Expense', sub: 'IAS 1 · IAS 16 Depr.',
    icon: iconWrap(<BarChart3 size={13} />, 'bg-amber-600'), link: '/reports/mor-report', auto: true,
    legal: 'IAS 1 · IAS 16 · IAS 2',
    color: 'text-amber-800 dark:text-amber-200',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    step: '5', label: 'Payroll + PIT', sub: 'PIT · Pension 7%/11%',
    icon: iconWrap(<Users size={13} />, 'bg-teal-600'), link: '/hr/payroll', auto: true,
    legal: 'PIT Proc. 1395/2025 · IAS 19',
    color: 'text-teal-800 dark:text-teal-200',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
  },
  {
    step: '6', label: 'WHT Remittance', sub: '30th monthly · certificates',
    icon: iconWrap(<Banknote size={13} />, 'bg-rose-700'), link: '/tax/wht-certificates', auto: false,
    legal: 'WHT Proc. 1395/2025 Art. 52–62',
    color: 'text-rose-900 dark:text-rose-100',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    border: 'border-rose-300 dark:border-rose-700',
  },
];

// ---------------------------------------------------------------------------
// 7-Module grid
// ---------------------------------------------------------------------------

const MODULES: ModuleCard[] = [
  {
    module: '1', label: 'Core Operations', icon: <Package size={14} />,
    iconBg: 'bg-emerald-500', description: 'Sales, Procurement, Inventory',
    link: '/items', tag: 'IFRS 15 · IAS 2', tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    items: [
      { label: 'Revenue Recognition', value: 'IFRS 15' },
      { label: 'Inventory Valuation', value: 'IAS 2 — Lower of cost / NRV' },
      { label: 'VAT on Sales', value: '15% standard · 0% zero-rated', color: 'text-emerald-700' },
      { label: 'TOT (Cat. B/C)', value: '2% goods · 10% services', color: 'text-sky-700' },
      { label: 'WHT on Purchases', value: '3% goods ≥20K · 3% svcs ≥10K', color: 'text-orange-700' },
    ],
  },
  {
    module: '2', label: 'People', icon: <Users size={14} />,
    iconBg: 'bg-teal-500', description: 'Payroll, HR, Employee Benefits',
    link: '/hr/payroll', tag: 'IAS 19 · PIT', tagColor: 'text-teal-600 bg-teal-50 border-teal-200',
    items: [
      { label: 'PIT Brackets', value: '0% → 35% (6 bands)', color: 'text-teal-700' },
      { label: 'Pension Employee', value: '7% of gross', color: 'text-teal-600' },
      { label: 'Pension Employer', value: '11% of gross', color: 'text-teal-600' },
      { label: 'Leave Accrual (IAS 19)', value: 'Days × (Salary ÷ 30)' },
      { label: 'Severance Accrual', value: '1 month/year (Labour Proc.)' },
    ],
  },
  {
    module: '3', label: 'ovds', icon: <Building2 size={14} />,
    iconBg: 'bg-violet-500', description: 'GL, Fixed Assets, Banking, FX',
    link: '/accounting/fixed-assets', tag: 'IAS 16 · IFRS 9 · IAS 21', tagColor: 'text-violet-600 bg-violet-50 border-violet-200',
    items: [
      { label: 'IFRS Depreciation', value: 'Straight-line / Revaluation (IAS 16)' },
      { label: 'Tax Pool Depr.', value: 'Cat 1-25% · Cat 2-20% · Cat 3-15%', color: 'text-violet-700' },
      { label: 'ECL Provision', value: 'Stage 1/2/3 PD × LGD (IFRS 9)' },
      { label: 'Capital Gains', value: '15% on disposal (Art. 59)', color: 'text-rose-600' },
      { label: 'FX Translation', value: 'IAS 21 — P&L or OCI' },
    ],
  },
  {
    module: '4', label: 'Compliance', icon: <Shield size={14} />,
    iconBg: 'bg-orange-500', description: 'Tax Reconciliation & Returns',
    link: '/tax/dashboard', tag: 'IAS 12 · MoR', tagColor: 'text-orange-600 bg-orange-50 border-orange-200',
    items: [
      { label: 'IAS 12 Deferred Tax', value: 'Temp. diff. × 30%', color: 'text-orange-700' },
      { label: 'CIT Rate', value: '30% flat (Proc. 979/2016)', color: 'text-rose-700' },
      { label: 'MAT', value: '2.5% of gross turnover' },
      { label: 'EFY Calendar', value: 'Hamle 1 – Sene 30' },
      { label: 'Non-deductibles', value: 'Entertainment · Excess donations' },
    ],
  },
  {
    module: '5', label: 'Reporting', icon: <PieChart size={14} />,
    iconBg: 'bg-sky-500', description: 'Financial Statements & Schedules',
    link: '/reports/mor-report', tag: 'IAS 1 · IFRS 18', tagColor: 'text-sky-600 bg-sky-50 border-sky-200',
    items: [
      { label: 'Statement of Financial Position', value: 'Balance Sheet (IAS 1)' },
      { label: 'Comprehensive Income', value: 'IFRS 18 P&L categories' },
      { label: 'Cash Flow', value: 'IAS 7 — Operating/Investing/Financing' },
      { label: 'Schedule A (CIT/MAT)', value: 'Taxable income computation' },
      { label: 'HR & Payroll MoR', value: 'PAYE · Pension · DRRF (IAS 19)', color: 'text-emerald-700' },
      { label: 'VAT Return', value: 'Output − Input = Payable', color: 'text-emerald-700' },
    ],
  },
  {
    module: '6', label: 'Admin', icon: <Lock size={14} />,
    iconBg: 'bg-slate-600', description: 'RBAC, Audit Trails, Period Lock',
    link: '/settings/audit-logs', tag: 'AABE · RBAC', tagColor: 'text-slate-600 bg-white border-slate-200',
    items: [
      { label: 'Period Lock', value: 'Immutable after close' },
      { label: 'Dual Calendar', value: 'Gregorian + EFY' },
      { label: 'Audit Trail', value: 'Every VAT/WHT/asset change logged' },
      { label: 'FX Rate Management', value: 'ETB-USD daily rates' },
      { label: 'AABE Compliance', value: 'Retention 10 years' },
    ],
  },
  {
    module: '7', label: 'Developer', icon: <Code2 size={14} />,
    iconBg: 'bg-rose-600', description: 'API, eTax, E2E Integrations',
    link: '/settings/api-docs', tag: 'REST · JSON · ERCA', tagColor: 'text-rose-600 bg-rose-50 border-rose-200',
    items: [
      { label: 'eTax VAT Payload', value: 'POST /etax/vat-return', color: 'text-rose-700' },
      { label: 'WHT JSON Schema', value: 'TaxpayerDeclaration envelope' },
      { label: 'SIGTAS Integration', value: 'MoR National E-Tax Gateway' },
      { label: 'Webhook Events', value: 'invoice:paid · payroll:generated' },
      { label: 'TIN Verification', value: 'ERCA TIN lookup API' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Flow Row (reusable for both income and expense chains)
// ---------------------------------------------------------------------------

const FlowRow: React.FC<{ steps: FlowStep[]; direction: 'income' | 'expense' }> = ({ steps, direction }) => (
  <div className="overflow-x-auto pb-1">
    <div className="flex items-center gap-1 min-w-max">
      {steps.map((s, i) => {
        const isExternal = s.link.startsWith('http');
        const tile = (
          <div className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border cursor-pointer
                           hover:shadow-sm hover:-translate-y-0.5 transition-all min-w-[88px] text-center
                           ${s.bg} ${s.border}`}>
            <div className="flex items-center justify-center gap-1">
              {s.icon}
              {s.auto && (
                <span className="text-[7px] font-black bg-emerald-500 text-white px-1 rounded-full leading-tight">AUTO</span>
              )}
            </div>
            <span className={`text-[8px] font-semibold uppercase tracking-wider opacity-50 ${s.color}`}>
              Step {s.step}
            </span>
            <span className={`text-[11px] font-bold leading-tight ${s.color}`}>{s.label}</span>
            <span className={`text-[8px] opacity-60 leading-tight ${s.color}`}>{s.sub}</span>
          </div>
        );
        return (
          <React.Fragment key={s.step}>
            {isExternal
              ? <a href={s.link} target="_blank" rel="noopener noreferrer">{tile}</a>
              : <Link to={s.link}>{tile}</Link>
            }
            {i < steps.length - 1 && (
              <ArrowRight size={11} className="text-slate-300 dark:text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
      {/* Converge arrow to net profit */}
      <ArrowRight size={11} className="text-slate-300 dark:text-slate-600 shrink-0" />
      <Link to="/reports/mor-report">
        <div className="flex flex-col gap-1 px-3 py-2.5 rounded-xl border cursor-pointer min-w-[88px] text-center
                        bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
          <div className="flex items-center justify-center">
            {iconWrap(direction === 'income' ? <TrendingUp size={12} /> : <TrendingUp size={12} />, direction === 'income' ? 'bg-emerald-500' : 'bg-rose-500')}
          </div>
          <span className="text-[8px] font-semibold text-slate-400 uppercase">Net</span>
          <span className="text-[11px] font-bold text-white leading-tight">
            {direction === 'income' ? 'Net Revenue' : 'Net Expense'}
          </span>
          <span className="text-[8px] text-slate-400">IFRS Book</span>
        </div>
      </Link>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const AccountingChainWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [showModules, setShowModules] = useState(false);

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-50 dark:bg-teal-950/30 rounded-xl flex items-center justify-center">
            <GitBranch size={15} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Income vs Expenses — IFRS Accounting Flow
            </p>
            <p className="ovds-caption">
              IAS 1/2/12/15/16/19 · IFRS 9 · Proc. 1341/2024 · Proc. 1395/2025 · Dual-book ledger
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30
                           text-emerald-600 dark:text-emerald-400 text-[10px] font-medium
                           rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            AUTO-POST
          </span>
          <Link to="/tax/dashboard"
            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Tax Center →
          </Link>
        </div>
      </div>

      {/* Income flow */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <ArrowUp size={10} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Income Side</span>
          </div>
          <span className="text-[10px] text-slate-400">Sales · Invoices · Revenue Recognition (IFRS 15) · VAT/TOT</span>
        </div>
        <FlowRow steps={INCOME_CHAIN} direction="income" />
      </div>

      {/* Net Profit bridge */}
      <div className="mx-5 my-1 flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 via-slate-200 to-rose-200 dark:from-emerald-800 dark:via-slate-700 dark:to-rose-800" />
        <Link to="/reports/mor-report"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl
                     text-[10px] font-bold hover:bg-slate-700 transition-colors shrink-0">
          <BarChart3 size={11} />
          Net Profit → IAS 12 → CIT 30%
        </Link>
        <div className="flex-1 h-px bg-gradient-to-r from-rose-200 via-slate-200 to-emerald-200 dark:from-rose-800 dark:via-slate-700 dark:to-emerald-800" />
      </div>

      {/* Expense flow */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-lg">
            <ArrowDown size={10} className="text-rose-600" />
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Expense Side</span>
          </div>
          <span className="text-[10px] text-slate-400">Purchases · Bills · WHT · Payroll · PIT · Pension</span>
        </div>
        <FlowRow steps={EXPENSE_CHAIN} direction="expense" />
      </div>

      {/* Expand buttons */}
      <div className="px-5 pb-3 flex gap-2">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold
                     text-slate-400 hover:text-emerald-600 transition-colors
                     border border-dashed border-slate-200 dark:border-slate-700 rounded-xl
                     hover:border-emerald-400/40"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Hide compliance workflow' : 'Compliance submission workflow'}
        </button>
        <button
          onClick={() => setShowModules(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold
                     text-slate-400 hover:text-violet-600 transition-colors
                     border border-dashed border-slate-200 dark:border-slate-700 rounded-xl
                     hover:border-violet-400/40"
        >
          {showModules ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {showModules ? 'Hide 7-module overview' : 'All 7 modules — full system map'}
        </button>
      </div>

      {/* Compliance workflow */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4
                        animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="ovds-label mb-3">Compliance Submission Workflow</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { n: '1', label: 'Record', desc: 'Invoice/Bill → auto Journal Entry posted', icon: <Receipt size={11} />, color: 'text-emerald-600' },
              { n: '2', label: 'Reconcile', desc: 'VAT/DRRF/WHT computation worksheets', icon: <BarChart3 size={11} />, color: 'text-violet-600' },
              { n: '3', label: 'Declare', desc: 'Monthly eTax portal (MoR/SIGTAS)', icon: <Globe size={11} />, color: 'text-orange-600' },
              { n: '4', label: 'IAS 12', desc: 'Deferred tax DTA/DTL reconciliation', icon: <GitBranch size={11} />, color: 'text-sky-600' },
              { n: '5', label: 'Report', desc: 'Annual BIT filing · audited financials', icon: <FileText size={11} />, color: 'text-amber-600' },
              { n: '6', label: 'Remit', desc: 'DRRF / CBE payment · WHT certificates', icon: <Banknote size={11} />, color: 'text-teal-600' },
            ].map(step => (
              <div key={step.n}
                className="flex items-start gap-2.5 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className={`w-5 h-5 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 ${step.color}`}>
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-400">{step.n}</span>
                    <span className={`text-[10px] font-bold ${step.color}`}>{step.label}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/40">
            <p className="text-[10px] font-medium text-orange-600 uppercase tracking-wider mb-1">Legal & IFRS Basis</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Full IFRS (IAS 1/2/7/12/15/16/19/21/36 · IFRS 9/15/16) ·
              Proc. No. 1341/2024 (VAT) · Proc. No. 1395/2025 (PIT/WHT/BIT) ·
              Regulation No. 570/2025 (DRRF) · Ethiopian Labour Proc. 1156/2019 (Severance) ·
              AABE Standards · MoR 2026 Directives
            </p>
          </div>
        </div>
      )}

      {/* 7-module grid */}
      {showModules && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4
                        animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="ovds-label mb-3">
            Full System — 7 Modules · Core Operations → People → ovds → Compliance → Reporting → Admin → Developer
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MODULES.map(m => (
              <Link key={m.module} to={m.link}
                className="group block p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700
                           hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-xl ${m.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400">M{m.module}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.label}</span>
                    </div>
                    <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded border mt-0.5 ${m.tagColor}`}>
                      {m.tag}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">{m.description}</p>
                <div className="space-y-1">
                  {m.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-400 truncate shrink-0 max-w-[50%]">{item.label}</span>
                      <span className={`text-[9px] font-semibold truncate ${item.color ?? 'text-slate-600 dark:text-slate-300'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingChainWidget;
