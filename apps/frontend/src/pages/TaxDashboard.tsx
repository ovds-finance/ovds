import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTaxDashboard, useVatReconciliation, useIncomeTax } from '../services/taxApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { fmtCompact } from '../utils/fmt';
import { PIT_BRACKETS as SHARED_PIT } from '../utils/ethiopianTax';
import AccountingChainWidget from '../components/dashboard/accountingChainWidget';
import { TaxAutomationWidget } from '../components/dashboard/taxAutomationWidget';
import { PipelineStageHeader } from '../components/pipelineComponents';
import EthiopianComplianceGuide from '../components/ethiopianComplianceGuide';
import IASBUpdateBanner from '../components/iasbUpdateBanner';
import WHTCertificateModal from '../components/whtCertificateModal';
import { useBusiness } from '../context/businessContext';
import {
  efyPeriodLabel, efyTaxDeadlines, gregorianToEFY,
  bitFilingDeadline, vatFilingDeadline, drrfQuarterDeadline,
} from '@ovds/ui';
import {
  AppPage, AppKpi, Btn, Icon,
} from '../components/ui';

const fmtK = (n: number) => fmtCompact(n, 'ETB');

// -- Types & Constants --------------------------------------------------------

type DeadlineType = 'VAT' | 'DRRF' | 'BIT' | 'PAYROLL' | 'PENSION';
interface TaxDeadline {
  date: Date;
  label: string;
  type: DeadlineType;
  to: string;
  penalty?: string;
}

const DEADLINE_COLORS: Record<DeadlineType, string> = {
  VAT:     'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  DRRF:    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800',
  BIT:     'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800',
  PAYROLL: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  PENSION: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800',
};

const DEADLINE_DOT: Record<DeadlineType, string> = {
  VAT:     'bg-emerald-500',
  DRRF:    'bg-amber-500',
  BIT:     'bg-teal-500',
  PAYROLL: 'bg-emerald-500',
  PENSION: 'bg-teal-500',
};

// PIT display table derived from shared PIT_BRACKETS (single source of truth)
const PIT_BRACKETS = [
  { range: '0 – 2,000',        rate: '0%',  tax: '0',                                     color: 'text-emerald-600 dark:text-emerald-400' },
  { range: '2,001 – 4,000',    rate: '15%', tax: '(taxable − 2,000) × 15%',               color: 'text-emerald-600 dark:text-emerald-400' },
  { range: '4,001 – 7,000',    rate: '20%', tax: '300 + (taxable − 4,000) × 20%',         color: 'text-teal-600 dark:text-teal-400' },
  { range: '7,001 – 10,000',   rate: '25%', tax: '900 + (taxable − 7,000) × 25%',         color: 'text-violet-600 dark:text-violet-400' },
  { range: '10,001 – 14,000',  rate: '30%', tax: '1,650 + (taxable − 10,000) × 30%',      color: 'text-orange-600 dark:text-orange-400' },
  { range: '> 14,000',         rate: '35%', tax: '2,850 + (taxable − 14,000) × 35%',      color: 'text-rose-600 dark:text-rose-400' },
].map((row, i) => ({ ...SHARED_PIT[i], ...row }));

const DRRF_CATEGORIES = [
  { category: 'Annual Sales Revenue', rate: '5%', color: 'text-orange-600' },
  { category: 'Telecom / Digital', rate: '5%', color: 'text-orange-600' },
  { category: 'Service Fees (Bank)', rate: '5%', color: 'text-orange-600' },
  { category: 'Loan Value', rate: '1%', color: 'text-emerald-600' },
  { category: 'Insurance Premium', rate: '1%', color: 'text-emerald-600' },
  { category: 'Salary Contribution', rate: '1%', color: 'text-emerald-600' },
];

function buildDeadlines(year: number, month: number): TaxDeadline[] {
  const now = new Date(year, month, 1);
  const efyDeadlines = efyTaxDeadlines(gregorianToEFY(now));
  const deadlines: TaxDeadline[] = [];

  // Add EFY-aware deadlines from the shared utility
  for (const d of efyDeadlines) {
    const typeMap: Record<string, DeadlineType> = {
      VAT: 'VAT', TOT: 'VAT', WHT: 'PAYROLL', DRRF: 'DRRF', BIT: 'BIT',
    };
    const toMap: Record<string, string> = {
      VAT: '/tax/vat', TOT: '/tax/tot', WHT: '/tax/vat', DRRF: '/disaster-fund', BIT: '/tax/business-income',
    };
    deadlines.push({
      date:    d.deadline,
      label:   d.label,
      type:    typeMap[d.type] ?? 'VAT',
      to:      toMap[d.type] ?? '/tax/dashboard',
      penalty: d.type === 'VAT' ? '25% penalty + 2%/month interest (ERCA)' : undefined,
    });
  }

  // Also add monthly payroll PIT deadlines for next 3 months
  for (let i = 0; i < 3; i++) {
    const m = (month + i) % 12;
    const y = year + Math.floor((month + i) / 12);
    const period = `${y}-${String(m + 1).padStart(2, '0')}`;
    const pitDl = vatFilingDeadline(period);
    deadlines.push({
      date:  pitDl,
      label: `Payroll PIT — ${efyPeriodLabel(period)}`,
      type:  'PAYROLL',
      to:    '/hr/payroll',
    });
    deadlines.push({
      date:  pitDl,
      label: `Employer Pension — ${efyPeriodLabel(period)}`,
      type:  'PENSION',
      to:    '/hr/payroll',
    });
  }

  // Add DRRF quarterly deadline
  const drrfDl = drrfQuarterDeadline(now);
  if (!deadlines.find(d => d.type === 'DRRF')) {
    deadlines.push({
      date:    drrfDl,
      label:   `DRRF Quarterly Levy`,
      type:    'DRRF',
      to:      '/disaster-fund',
      penalty: '25% late filing penalty',
    });
  }

  return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// -- Shared UI Components -----------------------------------------------------

const ComplianceRing: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-out' }} strokeLinecap="round" className={color} />
        </svg>
        <span className="absolute text-xl font-semibold text-slate-800 dark:text-slate-100">{score}%</span>
      </div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
};

const KPIBlock: React.FC<{ label: string; value: string; sub: string; to?: string; icon: React.ReactNode }> = ({ label, value, sub, to, icon }) => {
  const content = (
    <div className="dash-stat-cell h-full flex flex-col justify-between">
      <div>
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-emerald-600 dark:text-emerald-400 w-fit mb-3">
          {icon}
        </div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="ovds-value-sm text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <p className="ovds-caption mt-3">{sub}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

const TaxFilingCalendar: React.FC = () => {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const deadlines = useMemo(() => buildDeadlines(viewYear, viewMonth), [viewYear, viewMonth]);
  const upcoming = deadlines.filter(d => {
    const diff = (d.date.getTime() - now.getTime()) / 86_400_000;
    return diff >= 0 && diff <= 30;
  });

  return (
    <div className="ovds-widget-card overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Icon name="CALENDAR" size={16} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Filing Calendar</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMonth(m => m === 0 ? 11 : m - 1)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <Icon name="CHEVRON_LEFT" size={12} />
          </button>
          <span className="text-[10px] font-semibold text-slate-500 min-w-[70px] text-center">
            {new Date(viewYear, viewMonth).toLocaleString('en-ET', { month: 'short' })}
            <span className="block text-[9px] text-emerald-500 font-medium">
              {efyPeriodLabel(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)}
            </span>
          </span>
          <button onClick={() => setViewMonth(m => m === 11 ? 0 : m + 1)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <Icon name="CHEVRON_RIGHT" size={12} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-4">No deadlines this month</p>
        ) : (
          upcoming.map((d, i) => (
            <Link key={i} to={d.to} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full ${DEADLINE_DOT[d.type]}`} />
                <p className="text-[10px] font-semibold truncate text-slate-700 dark:text-slate-200">{d.label}</p>
              </div>
              <span className="text-[10px] font-medium text-slate-400 shrink-0">{d.date.getDate()}th</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

// -- Overdue Penalty Summary Panel --------------------------------------------

const OverduePenaltySummary: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [data, setData]       = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = companyId ? `?companyId=${companyId}` : '';
    import('../services/api').then(({ default: api }) => {
      api.get(`/tax/overdue-summary${q}`, { headers: { 'x-background': '1' } } as any)
        .then((res: any) => setData(res.data?.data ?? res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [companyId]);

  if (loading || !data || data.summary?.overdueCount === 0) return null;

  const { items = [], summary } = data;
  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(n);

  return (
    <div className="ovds-widget-card overflow-hidden border-rose-200 dark:border-rose-800 border">
      <div className="px-5 py-4 border-b border-rose-100 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 flex items-center gap-3">
        <Icon name="WARNING" size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
            {summary.overdueCount} Overdue Tax Filing{summary.overdueCount > 1 ? 's' : ''}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
            Total principal: <strong>ETB {fmt(summary.totalTaxDue)}</strong> ·
            Estimated penalties: <strong>ETB {fmt(summary.totalPenaltyExposure)}</strong> ·
            Total owed: <strong>ETB {fmt(summary.totalOwed)}</strong>
          </p>
        </div>
        <Link to="/tax/penalty-calculator"
          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0">
          Calculate Penalties →
        </Link>
      </div>
      <div className="divide-y divide-rose-50 dark:divide-rose-900/30">
        {items.slice(0, 5).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              item.type === 'VAT'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800'
            }`}>
              {item.type}
            </span>
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 flex-1">
              Period: {item.period}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {item.daysLate}d late
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              ETB {fmt(item.taxDue)}
            </span>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              +ETB {fmt(item.penalty)} penalty
            </span>
            <span className="text-[12px] font-black text-rose-700 dark:text-rose-300 tabular-nums">
              = ETB {fmt(item.totalOwed)}
            </span>
          </div>
        ))}
        {items.length > 5 && (
          <div className="px-5 py-3 text-[11px] text-slate-400">
            +{items.length - 5} more overdue filings — <Link to="/tax/dashboard" className="text-rose-600 hover:underline">View all</Link>
          </div>
        )}
      </div>
    </div>
  );
};

// -- Quarterly Tax Summary Widget --------------------------------------------
// Fetches and displays Q1–Q4 consolidated tax liabilities for the current EFY.
// Proclamation No. 983/2016 Art. 19 — quarterly summary obligation (Cat A).

const QuarterlyTaxSummary: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const efyYear = React.useMemo(() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    return m >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  }, []);

  const [reports, setReports]   = React.useState<any[]>([]);
  const [loading, setLoading]   = React.useState(false);
  const [generating, setGen]    = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { default: api } = await import('../services/api');
      const res = await api.get(
        `/tax/quarterly/list/${efyYear}`,
        { params: { companyId } },
      );
      const d = res.data?.data ?? res.data;
      setReports(Array.isArray(d) ? d : []);
    } catch { setReports([]); }
    finally { setLoading(false); }
  }, [companyId, efyYear]);

  React.useEffect(() => { load(); }, [load]);

  const generate = async (quarter: string) => {
    if (!companyId) return;
    setGen(quarter);
    try {
      const { default: api } = await import('../services/api');
      await api.post(
        `/tax/quarterly/${quarter}`,
        {},
        { params: { companyId } },
      );
      await load();
    } catch { /* toast shown by interceptor */ }
    finally { setGen(null); }
  };

  const QUARTERS = [`Q1-${efyYear}`, `Q2-${efyYear}`, `Q3-${efyYear + 1}`, `Q4-${efyYear + 1}`] as const;
  const QUARTER_LABELS: Record<string, string> = {
    [`Q1-${efyYear}`]:     'Q1 — Jul–Sep',
    [`Q2-${efyYear}`]:     'Q2 — Oct–Dec',
    [`Q3-${efyYear + 1}`]: 'Q3 — Jan–Mar',
    [`Q4-${efyYear + 1}`]: 'Q4 — Apr–Jun',
  };
  const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const reportMap = React.useMemo(() =>
    Object.fromEntries(reports.map(r => [r.period, r])), [reports],
  );

  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="CALENDAR" size={14} className="text-teal-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Quarterly Tax Summary — EFY {efyYear}/{String(efyYear + 1).slice(-2)}
          </p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded">
            Proc. 983/2016 Art. 19
          </span>
        </div>
        <button onClick={load} disabled={loading}
          className="text-[10px] font-semibold text-slate-400 hover:text-teal-500 transition-colors flex items-center gap-1 disabled:opacity-40">
          <Icon name="REFRESH" size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800">
        {QUARTERS.map(q => {
          const r = reportMap[q];
          const isLoading = generating === q;
          return (
            <div key={q} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {QUARTER_LABELS[q] ?? q}
                </span>
                {!r && (
                  <button
                    onClick={() => generate(q)}
                    disabled={isLoading || !!generating}
                    className="text-[9px] font-bold text-teal-600 hover:underline dark:text-teal-400 disabled:opacity-40 flex items-center gap-0.5"
                  >
                    {isLoading
                      ? <><Icon name="REFRESH" size={9} className="animate-spin" /> Generating…</>
                      : '+ Generate'}
                  </button>
                )}
              </div>

              {r ? (
                <div className="space-y-1.5">
                  {[
                    { label: 'VAT',  value: Number(r.vatNetPayable  ?? 0), color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'WHT',  value: Number(r.whtTotalToRemit ?? 0), color: 'text-amber-600 dark:text-amber-400'   },
                    { label: 'PAYE', value: Number(r.payeNetPayableErca ?? 0), color: 'text-sky-600 dark:text-sky-400'    },
                    { label: 'DRRF', value: Number(r.drrfLevyDue    ?? 0), color: 'text-orange-600 dark:text-orange-400' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{row.label}</span>
                      <span className={`font-mono font-bold tabular-nums ${row.color}`}>
                        {fmt(row.value)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 tabular-nums font-mono">
                      {fmt(Number(r.grandTotalPayable ?? 0))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      r.status === 'SUBMITTED_TO_MOR'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}>
                      {r.status === 'SUBMITTED_TO_MOR' ? '✓ Submitted' : r.status ?? 'DRAFT'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 italic">Not generated</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-2.5 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 flex items-center gap-2">
        <Icon name="INFO" size={11} className="text-slate-400 shrink-0" />
        <p className="text-[9px] text-slate-400 dark:text-slate-500">
          Quarterly reports consolidate 3 monthly filings. Click "+ Generate" to compute a quarter.
          Category A taxpayers must file quarterly summaries with MoR — Proclamation No. 983/2016 Art. 19.
        </p>
      </div>
    </div>
  );
};

// -- Annual BIT Breakdown Widget ----------------------------------------------
// Displays the Business Income Tax calculation with IAS 12 non-deductible add-backs.
// Proclamation No. 979/2016 Art. 25 — entertainment, donations, penalties.

const AnnualBitBreakdown: React.FC<{ incomeTax: any; year: number }> = ({ incomeTax, year }) => {
  if (!incomeTax) return null;
  const fmt = (n: number) => (n ?? 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows = [
    { label: 'Annual Revenue (Gross)',        value: Number(incomeTax.annualRevenue ?? 0),      color: 'text-slate-700 dark:text-slate-200' },
    { label: 'Total Expenses (Deductible)',    value: -Number(incomeTax.totalExpenses ?? 0),     color: 'text-slate-700 dark:text-slate-200' },
    { label: 'Accounting Profit',             value: Number(incomeTax.accountingProfit ?? (incomeTax.annualRevenue - incomeTax.totalExpenses)),  color: 'text-slate-800 dark:text-slate-100 font-bold border-t border-slate-200 dark:border-slate-700 pt-1' },
    { label: '+ Entertainment Add-back (5% cap — Art. 25a)', value: Number(incomeTax.entertainmentAddBack ?? 0), color: 'text-amber-600 dark:text-amber-400' },
    { label: '+ Donations Add-back (10% cap — Art. 25b)',    value: Number(incomeTax.donationAddBack ?? 0),      color: 'text-amber-600 dark:text-amber-400' },
    { label: '+ Penalties & Fines (Art. 25c)',               value: Number(incomeTax.penaltyAddBack ?? 0),       color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Taxable Net Income',             value: Number(incomeTax.taxableProfit ?? 0),      color: 'text-violet-700 dark:text-violet-300 font-bold border-t border-slate-200 dark:border-slate-700 pt-1' },
    { label: 'Regular CIT @ 30% (Art. 19)',   value: Number(incomeTax.regularTax ?? 0),         color: 'text-slate-600 dark:text-slate-300' },
    { label: 'MAT @ 2.5% of Revenue',         value: Number(incomeTax.matPayable ?? 0),         color: 'text-slate-600 dark:text-slate-300' },
    { label: 'Tax Payable (max of CIT / MAT)',value: Number(incomeTax.taxPayable ?? 0),          color: 'text-rose-700 dark:text-rose-400 font-bold border-t border-slate-200 dark:border-slate-700 pt-1' },
  ];

  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center text-white text-[10px] font-black">BIT</span>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Annual Business Income Tax — EFY {year}/{String(year + 1).slice(-2)}
          </p>
          {incomeTax.matApplies && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full">
              MAT APPLIES
            </span>
          )}
        </div>
        <Link to="/tax/business-income"
          className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
          File BIT <Icon name="EXTERNAL_LINK" size={10} />
        </Link>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Computation waterfall */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            IAS 12 Computation — Proc. 979/2016
          </p>
          {rows.map(row => (
            <div key={row.label} className={`flex items-center justify-between ${row.color} text-[11px]`}>
              <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{row.label}</span>
              <span className="font-mono tabular-nums shrink-0 ml-4">
                {row.value < 0
                  ? `(${fmt(Math.abs(row.value))})`
                  : fmt(row.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Summary</p>
          {[
            { label: 'Effective Tax Rate',    value: `${((incomeTax.effectiveRate ?? 0) * 100).toFixed(1)}%`,  color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
            { label: 'Non-Deductible Total',  value: `ETB ${fmt(incomeTax.permanentAddBacks ?? 0)}`,           color: 'text-amber-700 dark:text-amber-300',  bg: 'bg-amber-50 dark:bg-amber-950/20' },
            { label: 'BIT Due (Nov 7)',        value: `ETB ${fmt(incomeTax.taxPayable ?? 0)}`,                  color: 'text-rose-700 dark:text-rose-300',    bg: 'bg-rose-50 dark:bg-rose-950/20'   },
            { label: 'MAT Comparison (2.5%)', value: incomeTax.matApplies ? '⚠ MAT > CIT — MAT applies' : '✓ CIT > MAT — standard rate', color: incomeTax.matApplies ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300', bg: incomeTax.matApplies ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20' },
          ].map(card => (
            <div key={card.label} className={`flex items-center justify-between px-3 py-2.5 ${card.bg} rounded-xl`}>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{card.label}</span>
              <span className={`text-[11px] font-bold tabular-nums ${card.color}`}>{card.value}</span>
            </div>
          ))}

          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">GL Auto-post</p>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Dr Tax Expense</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">8100</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Cr Tax Payable</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">2150</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Main Dashboard -----------------------------------------------------------

const TaxDashboard: React.FC = () => {
  usePageTitle('Tax Center');
  const { can } = useAuth();
  const { selectedCompanyId, companies } = useBusiness();
  const activeCompany = companies.find(c => c.id === selectedCompanyId);
  const canViewVat = can('vat:read');
  const { dashboard, loading, refetch } = useTaxDashboard() as any;
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const { recon } = useVatReconciliation(currentPeriod);
  const { report: incomeTax } = useIncomeTax(dashboard?.year ?? new Date().getFullYear());
  
  const [showPIT, setShowPIT] = useState(false);
  const [showDRRF, setShowDRRF] = useState(false);
  const [showWHT, setShowWHT] = useState(false);

  const now = new Date();
  const vatDaysLeft = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 30).getTime() - now.getTime()) / 86_400_000);
  const score = dashboard?.complianceScore ?? 0;

  const { data: taxpayer } = useApiQuery<any>(`/ovds/taxpayer/status${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`, { deps: [selectedCompanyId], suppressToast: true });
  const { data: whtSummary } = useApiQuery<any>(`/ovds/wht/summary${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`, { deps: [selectedCompanyId], suppressToast: true });

  // Taxpayer category from dashboard data
  const taxpayerCategory = dashboard?.taxpayerCategory ?? taxpayer?.category ?? 'A';
  const annualRevenue = dashboard?.annualRevenue ?? 0;
  const matApplies = dashboard?.matApplies ?? false;
  const matPayable = dashboard?.matPayable ?? 0;

  return (
    <AppPage
      title="Tax Center"
      subtitle={`Compliance oversight for ${activeCompany?.name || 'Your Business'} · 2026 · Banking & ovds · Retail & E-commerce · IT & Software · Revenue · Market Forecast · Challenges Analysis`}
      icon={<Icon name="SHIELD_CHECK" size={18} />}
      crumbs={[{ label: 'Tax Center' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="RECEIPT" size={12} />} onClick={() => setShowWHT(true)}>WHT Certificates</Btn>
        </>
      }
    >
      <div className="space-y-5">
        <PipelineStageHeader
          stages={[
            { key: 'VAT',      label: 'VAT',         count: dashboard?.vatCurrent    ? 1 : 0, color: '#00E784', active: true },
            { key: 'DRRF',     label: 'DRRF',        count: dashboard?.drrfPending   ? 1 : 0, color: '#8b5cf6' },
            { key: 'INCOME',   label: 'Income Tax',  count: dashboard?.incomeTaxDue  ? 1 : 0, color: '#f59e0b' },
            { key: 'OVERDUE',  label: 'Overdue',     count: dashboard?.overdueFilings ?? 0,   color: '#ef4444' },
            { key: 'COMPLIANT',label: 'Compliant',   count: Math.round((dashboard?.complianceScore ?? 0) / 20), color: '#00E784', completed: true },
          ]}
        />

        <AppKpi
          cells={[
            { label: 'VAT Net',      value: fmtK(recon?.netPayable ?? 0),  sub: 'Due end of month', icon: <Icon name="RECEIPT" size={14} />, color: 'emerald' },
            { label: 'Income Tax',   value: fmtK(incomeTax?.taxPayable ?? 0), sub: matApplies ? 'MAT applies (2.5%)' : 'Next filing: Nov 7', icon: <Icon name="BANKNOTE" size={14} />, color: 'violet' },
            { label: 'DRRF Levy',    value: fmtK(dashboard?.drrfPending ?? 0), sub: 'Regulation 570/2025', icon: <Icon name="SHIELD" size={14} />, color: 'amber' },
            { label: 'Compliance',   value: `${score}%`, sub: 'Overall Rating', icon: <Icon name="SHIELD_CHECK" size={14} />, color: score >= 90 ? 'emerald' : 'amber' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <div className="ovds-widget-card p-6 shadow-sm flex flex-col md:flex-row items-center gap-10">
              <ComplianceRing score={score} label="Compliance Rating" color={score >= 90 ? 'text-emerald-500' : 'text-amber-500'} />
              <div className="flex-1 ovds-grid-layout cols-2 w-full">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">VAT Threshold</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{taxpayer?.vatThresholdPct ?? 0}%</span>
                    <span className="ovds-caption">ETB 2M</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${taxpayer?.vatThresholdPct ?? 0}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Fiscal Progress</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{Math.round((new Date().getMonth() + 1) / 12 * 100)}%</span>
                    <span className="ovds-caption">Ends July 7</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(new Date().getMonth() + 1) / 12 * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <AccountingChainWidget />
          </div>

          <div className="lg:col-span-4 space-y-5">
            <TaxAutomationWidget companyId={selectedCompanyId ?? undefined} />
            <TaxFilingCalendar />
            <div className="ovds-widget-card p-5">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Current WHT Status — Proclamation 1395/2025</p>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase">Total Payable</p>
                    <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">ETB {fmtCompact(whtSummary?.totalWht ?? whtSummary?.totalWithholding ?? whtSummary?.withholdingTax3pct ?? 0)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">3% SVC ≥ ETB 3K</span>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">3% GOODS ≥ ETB 10K</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-500">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">Services: {fmtCompact(whtSummary?.whtOnServices ?? whtSummary?.withholdingServices ?? 0)}</div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">Goods: {fmtCompact(whtSummary?.whtOnGoods ?? whtSummary?.withholdingGoods ?? 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ovds-grid-layout cols-3">
          <div className="ovds-widget-card overflow-hidden">
            <button onClick={() => setShowPIT(!showPIT)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-2">
                <Icon name="USERS" size={14} className="text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold">PIT Brackets (2026)</p>
              </div>
              <Icon name={showPIT ? 'CHEVRON_UP' : 'CHEVRON_DOWN'} size={14} />
            </button>
            {showPIT && (
              <div className="px-5 pb-5 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {PIT_BRACKETS.map(b => (
                  <div key={b.range} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800/50 rounded-lg text-[10px]">
                    <span className="font-mono text-slate-600 dark:text-slate-300">{b.range} ETB</span>
                    <span className={`font-semibold ${b.color}`}>{b.rate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ovds-widget-card overflow-hidden">
            <button onClick={() => setShowDRRF(!showDRRF)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-2">
                <Icon name="SHIELD" size={14} className="text-orange-500" />
                <p className="text-sm font-semibold">DRRF Categories</p>
              </div>
              <Icon name={showDRRF ? 'CHEVRON_UP' : 'CHEVRON_DOWN'} size={14} />
            </button>
            {showDRRF && (
              <div className="px-5 pb-5 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {DRRF_CATEGORIES.map(c => (
                  <div key={c.category} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800/50 rounded-lg text-[10px]">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{c.category}</span>
                    <span className={`font-semibold ${c.color}`}>{c.rate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Icon name="TRENDING_UP" size={14} className="text-sky-500" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Turnover Tax (TOT)</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded">Category B</span>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { label: 'TOT — Goods',    rate: '2%',  note: 'Sale of goods' },
                { label: 'TOT — Services', rate: '10%', note: 'Provision of services' },
                { label: 'TOT — Construction / Grain / Farm Machinery', rate: '2%', note: 'Special category' },
              ].map(t => (
                <div key={t.label} className="flex items-center justify-between px-3 py-2 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
                  <div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{t.label}</p>
                    <p className="ovds-caption">{t.note}</p>
                  </div>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{t.rate}</span>
                </div>
              ))}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                {[
                  { label: 'Threshold',  value: '< ETB 2M/year' },
                  { label: 'Deadline',   value: '30th of following month' },
                  { label: 'Zero report', value: 'Required even if no sales' },
                  { label: 'Input credit', value: '❌ Not applicable' },
                  { label: 'Portal',     value: 'etax.erca.gov.et' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{r.label}</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{r.value}</span>
                  </div>
                ))}
              </div>
              <a href="https://etax.erca.gov.et" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                File TOT on E-Tax Portal <Icon name="EXTERNAL_LINK" size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* -- Schedule D & Other Income Tax quick-reference -- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center text-white text-[10px] font-black">D</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Schedule D — Other Income & Capital Taxes</p>
            </div>
            <Link to="/tax/schedule-d" className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              Calculators & Records <Icon name="EXTERNAL_LINK" size={10} />
            </Link>
          </div>
          <div className="p-5">
            <div className="ovds-grid-layout cols-4 gap-sm">
              {[
                { label: 'Dividend',          rate: '15%', ref: 'Art. 52', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'Interest (std)',     rate: '10%', ref: 'Art. 53', color: 'bg-sky-50 text-sky-700 border-sky-200' },
                { label: 'Interest (FI)',      rate: '30%', ref: 'Art. 53', color: 'bg-sky-50 text-sky-700 border-sky-200' },
                { label: 'Capital Gains',      rate: '15%', ref: 'Art. 59', color: 'bg-violet-50 text-violet-700 border-violet-200' },
                { label: 'Royalty Artistic',   rate: '5%',  ref: 'Art. 56', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'Royalty Technical',  rate: '10%', ref: 'Art. 56', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'Digital Content',    rate: '15%', ref: 'Art. 57', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                { label: 'Games of Chance',    rate: '20%', ref: 'Art. 58', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { label: 'Repatriated Profit', rate: '15%', ref: 'Art. 60', color: 'bg-teal-50 text-teal-700 border-teal-200' },
                { label: 'Undistributed Profit', rate: '15%', ref: 'Art. 61', color: 'bg-teal-50 text-teal-700 border-teal-200' },
                { label: 'Mgmt Fees (NR)',     rate: '15%', ref: 'Art. 62', color: 'bg-white text-slate-600 border-slate-200' },
                { label: 'Technical Fees (NR)',rate: '15%', ref: 'Art. 62', color: 'bg-white text-slate-600 border-slate-200' },
              ].map(t => (
                <div key={t.label} className={`p-3 rounded-xl border text-center ${t.color}`}>
                  <p className="text-xs font-bold leading-tight">{t.label}</p>
                  <p className="text-lg font-black mt-1">{t.rate}</p>
                  <p className="text-[9px] font-mono opacity-60 mt-0.5">Proc. 1395/2025 {t.ref}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between px-3 py-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
                <span className="font-semibold text-sky-800 dark:text-sky-300">Rental (Individual)</span>
                <span className="font-bold text-sky-700 dark:text-sky-400">0 – 35% progressive</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-xs">
                <span className="font-semibold text-violet-800 dark:text-violet-300">Rental (Corporate)</span>
                <span className="font-bold text-violet-700 dark:text-violet-400">30% flat</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300">Customs Duty</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">0 – 35% on CIF</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs">
                <span className="font-semibold text-orange-800 dark:text-orange-300">Import Surtax</span>
                <span className="font-bold text-orange-700 dark:text-orange-400">10% on CIF+Customs+Excise</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quarterly Tax Summary ─────────────────────────────────────── */}
        <QuarterlyTaxSummary companyId={selectedCompanyId ?? undefined} />

        {/* ── Annual BIT Breakdown ──────────────────────────────────────── */}
        <AnnualBitBreakdown incomeTax={incomeTax} year={dashboard?.year ?? new Date().getFullYear()} />

        <EthiopianComplianceGuide defaultOpen="deadlines" />        {canViewVat && <IASBUpdateBanner compact />}
        {/* Overdue Tax & Penalty Summary */}
        <OverduePenaltySummary companyId={selectedCompanyId ?? undefined} />
      </div>

      {showWHT && (
        <WHTCertificateModal
          companyId={selectedCompanyId ?? undefined}
          companyName={activeCompany?.name}
          companyTin={activeCompany?.tin ?? undefined}
          onClose={() => setShowWHT(false)}
        />
      )}
    </AppPage>
  );
};

export default TaxDashboard;












