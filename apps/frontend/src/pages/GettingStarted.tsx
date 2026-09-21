import { useEimsReadiness } from '@ovds/features/eims';
import { useSecurityReadiness } from '@ovds/features/security';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Key,
  Keyboard,
  Package,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Users,
  BookOpen,
  Receipt,
  Clock,
  Banknote,
  FileText,
  Landmark,
  Building2,
  Briefcase,
  TrendingUp,
  ShoppingCart,
  Factory,
  ExternalLink,
  CalendarDays,
  AlertTriangle,
  CheckSquare,
  Square,
  HelpCircle,
  Globe,
  Download,
  RefreshCw,
  Cloud,
  CreditCard,
  Smartphone,
  LayoutGrid,
  Bell,
  Server,
  Lock,
  UserPlus,
  SlidersHorizontal,
  Zap,
  Target,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSetupComplianceSync } from '../hooks/useSetupComplianceSync';
import { useAuth } from '../rbac/AuthContext';
import setupApi, { type SetupStepDefinition, type CompanySetupProgress } from '../services/setupApi';
import { calculatePIT } from '../utils/ethiopianTax';
import { fmtDecimal } from '../utils/fmt';


// -----------------------------------------------------------------------------
// PIT Calculator
// -----------------------------------------------------------------------------

const fmt2 = fmtDecimal;

const PITCalculator: React.FC = () => {
  const [gross, setGross] = useState('');
  const [showTable, setShowTable] = useState(false);
  const g = parseFloat(gross.replace(/,/g, '')) || 0;
  const result = calculatePIT(g);
  const pit = result.incomeTax;
  const empPension = result.pensionEmployee;
  const emplPension = result.pensionEmployer;
  const net = result.netSalary;
  const rate = g > 0 ? ((pit / g) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Gross Monthly Salary
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 group-focus-within:text-[var(--pro-azure)] transition-colors">
                ETB
              </span>
              <input
                type="text"
                value={gross}
                onChange={(e) =>
                  setGross(e.target.value.replace(/[^0-9.,]/g, ''))
                }
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 transition-all shadow-sm"
              />
            </div>
          </div>
          {g > 0 && (
            <div className="sm:w-48">
              <div className="h-full px-6 py-4 bg-[var(--pro-azure-50)]0 rounded-xl text-center flex flex-col justify-center shadow-lg shadow-green-500/20">
                <p className="text-[10px] font-bold text-green-100 uppercase tracking-widest">
                  Effective Rate
                </p>
                <p className="text-3xl font-bold text-white mt-1">{rate}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {g > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="ovds-grid-layout cols-4">
            {[
              {
                label: 'Gross Pay',
                value: fmt2(g),
                color: 'text-slate-900 dark:text-white',
                bg: 'bg-white dark:bg-slate-900',
                icon: <Banknote size={16} />,
              },
              {
                label: 'Income Tax (PIT)',
                value: fmt2(pit),
                color: 'text-rose-600 dark:text-rose-400',
                bg: 'bg-rose-50/50 dark:bg-rose-900/10',
                icon: <Receipt size={16} />,
              },
              {
                label: 'Pension (7%)',
                value: fmt2(empPension),
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50/50 dark:bg-amber-900/10',
                icon: <Shield size={16} />,
              },
              {
                label: 'Net Take-Home',
                value: fmt2(net),
                color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                bg: 'bg-[var(--pro-azure-50)]/50 dark:bg-green-900/10',
                icon: <Sparkles size={16} />,
              },
            ].map((c) => (
              <div
                key={c.label}
                className={`${c.bg} rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-slate-400">
                    {c.icon}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.label}</p>
                </div>
                <p className={`text-xl font-bold ${c.color} tabular-nums`}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[var(--pro-azure-50)]/50 dark:bg-green-900/10 border border-[var(--pro-azure-100)] dark:border-green-900/30 rounded-2xl">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-light)]" />{' '}
                Employer pension (11%):{' '}
                <strong className="text-slate-900 dark:text-white">
                  ETB {fmt2(emplPension)}
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-light)]" />{' '}
                Total employer cost:{' '}
                <strong className="text-slate-900 dark:text-white">
                  ETB {fmt2(g + emplPension)}
                </strong>
              </span>
            </div>
            <button
              onClick={() => setShowTable((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:shadow-md transition-all"
            >
              {showTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showTable ? 'Hide' : 'Show'} PIT Brackets
            </button>
          </div>

          {showTable && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <table className="ovds-table w-full text-sm">
                <thead>
                  <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    {['Income Range (ETB/month)', 'Rate', 'Formula'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ['0 – 2,000', '0%', 'Exempt'],
                    ['2,001 – 4,000', '15%', '(gross − 2,000) × 15%'],
                    ['4,001 – 7,000', '20%', '300 + (gross − 4,000) × 20%'],
                    ['7,001 – 10,000', '25%', '900 + (gross − 7,000) × 25%'],
                    [
                      '10,001 – 14,000',
                      '30%',
                      '1,650 + (gross − 10,000) × 30%',
                    ],
                    ['> 14,000', '35%', '2,850 + (gross − 14,000) × 35%'],
                  ].map(([range, r, formula], i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {range}
                      </td>
                      <td className="px-5 py-3 font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                        {r}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {formula}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {!g && (
        <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="ovds-body italic">
            Enter a gross salary above to calculate PIT, pension, and net pay.
            Calculations are based on Proclamation No. 1395/2025 and the updated
            Ethiopian tax brackets.
          </p>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Quick-start checklist data
// -----------------------------------------------------------------------------

const CHECKLIST = [
  // ovds-style 4-step cloud setup
  {
    id: 'signup',
    label: 'Sign up to Ovds',
    desc: 'Create your account at ovds.com.et — takes about 60 seconds',
    to: '/start',
    icon: <Sparkles size={14} />,
  },
  {
    id: 'apikey',
    label: 'Get your API Key',
    desc: 'Log in at ovds.com.et/login → your API key is at the top of the Account Dashboard',
    to: '/settings?tab=api-keys',
    icon: <Key size={14} />,
  },
  {
    id: 'company',
    label: 'Create your company',
    desc: 'Press W or go to System Administration → Setup Wizard. Paste your API key.',
    to: '/companies/new',
    icon: <Settings size={14} />,
  },
  {
    id: 'apps',
    label: 'Add default and recommended apps',
    desc: 'App Store → install 2FA, Address Finder, Calendar, Live Currency, and more',
    to: '/settings/app-store',
    icon: <Package size={14} />,
  },
  {
    id: 'invoice',
    label: 'Send your first invoice',
    desc: 'ovds → Invoices → New Invoice — ERCA QR code included automatically',
    to: '/sales/invoices',
    icon: <FileText size={14} />,
  },
  {
    id: 'invoice-module',
    label: 'Download the Invoice Module',
    desc: 'Process invoices offline on any workstation — syncs templates and tax rules automatically when online. Available on all plans.',
    to: '/getting-started/invoice-module',
    icon: <Download size={14} />,
  },
  {
    id: 'accounts',
    label: 'Seed chart of accounts',
    desc: 'Accounting → Chart of Accounts → Seed Ethiopian Defaults',
    to: '/accounting',
    icon: <BookOpen size={14} />,
  },
  {
    id: 'employees',
    label: 'Add employees',
    desc: 'HR → Employees → Add Employee or bulk CSV import',
    to: '/hr/employees',
    icon: <Users size={14} />,
  },
  {
    id: 'vat',
    label: 'File your first VAT return',
    desc: 'Tax & Compliance → VAT Administration → Compute',
    to: '/vat-administration',
    icon: <Shield size={14} />,
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'K'], action: 'Global search' },
  { keys: ['G', 'D'], action: 'Go to Dashboard' },
  { keys: ['G', 'I'], action: 'Go to Invoices' },
  { keys: ['G', 'P'], action: 'Go to Payroll' },
  { keys: ['G', 'E'], action: 'Go to Employees' },
  { keys: ['G', 'V'], action: 'Go to VAT' },
  { keys: ['G', 'S'], action: 'Go to Settings' },
  { keys: ['W'], action: 'System Administration Setup' },
  { keys: ['A'], action: 'Activity Feed' },
  { keys: ['?'], action: 'All shortcuts' },
];

const TAX_QUICK_REF = [
  {
    label: 'VAT',
    rate: '15%',
    basis: 'Output − Input VAT',
    deadline: '30th of following month',
  },
  {
    label: 'PIT (tax-free)',
    rate: '0%',
    basis: '≤ ETB 2,000/month',
    deadline: 'Monthly via payroll',
  },
  {
    label: 'PIT (top bracket)',
    rate: '35%',
    basis: '> ETB 14,000/month',
    deadline: 'Monthly via payroll',
  },
  {
    label: 'Pension (employee)',
    rate: '7%',
    basis: 'Basic salary (cap ETB 15k)',
    deadline: 'Monthly',
  },
  {
    label: 'Pension (employer)',
    rate: '11%',
    basis: 'Basic salary (cap ETB 15k)',
    deadline: 'Monthly',
  },
  {
    label: 'DRRF',
    rate: '1–5%',
    basis: 'Transaction value',
    deadline: 'Quarterly (15th)',
  },
  {
    label: 'BIT',
    rate: '30%',
    basis: 'Net profit',
    deadline: 'Within 4 months of FY end',
  },
  {
    label: 'Withholding (svc)',
    rate: '3%',
    basis: 'Service payments ≥ ETB 10k',
    deadline: 'Per transaction',
  },
];

// -----------------------------------------------------------------------------
// Ethiopian Tax Guide — Schedule & Sector Classification
// -----------------------------------------------------------------------------

const TAX_SCHEDULES = [
  {
    id: 'A',
    label: 'Schedule A — Employment Income Tax',
    short: 'Salaries & Wages',
    icon: <Users size={15} />,
    color:
      'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400',
    accent: 'bg-sky-500',
    rates: '0% – 35% (progressive)',
    basis: 'Individual salaries and wages earned from employment.',
    details: [
      '0% on monthly income ≤ ETB 2,000',
      '15% on ETB 2,001 – 4,000',
      '20% on ETB 4,001 – 7,000',
      '25% on ETB 7,001 – 10,000',
      '30% on ETB 10,001 – 14,000',
      '35% on income > ETB 14,000',
    ],
    link: '/hr/payroll',
    linkLabel: 'Payroll Module',
    proclamation: 'Proc. No. 1395/2025',
  },
  {
    id: 'B',
    label: 'Schedule B — Rental Income Tax',
    short: 'Property Rentals',
    icon: <Building2 size={15} />,
    color:
      'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    accent: 'bg-amber-500',
    rates: 'Progressive up to 35%',
    basis: 'Income earned from leasing land and buildings.',
    details: [
      'Progressive rates for individuals (same brackets as Sch. A)',
      'Flat 30% rate for corporate bodies',
      'Applies to residential and commercial rental income',
      'Must file annual rental income declaration',
    ],
    link: '/tax/filing',
    linkLabel: 'Tax Filing',
    proclamation: 'Proc. No. 1395/2025',
  },
  {
    id: 'C',
    label: 'Schedule C — Business Profit Tax',
    short: 'Corporate / Business',
    icon: <Briefcase size={15} />,
    color:
      'bg-[var(--pro-azure-50)] dark:bg-green-950/20 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
    accent: 'bg-[var(--pro-azure-50)]0',
    rates: '30% flat (corp.) / up to 35% (sole)',
    basis:
      'Net profits from commercial, industrial, or professional businesses.',
    details: [
      'Corporations and PLC: flat 30% on net taxable profit',
      'Sole proprietors: progressive rates up to 35%',
      'Minimum Alternative Tax (MAT) = 2.5% of annual turnover',
      'Tax paid is whichever is higher: BIT or MAT',
      'Provisional tax paid in 4 quarterly instalments',
    ],
    link: '/tax/business-income',
    linkLabel: 'Business Income Tax',
    proclamation: 'Proc. No. 1395/2025',
  },
  {
    id: 'D',
    label: 'Schedule D — Other Income Taxes',
    short: 'Dividends, CGT & Royalties',
    icon: <TrendingUp size={15} />,
    color:
      'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
    accent: 'bg-violet-500',
    rates: '5% – 15%',
    basis: 'Miscellaneous income streams outside Schedules A–C.',
    details: [
      'Dividend Tax: 10% on distributed company profits',
      'Capital Gains Tax (CGT): 15% on sale of business shares or buildings',
      'Royalty Tax: 5% on intellectual property exploitation',
      'Interest Income Tax: 5% on bank savings interest',
    ],
    link: '/tax/filing',
    linkLabel: 'Tax Filing',
    proclamation: 'Proc. No. 1395/2025',
  },
  {
    id: 'E',
    label: 'Schedule E — Exempt Income',
    short: 'Tax-Free Items',
    icon: <Shield size={15} />,
    color:
      'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
    accent: 'bg-slate-400',
    rates: '0% (fully exempt)',
    basis: 'Income types completely excluded from Ethiopian taxation.',
    details: [
      'Diplomatic income and allowances',
      'Certain NGO / development organisation grants',
      'Export proceeds under qualifying investment schemes',
      'Pension and provident fund distributions (specified conditions)',
      'Refer to MoR for the full exemption schedule',
    ],
    link: '/compliance/auditor',
    linkLabel: 'Compliance Auditor',
    proclamation: 'Proc. No. 1395/2025',
  },
];

const TRADE_SECTORS = [
  {
    key: 'commercial',
    label: 'Commercial & Retail Trade',
    icon: <ShoppingCart size={14} />,
    color:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800',
    examples:
      'Wholesalers, supermarkets, commodity merchants, import/export firms',
    taxes: [
      { name: 'BIT (Schedule C)', rate: '30%', note: 'Net profit' },
      { name: 'VAT', rate: '15%', note: 'Proc. 1341/2024' },
      { name: 'Customs Duty', rate: '10–35%', note: 'Imported goods' },
    ],
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing & Processing',
    icon: <Factory size={14} />,
    color:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
    examples: 'Textile, agro-processing, food processing, bottling plants',
    taxes: [
      { name: 'Excise Tax', rate: 'Varies', note: 'Per category' },
      { name: 'WHT', rate: '3%', note: 'Local sourcing' },
      { name: 'BIT', rate: '30%', note: 'Net profit' },
    ],
  },
  {
    key: 'services',
    label: 'Service & Professional Trade',
    icon: <Briefcase size={14} />,
    color:
      'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/20 dark:text-[var(--pro-azure-light)] dark:border-green-800',
    examples: 'Consulting, legal, engineering, transport, hotels',
    taxes: [
      {
        name: 'Service VAT / TOT',
        rate: '15% / 10%',
        note: 'VAT if Cat A; TOT if Cat B',
      },
      { name: 'WHT', rate: '3%', note: 'Per contract ≥ ETB 10k' },
      { name: 'BIT', rate: '30%', note: 'Net profit' },
    ],
  },
  {
    key: 'financial',
    label: 'Financial Services & Investment',
    icon: <TrendingUp size={14} />,
    color:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800',
    examples: 'Banks, microovds, insurance, stock traders',
    taxes: [
      { name: 'Dividend Tax', rate: '10%', note: 'On profit distributions' },
      { name: 'CGT', rate: '15%', note: 'Share / property disposal' },
      { name: 'DRRF', rate: '1–5%', note: 'Reg. 570/2025' },
    ],
  },
];

const BUSINESS_CATEGORIES = [
  {
    cat: 'Category A',
    threshold: '≥ ETB 2,000,000 annual turnover',
    bookkeeping:
      'Full IFRS-aligned balance sheets, complete transactional records',
    taxMethod: 'Net Taxable Income: Gross sales minus authorised deductions',
    vatRequired: true,
    color: 'border-l-indigo-500',
  },
  {
    cat: 'Category B',
    threshold: '< ETB 2,000,000 annual turnover',
    bookkeeping:
      'Simplified, structured transaction logging (excludes legal corporate bodies)',
    taxMethod:
      'Gross Annual Sales: tiered sliding scale 2–9% (no deduction write-offs)',
    vatRequired: false,
    color: 'border-l-amber-500',
  },
];

const INDIRECT_TAXES = [
  {
    name: 'VAT',
    rate: '15%',
    desc: 'Standard domestic consumption tax on most goods and services. Mandatory registration at ETB 2M+ turnover.',
    link: '/tax/vat',
  },
  {
    name: 'Turnover Tax (TOT)',
    rate: '2% / 10%',
    desc: 'Presumptive tax for Category B businesses below the VAT threshold. 2% on goods sold locally, 10% on services.',
    link: '/tax/tot',
  },
  {
    name: 'Excise Tax',
    rate: 'Varies',
    desc: 'Applied to locally manufactured or imported luxury/hazardous goods — alcohol, tobacco, fuel, sugar, plastics.',
    link: '/tax/excise-tax',
  },
  {
    name: 'Customs Duty',
    rate: '10–35%',
    desc: 'Import tariffs at borders following international HS code classifications.',
    link: '/trade',
  },
  {
    name: 'Import Surtax',
    rate: '10%',
    desc: 'Flat surcharge on all goods imported into Ethiopia.',
    link: '/trade',
  },
  {
    name: 'Stamp Duty',
    rate: 'Fixed',
    desc: 'Levied on formal legal documents — property transfers, employment agreements, business registrations.',
    link: '/tax/stamp-duty',
  },
];

const EthiopianTaxGuide: React.FC = () => {
  const [section, setSection] = useState<
    'schedules' | 'sectors' | 'categories' | 'indirect'
  >('schedules');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Section nav */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'schedules', label: 'Income Tax Schedules (A–E)' },
          { id: 'sectors', label: 'Trade Sectors' },
          { id: 'categories', label: 'Business Categories (A/B)' },
          { id: 'indirect', label: 'Indirect Taxes' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id as typeof section)}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
              section === s.id
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[var(--pro-azure)] dark:hover:border-[var(--pro-azure-light)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Schedules A–E */}
      {section === 'schedules' && (
        <div className="space-y-3">
          <p className="ovds-body text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-[var(--pro-azure)]" />
            Ethiopia divides income taxes into five official categories
            (Schedules A–E) under Proclamation No. 1395/2025, administered by
            the Ministry of Revenues (MoR) via the MoR e-Tax Portal.
          </p>
          <div className="space-y-2">
            {TAX_SCHEDULES.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border overflow-hidden ${s.color}`}
              >
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.accent} text-white`}
                  >
                    {s.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className="text-[11px] opacity-70 mt-0.5">
                      {s.rates} · {s.basis}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold opacity-60 mr-2 hidden sm:block">
                    {s.proclamation}
                  </span>
                  {expanded === s.id ? (
                    <ChevronUp size={14} className="shrink-0 opacity-60" />
                  ) : (
                    <ChevronDown size={14} className="shrink-0 opacity-60" />
                  )}
                </button>
                {expanded === s.id && (
                  <div className="px-5 pb-4 pt-1 bg-white/40 dark:bg-white/5 space-y-3 animate-in fade-in duration-150">
                    <ul className="space-y-1.5 pl-4">
                      {s.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2
                            size={11}
                            className="mt-0.5 shrink-0 text-[var(--pro-azure)]"
                          />
                          <span className="opacity-80">{d}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={s.link}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold hover:underline"
                    >
                      {s.linkLabel} <ArrowRight size={11} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade Sectors */}
      {section === 'sectors' && (
        <div className="space-y-4">
          <p className="ovds-body text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-[var(--pro-azure)]" />
            The Ministry of Revenues links specific trade sectors to mandated
            tax types. Your sector determines which taxes apply to your business
            activities.
          </p>
          <div className="ovds-grid-layout cols-2">
            {TRADE_SECTORS.map((sector) => (
              <div
                key={sector.key}
                className={`rounded-xl border p-5 space-y-4 ${sector.color}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center shrink-0">
                    {sector.icon}
                  </span>
                  <p className="text-sm font-bold">{sector.label}</p>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed">
                  {sector.examples}
                </p>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    Key Taxes
                  </p>
                  {sector.taxes.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between bg-white/50 dark:bg-white/10 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-[11px] font-semibold">
                        {t.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold">{t.rate}</span>
                        <span className="text-[10px] opacity-60">{t.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Categories */}
      {section === 'categories' && (
        <div className="space-y-4">
          <p className="ovds-body text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-[var(--pro-azure)]" />
            Ethiopia classifies businesses into two legal categories based on
            annual gross revenue. Your category determines your bookkeeping
            requirements, income tax method, and VAT obligations.
          </p>
          <div className="space-y-3">
            {BUSINESS_CATEGORIES.map((bc) => (
              <div
                key={bc.cat}
                className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden border-l-4 ${bc.color}`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {bc.cat}
                      </p>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {bc.threshold}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border ${bc.vatRequired ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/20 dark:text-[var(--pro-azure-light)] dark:border-green-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800'}`}
                    >
                      {bc.vatRequired
                        ? 'VAT Registered (mandatory)'
                        : 'Turnover Tax (TOT)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Bookkeeping Requirement</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {bc.bookkeeping}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Income Tax Method</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {bc.taxMethod}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-3">
            <Info size={14} className="shrink-0 mt-0.5 text-sky-500" />
            <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed">
              <strong>Note:</strong> The previous Category C has been legally
              removed under Regulation No. 570/2025 to transition smaller
              operators into micro-receptive gross receipt structures under
              Category B.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/settings/business-registration"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)] transition-colors"
            >
              Business Registration <ArrowRight size={11} />
            </Link>
            <Link
              to="/tax/vat"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)] transition-colors"
            >
              VAT Administration <ArrowRight size={11} />
            </Link>
            <Link
              to="/tax/tot"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)] transition-colors"
            >
              TOT Filing <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}

      {/* Indirect Taxes */}
      {section === 'indirect' && (
        <div className="space-y-4">
          <p className="ovds-body text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-[var(--pro-azure)]" />
            Indirect taxes are consumption-based fees collected by businesses
            during trade transactions and Remitted to MoR.
          </p>
          <div className="space-y-2">
            {INDIRECT_TAXES.map((t) => (
              <div
                key={t.name}
                className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-[var(--pro-azure-light)] dark:hover:border-green-700 transition-colors group"
              >
                <div className="w-16 shrink-0 text-center">
                  <span className="text-[13px] font-black text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                    {t.rate}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
                <Link
                  to={t.link}
                  className="shrink-0 p-2 rounded-lg text-slate-300 dark:text-slate-600 group-hover:text-[var(--pro-azure)] group-hover:bg-[var(--pro-azure-50)] dark:group-hover:bg-green-950/20 transition-all"
                  title={`Go to ${t.name}`}
                >
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
          <a
            href="https://etax.mor.gov.et"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline mt-1"
          >
            <ExternalLink size={12} /> MoR e-Tax Portal — etax.mor.gov.et
          </a>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Tax Deadline Calendar — sidebar panel
// -----------------------------------------------------------------------------

interface DeadlineItem {
  label: string;
  dayOfMonth: number; // due day (or 0 = varies)
  months: number[]; // 1-based months it applies; empty = every month
  type: 'monthly' | 'quarterly' | 'annual';
  link: string;
  color: string; // Tailwind accent class
}

const DEADLINES: DeadlineItem[] = [
  {
    label: 'VAT Return',
    dayOfMonth: 30,
    months: [],
    type: 'monthly',
    link: '/tax/vat',
    color: 'bg-[var(--pro-azure-50)]0',
  },
  {
    label: 'TOT Filing',
    dayOfMonth: 30,
    months: [],
    type: 'monthly',
    link: '/tax/tot',
    color: 'bg-sky-500',
  },
  {
    label: 'WHT Remittance',
    dayOfMonth: 30,
    months: [],
    type: 'monthly',
    link: '/tax/vat',
    color: 'bg-amber-500',
  },
  {
    label: 'DRRF Levy',
    dayOfMonth: 15,
    months: [3, 6, 9, 12],
    type: 'quarterly',
    link: '/disaster-fund',
    color: 'bg-rose-500',
  },
  {
    label: 'BIT Q1 Provisional',
    dayOfMonth: 7,
    months: [9],
    type: 'quarterly',
    link: '/tax/business-income',
    color: 'bg-violet-500',
  },
  {
    label: 'BIT Q2 Provisional',
    dayOfMonth: 7,
    months: [12],
    type: 'quarterly',
    link: '/tax/business-income',
    color: 'bg-violet-500',
  },
  {
    label: 'BIT Q3 Provisional',
    dayOfMonth: 7,
    months: [3],
    type: 'quarterly',
    link: '/tax/business-income',
    color: 'bg-violet-500',
  },
  {
    label: 'BIT Q4 Provisional',
    dayOfMonth: 7,
    months: [6],
    type: 'quarterly',
    link: '/tax/business-income',
    color: 'bg-violet-500',
  },
  {
    label: 'BIT Annual Return',
    dayOfMonth: 7,
    months: [11],
    type: 'annual',
    link: '/tax/business-income',
    color: 'bg-rose-600',
  },
];

const TaxDeadlineCalendar: React.FC = () => {
  const now = new Date();
  const thisMonth = now.getMonth() + 1; // 1-based
  const thisDay = now.getDate();
  const thisYear = now.getFullYear();

  // Build upcoming deadlines (within ~60 days)
  const upcoming = useMemo(() => {
    const results: {
      label: string;
      dueDate: Date;
      daysLeft: number;
      link: string;
      color: string;
      type: string;
    }[] = [];

    DEADLINES.forEach((d) => {
      // Months this deadline fires
      const applicableMonths: number[] =
        d.months.length > 0
          ? d.months
          : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      // Check current month and next 2 months
      for (let offset = 0; offset <= 2; offset++) {
        const checkMonth = ((thisMonth - 1 + offset) % 12) + 1;
        const checkYear = thisYear + Math.floor((thisMonth - 1 + offset) / 12);

        if (!applicableMonths.includes(checkMonth)) continue;

        const due = new Date(checkYear, checkMonth - 1, d.dayOfMonth);
        const daysLeft = Math.ceil(
          (due.getTime() - now.getTime()) / 86_400_000,
        );

        if (daysLeft >= -1 && daysLeft <= 45) {
          results.push({
            label: d.label,
            dueDate: due,
            daysLeft,
            link: d.link,
            color: d.color,
            type: d.type,
          });
        }
      }
    });

    return results
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .filter(
        (v, i, arr) =>
          arr.findIndex(
            (x) =>
              x.label === v.label &&
              x.dueDate.getTime() === v.dueDate.getTime(),
          ) === i,
      )
      .slice(0, 7);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thisMonth, thisDay, thisYear]);

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays
          size={14}
          className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
        />
        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
          Tax Deadline Calendar
        </p>
      </div>
      <p className="ovds-caption">Next 45 days · Ethiopian EFY calendar</p>
      <div className="space-y-2 pt-1">
        {upcoming.length === 0 && (
          <p className="text-xs text-slate-400 py-2 text-center">
            No upcoming deadlines.
          </p>
        )}
        {upcoming.map((item, i) => {
          const overdue = item.daysLeft < 0;
          const urgent = item.daysLeft >= 0 && item.daysLeft <= 7;
          return (
            <Link
              key={i}
              to={item.link}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <span
                className={`w-1.5 h-8 rounded-full shrink-0 ${item.color}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                  {item.label}
                </p>
                <p className="ovds-caption truncate">
                  {item.dueDate.toLocaleDateString('en-ET', {
                    day: 'numeric',
                    month: 'short',
                  })}
                  {' · '}
                  <span
                    className={`font-bold ${overdue ? 'text-rose-500' : urgent ? 'text-amber-500' : 'text-slate-400'}`}
                  >
                    {overdue
                      ? `${Math.abs(item.daysLeft)}d overdue`
                      : item.daysLeft === 0
                        ? 'today'
                        : `${item.daysLeft}d left`}
                  </span>
                </p>
              </div>
              {(overdue || urgent) && (
                <AlertTriangle
                  size={11}
                  className={`shrink-0 ${overdue ? 'text-rose-400' : 'text-amber-400'}`}
                />
              )}
              <ArrowRight
                size={11}
                className="shrink-0 text-slate-300 group-hover:text-[var(--pro-azure)] transition-colors"
              />
            </Link>
          );
        })}
      </div>
      <a
        href="https://etax.mor.gov.et"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline pt-1"
      >
        <Globe size={10} /> MoR e-Tax Portal
      </a>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Persisted checklist hook
// -----------------------------------------------------------------------------

const CHECKLIST_KEY = 'ovds_gs_checklist_v1';

const STEP_ROUTE_MAP: Record<string, string> = {
  setup_wizard: '/settings/setup-wizard',
  admin_setup_wizard: '/settings/setup-wizard',
  cloud_deployment: '/getting-started/cloud',
  on_premise_deployment: '/getting-started/on-premise',
  enterprise_client: '/getting-started/client',
  invoice_module: '/getting-started/invoice-module',
  tin_mor_credentials: '/settings/company-profile',
  business_registration: '/settings/business-registration',
  sme_profile: '/smes',
  multi_company: '/settings/multi-company',
  currency_exchange: '/settings/currencies',
  fiscal_year: '/accounting/period-close',
  payment_gateways: '/ovds/payment-gateways',
  chapa_gateway: '/settings/payment-gateways/chapa',
  digital_wallets: '/settings/digital-wallets',
  universal_tax_config: '/tax/universal-config',
  module_selection: '/settings/app-store',
  project_management: '/ovds/projects',
  iot_devices: '/control/iot',
  users: '/settings/users',
  roles_permissions: '/settings/roles',
  onboarding: '/settings/onboarding',
  settings_catalog: '/settings/catalog',
  control_node: '/control',
  api_docs: '/settings/api-docs',
  developer_guide: '/settings/developers',
  system_updates: '/settings/releases',
  notifications: '/admin/notifications-settings',
  eims_integration: '/settings/eims',
  security_assessment: '/settings/security',
};

const STEP_ICON_MAP: Record<string, React.ReactNode> = {
  setup_wizard: <Zap size={14} />,
  admin_setup_wizard: <Settings size={14} />,
  cloud_deployment: <Cloud size={14} />,
  on_premise_deployment: <Server size={14} />,
  enterprise_client: <Download size={14} />,
  invoice_module: <FileText size={14} />,
  tin_mor_credentials: <Building2 size={14} />,
  business_registration: <CheckCircle2 size={14} />,
  sme_profile: <Building2 size={14} />,
  multi_company: <Users size={14} />,
  payment_gateways: <CreditCard size={14} />,
  chapa_gateway: <CreditCard size={14} />,
  digital_wallets: <Smartphone size={14} />,
  universal_tax_config: <Shield size={14} />,
  currency_exchange: <Globe size={14} />,
  fiscal_year: <CalendarDays size={14} />,
  module_selection: <Package size={14} />,
  project_management: <Target size={14} />,
  iot_devices: <Server size={14} />,
  users: <UserPlus size={14} />,
  roles_permissions: <Lock size={14} />,
  onboarding: <Rocket size={14} />,
  settings_catalog: <LayoutGrid size={14} />,
  control_node: <SlidersHorizontal size={14} />,
  api_docs: <FileText size={14} />,
  developer_guide: <FileText size={14} />,
  system_updates: <Zap size={14} />,
  notifications: <Bell size={14} />,
  eims_integration: <Shield size={14} />,
  security_assessment: <Lock size={14} />,
};

function useChecklistProgress(ids: string[]) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify([...next]));
      // eslint-disable-next-line no-empty
      } catch {}
      return next;
    });
  };

  const reset = () => {
    setChecked(new Set());
    try {
      localStorage.removeItem(CHECKLIST_KEY);
    // eslint-disable-next-line no-empty
    } catch {}
  };

  const pct =
    ids.length > 0
      ? Math.round(
          (ids.filter((id) => checked.has(id)).length / ids.length) * 100,
        )
      : 0;

  return { checked, toggle, reset, pct };
}

// -----------------------------------------------------------------------------
// Context-aware sidebar panels
// -----------------------------------------------------------------------------

const SidebarApiKey: React.FC = () => (
  <div className="p-6 ovds-widget-card shadow-sm space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/20 flex items-center justify-center shrink-0">
        <Key size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
      </div>
      <div>
        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
          Your API Key
        </p>
        <p className="ovds-caption mt-0.5">
          Required for company setup &amp; apps
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <code className="text-[10px] font-mono text-slate-400 blur-[3px] select-none flex-1 truncate">
        ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx
      </code>
    </div>
    <a
      href="https://ovds.com.et/login"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-black hover:bg-[var(--pro-azure-dark)] transition-all"
    >
      Get API Key at ovds.com.et <ArrowRight size={12} />
    </a>
  </div>
);

const SidebarComplianceHub: React.FC = () => (
  <div className="p-8 bg-slate-900 rounded-xl text-white space-y-6 relative overflow-hidden shadow-2xl">
    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pro-azure-100)] rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
    <h3 className="text-xs font-black text-[var(--pro-azure-light)] uppercase tracking-widest">
      Compliance Hub
    </h3>
    <div className="space-y-4">
      {[
        {
          label: 'DRRF Rate',
          value: '1.0% — 5.0%',
          sub: 'Auto-calculated per Procl.',
          subCls: 'text-[var(--pro-azure-light)]',
        },
        {
          label: 'Pension (Co.)',
          value: '11.0%',
          sub: 'Cap at ETB 15,000',
          subCls: 'text-slate-500',
        },
        {
          label: 'VAT Rate',
          value: '15%',
          sub: 'Output − Input, due 30th',
          subCls: 'text-slate-500',
        },
        {
          label: 'WHT (Services)',
          value: '3%',
          sub: '≥ ETB 10k · Proc. 1395/2025',
          subCls: 'text-slate-500',
        },
      ].map((item) => (
        <div
          key={item.label}
          className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-0.5"
        >
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {item.label}
          </p>
          <p className="text-xl font-black">{item.value}</p>
          <p className={`text-[10px] font-bold ${item.subCls}`}>{item.sub}</p>
        </div>
      ))}
    </div>
  </div>
);

const SidebarPitTips: React.FC = () => (
  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
    <div className="flex items-center gap-2">
      <Calculator
        size={14}
        className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
      />
      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
        Quick PIT Facts
      </p>
    </div>
    <div className="space-y-2">
      {[
        { label: 'Tax-free threshold', value: 'ETB 2,000 / month' },
        { label: 'Highest bracket', value: '35% above ETB 14,000' },
        { label: 'Employee pension', value: '7% of basic salary' },
        { label: 'Employer pension', value: '11% of basic salary' },
        { label: 'Pension cap', value: 'ETB 15,000 insurable' },
        { label: 'Proclamation', value: 'No. 1395/2025' },
      ].map((r) => (
        <div
          key={r.label}
          className="flex justify-between gap-2 text-[11px] py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
        >
          <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
            {r.value}
          </span>
        </div>
      ))}
    </div>
    <Link
      to="/hr/payroll"
      className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline pt-1"
    >
      Payroll Module <ArrowRight size={11} />
    </Link>
  </div>
);

const SidebarTaxLinks: React.FC = () => (
  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
    <div className="flex items-center gap-2">
      <Landmark size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
        Official Resources
      </p>
    </div>
    <div className="space-y-1.5">
      {[
        { label: 'MoR e-Tax Portal', href: 'https://etax.mor.gov.et' },
        { label: 'Ministry of Revenues', href: 'https://mor.gov.et' },
        { label: 'AABE (IFRS Standards)', href: 'https://aabe.gov.et' },
        { label: 'NBE (Exchange Rates)', href: 'https://nbe.gov.et' },
      ].map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
        >
          <Globe
            size={11}
            className="text-slate-400 shrink-0 group-hover:text-[var(--pro-azure)]"
          />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] flex-1 truncate">
            {link.label}
          </span>
          <ExternalLink
            size={10}
            className="text-slate-300 shrink-0 group-hover:text-[var(--pro-azure-light)]"
          />
        </a>
      ))}
    </div>
  </div>
);

const SidebarShortcutHint: React.FC = () => (
  <div className="p-5 bg-slate-900 rounded-xl text-white space-y-3">
    <p className="text-xs font-black text-[var(--pro-azure-light)] uppercase tracking-widest">
      Pro Tip
    </p>
    <p className="text-xs text-slate-400 leading-relaxed">
      Press{' '}
      <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">
        ?
      </kbd>{' '}
      anywhere in the app to open the full shortcuts panel. Use{' '}
      <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">
        Ctrl K
      </kbd>{' '}
      for instant global search.
    </p>
    <Link
      to="/dashboard"
      className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--pro-azure-light)] hover:underline"
    >
      Go to Dashboard <ArrowRight size={11} />
    </Link>
  </div>
);

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

const GettingStarted: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('gs.page_title'));
  const { user } = useAuth();
  const { selectedCompanyId: companyId } = useBusiness();
  type ActiveTab = 'checklist' | 'tax' | 'shortcuts' | 'pit' | 'guide';
  const [activeTab, setActiveTab] = useState<ActiveTab>('checklist');
  const checklistIds = CHECKLIST.map((c) => c.id);
  const { checked: localChecked, toggle: localToggle, reset: localReset, pct: localPct } = useChecklistProgress(checklistIds);

  const [wizardSteps, setWizardSteps] = useState<SetupStepDefinition[]>([]);
  const [wizardProgress, setWizardProgress] = useState<CompanySetupProgress | null>(null);
  const [_wizardLoading, setWizardLoading] = useState(false);
  const [_wizardSaving, setWizardSaving] = useState(false);

  const { data: eimsReadiness } = useEimsReadiness();
  const { data: securityReadiness } = useSecurityReadiness();
  useSetupComplianceSync(companyId ?? undefined, {
    eimsReady: eimsReadiness?.ready === true,
    securityScore: securityReadiness?.summary?.readinessScore,
    onSynced: (progress) => setWizardProgress(progress),
  });

  useEffect(() => {
    if (!companyId) return;
    setWizardLoading(true);
    setupApi.listSteps()
      .then((steps) => setWizardSteps(steps))
      .catch(() => {})
      .finally(() => setWizardLoading(false));
    setupApi.getProgress(companyId)
      .then((progress) => setWizardProgress(progress))
      .catch(() => {});
  }, [companyId]);

  const wizardChecked = useMemo(() => {
    const set = new Set<string>();
    if (wizardProgress) {
      for (const s of wizardProgress.steps) {
        if (s.status === 'completed') set.add(s.stepKey);
      }
    }
    return set;
  }, [wizardProgress]);

  const wizardPct = wizardProgress?.overallProgress ?? 0;

  const handleWizardToggle = async (stepKey: string) => {
    if (!companyId || !wizardProgress) return;
    const step = wizardProgress.steps.find((s) => s.stepKey === stepKey);
    if (!step) return;
    setWizardSaving(true);
    try {
      if (step.status === 'completed') {
        const updated = await setupApi.startWizard(companyId);
        setWizardProgress(updated.progress);
      } else if (step.status === 'pending') {
        const updated = await setupApi.completeStep(companyId, stepKey, {});
        setWizardProgress(updated);
        toast.success(t('gs.toasts.step_completed'));
      }
    } catch (e: any) {
      toast.error(e?.message ?? t('gs.toasts.failed_update_step'));
    } finally {
      setWizardSaving(false);
    }
  };

  const handleWizardReset = async () => {
    if (!companyId) return;
    setWizardSaving(true);
    try {
      const result = await setupApi.resetProgress(companyId);
      setWizardProgress(result.progress);
      toast.success(t('gs.toasts.wizard_reset'));
    } catch (e: any) {
      toast.error(e?.message ?? t('gs.toasts.failed_reset'));
    } finally {
      setWizardSaving(false);
    }
  };

  const pct = wizardSteps.length > 0 ? wizardPct : localPct;
  const checked = wizardSteps.length > 0 ? wizardChecked : localChecked;
  const reset = wizardSteps.length > 0 ? handleWizardReset : localReset;
  const toggle = wizardSteps.length > 0 ? handleWizardToggle : localToggle;

  const renderWizardSteps = () => {
    const categoryOrder = ['deployment','company','financial','modules','users','system','tax','compliance','localization'];
    const grouped = wizardSteps.reduce<Record<string, SetupStepDefinition[]>>((acc, step) => {
      const cat = step.category || 'system';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(step);
      return acc;
    }, {});
    const sortedCats = Object.keys(grouped).sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    const catMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      deployment:  { label: t('gs.cat_labels.deployment'),  icon: <Cloud size={13} />, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800' },
      company:     { label: t('gs.cat_labels.company'),     icon: <Building2 size={13} />, color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800' },
      financial:   { label: t('gs.cat_labels.financial'),   icon: <Banknote size={13} />, color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800' },
      modules:     { label: t('gs.cat_labels.modules'),     icon: <Package size={13} />, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800' },
      users:       { label: t('gs.cat_labels.users'),       icon: <Users size={13} />, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800' },
      system:      { label: t('gs.cat_labels.system'),      icon: <SlidersHorizontal size={13} />, color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
      tax:         { label: t('gs.cat_labels.tax'),         icon: <Shield size={13} />, color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800' },
      compliance:  { label: t('gs.cat_labels.compliance'),  icon: <CheckCircle2 size={13} />, color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800' },
      localization:{ label: t('gs.cat_labels.localization'),icon: <Globe size={13} />, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800' },
    };
    return sortedCats.map((cat) => {
      const meta = catMeta[cat] || { label: cat, icon: <Settings size={13} />, color: 'bg-slate-50 text-slate-700 border-slate-200' };
      const catSteps = grouped[cat];
      return (
        <div key={cat} className="space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-wider ${meta.color}`}>
            {meta.icon}
            {meta.label}
            <span className="text-[10px] opacity-70">
              ({catSteps.filter(s => wizardChecked.has(s.key)).length}/{catSteps.length})
            </span>
          </div>
          <div className="ovds-grid-layout cols-2">
            {catSteps.map((step) => {
              const done = wizardChecked.has(step.key);
              const route = STEP_ROUTE_MAP[step.key];
              return (
                <div
                  key={step.key}
                  className={`group relative ovds-widget-card p-6 transition-all duration-200 cursor-pointer select-none ${
                    done
                      ? 'opacity-70 bg-white dark:bg-slate-800/40'
                      : 'hover:border-[var(--pro-azure-light)] dark:hover:border-green-700'
                  }`}
                  onClick={() => toggle(step.key)}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        done
                          ? 'bg-[var(--pro-azure)] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[var(--pro-azure-dark)] group-hover:text-white'
                      }`}
                    >
                      {done ? <CheckCircle2 size={18} /> : (STEP_ICON_MAP[step.key] ?? <Settings size={14} />)}
                    </div>
                    <span
                      className={`mt-1 transition-colors ${done ? 'text-[var(--pro-azure)]' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`}
                    >
                      {done ? <CheckSquare size={14} /> : <Square size={14} />}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-black mb-1.5 transition-colors ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}
                  >
                    {step.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                  {route && (
                    <Link
                      to={route}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
                    >
                      {t('gs.checklist.go')} <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero Header - High fidelity glassmorphism */}
      <div className="relative p-10 lg:p-16 rounded-xl bg-slate-900 overflow-hidden shadow-2xl shadow-green-900/20">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--pro-azure-100)] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--pro-azure-50)] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 rounded-full">
              <Sparkles size={14} className="text-[var(--pro-azure-light)]" />
              <span className="text-[10px] font-black text-[var(--pro-azure-light)] uppercase tracking-widest">
                {t('gs.hero.badge')}
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tighter">
              {t('gs.hero.title_prefix')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--pro-azure-light)] to-[var(--pro-azure-light)]">
                {t('gs.hero.title_brand')}
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed font-medium">
              {user ? t('gs.hero.welcome', { name: user.username }) : ''}
              {t('gs.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="https://ovds.com.et"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[var(--pro-azure)] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:bg-[var(--pro-azure-dark)] transition-all active:scale-95"
              >
                {t('gs.hero.cta_get_started')}
              </a>
              <Link
                to="/getting-started/on-premise"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                {t('gs.hero.cta_self_hosting')}
              </Link>
              <Link
                to="/getting-started/client"
                className="px-8 py-4 bg-amber-500/10 border border-amber-400/20 text-amber-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              >
                {t('gs.hero.cta_enterprise')}
              </Link>
              <Link
                to="/getting-started/invoice-module"
                className="px-8 py-4 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 text-green-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[var(--pro-azure-dark)]/20 transition-all"
              >
                {t('gs.hero.cta_invoice_module')}
              </Link>
            </div>
          </div>

          <div className="hidden lg:block w-72 h-72 relative">
            <div className="absolute inset-0 bg-[var(--pro-azure-50)]0/10 rounded-xl rotate-6 scale-95" />
            <div className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center -rotate-3 transition-transform hover:rotate-0 duration-500">
              <Rocket size={48} className="text-[var(--pro-azure-light)] mb-6" />
              <div className="h-2 w-32 bg-slate-700 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-500"
                  style={{ width: `${wizardSteps.length > 0 ? wizardPct : 65}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {t('gs.hero.activation_progress')}
              </p>
              <p className="text-2xl font-black text-white mt-1">{wizardSteps.length > 0 ? wizardPct : 65}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          {
            id: 'checklist',
            label: t('gs.tabs.checklist'),
            icon: <CheckCircle2 size={14} />,
          },
          {
            id: 'pit',
            label: t('gs.tabs.pit'),
            icon: <Calculator size={14} />,
          },
          { id: 'tax', label: t('gs.tabs.tax'), icon: <Shield size={14} /> },
          {
            id: 'guide',
            label: t('gs.tabs.guide'),
            icon: <Landmark size={14} />,
          },
          { id: 'shortcuts', label: t('gs.tabs.shortcuts'), icon: <Keyboard size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[var(--pro-azure)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {activeTab === 'checklist' && (
            <div className="space-y-5">
              {/* Progress bar */}
              <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {t('gs.checklist.setup_progress')}
                    </p>
                    <p className="text-xs font-black text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                      {pct}%
                    </p>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="ovds-caption mt-1.5">
                    {wizardSteps.length > 0
                      ? t('gs.checklist.steps_complete', { done: wizardChecked.size, total: wizardSteps.length })
                      : t('gs.checklist.steps_complete', { done: checklistIds.filter((id) => checked.has(id)).length, total: checklistIds.length })}
                  </p>
                </div>
                {pct > 0 && (
                  <button
                    onClick={reset}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    title={t('gs.checklist.reset')}
                  >
                    {t('gs.checklist.reset')}
                  </button>
                )}
               </div>

{wizardSteps.length > 0 ? renderWizardSteps() : (
         <div className="ovds-grid-layout cols-2">
                    {CHECKLIST.map((item) => {
                        const done = checked.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`group relative ovds-widget-card p-6 transition-all duration-200 cursor-pointer select-none ${
                              done
                                ? 'opacity-70 bg-white dark:bg-slate-800/40'
                                : 'hover:border-[var(--pro-azure-light)] dark:hover:border-green-700'
                            }`}
                            onClick={() => toggle(item.id)}
                          >
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                done
                                  ? 'bg-[var(--pro-azure)] text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[var(--pro-azure-dark)] group-hover:text-white'
                              }`}
                            >
                              {done ? <CheckCircle2 size={18} /> : item.icon}
                            </div>
                            <span
                              className={`mt-1 transition-colors ${done ? 'text-[var(--pro-azure)]' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`}
                            >
                              {done ? (
                                <CheckSquare size={14} />
                              ) : (
                                <Square size={14} />
                              )}
                            </span>
                          </div>
                          <h3
                            className={`text-sm font-black mb-1.5 transition-colors ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}
                          >
                            {item.label}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {item.desc}
                          </p>
                          <Link
                            to={item.to}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
                          >
                            {t('gs.checklist.go')} <ArrowRight size={10} />
                          </Link>
                        </div>
                      );
                     })}
                    </div>
                  )
               }

              {wizardSteps.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {t('gs.checklist.steps_complete', { done: wizardChecked.size, total: wizardSteps.length })}
                  </p>
                  <Link
                    to="/settings/setup-wizard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-black hover:bg-[var(--pro-azure-dark)] transition-all"
                  >
                    <Settings size={12} /> {t('gs.checklist.admin_setup_wizard')}
                  </Link>
                </div>
              )}

              {wizardSteps.length > 0 && wizardProgress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="ovds-widget-card p-5">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{t('gs.checklist.scope_summary')}</p>
                    <div className="space-y-2">
                      {Object.entries(wizardProgress.scopeSummary ?? {}).map(([scope, steps]) => (
                        <div key={scope} className="flex items-center justify-between text-[12px]">
                          <span className="text-slate-600 dark:text-slate-300 capitalize">{scope}</span>
                          <span className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{steps.length} step{steps.length === 1 ? '' : 's'}</span>
                        </div>
                      ))}
                      {!wizardProgress.scopeSummary || Object.keys(wizardProgress.scopeSummary).length === 0 && (
                        <p className="text-[11px] text-slate-400">{t('gs.checklist.no_scopes')}</p>
                      )}
                    </div>
                  </div>
                  <div className="ovds-widget-card p-5">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{t('gs.checklist.module_activities')}</p>
                    <div className="space-y-2">
                      {(wizardProgress.moduleActivities ?? []).slice(-5).reverse().map((activity, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <span className="text-slate-600 dark:text-slate-300 capitalize">{activity.moduleId}</span>
                          <span className="text-[10px] text-slate-400">{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                      {(!wizardProgress.moduleActivities || wizardProgress.moduleActivities.length === 0) && (
                        <p className="text-[11px] text-slate-400">{t('gs.checklist.no_activities')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pct === 100 && (
                <div className="flex items-center gap-3 p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl animate-in fade-in duration-300">
                  <Sparkles size={18} className="text-[var(--pro-azure)] shrink-0" />
                  <div>
                    <p className="text-sm font-black text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
                      {t('gs.checklist.all_set_title')}
                    </p>
                    <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure)] mt-0.5">
                      {t('gs.checklist.all_set_body')}
                    </p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-black hover:bg-[var(--pro-azure-dark)] transition-all shrink-0"
                  >
                    {t('gs.checklist.dashboard')} <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pit' && (
            <div className="ovds-widget-card p-10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pro-azure-50)]0/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] flex items-center justify-center">
                  <Calculator size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('gs.pit.heading')}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    {t('gs.pit.subheading')}
                  </p>
                </div>
              </div>
              <PITCalculator />
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                  {TAX_QUICK_REF.map((tax, i) => (
                    <div
                      key={i}
                      className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{tax.label}</span>
                        <span className="px-3 py-1 bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] text-xs font-black rounded-lg">
                          {tax.rate}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {tax.basis}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-500">
                        <Clock size={12} /> Deadline: {tax.deadline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="ovds-grid-layout cols-2">
              {KEYBOARD_SHORTCUTS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-[var(--pro-azure)] transition-all"
                >
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {s.action}
                  </span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black shadow-sm group-hover:bg-[var(--pro-azure-dark)] group-hover:text-white group-hover:border-[var(--pro-azure)] transition-all"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="ovds-widget-card p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-50)]0/10 text-[var(--pro-azure)] flex items-center justify-center">
                  <Landmark size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('gs.guide.heading')}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    {t('gs.guide.subheading')}
                  </p>
                </div>
              </div>
              <EthiopianTaxGuide />
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-5">
          {/* Always-visible deadline calendar */}
          <TaxDeadlineCalendar />

          {/* Tab-contextual panels */}
          {activeTab === 'checklist' && (
            <>
              <SidebarApiKey />
              <SidebarComplianceHub />
            </>
          )}
          {activeTab === 'shortcuts' && (
            <>
              <SidebarShortcutHint />
              <SidebarComplianceHub />
            </>
          )}
          {activeTab === 'pit' && (
            <>
              <SidebarPitTips />
              <SidebarComplianceHub />
            </>
          )}
          {activeTab === 'tax' && (
            <>
              <SidebarTaxLinks />
              <SidebarComplianceHub />
            </>
          )}
          {activeTab === 'guide' && (
            <>
              <SidebarTaxLinks />
              <SidebarComplianceHub />
            </>
          )}
        </div>
      </div>

      {/* -- FAQ -- */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <HelpCircle size={18} className="text-[var(--pro-azure)]" />
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {t('gs.faq.heading')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('gs.faq.subheading')}
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqItems.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
};

const faqItems = [
  {
    q: 'Accrual vs Cash — which does Ovds use?',
    a: 'Ovds uses accrual-basis accounting by default, as required by IFRS (IAS 1.27). Revenue is recognised when earned (invoice date), not when cash is received. Expenses are recognised when incurred (bill date). This gives a more accurate picture of financial position. Cash-basis reporting is available as a filter in the Reports module for management purposes, but statutory filings must use accrual basis.',
  },
  {
    q: 'How do I add shipping costs to an invoice?',
    a: 'Add shipping as a line item on your invoice. Go to Invoices → New Invoice → Add Item, then type "Shipping" as the item name and enter the amount. You can also create a reusable "Shipping" service item in Items → New Item (set type to SERVICE) so it appears in your item dropdown on every invoice. For VAT purposes, shipping is typically taxable at the standard 15% rate unless the goods are exempt.',
  },
  {
    q: "I can't install apps from the App Store",
    a: 'App installation requires an active Ovds subscription and the ADMIN or SPURADMIN role. Check: (1) Your plan — free tier has limited app slots. (2) Your role — go to Settings → Users and confirm you have ADMIN access. (3) Your API key — go to Settings → API Keys and verify your key is active. (4) Network — some apps require outbound internet access. If issues persist, check the System Health panel at /developers.',
  },
  {
    q: 'On-Premise vs Cloud — which should I choose?',
    a: 'Cloud is recommended for most businesses — zero maintenance, automatic updates, 99.9% uptime SLA, and built-in backups. On-Premise is ideal if you have strict data sovereignty requirements, operate in a low-connectivity environment, or need air-gapped deployment. On-Premise requires a Linux server (Ubuntu 22.04+ recommended), Docker, and a MySQL/MariaDB database. You manage updates manually. Both options support all Ovds features including MoR Integration. Cloud-Based and SaaS-Based deployment suits Banking & ovds, Retail & E-commerce, and IT & Software. On-Premise and Hybrid Deployment suit Healthcare & Pharmaceuticals, Manufacturing & Logistics, and enterprises with Competitive Landscape data control requirements.',
  },
  {
    q: 'How do I migrate from another accounting system?',
     a: 'Use the Import Center (/import-center) to migrate your data. Start with Chart of Accounts, then Customers, Vendors, and Items. Import opening balances via Journal Entries (use category OPENING_BALANCE). For historical transactions, use the Transactions import. The System Administration Setup Wizard also includes a guided migration step. Ovds supports CSV import from QuickBooks, Sage, and Xero exports.',
  },
  {
    q: 'How does ERCA e-invoice work?',
    a: 'Every invoice created in Ovds automatically includes an ERCA-compliant QR code generated from the NBE-IQR format. The QR encodes your TIN, invoice number, amount, and VAT. When you send an invoice, the QR is embedded in the PDF. For VAT-registered businesses, invoices are also submitted to the MoR e-Tax Portal via the API integration in Settings → Taxes → MoR Integration.',
  },
  {
    q: 'Am I Category A or Category B? How do I know?',
    a: 'Your category is based on your annual gross revenue. If your annual turnover is ETB 2,000,000 or more, you are Category A — you must maintain full IFRS-aligned books and register for VAT. If your turnover is below ETB 2,000,000, you are Category B — you use simplified bookkeeping and pay Turnover Tax (TOT) instead of VAT. When you create your company in Ovds, the system will prompt you to select your category, which automatically configures the correct tax rates and filing workflows.',
  },
  {
    q: 'What is the DRRF and does it apply to my business?',
    a: 'The Disaster Risk Reduction Fund (DRRF) is a mandatory levy under Regulation No. 570/2025. It applies to specific sectors including banking (1% of loans), telecom (5% of airtime/digital revenue), insurance (1% of premiums), airlines (ETB 100 per domestic ticket), fuel (ETB 200 per issuance), and government bodies. If your business operates in one of these 14+ categories, you must collect and remit the levy quarterly by the 15th. Ovds calculates and tracks DRRF automatically under Tax & Compliance → Disaster Fund.',
  },
  {
    q: 'How does Withholding Tax (WHT) work in Ovds?',
    a: 'When you pay a vendor for services of ETB 10,000 or more, or goods of ETB 20,000 or more, you are legally required to withhold 3% of the gross payment under Proclamation No. 1395/2025. Ovds applies WHT automatically when you mark a bill as paid — it debits Accounts Payable (gross), credits Cash (net), and credits WHT Payable (3%). You then remit to MoR via Tax & Compliance → VAT Administration → Withholding tab. Ovds generates WHT certificates you can provide to vendors.',
  },
  {
    q: 'What is the Minimum Alternative Tax (MAT)?',
    a: 'The MAT is 2.5% of your annual gross turnover, introduced by Proclamation No. 1395/2025. It acts as a floor for Business Income Tax (BIT). If your calculated BIT (30% of net profit) is lower than 2.5% of turnover, you pay the MAT instead. This prevents businesses from over-deducting to reduce their BIT to near-zero. Ovds computes both figures automatically in the Business Income Tax module and shows you which applies.',
  },
  {
    q: 'How do I handle multi-currency invoices?',
    a: "Ovds supports multi-currency billing via the FX Rates module (/fx-rates). Set your company's functional currency (usually ETB), then add foreign currencies (USD, EUR, etc.) under Settings → Currencies. When creating an invoice, select the billing currency — Ovds applies the current exchange rate and records the ETB equivalent in your general ledger. FX gains and losses on settlement are automatically posted per IAS 21. Live NBE rates are pulled daily if the NBE_RATES_API_URL is configured.",
  },
  {
    q: 'How does payroll pension calculation work?',
    a: 'Ethiopian pension is 7% from the employee and 11% from the employer, applied to basic salary with a cap at ETB 15,000 insurable earnings (meaning pension is calculated on the lower of actual basic salary or ETB 15,000). Ovds handles this automatically during payroll generation. The GL entry posts: Dr Salary Expense (gross + employer pension), Cr Salary Payable (net), Cr PIT Payable, Cr Pension Payable. Payslips show the employee deduction clearly.',
  },
];

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ovds-widget-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="ovds-card-title">{q}</span>
        {open ? (
          <ChevronUp size={16} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 ovds-body leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

export default GettingStarted;

