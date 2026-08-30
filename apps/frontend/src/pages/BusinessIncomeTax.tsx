import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AppPage, Btn } from '@ovds/ui';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuditLog } from '../hooks/useAuditLog';
import IASBUpdateBanner from '../components/iasbUpdateBanner';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Briefcase,
  Calculator, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Download, ExternalLink, FileText, Globe, Info, Lightbulb,
  Printer, Send, ShieldCheck, TrendingDown, TrendingUp,
} from 'lucide-react';

// -- Constants — Proclamation No. 1395/2025 -----------------------------------
const INDIVIDUAL_BRACKETS = [
  { from: 0,     to: 2000,      rate: 0,    deduction: 0    },
  { from: 2001,  to: 4000,      rate: 0.15, deduction: 300  },
  { from: 4001,  to: 7000,      rate: 0.20, deduction: 500  },
  { from: 7001,  to: 10000,     rate: 0.25, deduction: 850  },
  { from: 10001, to: 14000,     rate: 0.30, deduction: 1350 },
  { from: 14001, to: Infinity,  rate: 0.35, deduction: 2050 },
];
const MAT_RATE      = 0.025;
const CORP_RATE     = 0.30;
const CURRENT_YEAR  = new Date().getFullYear();
const FISCAL_YEAR   = `${CURRENT_YEAR - 1}/${CURRENT_YEAR}`;
const FILING_DEADLINE = `November 7, ${CURRENT_YEAR}`;

const DEDUCTIBLE_EXPENSES = [
  { id: 'salaries',     label: 'Salaries & Wages',          hint: 'All employee compensation including benefits' },
  { id: 'rent',         label: 'Rent & Utilities',           hint: 'Business premises rent, electricity, water, internet' },
  { id: 'depreciation', label: 'Depreciation',               hint: 'Straight-line or declining balance per ERCA schedule' },
  { id: 'interest',     label: 'Interest on Business Loans', hint: 'Interest paid on loans used for business purposes' },
  { id: 'insurance',    label: 'Insurance Premiums',         hint: 'Business insurance, not personal' },
  { id: 'advertising',  label: 'Advertising & Marketing',    hint: 'Promotional expenses directly related to business' },
  { id: 'professional', label: 'Professional Fees',          hint: 'Audit, legal, accounting fees' },
  { id: 'repairs',      label: 'Repairs & Maintenance',      hint: 'Routine maintenance of business assets' },
  { id: 'other',        label: 'Other Allowable Expenses',   hint: 'Other expenses per ERCA guidelines' },
];

// -- Types ---------------------------------------------------------------------
type TaxpayerType = 'corporate' | 'individual';
type ActiveTab = 'calculator' | 'brackets' | 'calendar' | 'penalties' | 'ifrs';

interface ExpenseRow { id: string; label: string; amount: string; }

// -- Helpers -------------------------------------------------------------------
const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : fmt(n);

const calcIndividualTax = (income: number): number => {
  if (income <= 0) return 0;
  const b = INDIVIDUAL_BRACKETS.slice().reverse().find(b => income > b.from);
  return b ? Math.max(0, income * b.rate - b.deduction) : 0;
};

// -- KPI Card ------------------------------------------------------------------
const KpiCard: React.FC<{
  label: string; value: string; sub?: string;
  color: string; bg: string; border: string; icon: React.ReactNode;
  highlight?: boolean;
}> = ({ label, value, sub, color, bg, border, icon, highlight }) => (
  <div className={`${bg} border ${border} rounded-xl p-4 ${highlight ? 'ring-2 ring-amber-400/40' : ''}`}>
    <div className={`flex items-center gap-1.5 ${color} mb-2`}>
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
    </div>
    <p className={`text-xl font-semibold ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
  </div>
);

// -- Section Card wrapper ------------------------------------------------------
const SectionCard: React.FC<{
  icon: React.ReactNode; iconColor: string; title: string; badge?: React.ReactNode;
  collapsible?: boolean; open?: boolean; onToggle?: () => void; children: React.ReactNode;
  noPad?: boolean;
}> = ({ icon, iconColor, title, badge, collapsible, open = true, onToggle, children, noPad }) => (
  <div className="ovds-widget-card overflow-hidden">
    <div
      className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 ${collapsible ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors' : ''}`}
      onClick={collapsible ? onToggle : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={iconColor}>{icon}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</span>
        {badge}
      </div>
      {collapsible && (open
        ? <ChevronUp size={15} className="text-slate-400 shrink-0" />
        : <ChevronDown size={15} className="text-slate-400 shrink-0" />)}
    </div>
    {open && (
      <div className={noPad ? '' : 'p-5'}>
        {children}
      </div>
    )}
  </div>
);

// -- VAT ↔ BIT Cross-Check ----------------------------------------------------
const VatBitBridge: React.FC<{ grossIncome: number }> = ({ grossIncome }) => {
  const [vatSummary, setVatSummary] = useState<any>(null);
  useEffect(() => {
    api.get('/vat/summary')
      .then((r: any) => setVatSummary(r.data?.data ?? r.data))
      .catch(() => {});
  }, []);

  const vatRevenue   = Number(vatSummary?.totalSales ?? 0);
  const vatInput     = Number(vatSummary?.inputVat ?? 0);
  const match = grossIncome > 0 && vatRevenue > 0
    ? Math.min(100, Math.round((Math.min(grossIncome, vatRevenue) / Math.max(grossIncome, vatRevenue)) * 100))
    : null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/20 dark:to-emerald-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">VAT ↔ BIT Cross-Check</p>
        <span className="text-[10px] text-slate-400 ml-1">Revenue consistency</span>
      </div>
      <div className="ovds-grid-layout cols-3">
        {[
          { label: 'VAT Sales (ledger)',    value: vatRevenue,   color: 'text-emerald-700 dark:text-emerald-400'    },
          { label: 'BIT Gross Income',      value: grossIncome,  color: 'text-amber-700 dark:text-amber-400'  },
          { label: 'Claimable Input VAT',   value: vatInput,     color: 'text-emerald-700 dark:text-emerald-400' },
        ].map(r => (
          <div key={r.label} className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{r.label}</div>
            <div className={`text-sm font-semibold ${r.color}`}>
              {r.value > 0 ? `ETB ${fmtK(r.value)}` : '—'}
            </div>
          </div>
        ))}
      </div>
      {match !== null && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
          match >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
          : match >= 70 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
        }`}>
          {match >= 90 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          <span>Consistency: <strong>{match}%</strong> — {match >= 90
            ? 'VAT and BIT figures are consistent.'
            : 'Discrepancy detected — verify gross income matches VAT sales records.'}</span>
        </div>
      )}
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        ERCA cross-references VAT returns with BIT declarations. Consistent figures reduce audit risk.
      </p>
    </div>
  );
};

// -- Tax Optimization Tips -----------------------------------------------------
const TaxOptimizationTips: React.FC<{ taxpayerType: TaxpayerType; taxableIncome: number }> = ({ taxpayerType, taxableIncome }) => {
  const tips = [
    { title: 'Maximize Allowable Deductions', desc: 'Document all business expenses — rent, salaries, depreciation, professional fees — and claim them fully.', applicable: true },
    { title: 'Claim Input VAT Credits', desc: 'Input VAT paid on business purchases is deductible as a business expense, reducing taxable income.', applicable: true },
    { title: 'Provisional Tax Planning', desc: 'Pay quarterly installments to avoid a lump-sum payment and 2%/month late-payment interest.', applicable: taxableIncome > 0 },
    { title: 'ERCA Depreciation Rates', desc: 'Use approved rates: buildings 5%, machinery 20%, vehicles 20%. Maximise depreciation to reduce taxable income.', applicable: true },
    { title: 'Voluntary Disclosure', desc: 'Disclose under-declared income before an ERCA audit notification to receive a 50% penalty reduction.', applicable: true },
    { title: 'Audit-Ready Records', desc: 'Maintain books for 10 years. ERCA can audit up to 5 years back. Digital records are accepted.', applicable: true },
    ...(taxpayerType === 'individual'
      ? [{ title: 'Bracket Timing', desc: 'Near a bracket boundary? Timing income and expenses across fiscal years can lower your effective rate.', applicable: taxableIncome > 600 }]
      : [{ title: 'Loss Carry-Forward', desc: 'Corporate losses can be carried forward up to 3 years to offset future taxable income.', applicable: true }]),
  ].filter(t => t.applicable);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900">
          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">{i + 1}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">{tip.title}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{tip.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// -- Tax Calendar --------------------------------------------------------------
const TaxCalendarTab: React.FC = () => {
  const now  = new Date();
  const year = now.getFullYear();
  const deadlines = [
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `VAT Return — ${new Date(year, i).toLocaleString('en-US', { month: 'short' })}`,
      date: new Date(year, i + 1, 30), type: 'VAT',
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `TOT Return — ${new Date(year, i).toLocaleString('en-US', { month: 'short' })} (Cat. B)`,
      date: new Date(year, i + 1, 30), type: 'TOT',
    })),
    ...[2, 5, 8, 11].map(m => ({
      label: `DRRF Levy — Q${Math.floor(m / 3) + 1}`,
      date: new Date(year, m + 1, 10), type: 'DRRF',
    })),
    { label: `BIT Annual Declaration — FY ${year - 1}/${year}`, date: new Date(year, 10, 7), type: 'BIT' },
    { label: 'VAT Annual Reconciliation', date: new Date(year, 2, 31), type: 'VAT' },
    { label: 'WHT Monthly Remittance', date: new Date(year, now.getMonth() + 1, 30), type: 'WHT' },
  ]
    .filter(d => d.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 12);

  const daysLeft = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86_400_000);

  const typeCls: Record<string, string> = {
    VAT:  'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    BIT:  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    DRRF: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
    WHT:  'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
    TOT:  'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  };
  const dotCls: Record<string, string> = {
    VAT: 'bg-emerald-500', BIT: 'bg-amber-500', DRRF: 'bg-amber-500', WHT: 'bg-teal-500', TOT: 'bg-sky-500',
  };

  return (
    <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
      {deadlines.map((d, i) => {
        const days   = daysLeft(d.date);
        const urgent = days <= 7;
        const soon   = days <= 30;
        return (
          <div key={i} className={`flex items-center gap-3 px-5 py-3 ${urgent ? 'bg-rose-50 dark:bg-rose-950/20' : soon ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${dotCls[d.type] ?? 'bg-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{d.label}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {d.date.toLocaleDateString('en-ET', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              urgent ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
              : soon  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${typeCls[d.type] ?? ''}`}>
              {d.type}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// -- Penalty Calculator --------------------------------------------------------
const PenaltyTab: React.FC = () => {
  const [taxType, setTaxType]     = useState<'VAT' | 'BIT' | 'WHT'>('BIT');
  const [taxDue, setTaxDue]       = useState('');
  const [daysLate, setDaysLate]   = useState('');
  const [monthsLate, setMonthsLate] = useState('');

  const taxDueNum    = parseFloat(taxDue)    || 0;
  const daysLateNum  = parseInt(daysLate)    || 0;
  const monthsLateNum = parseInt(monthsLate) || 0;

  const calc = useMemo(() => {
    if (!taxDueNum) return null;
    const filingPenalty  = taxType !== 'WHT' ? Math.min(500 * daysLateNum, 50_000) : 0;
    const paymentPenalty = taxType === 'WHT'
      ? taxDueNum * 0.05 * monthsLateNum
      : taxDueNum * ((1 + 0.02) ** monthsLateNum - 1);
    const notes = taxType === 'WHT'
      ? ['5% per month on unremitted WHT', 'Immediate remittance recommended']
      : ['ETB 500/day late filing, max ETB 50,000', '2%/month compounded on unpaid tax',
         ...(taxType === 'BIT' ? ['Voluntary disclosure: 50% penalty reduction'] : [])];
    return { filingPenalty, paymentPenalty, total: filingPenalty + paymentPenalty, notes };
  }, [taxType, taxDueNum, daysLateNum, monthsLateNum]);

  const inp = 'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700 dark:text-slate-200';

  return (
    <div className="space-y-4">
      {/* Tax type selector */}
      <div className="grid grid-cols-3 gap-2">
        {(['VAT', 'BIT', 'WHT'] as const).map(t => (
          <button key={t} onClick={() => setTaxType(t)}
            className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
              taxType === t
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}>
            {t}
          </button>
        ))}
      </div>
      {/* Inputs */}
      <div className="ovds-grid-layout cols-3">
        {[
          { label: 'Tax Due (ETB)', value: taxDue, onChange: setTaxDue, placeholder: '0.00', type: 'number', step: '0.01' },
          { label: 'Days Late (filing)', value: daysLate, onChange: setDaysLate, placeholder: '0', type: 'number', step: '1' },
          { label: 'Months Late (payment)', value: monthsLate, onChange: setMonthsLate, placeholder: '0', type: 'number', step: '1' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide block mb-1">{f.label}</label>
            <input type={f.type} min="0" step={f.step} value={f.value}
              onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} className={inp} />
          </div>
        ))}
      </div>
      {/* Results */}
      {calc && taxDueNum > 0 && (
        <div className="space-y-3">
          <div className="ovds-grid-layout cols-3 gap-sm">
            {[
              { label: 'Filing Penalty',  value: calc.filingPenalty,  color: 'text-rose-700 dark:text-rose-300'   },
              { label: 'Payment Penalty', value: calc.paymentPenalty, color: 'text-orange-700 dark:text-orange-300' },
              { label: 'Total Penalty',   value: calc.total,          color: 'text-rose-800 dark:text-rose-300'     },
            ].map(r => (
              <div key={r.label} className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-rose-100 dark:border-rose-900">
                <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wide mb-1">{r.label}</p>
                <p className={`text-base font-semibold ${r.color}`}>ETB {fmt(r.value)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {calc.notes.map((n, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-rose-600 dark:text-rose-400">
                <div className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                {n}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -- IFRS / IAS 12 Tab ---------------------------------------------------------
const IfrsTab: React.FC<{ taxableIncome: number }> = ({ taxableIncome }) => {
  const currentTax = taxableIncome * CORP_RATE;
  return (
    <div className="space-y-5">
      <div className="ovds-grid-layout cols-2">
        {/* Current tax journal */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current Tax (IAS 12.46)</p>
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">DR Income Tax Expense</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {taxableIncome > 0 ? `ETB ${fmt(currentTax)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 pl-4">CR Current Tax Payable</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {taxableIncome > 0 ? `ETB ${fmt(currentTax)}` : '—'}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 text-[10px] text-slate-400">
              30% × taxable income — recognised in P&amp;L
            </div>
          </div>
        </div>
        {/* Deferred tax */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Deferred Tax (IAS 12.15)</p>
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 space-y-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Temporary differences between accounting profit and taxable profit create deferred tax assets or liabilities.
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Accelerated depreciation',       type: 'DTL', note: 'Tax deduction > accounting charge' },
                { label: 'Provisions not yet deductible',  type: 'DTA', note: 'Recognised in accounts, not yet tax-deductible' },
                { label: 'Unused tax losses',              type: 'DTA', note: 'Carry-forward up to 3 years (corporate)' },
              ].map(({ label, type, note }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    type === 'DTA'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  }`}>{type}</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{label}</p>
                    <p className="ovds-caption">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* IAS 12 disclosures */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Required IAS 12 Disclosures in Notes</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { ref: 'IAS 12.79',  label: 'Tax expense reconciliation',      note: 'Accounting profit × 30% vs actual tax expense' },
            { ref: 'IAS 12.81',  label: 'Deferred tax assets & liabilities', note: 'Nature and amount of temporary differences' },
            { ref: 'IAS 12.81e', label: 'Unrecognised deferred tax assets', note: 'Unused losses, expiry dates, reasons' },
          ].map(({ ref, label, note }) => (
            <div key={ref} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{ref}</span>
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 mt-1">{label}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -- Main Component ------------------------------------------------------------
const BusinessIncomeTax: React.FC = () => {
  usePageTitle('Business Income Tax');
  const { logExport, log } = useAuditLog();
  const { can } = useAuth();
  const canViewBIT     = can('bit:read');
  const canViewovds = can('ovds:read');

  // -- State ------------------------------------------------------------------
  const [taxpayerType, setTaxpayerType] = useState<TaxpayerType>('corporate');
  const [grossIncome,  setGrossIncome]  = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>(
    DEDUCTIBLE_EXPENSES.map(e => ({ id: e.id, label: e.label, amount: '' }))
  );
  const [whtCredits,      setWhtCredits]      = useState('');
  const [provisionalPaid, setProvisionalPaid] = useState('');
  const [filingYear,      setFilingYear]      = useState(String(CURRENT_YEAR - 1));
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('calculator');
  const [showChecklist,   setShowChecklist]   = useState(true);
  const [showProvisional, setShowProvisional] = useState(false);
  const [showMultiYear,   setShowMultiYear]   = useState(false);
  const [showTips,        setShowTips]        = useState(false);
  const [apiLoading,      setApiLoading]      = useState(false);
  const [priorYearsData,  setPriorYearsData]  = useState<Array<{ year: number; grossIncome: number; taxableIncome: number; taxDue: number }>>([
    { year: CURRENT_YEAR - 2, grossIncome: 0, taxableIncome: 0, taxDue: 0 },
    { year: CURRENT_YEAR - 3, grossIncome: 0, taxableIncome: 0, taxDue: 0 },
  ]);

  // -- Load real data from accounting API ------------------------------------
  useEffect(() => {
    const loadAccountingData = async () => {
      setApiLoading(true);
      try {
        // Load income tax calculation from backend (uses real P&L data)
        const [bitRes, whtRes] = await Promise.all([
          api.get(`/tax/income-tax/${filingYear}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
          api.get(`/ovds/wht/summary`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
        ]);

        const bit = bitRes.data?.data ?? bitRes.data;
        const wht = whtRes.data?.data ?? whtRes.data;

        if (bit) {
          // Auto-populate gross income from real accounting data
          if (bit.annualRevenue > 0 && !grossIncome) {
            setGrossIncome(String(bit.annualRevenue));
          }
          // Auto-populate WHT credits from WHT summary
          if (wht?.totalWht > 0 && !whtCredits) {
            setWhtCredits(String(wht.totalWht));
          }
        }

        // Load prior years data
        const priorResults = await Promise.all(
          [CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y =>
            api.get(`/tax/income-tax/${y}`, { headers: { 'x-background': '1' } } as any)
              .then((r: any) => {
                const d = r.data?.data ?? r.data;
                return { year: y, grossIncome: d?.annualRevenue ?? 0, taxableIncome: d?.netProfit ?? 0, taxDue: d?.taxPayable ?? 0 };
              })
              .catch(() => ({ year: y, grossIncome: 0, taxableIncome: 0, taxDue: 0 }))
          )
        );
        setPriorYearsData(priorResults);
      } catch {
        // Silently fail — user can enter manually
      } finally {
        setApiLoading(false);
      }
    };
    loadAccountingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filingYear]);

  // -- Derived values ---------------------------------------------------------
  const grossIncomeNum    = parseFloat(grossIncome) || 0;
  const totalExpenses     = useMemo(() => expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [expenses]);
  const taxableIncome     = Math.max(0, grossIncomeNum - totalExpenses);
  const corporateTax      = taxableIncome * CORP_RATE;
  const individualTax     = calcIndividualTax(taxableIncome);
  const grossTaxDue       = taxpayerType === 'corporate' ? corporateTax : individualTax;
  const matAmount         = grossIncomeNum * MAT_RATE;
  const matApplies        = matAmount > grossTaxDue && grossIncomeNum > 0;
  const effectiveTax      = matApplies ? matAmount : grossTaxDue;
  const whtCreditsNum     = parseFloat(whtCredits)      || 0;
  const provisionalPaidNum = parseFloat(provisionalPaid) || 0;
  const taxDue            = Math.max(0, effectiveTax - whtCreditsNum - provisionalPaidNum);
  const effectiveRate     = grossIncomeNum > 0 ? (effectiveTax / grossIncomeNum) * 100 : 0;
  const quarterlyProvisional = grossTaxDue / 4;

  // -- Keyboard shortcuts -----------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === 'p' || e.key === 'P') && grossIncomeNum > 0) printDeclaration();
      if (e.key === 'r' || e.key === 'R') {
        setGrossIncome('');
        setExpenses(DEDUCTIBLE_EXPENSES.map(ex => ({ id: ex.id, label: ex.label, amount: '' })));
        setWhtCredits(''); setProvisionalPaid('');
        toast.success('Calculator reset');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grossIncomeNum]);

  const updateExpense = useCallback((id: string, amount: string) =>
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount } : e)), []);

  // -- Submit -----------------------------------------------------------------
  const handleSubmit = async () => {
    if (!grossIncome || taxableIncome <= 0) {
      toast.error('Enter gross income to calculate tax');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/tax/filing', {
        type: 'INCOME_TAX',  // Backend expects INCOME_TAX (not BIT)
        period: filingYear,  // Backend uses period as year string for INCOME_TAX
        amount: taxDue,
        grossIncome: grossIncomeNum,
        taxableIncome,
        taxDue,
        matAmount,
        taxpayerType,
        whtCredits: whtCreditsNum,
        provisionalPaid: provisionalPaidNum,
        expenses: expenses
          .filter(e => parseFloat(e.amount) > 0)
          .map(e => ({ id: e.id, label: e.label, amount: parseFloat(e.amount) })),
      });
      setSubmitted(true);
      toast.success('BIT declaration submitted to MoR e-Tax Portal');
      log('BIT_FILED', { year: Number(filingYear), taxDue, taxpayerType }, 'BusinessIncomeTax');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // -- Export eTax JSON -------------------------------------------------------
  const handleExportETax = async () => {
    try {
      const res = await api.get(`/tax/export-etax/${filingYear}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = `etax_BIT_${filingYear}.json`; a.click();
      URL.revokeObjectURL(url);
      logExport('BusinessIncomeTax', 'json' as any);
      toast.success('eTax JSON exported');
    } catch {
      toast.error('eTax export failed');
    }
  };

  // -- Print ------------------------------------------------------------------
  const printDeclaration = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    logExport('BusinessIncomeTax', 'pdf');
    w.document.write(`<!DOCTYPE html><html><head><title>BIT Declaration ${filingYear}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;font-size:11px}
      h1{font-size:16px;font-weight:900;margin-bottom:4px}
      .sub{font-size:10px;color:#64748b;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th{background:#f8fafc;padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
      td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px}
      .total{font-weight:900;background:#f8fafc;border-top:2px solid #e2e8f0}
      .tax-box{background:#fff7ed;border:2px solid #fed7aa;border-radius:8px;padding:16px;margin-top:20px;text-align:center}
    </style></head><body>
    <h1>Business Income Tax Declaration — FY ${filingYear}</h1>
    <p class="sub">Taxpayer: ${taxpayerType === 'corporate' ? 'Corporate (30% flat)' : 'Individual/Sole Proprietor (0–35%)'} · Deadline: ${FILING_DEADLINE}</p>
    <table>
      <thead><tr><th>Description</th><th style="text-align:right">Amount (ETB)</th></tr></thead>
      <tbody>
        <tr><td>Gross Business Income</td><td style="text-align:right;font-weight:900">${fmt(grossIncomeNum)}</td></tr>
        ${expenses.filter(e => parseFloat(e.amount) > 0).map(e =>
          `<tr><td style="padding-left:20px">Less: ${e.label}</td><td style="text-align:right">(${fmt(parseFloat(e.amount))})</td></tr>`
        ).join('')}
        <tr class="total"><td>Total Allowable Deductions</td><td style="text-align:right">(${fmt(totalExpenses)})</td></tr>
        <tr class="total"><td>Taxable Income</td><td style="text-align:right">${fmt(taxableIncome)}</td></tr>
      </tbody>
    </table>
    <div class="tax-box">
      <p style="font-size:10px;color:#92400e;font-weight:900;text-transform:uppercase;margin:0 0 4px">
        Net Tax Due (${taxpayerType === 'corporate' ? '30%' : effectiveRate.toFixed(1) + '% eff.'})
      </p>
      <p style="font-size:28px;font-weight:900;color:#ea580c;margin:0">ETB ${fmt(taxDue)}</p>
    </div>
    <p style="margin-top:20px;font-size:9px;color:#94a3b8">Generated ${new Date().toLocaleString()} · Submit via etax.mor.gov.et</p>
    </body></html>`);
    w.document.close(); w.print();
    w.addEventListener('afterprint', () => w.close());
  };

  // -- Checklist --------------------------------------------------------------
  const CHECKLIST = [
    { id: 'tin',     label: 'TIN registered with ERCA',                                              done: true },
    { id: 'books',   label: 'Books of accounts maintained for the fiscal year',                       done: !!grossIncome },
    { id: 'audit',   label: 'Financial statements audited (required for revenue > ETB 500K)',         done: false },
    { id: 'calc',    label: 'Taxable income calculated (gross income minus allowable deductions)',    done: taxableIncome > 0 },
    { id: 'etax',    label: 'eTax portal account active (etax.mor.gov.et)',                          done: true },
    { id: 'payment', label: 'Tax payment arranged (bank transfer or CBE branch)',                     done: submitted },
    { id: 'filed',   label: 'Annual return filed within 4 months of fiscal year-end',                done: submitted },
  ];
  const checklistDone = CHECKLIST.filter(c => c.done).length;

  // -- TABS definition --------------------------------------------------------
  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'calculator', label: 'Calculator'   },
    { id: 'brackets',   label: 'Tax Brackets' },
    { id: 'calendar',   label: 'Tax Calendar' },
    { id: 'penalties',  label: 'Penalties'    },
    { id: 'ifrs',       label: 'IAS 12 / IFRS'},
  ];

  // -- KPI data ---------------------------------------------------------------
  const kpis = [
    {
      label: 'Gross Income',
      value: grossIncomeNum > 0 ? `ETB ${fmtK(grossIncomeNum)}` : '—',
      sub: `FY ${filingYear}`,
      color: 'text-slate-700 dark:text-slate-200',
      bg: 'bg-white dark:bg-slate-800/60',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <TrendingUp size={15} />,
    },
    {
      label: 'Total Deductions',
      value: totalExpenses > 0 ? `ETB ${fmtK(totalExpenses)}` : '—',
      sub: `${expenses.filter(e => parseFloat(e.amount) > 0).length} categories`,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-100 dark:border-emerald-800',
      icon: <TrendingDown size={15} />,
    },
    {
      label: 'Taxable Income',
      value: taxableIncome > 0 ? `ETB ${fmtK(taxableIncome)}` : '—',
      sub: 'After deductions',
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-100 dark:border-emerald-800',
      icon: <Calculator size={15} />,
    },
    {
      label: matApplies ? 'MAT Applies' : 'Gross Tax',
      value: effectiveTax > 0 ? `ETB ${fmtK(effectiveTax)}` : '—',
      sub: matApplies ? '2.5% of turnover' : taxpayerType === 'corporate' ? '30% flat' : `${effectiveRate.toFixed(1)}% eff.`,
      color: matApplies ? 'text-orange-700 dark:text-orange-400' : 'text-amber-700 dark:text-amber-400',
      bg: matApplies ? 'bg-orange-50 dark:bg-orange-950/30' : 'bg-amber-50 dark:bg-amber-950/30',
      border: matApplies ? 'border-orange-100 dark:border-orange-800' : 'border-amber-100 dark:border-amber-800',
      icon: <ShieldCheck size={15} />,
      highlight: matApplies,
    },
    {
      label: taxDue > 0 ? 'Net Tax Due' : 'Tax Refund',
      value: `ETB ${fmtK(Math.abs(taxDue))}`,
      sub: `Due ${FILING_DEADLINE}`,
      color: taxDue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400',
      bg: taxDue > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
      border: taxDue > 0 ? 'border-rose-100 dark:border-rose-800' : 'border-emerald-100 dark:border-emerald-800',
      icon: taxDue > 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />,
      highlight: taxDue > 0 && grossIncomeNum > 0,
    },
    {
      label: 'Compliance',
      value: `${checklistDone}/${CHECKLIST.length}`,
      sub: checklistDone === CHECKLIST.length ? 'Ready to file' : 'Items pending',
      color: checklistDone === CHECKLIST.length ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
      bg: checklistDone === CHECKLIST.length ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30',
      border: checklistDone === CHECKLIST.length ? 'border-emerald-100 dark:border-emerald-800' : 'border-amber-100 dark:border-amber-800',
      icon: <CheckCircle2 size={15} />,
    },
  ];

  // -- JSX --------------------------------------------------------------------
  return (
    <AppPage
      title="Business Income Tax (BIT)"
      subtitle={`Proclamation No. 1395/2025 · FY ${FISCAL_YEAR} · Filing deadline: ${FILING_DEADLINE} · Banking & ovds · IT & Software · Manufacturing & Logistics · Revenue · Market Forecast · Challenges Analysis`}
      icon={<Briefcase size={16} />}
      iconBg="bg-amber-500"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={printDeclaration} disabled={grossIncomeNum === 0}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
            <Printer size={13} /> Print
          </button>
          <button onClick={handleExportETax} disabled={grossIncomeNum === 0}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors">
            <Download size={13} /> eTax JSON
          </button>
        </div>
      }
    >

      {/* -- KPI Strip -- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* -- Taxpayer Type Selector -- */}
      <div className="ovds-grid-layout cols-2">
        {([
          {
            type: 'corporate' as TaxpayerType,
            title: 'Corporate / Company',
            sub: 'PLC, Share Company, NGO',
            rate: '30%',
            rateLabel: 'Flat Rate on Net Profit',
            activeColor: 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-600',
            rateBg: 'bg-amber-100 dark:bg-amber-900/40',
            rateText: 'text-amber-700 dark:text-amber-300',
            icon: <Briefcase size={16} />,
            iconActive: 'bg-amber-400 dark:bg-amber-600',
          },
          {
            type: 'individual' as TaxpayerType,
            title: 'Individual / Sole Proprietor',
            sub: 'Trader, freelancer, sole owner',
            rate: '0–35%',
            rateLabel: 'Progressive Rate',
            activeColor: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-600',
            rateBg: 'bg-emerald-100 dark:bg-emerald-900/40',
            rateText: 'text-emerald-700 dark:text-emerald-300',
            icon: <FileText size={16} />,
            iconActive: 'bg-emerald-500 dark:bg-emerald-500',
          },
        ] as const).map(opt => {
          const active = taxpayerType === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => setTaxpayerType(opt.type)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                active ? opt.activeColor : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? opt.iconActive : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <span className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>{opt.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{opt.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{opt.sub}</p>
                </div>
                {active && <CheckCircle2 size={16} className={active && opt.type === 'corporate' ? 'text-amber-500' : 'text-emerald-500'} />}
              </div>
              <div className={`${opt.rateBg} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-semibold ${opt.rateText}`}>{opt.rate}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${opt.rateText} opacity-80`}>{opt.rateLabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* -- Tabs -- */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CALCULATOR
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calculator' && (
        <div className="space-y-5">

          {/* Calculator card */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Calculator size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tax Calculator — FY {filingYear}</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fiscal Year</label>
                <select
                  value={filingYear}
                  onChange={e => setFilingYear(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                  {[CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y => (
                    <option key={y} value={y}>{y}/{y + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Gross income */}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Gross Business Income (ETB)
                  {apiLoading && <span className="ml-2 text-[9px] text-emerald-500 animate-pulse">Loading from accounting…</span>}
                  {!apiLoading && grossIncomeNum > 0 && <span className="ml-2 text-[9px] text-emerald-500">✓ From accounting records</span>}
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={grossIncome}
                  onChange={e => setGrossIncome(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <Info size={10} /> Total revenue from all business activities before any deductions. Auto-loaded from your accounting records.
                </p>
              </div>

              {/* Deductible expenses */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Allowable Deductions
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {expenses.map(exp => {
                    const hint = DEDUCTIBLE_EXPENSES.find(de => de.id === exp.id)?.hint;
                    return (
                      <div key={exp.id}>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1" title={hint}>
                          {exp.label}
                        </label>
                        <input
                          type="number" min="0" step="0.01"
                          value={exp.amount}
                          onChange={e => updateExpense(exp.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Results waterfall */}
              {grossIncomeNum > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Waterfall rows */}
                  {[
                    { label: 'Gross Income',       value: grossIncomeNum, color: 'text-slate-800 dark:text-slate-100', sign: '' },
                    { label: 'Total Deductions',   value: totalExpenses,  color: 'text-emerald-700 dark:text-emerald-400', sign: '−' },
                    { label: 'Taxable Income',     value: taxableIncome,  color: 'text-slate-800 dark:text-slate-100', sign: '=' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{row.label}</span>
                      <span className={`text-sm font-semibold font-mono ${row.color}`}>
                        {row.sign} ETB {fmt(row.value)}
                      </span>
                    </div>
                  ))}

                  {/* MAT indicator */}
                  <div className={`flex items-center justify-between py-2 px-3 rounded-xl border ${
                    matApplies
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">MAT (2.5% of turnover)</span>
                      {matApplies && (
                        <span className="ml-2 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase">
                          APPLIES
                        </span>
                      )}
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Proclamation No. 1395/2025 · Pay whichever is higher
                      </p>
                    </div>
                    <span className={`text-sm font-semibold font-mono ${matApplies ? 'text-orange-700 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      ETB {fmt(matAmount)}
                    </span>
                  </div>

                  {/* WHT & Provisional credits */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {[
                      { label: 'WHT Credits (withheld by payers)', value: whtCredits, onChange: setWhtCredits, hint: 'Tax withheld by customers/payers during the year' },
                      { label: 'Provisional Tax Paid',             value: provisionalPaid, onChange: setProvisionalPaid, hint: 'Quarterly installments already paid' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
                        <input
                          type="number" min="0" step="0.01"
                          value={f.value}
                          onChange={e => f.onChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
                        />
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{f.hint}</p>
                      </div>
                    ))}
                  </div>

                  {/* Credit breakdown */}
                  {(whtCreditsNum > 0 || provisionalPaidNum > 0) && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Gross Tax ({taxpayerType === 'corporate' ? '30%' : `${effectiveRate.toFixed(1)}% eff.`})
                        </span>
                        <span className="text-sm font-semibold font-mono text-amber-700 dark:text-amber-400">ETB {fmt(grossTaxDue)}</span>
                      </div>
                      {whtCreditsNum > 0 && (
                        <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Less: WHT Credits</span>
                          <span className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400">− ETB {fmt(whtCreditsNum)}</span>
                        </div>
                      )}
                      {provisionalPaidNum > 0 && (
                        <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Less: Provisional Tax Paid</span>
                          <span className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400">− ETB {fmt(provisionalPaidNum)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Net tax due box */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {taxDue > 0 ? 'Net Tax Payable' : 'Tax Refund / Carry Forward'}
                      </p>
                      <p className="text-3xl font-semibold text-amber-700 dark:text-amber-300 mt-1">
                        ETB {fmt(Math.abs(taxDue))}
                      </p>
                      <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1">
                        Due by {FILING_DEADLINE} · Pay via CBE or eTax portal
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={printDeclaration}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-all"
                      >
                        <Printer size={13} /> Print
                      </button>
                      <button
                        onClick={() => {
                          const csv = `Business Income Tax,FY ${filingYear}\nGross Income,${grossIncomeNum}\nTaxable Income,${taxableIncome}\nNet Tax Due,${taxDue}`;
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `BIT_${filingYear}.csv`; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <Download size={13} /> CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VAT ↔ BIT cross-check */}
          {grossIncomeNum > 0 && <VatBitBridge grossIncome={grossIncomeNum} />}

          {/* Provisional tax schedule */}
          {grossTaxDue > 0 && (
            <SectionCard
              icon={<Calculator size={16} />}
              iconColor="text-violet-500"
              title="Provisional Tax Schedule"
              badge={<span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">4 quarterly installments</span>}
              collapsible open={showProvisional} onToggle={() => setShowProvisional(v => !v)}
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Businesses with prior-year tax liability &gt; ETB 500 must pay provisional tax in 4 equal quarterly installments.
              </p>
              <div className="ovds-grid-layout cols-4">
                {[
                  { q: 'Q1', deadline: `Sep 7, ${Number(filingYear)}` },
                  { q: 'Q2', deadline: `Dec 7, ${Number(filingYear)}` },
                  { q: 'Q3', deadline: `Mar 7, ${Number(filingYear) + 1}` },
                  { q: 'Q4', deadline: `Jun 7, ${Number(filingYear) + 1}` },
                ].map(p => (
                  <div key={p.q} className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{p.q} Installment</p>
                    <p className="text-lg font-semibold text-violet-700 dark:text-violet-300 mt-1">ETB {fmt(quarterlyProvisional)}</p>
                    <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-0.5">Due: {p.deadline}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 italic">
                Each installment = 25% of prior year's tax liability. Late installments attract 2%/month interest.
              </p>
            </SectionCard>
          )}

          {/* Multi-year comparison */}
          <SectionCard
            icon={<BarChart3 size={16} />}
            iconColor="text-teal-500"
            title="Multi-Year BIT Comparison"
            badge={<span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Loss carry-forward · MAT trend · Audit risk</span>}
            collapsible open={showMultiYear} onToggle={() => setShowMultiYear(v => !v)}
            noPad
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs ovds-table">
                <thead>
                  <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Fiscal Year', 'Gross Income', 'Taxable Income', 'BIT (30%)', 'MAT (2.5%)', 'Tax Payable', 'Eff. Rate', 'YoY'].map(h => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${h === 'Fiscal Year' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grossIncomeNum > 0 && (
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/10">
                      <td className="px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {filingYear}/{Number(filingYear) + 1}
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded-full">current</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-right text-slate-700 dark:text-slate-300">{fmt(grossIncomeNum)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-right text-slate-700 dark:text-slate-300">{fmt(taxableIncome)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-right text-slate-600 dark:text-slate-400">{fmt(corporateTax)}</td>
                      <td className={`px-4 py-3 text-xs font-mono text-right ${matApplies ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400'}`}>
                        {fmt(matAmount)}{matApplies && <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">MAT</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-right text-amber-700 dark:text-amber-400">{fmt(effectiveTax)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-right text-slate-500 dark:text-slate-400">{effectiveRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">
                        {priorYearsData[0]?.taxDue > 0 && (
                          (() => {
                            const chg = ((effectiveTax - priorYearsData[0].taxDue) / priorYearsData[0].taxDue) * 100;
                            return (
                              <span className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${chg > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {chg > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(chg).toFixed(1)}%
                              </span>
                            );
                          })()
                        )}
                      </td>
                    </tr>
                  )}
                  {priorYearsData.map((y, idx) => {
                    const prevTax = priorYearsData[idx + 1]?.taxDue ?? 0;
                    const yoy = prevTax > 0 ? ((y.taxDue - prevTax) / prevTax) * 100 : null;
                    const yMat = y.grossIncome * MAT_RATE;
                    const yMatApplies = yMat > y.taxDue * (1 / 0.3) * 0.3 && y.grossIncome > 0;
                    return (
                      <tr key={y.year} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">{y.year}/{y.year + 1}</td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-slate-400 dark:text-slate-500">{y.grossIncome > 0 ? fmt(y.grossIncome) : '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-slate-400 dark:text-slate-500">
                          {y.taxableIncome > 0 ? fmt(y.taxableIncome) : y.taxableIncome < 0 ? <span className="text-rose-500">({fmt(Math.abs(y.taxableIncome))})</span> : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-slate-400 dark:text-slate-500">{y.taxableIncome > 0 ? fmt(y.taxableIncome * 0.3) : '—'}</td>
                        <td className={`px-4 py-3 text-xs font-mono text-right ${yMatApplies ? 'text-amber-500 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                          {y.grossIncome > 0 ? fmt(yMat) : '—'}
                          {yMatApplies && <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">MAT</span>}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-slate-400 dark:text-slate-500">{y.taxDue > 0 ? fmt(y.taxDue) : '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-slate-400 dark:text-slate-500">
                          {y.taxableIncome > 0 ? `${((y.taxDue / y.taxableIncome) * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {yoy !== null && (
                            <span className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${yoy > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {yoy > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                              {Math.abs(yoy).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Loss carry-forward summary */}
                {priorYearsData.some(y => y.taxableIncome < 0) && (
                  <tfoot>
                    <tr className="bg-rose-50 dark:bg-rose-950/20 border-t border-rose-200 dark:border-rose-800">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-300">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>
                            <strong>Loss carry-forward detected.</strong> Corporate losses can be carried forward up to 3 years to offset future taxable income (Proclamation No. 1395/2025).
                            {' '}Total available: ETB {fmt(Math.abs(priorYearsData.filter(y => y.taxableIncome < 0).reduce((s, y) => s + y.taxableIncome, 0)))}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-[10px] text-slate-400">
                <span><span className="font-semibold text-amber-600 dark:text-amber-400">MAT</span> = Minimum Alternative Tax (2.5% of gross income) — applies when higher than 30% BIT</span>
                <span><span className="font-semibold text-rose-500">YoY</span> = Year-on-year change in tax payable</span>
                <span>Loss years shown in <span className="text-rose-500">(brackets)</span> — eligible for 3-year carry-forward</span>
              </div>
            </div>
          </SectionCard>

          {/* MAT Optimization Panel */}
          {matApplies && grossIncomeNum > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Lightbulb size={15} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">MAT Applies — Optimization Opportunities</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    MAT of <strong>ETB {fmt(matAmount)}</strong> (2.5% of ETB {fmt(grossIncomeNum)}) exceeds regular BIT of <strong>ETB {fmt(corporateTax)}</strong>.
                    The following strategies can reduce your effective tax burden.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Accelerate Allowable Deductions',
                    desc: `Bringing forward deductible expenses into this fiscal year reduces taxable income. At 30% BIT, each ETB 1 of additional deduction saves ETB 0.30 — potentially bringing BIT above MAT.`,
                    saving: `ETB ${fmt((matAmount - corporateTax) / 0.3)} additional deductions needed to eliminate MAT`,
                    icon: '📉',
                  },
                  {
                    title: 'Maximise ERCA Depreciation',
                    desc: 'Claim full depreciation on all eligible assets: buildings 5%, machinery 20%, vehicles 20%. Accelerated depreciation reduces taxable income without cash outflow.',
                    saving: 'Non-cash deduction — reduces taxable income immediately',
                    icon: '🏗️',
                  },
                  {
                    title: 'Defer Revenue to Next Period',
                    desc: 'If legally permissible under IFRS 15, deferring revenue recognition to the next fiscal year reduces this year\'s gross income — directly reducing the MAT base.',
                    saving: `ETB ${fmt((matAmount - corporateTax) / MAT_RATE)} revenue deferral needed to eliminate MAT`,
                    icon: '📅',
                  },
                  {
                    title: 'Increase Deductible Pension Contributions',
                    desc: 'Employer pension contributions (11% of salary) are fully deductible. Increasing contributions reduces taxable income and benefits employees.',
                    saving: 'Deductible at 30% BIT rate — also reduces DRRF salary levy base',
                    icon: '👥',
                  },
                ].map((tip, i) => (
                  <div key={i} className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3.5 border border-amber-100 dark:border-amber-900/40">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{tip.icon}</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{tip.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <TrendingDown size={10} /> {tip.saving}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                Consult a tax advisor before implementing deferral strategies. All deductions must be supported by valid documentation for ERCA audit purposes.
              </p>
            </div>
          )}

          {/* Filing checklist */}
          <SectionCard
            icon={<CheckCircle2 size={16} />}
            iconColor="text-slate-500 dark:text-slate-400"
            title="Annual Filing Checklist"
            badge={
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                checklistDone === CHECKLIST.length
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              }`}>
                {checklistDone}/{CHECKLIST.length}
              </span>
            }
            collapsible open={showChecklist} onToggle={() => setShowChecklist(v => !v)}
          >
            <div className="space-y-2">
              {CHECKLIST.map(item => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${item.done ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-800/50'}`}>
                  <CheckCircle2 size={16} className={item.done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'} />
                  <span className={`text-xs font-semibold ${item.done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Tax optimization tips */}
          <SectionCard
            icon={<Lightbulb size={16} />}
            iconColor="text-amber-500"
            title="Tax Optimization Tips"
            badge={<span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{taxpayerType === 'corporate' ? 'Corporate' : 'Individual'}</span>}
            collapsible open={showTips} onToggle={() => setShowTips(v => !v)}
          >
            <TaxOptimizationTips taxpayerType={taxpayerType} taxableIncome={taxableIncome} />
          </SectionCard>

          {/* Penalties reference */}
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400" />
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Penalties for Non-Compliance</p>
            </div>
            <div className="ovds-grid-layout cols-3">
              {[
                { label: 'Late Filing',        value: 'ETB 500/day, max ETB 50,000' },
                { label: 'Late Payment',       value: '2% per month (compounded)'   },
                { label: 'Under-declaration',  value: '100% of understated tax + prosecution' },
              ].map(p => (
                <div key={p.label} className="bg-white/60 dark:bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{p.label}</p>
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-300 mt-0.5">{p.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-3 italic">
              Voluntary disclosure before ERCA audit notification: 50% penalty reduction available.
            </p>
          </div>

          {/* IASB banner */}
          {canViewBIT && <IASBUpdateBanner compact />}

          {/* Submit */}
          <div className="ovds-widget-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Submit Annual BIT Declaration</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  File via the MoR e-Tax Portal or in person at your nearest MoR branch. Deadline: {FILING_DEADLINE}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {submitted && (
                  <span className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold">
                    <CheckCircle2 size={14} /> Submitted
                  </span>
                )}
                <a
                  href="https://etax.mor.gov.et"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ExternalLink size={14} /> Open eTax Portal
                </a>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || submitted || taxableIncome <= 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                    : <><Send size={14} /> Submit Declaration</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: BRACKETS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'brackets' && (
        <div className="space-y-5">
          {/* Corporate */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Briefcase size={16} className="text-amber-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Corporate Tax Rate</span>
              <span className="ml-auto text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">30% Flat</span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">All taxable income</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">PLC, Share Company, NGO, Branch offices</p>
                </div>
                <p className="text-3xl font-semibold text-amber-700 dark:text-amber-300">30%</p>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'MAT (Minimum Alternative Tax)', value: '2.5% of annual turnover', note: 'Pay whichever is higher: regular tax or MAT' },
                  { label: 'Cash transaction limit',        value: 'ETB 30,000',              note: 'Above this must be via bank/cheque to be deductible' },
                  { label: 'Loss carry-forward',            value: 'Up to 3 years',           note: 'Corporate losses offset future taxable income' },
                  { label: 'Filing deadline',               value: 'November 7',              note: '4 months after Ethiopian fiscal year-end (July 7)' },
                ].map(r => (
                  <div key={r.label} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{r.label}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{r.value}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual brackets */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <FileText size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Individual / Sole Proprietor — Progressive Brackets</span>
              <span className="ml-auto text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Proclamation 1395/2025</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs ovds-table">
                <thead>
                  <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Income Range (ETB/yr)', 'Rate', 'Deduction (ETB)', 'Formula'].map(h => (
                      <th key={h} className={`px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${h !== 'Income Range (ETB/yr)' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INDIVIDUAL_BRACKETS.map((b, i) => {
                    const inBracket = taxableIncome > b.from && (taxableIncome <= b.to || b.to === Infinity);
                    const formula = b.rate === 0 ? 'Nil' : `Income × ${(b.rate * 100).toFixed(0)}% − ${fmt(b.deduction)}`;
                    return (
                      <tr key={i} className={`border-b border-slate-50 dark:border-slate-800/60 ${inBracket ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}>
                        <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {fmt(b.from + (i === 0 ? 0 : 1))} – {b.to === Infinity ? '∞' : fmt(b.to)}
                          {inBracket && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">YOUR BRACKET</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">{(b.rate * 100).toFixed(0)}%</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-500 dark:text-slate-400">{fmt(b.deduction)}</td>
                        <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400">{formula}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/10 border-t border-emerald-100 dark:border-emerald-900">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                <strong>Example:</strong> Annual income of ETB 12,000 → bracket 30% → Tax = 12,000 × 30% − 1,350 = ETB 2,250
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CALENDAR
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <SectionCard
          icon={<Calendar size={16} />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          title={`Ethiopian Tax Calendar ${new Date().getFullYear()}`}
          badge={<span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">Upcoming deadlines</span>}
          noPad
        >
          <TaxCalendarTab />
        </SectionCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PENALTIES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'penalties' && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-200 dark:border-rose-800 flex items-center gap-3">
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
            <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">Penalty Calculator</span>
            <span className="text-[10px] text-rose-500 dark:text-rose-400 ml-1">Estimate late filing / payment penalties</span>
          </div>
          <div className="p-5">
            <PenaltyTab />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: IAS 12 / IFRS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ifrs' && canViewovds && (
        <SectionCard
          icon={<Globe size={16} />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          title="IAS 12 — Income Taxes: IFRS Accounting Treatment"
          badge={<span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">How BIT flows through your financial statements</span>}
        >
          <IfrsTab taxableIncome={taxableIncome} />
        </SectionCard>
      )}
      {activeTab === 'ifrs' && !canViewovds && (
        <div className="ovds-widget-card p-10 text-center">
          <ShieldCheck size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">ovds access required</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You need the <code>ovds:read</code> permission to view IFRS accounting treatment.</p>
        </div>
      )}

    </AppPage>
  );
};

export default BusinessIncomeTax;


