/**
 * MoR Report — IFRS Ethiopian Financial Statement Package
 * =========================================================
 * Bilingual (Amharic / English) financial statements ready for
 * submission to Ethiopia's Ministry of Revenues via etax.mor.gov.et
 *
 * Tab structure:
 *   Overview · Income Statement · Balance Sheet · Cash Flow ·
 *   Changes in Equity · Schedule A (CIT) · HR & Payroll ·
 *   Accounting Cycle · Compliance Dashboard
 */
import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable,
  AppTh, AppTd, AppTr, Btn, Icon,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  getMoRPackage,
  getMoRCompliance,
  getMoRAccountingCycle,
  getMoRScheduleA,
  getMoRHRPayroll,
  getMoRNotes,
  getMoRExportUrl,
} from '../services/ifrsApi';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null, dec = 2): string =>
  n == null ? '—' : `ETB ${Number(n).toLocaleString('en-ET', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
const pct = (n: number | undefined | null): string =>
  n == null ? '—' : `${(Number(n) * 100).toFixed(1)}%`;
const cyStart = (): string => `${new Date().getFullYear()}-01-01`;
const today   = (): string => new Date().toISOString().slice(0, 10);

type TabKey =
  | 'overview' | 'income' | 'balance' | 'cashflow'
  | 'equity' | 'schedule-a' | 'hr-payroll' | 'cycle' | 'notes' | 'compliance';

const TABS = [
  { key: 'overview',    label: 'Overview / ማጠቃለያ' },
  { key: 'income',      label: 'Income Statement / የገቢ መግለጫ' },
  { key: 'balance',     label: 'Balance Sheet / ሂሳብ ሚዛን' },
  { key: 'cashflow',    label: 'Cash Flow / ጥሬ ገንዘብ' },
  { key: 'equity',      label: 'Equity / ካፒታል' },
  { key: 'schedule-a',  label: 'Schedule A — CIT / ሰሌዳ ሀ' },
  { key: 'hr-payroll',  label: 'HR & Payroll / ሠራተኞች' },
  { key: 'cycle',       label: 'Accounting Cycle / ሂሳብ ዑደት' },
  { key: 'notes',       label: 'IFRS Notes / ማስታወሻዎች' },
  { key: 'compliance',  label: 'Compliance / ተገዢነት' },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

/** Bilingual section heading */
function SH({ en, am }: { en: string; am: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{en}</h3>
      {am && <p className="text-xs text-gray-400">{am}</p>}
    </div>
  );
}

/** Standard table row: label + optional ref + right-aligned amount */
function AR({
  code, en, am, amount, bold, ifrsRef, neg,
}: {
  code?: string; en: string; am?: string; amount?: number | null;
  bold?: boolean; ifrsRef?: string; neg?: boolean;
}) {
  const val = amount == null ? '—' : fmt(neg ? -Math.abs(amount) : amount);
  return (
    <tr className={`border-b border-gray-100 dark:border-gray-700 ${bold ? 'font-semibold bg-white dark:bg-gray-800' : ''}`}>
      {code !== undefined && <AppTd muted>{code}</AppTd>}
      <AppTd>
        <div className="text-sm">{en}</div>
        {am && <div className="text-xs text-gray-400">{am}</div>}
      </AppTd>
      <td className="px-4 py-2 text-xs text-[var(--pro-azure)] hidden md:table-cell">{ifrsRef ?? ''}</td>
      <AppTd align="right">
        <span className={`tabular-nums ${(amount ?? 0) < 0 ? 'text-red-600' : ''}`}>{val}</span>
      </AppTd>
    </tr>
  );
}

/** Bold total row with double-top border */
function TR({ en, am, amount }: { en: string; am?: string; amount?: number | null }) {
  return (
    <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-[var(--pro-azure-50)] dark:bg-green-900/20">
      <td colSpan={3} className="px-4 py-2 text-sm">
        {en}{am && <span className="text-xs font-normal text-gray-500 ml-1">/ {am}</span>}
      </td>
      <AppTd align="right"><span className="tabular-nums">{fmt(amount)}</span></AppTd>
    </tr>
  );
}

/** Coloured section label spanning all columns */
function SEC({ title, am, color = 'indigo' }: { title: string; am?: string; color?: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-green-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    blue:   'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    teal:   'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
    gray:   'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };
  return (
    <tr className={cls[color] ?? cls.indigo}>
      <td colSpan={4} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
        {title}{am && ` — ${am}`}
      </td>
    </tr>
  );
}

/** Status badge for accounting cycle */
function StepBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETE:    'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    PENDING:     'bg-gray-100 text-gray-500',
    ERROR:       'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? map.PENDING}`}>{status}</span>;
}

/** Compliance row chip */
function CF({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
      ok ? 'border-green-200 bg-green-50 text-green-800 dark:bg-green-900/10 dark:border-green-700 dark:text-green-300'
         : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/10 dark:border-red-700 dark:text-red-300'}`}>
      <Icon name={ok ? 'CHECK_CIRCLE' : 'X_CIRCLE'} className="w-4 h-4 flex-shrink-0" />
      {label}
    </div>
  );
}

// ── KPI helpers ───────────────────────────────────────────────────────────────
const kpi = (label: string, value: string | number, sub?: string) =>
  ({ label, value, sub });

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MoRReport() {
  usePageTitle('MoR Report — IFRS Ethiopian Financial Statements');
  const { selectedCompanyId } = useBusiness();

  const [tab, setTab]     = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg]     = useState<any>(null);
  const [comp, setComp]   = useState<any>(null);
  const [cycle, setCycle] = useState<any[]>([]);
  const [sa, setSA]       = useState<any>(null);
  const [hr, setHR]       = useState<any>(null);
  const [notes, setNotes] = useState<any>(null);

  const [startDate, setStartDate] = useState(cyStart());
  const [endDate,   setEndDate]   = useState(today());
  const [subType,   setSubType]   = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY'>('ANNUAL');

  const params = { companyId: selectedCompanyId ?? undefined, startDate, endDate, submissionType: subType };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, cy, s, h, n] = await Promise.all([
        getMoRPackage(params),
        getMoRCompliance(params),
        getMoRAccountingCycle(params),
        getMoRScheduleA(params),
        getMoRHRPayroll(params),
        getMoRNotes(params),
      ]);
      setPkg(p); setComp(c);
      setCycle(Array.isArray(cy) ? cy : []);
      setSA(s); setHR(h); setNotes(n);
    } catch {
      toast.error('Failed to load MoR report');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, startDate, endDate, subType]);

  useEffect(() => { load(); }, [load]);

  const hdr = pkg?.header;
  const overallStatus = comp?.overallStatus ?? '—';
  const statusCls = overallStatus === 'COMPLIANT' ? 'text-green-600' : overallStatus === 'PARTIAL' ? 'text-yellow-600' : 'text-red-600';

  const actions = (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-400">Start</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-400">End</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
      </div>
      <select value={subType} onChange={e => setSubType(e.target.value as any)}
        className="border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white self-end">
        <option value="ANNUAL">Annual</option>
        <option value="QUARTERLY">Quarterly</option>
        <option value="MONTHLY">Monthly</option>
      </select>
      <Btn size="sm" onClick={load} disabled={loading}>
        <Icon name="REFRESH_CW" className="w-3.5 h-3.5 mr-1" />
        {loading ? 'Loading…' : 'Generate'}
      </Btn>
      <a href="https://etax.mor.gov.et" target="_blank" rel="noreferrer">
        <Btn size="sm" variant="secondary">
          <Icon name="EXTERNAL_LINK" className="w-3.5 h-3.5 mr-1" />
          eTax Portal
        </Btn>
      </a>
      {pkg && (
        <a
          href={getMoRExportUrl({ companyId: selectedCompanyId ?? undefined, startDate, endDate, submissionType: subType })}
          download
          target="_blank"
          rel="noreferrer"
        >
          <Btn size="sm" variant="secondary">
            <Icon name="DOWNLOAD" className="w-3.5 h-3.5 mr-1" />
            Export JSON
          </Btn>
        </a>
      )}
    </div>
  );

  return (
    <AppPage
      title="MoR IFRS Report / የሚኒስቴር ገቢዎች IFRS ሪፖርት"
      subtitle={hdr ? `${hdr.companyName} · TIN: ${hdr.tin} · ${hdr.fiscalYear} · ${hdr.ifrsStandard} · Category ${hdr.ercaCategory}` : 'Ethiopian Ministry of Revenues — IFRS Financial Statements'}
      actions={actions}
      loading={loading}
      tabs={<AppTabs tabs={TABS} active={tab} onChange={v => setTab(v as TabKey)} />}
    >
      {/* Meta strip */}
      {hdr && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span><b>VAT No:</b> {hdr.vatNumber ?? 'N/A'}</span>
          <span><b>Currency:</b> {hdr.currency}</span>
          <span><b>Audit Required:</b> {hdr.auditRequired ? 'Yes (Cat A)' : 'No'}</span>
          <span><b>Ref:</b> {pkg?.submissionRef}</span>
          <span className={`font-semibold ${statusCls}`}>● {overallStatus}</span>
        </div>
      )}

      {tab === 'overview'    && <OverviewTab    pkg={pkg} comp={comp} loading={loading} />}
      {tab === 'income'      && <IncomeTab      s={pkg?.incomeStatement} />}
      {tab === 'balance'     && <BalanceTab     s={pkg?.balanceSheet} />}
      {tab === 'cashflow'    && <CashFlowTab    s={pkg?.cashFlowStatement} />}
      {tab === 'equity'      && <EquityTab      s={pkg?.equityStatement} />}
      {tab === 'schedule-a'  && <ScheduleATab   s={sa} />}
      {tab === 'hr-payroll'  && <HRPayrollTab   s={hr} />}
      {tab === 'cycle'       && <CycleTab       steps={cycle} />}
      {tab === 'notes'       && <NotesTab       s={notes} />}
      {tab === 'compliance'  && <ComplianceTab  c={comp} />}
    </AppPage>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ pkg, comp, loading }: { pkg: any; comp: any; loading: boolean }) {
  if (loading) return <div className="py-12 text-center text-gray-400">Generating statements…</div>;
  if (!pkg)    return <div className="py-12 text-center text-gray-400">Click Generate to build the MoR package.</div>;

  const is = pkg.incomeStatement;
  const bs = pkg.balanceSheet;
  const sa = pkg.scheduleA;
  const hr = pkg.hrSummary;

  const kpis1 = [
    kpi('Revenue / ጠቅላላ ገቢ',         fmt(is?.revenue?.totalRevenue),  'IFRS 15'),
    kpi('Net Profit / ጥቅም',            fmt(is?.profitForPeriod),        'After tax'),
    kpi('Total Assets / ጠቅላላ ንብረቶች', fmt(bs?.totalAssets),            'IAS 1.54'),
    kpi('Tax Payable / ቀረጥ ዕዳ',       fmt(sa?.finalTaxPayable),        sa?.matApplies ? 'MAT 2.5%' : 'CIT 30%'),
  ];
  const kpis2 = [
    kpi('Gross Payroll / ደሞዝ',         fmt(hr?.payroll?.grossPayroll),  'IAS 19'),
    kpi('PIT Withheld / ቀረጥ ቀርቷል',  fmt(hr?.payroll?.pitWithheld),   'Schedule A'),
    kpi('Pension Total / ጡረታ',        fmt((hr?.payroll?.employeePension ?? 0) + (hr?.payroll?.employerPension ?? 0)), '7% + 11%'),
    kpi('Gross Margin',                 pct((is?.grossProfit ?? 0) / Math.max(1, is?.revenue?.totalRevenue ?? 1)), ''),
  ];

  return (
    <div className="space-y-5">
      <AppKpi cells={kpis1} />
      <AppKpi cells={kpis2} />

      {comp?.issues?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            ⚠ Compliance Issues / የተገዢነት ጉዳዮች
          </p>
          <ul className="space-y-1">
            {comp.issues.map((iss: string, i: number) => (
              <li key={i} className="text-sm text-red-600">• {iss}</li>
            ))}
          </ul>
        </div>
      )}

      {pkg.morTaxBridge && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
          <SH en="MoR Tax Bridge — IFRS Profit → Taxable Income" am="ለሚኒስቴር ገቢዎች ቀረጥ ድልድይ" />
          <div className="space-y-0.5 font-mono text-xs text-gray-700 dark:text-gray-300">
            {pkg.morTaxBridge.reconciliationNotes?.map((n: string, i: number) => (
              <p key={i}>{n}</p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
        <span className="font-semibold text-gray-600 dark:text-gray-300">Standards: </span>
        IAS 1 · IAS 2 · IAS 7 · IAS 12 · IAS 16 · IAS 19 · IAS 21 · IAS 37 · IAS 38 ·
        IFRS 9 · IFRS 15 · IFRS 16 · IFRS 18 | Proc. 979/2016 · 285/2002 · 1395/2025 · PFSA · AABE
      </div>

      {/* Quick action links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { href: 'https://etax.mor.gov.et',                         label: 'etax.mor.gov.et', sub: 'Submit returns', ext: true },
          { href: 'https://pfsa.gov.et',                             label: 'pfsa.gov.et',     sub: 'Pension portal', ext: true },
          { href: '/reports/financial-statements',                   label: 'IFRS Statements', sub: 'IAS 1 detail view', ext: false },
          { href: '/tax/filing',                                     label: 'Tax Filing',      sub: 'All tax types',   ext: false },
        ].map((l) => (
          l.ext
            ? <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[var(--pro-azure-light)] dark:hover:border-[var(--pro-azure-light)] transition-colors text-center cursor-pointer">
                <span className="text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{l.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{l.sub}</span>
              </a>
            : <a key={l.href} href={l.href}
                className="flex flex-col items-center justify-center p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[var(--pro-azure-light)] dark:hover:border-[var(--pro-azure-light)] transition-colors text-center cursor-pointer">
                <span className="text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{l.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{l.sub}</span>
              </a>
        ))}
      </div>
    </div>
  );
}

// ── Income Statement Tab ──────────────────────────────────────────────────────
function IncomeTab({ s }: { s: any }) {
  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const r = s.revenue; const oe = s.operatingExpenses; const tax = s.incomeTax;
  return (
    <div className="space-y-3">
      <div className="text-center text-sm">
        <p className="font-bold">{s.header?.companyName}</p>
        <p className="text-gray-500">Statement of Profit or Loss / የትርፍ ወይም ኪሳራ መግለጫ (IFRS 18 / IAS 1)</p>
        <p className="text-xs text-gray-400">{s.periodLabel?.en} · {s.header?.currency} · {s.header?.ifrsStandard}</p>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh width="64px">Code</AppTh><AppTh>Description / መግለጫ</AppTh>
          <AppTh>Ref</AppTh><AppTh align="right">ETB</AppTh>
        </tr></thead>
        <tbody>
          <SEC title="REVENUE" am="ሀ. ገቢ (IFRS 15 / IFRS 18 Operating)" />
          <AR code={r?.salesOfGoods?.code}       en="Sales of Goods"          am="የዕቃ ሽያጭ"         amount={r?.salesOfGoods?.currentPeriod}       ifrsRef="IFRS 15.31" />
          <AR code={r?.servicesRevenue?.code}    en="Revenue from Services"   am="ከአገልግሎት ገቢ"      amount={r?.servicesRevenue?.currentPeriod}     ifrsRef="IFRS 15.35" />
          <AR code={r?.otherOperatingIncome?.code} en="Other Operating Income" am="ሌሎች የሥራ ገቢዎች"  amount={r?.otherOperatingIncome?.currentPeriod} />
          <TR en="Total Revenue" am="ጠቅላላ ገቢ" amount={r?.totalRevenue} />

          <SEC title="COST OF SALES" am="ለ. የሽያጭ ዋጋ (IAS 2)" color="orange" />
          <AR code={s.costOfSales?.code} en="Cost of Sales" am="የሽያጭ ዋጋ" amount={s.costOfSales?.currentPeriod} neg ifrsRef="IAS 2.36" />
          <TR en={`Gross Profit (${s.grossMarginPct?.toFixed(1) ?? 0}%)`} am="ጠቅላላ ትርፍ" amount={s.grossProfit} />

          <SEC title="OPERATING EXPENSES" am="ሐ. የሥራ ወጪዎች (IFRS 18 Operating)" color="orange" />
          <AR code={oe?.employeeBenefits?.code}     en="Employee Benefits (Salaries + Pension + Gratuity)" am="የሠራተኛ ጥቅማጥቅሞች" amount={oe?.employeeBenefits?.currentPeriod}     neg ifrsRef="IAS 19.44" />
          <AR code={oe?.depreciation?.code}         en="Depreciation & Amortisation"                      am="ዝቅጠት እና ቅነሳ"   amount={oe?.depreciation?.currentPeriod}         neg ifrsRef="IAS 16 / IAS 38" />
          <AR code={oe?.rentAndUtilities?.code}     en="Rent, Utilities & Short-Term Leases"              am="ቤት ኪራይ እና አቅርቦቶች" amount={oe?.rentAndUtilities?.currentPeriod} neg ifrsRef="IFRS 16.6" />
          <AR code={oe?.sellingExpenses?.code}      en="Selling Expenses"                                 am="የሽያጭ ወጪዎች"     amount={oe?.sellingExpenses?.currentPeriod}      neg />
          <AR code={oe?.adminExpenses?.code}        en="General & Administrative"                         am="አጠቃላይ እና አስተዳደር" amount={oe?.adminExpenses?.currentPeriod}       neg />
          <AR code={oe?.provisionForECL?.code}      en="ECL Provision"                                    am="IFRS 9 ECL"     amount={oe?.provisionForECL?.currentPeriod}      neg ifrsRef="IFRS 9.5.5.1" />
          <AR code={oe?.vatNonRecoverable?.code}    en="Non-Recoverable VAT"                              am="ሊያዙ የማይችሉ VAT" amount={oe?.vatNonRecoverable?.currentPeriod}    neg ifrsRef="Proc. 285/2002" />
          <AR code={oe?.totExpense?.code}           en="Turnover Tax (TOT)"                               am="የሽያጭ ቀረጥ"      amount={oe?.totExpense?.currentPeriod}           neg ifrsRef="Proc. 1395/2025" />
          <AR code={oe?.otherOperatingExpenses?.code} en="Other Operating Expenses"                       am="ሌሎች የሥራ ወጪዎች" amount={oe?.otherOperatingExpenses?.currentPeriod} neg />
          <TR en="Total Operating Expenses" am="ጠቅላላ ወጪዎች" amount={oe?.totalOperatingExpenses ? -oe.totalOperatingExpenses : null} />
          <TR en="Operating Profit (EBIT)" am="የሥራ ትርፍ" amount={s.operatingProfit} />

          <SEC title="INVESTING INCOME" am="መ. IFRS 18 Investing" color="blue" />
          <AR code={s.interestIncome?.code}    en="Interest Income"        am="የወለድ ገቢ"      amount={s.interestIncome?.currentPeriod}    ifrsRef="IFRS 18" />
          <AR code={s.dividendIncome?.code}    en="Dividend Income"        am="ትርፍ ድርሻ ገቢ"  amount={s.dividendIncome?.currentPeriod}    ifrsRef="IFRS 18" />
          <AR code={s.gainLossOnDisposal?.code} en="Gain/(Loss) on Disposal" am="ንብረት ሽያጭ ትርፍ" amount={s.gainLossOnDisposal?.currentPeriod} ifrsRef="IAS 16.68" />

          <SEC title="FINANCING" am="ሠ. IFRS 18 Financing" color="purple" />
          <AR code={s.interestExpense?.code} en="ovds Costs"         am="የፋይናንስ ወጪዎች"   amount={s.interestExpense?.currentPeriod} neg ifrsRef="IFRS 16.49" />
          <AR code={s.fxGainLoss?.code}      en="FX Gain/(Loss)"        am="የምንዛሬ ትርፍ/ኪሳራ" amount={s.fxGainLoss?.currentPeriod}      ifrsRef="IAS 21.28" />
          <TR en="Profit Before Tax" am="ቀረጥ በፊት ትርፍ" amount={s.profitBeforeTax} />

          <SEC title="INCOME TAX (IAS 12)" am={`ረ. ${tax?.matApplies ? 'MAT 2.5% Applies' : 'CIT 30%'}`} color="red" />
          <AR code={tax?.currentTax?.code}  en="Current Income Tax"           am="የአሁኑ ቀረጥ"  amount={tax?.currentTax?.currentPeriod}  neg ifrsRef="IAS 12.58" />
          <AR code={tax?.deferredTax?.code} en="Deferred Tax Expense/(Income)" am="የዘገዩ ቀረጥ" amount={tax?.deferredTax?.currentPeriod} neg ifrsRef="IAS 12.58" />
          <TR en="Profit for the Period" am="የዓመቱ ትርፍ" amount={s.profitForPeriod} />

          <SEC title="OTHER COMPREHENSIVE INCOME (OCI)" am="ሰ. ሌሎች ሁሉ-አቀፍ ገቢዎች" color="teal" />
          <AR code={s.oci?.revaluationSurplus?.code} en="Revaluation Surplus (PPE)"        am="IAS 16.39"  amount={s.oci?.revaluationSurplus?.currentPeriod}  ifrsRef="IAS 16.39" />
          <AR code={s.oci?.actuarialGainLoss?.code}  en="Actuarial Gains/(Losses)"         am="IAS 19.120" amount={s.oci?.actuarialGainLoss?.currentPeriod}   ifrsRef="IAS 19.120" />
          <AR code={s.oci?.fxTranslation?.code}      en="FX Translation Reserve"           am="IAS 21.52"  amount={s.oci?.fxTranslation?.currentPeriod}       ifrsRef="IAS 21.52" />
          <TR en="Total Comprehensive Income" am="ጠቅላላ ሁሉ-አቀፍ ገቢ" amount={s.totalComprehensiveIncome} />
        </tbody>
      </AppTable>
      <p className="text-xs text-gray-400">
        Effective tax rate: {pct(tax?.effectiveTaxRate)} · Gross margin: {s.grossMarginPct?.toFixed(1)}% ·
        Generated: {s.generatedAt ? new Date(s.generatedAt).toLocaleString() : '—'}
      </p>
    </div>
  );
}

// ── Balance Sheet Tab ─────────────────────────────────────────────────────────
function BalanceTab({ s }: { s: any }) {
  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const ca = s.currentAssets; const nca = s.nonCurrentAssets;
  const cl = s.currentLiabilities; const ncl = s.nonCurrentLiabilities; const eq = s.equity;
  const block = (obj: any) => obj ? Object.values(obj).filter((l: any) => l && l.code) : [];
  return (
    <div className="space-y-3">
      <div className="text-center text-sm">
        <p className="font-bold">{s.header?.companyName}</p>
        <p className="text-gray-500">Statement of Financial Position / የፋይናንሺያል አቋም መግለጫ (IAS 1.54)</p>
        <p className="text-xs text-gray-400">{s.asAtLabel?.en} · {s.header?.currency}</p>
        {!s.isBalanced && <p className="text-xs text-red-600 font-semibold">⚠ Balance sheet does not balance</p>}
      </div>
      <AppTable>
        <thead><tr>
          <AppTh width="64px">Code</AppTh><AppTh>Description / መግለጫ</AppTh>
          <AppTh>Ref</AppTh><AppTh align="right">ETB</AppTh>
        </tr></thead>
        <tbody>
          <SEC title="ASSETS / ንብረቶች" color="gray" />
          <SEC title="Current Assets" am="አጭር-ጊዜ ንብረቶች" />
          {block(ca).map((l: any) => <AR key={l.code} code={l.code} en={l.label?.en} am={l.label?.am} amount={l.currentPeriod} ifrsRef={l.ifrsRef} />)}
          <TR en="Total Current Assets" am="ጠቅላላ አጭር-ጊዜ ንብረቶች" amount={ca?.totalCurrentAssets} />
          <SEC title="Non-Current Assets" am="ረጅም-ጊዜ ንብረቶች" />
          {block(nca).map((l: any) => <AR key={l.code} code={l.code} en={l.label?.en} am={l.label?.am} amount={l.currentPeriod} ifrsRef={l.ifrsRef} />)}
          <TR en="Total Non-Current Assets" am="ጠቅላላ ረጅም-ጊዜ ንብረቶች" amount={nca?.totalNonCurrentAssets} />
          <TR en="TOTAL ASSETS / ጠቅላላ ንብረቶች" amount={s.totalAssets} />

          <SEC title="LIABILITIES & EQUITY / ዕዳዎችና ካፒታል" color="gray" />
          <SEC title="Current Liabilities" am="አጭር-ጊዜ ዕዳዎች" color="orange" />
          {block(cl).map((l: any) => <AR key={l.code} code={l.code} en={l.label?.en} am={l.label?.am} amount={l.currentPeriod} ifrsRef={l.ifrsRef} />)}
          <TR en="Total Current Liabilities" am="ጠቅላላ አጭር-ጊዜ ዕዳዎች" amount={cl?.totalCurrentLiabilities} />
          <SEC title="Non-Current Liabilities" am="ረጅም-ጊዜ ዕዳዎች" color="orange" />
          {block(ncl).map((l: any) => <AR key={l.code} code={l.code} en={l.label?.en} am={l.label?.am} amount={l.currentPeriod} ifrsRef={l.ifrsRef} />)}
          <TR en="Total Non-Current Liabilities" am="ጠቅላላ ረጅም-ጊዜ ዕዳዎች" amount={ncl?.totalNonCurrentLiabilities} />
          <TR en="Total Liabilities" am="ጠቅላላ ዕዳዎች" amount={s.totalLiabilities} />

          <SEC title="Equity / ካፒታል (IAS 1.79)" color="blue" />
          {block(eq).map((l: any) => <AR key={l.code} code={l.code} en={l.label?.en} am={l.label?.am} amount={l.currentPeriod} ifrsRef={l.ifrsRef} />)}
          <TR en="Total Equity" am="ጠቅላላ ካፒታል" amount={eq?.totalEquity} />
          <TR en="TOTAL LIABILITIES & EQUITY / ጠቅላላ" amount={s.totalLiabilitiesAndEquity} />
        </tbody>
      </AppTable>
      <p className="text-xs text-gray-400">Balanced: {s.isBalanced ? '✓' : '✗'} · Generated: {s.generatedAt ? new Date(s.generatedAt).toLocaleString() : '—'}</p>
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────────────────────
function CashFlowTab({ s }: { s: any }) {
  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const CfRow = ({ item }: { item: any }) => !item ? null : (
    <tr className="border-b border-gray-100 dark:border-gray-700">
      <AppTd><div className="text-sm">{item.label?.en}</div><div className="text-xs text-gray-400">{item.label?.am}</div></AppTd>
      <td className="px-4 py-2 text-xs text-[var(--pro-azure)] hidden md:table-cell">{item.ifrsRef ?? ''}</td>
      <AppTd align="right"><span className={`tabular-nums text-sm ${(item.amount ?? 0) < 0 ? 'text-red-600' : ''}`}>{fmt(item.amount)}</span></AppTd>
    </tr>
  );
  return (
    <div className="space-y-3">
      <div className="text-center text-sm">
        <p className="font-bold">{s.header?.companyName}</p>
        <p className="text-gray-500">Statement of Cash Flows (Indirect Method) / የጥሬ ገንዘብ ፍሰት (IAS 7)</p>
        <p className="text-xs text-gray-400">{s.periodLabel?.en}</p>
      </div>
      <AppTable>
        <thead><tr><AppTh>Description / መግለጫ</AppTh><AppTh>Ref</AppTh><AppTh align="right">ETB</AppTh></tr></thead>
        <tbody>
          <SEC title="Operating Activities" am="ከሥራ ጥሬ ገንዘብ" />
          <tr className="border-b dark:border-gray-700">
            <AppTd><div className="text-sm font-medium">Profit Before Tax / ቀረጥ በፊት ትርፍ</div></AppTd>
            <td className="px-4 py-2 text-xs text-[var(--pro-azure)] hidden md:table-cell">IAS 7.18</td>
            <AppTd align="right"><span className="tabular-nums">{fmt(s.profitBeforeTax)}</span></AppTd>
          </tr>
          <tr><td colSpan={3} className="px-4 py-1 text-xs text-gray-400 italic">Non-cash adjustments / ጥሬ ያልሆኑ ማስተካከያዎች:</td></tr>
          {Object.values(s.adjustments ?? {}).map((item: any) => <CfRow key={item.code} item={item} />)}
          <tr><td colSpan={3} className="px-4 py-1 text-xs text-gray-400 italic">Working capital changes / የዙሪያ ካፒታል ለውጦች:</td></tr>
          {Object.values(s.workingCapital ?? {}).map((item: any) => <CfRow key={item.code} item={item} />)}
          <CfRow item={s.taxPaid} />
          <TR en="Net Cash from Operations" am="ከሥራ ጥሬ ገንዘብ ፍሰት" amount={s.netOperating} />

          <SEC title="Investing Activities" am="ኢንቨስትመንት ተግባር" color="blue" />
          {Object.values(s.investing ?? {}).map((item: any) => <CfRow key={item.code} item={item} />)}
          <TR en="Net Cash from Investing" am="ከኢንቨስትመንት ፍሰት" amount={s.netInvesting} />

          <SEC title="Financing Activities" am="ፋይናንሺያል ተግባር" color="purple" />
          {Object.values(s.financing ?? {}).map((item: any) => <CfRow key={item.code} item={item} />)}
          <TR en="Net Cash from Financing" am="ከፋይናንሺያል ፍሰት" amount={s.netFinancing} />

          <SEC title="Net Change in Cash" color="gray" />
          <tr className="border-b dark:border-gray-700 font-semibold">
            <AppTd><div className="text-sm">Net Change in Cash / ጥሬ ገንዘብ ለውጥ</div></AppTd>
            <td className="px-4 py-2 text-xs text-[var(--pro-azure)] hidden md:table-cell">IAS 7.45</td>
            <AppTd align="right"><span className={`tabular-nums ${(s.netChangeInCash ?? 0) < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(s.netChangeInCash)}</span></AppTd>
          </tr>
          <AR en="Opening Cash" am="የመክፈቻ ጥሬ ገንዘብ" amount={s.openingCash} />
          <AR en="FX Effect on Cash (IAS 21)" am="የምንዛሬ ውጤት" amount={s.fxEffectOnCash} ifrsRef="IAS 21" />
          <TR en="Closing Cash" am="የዝጊያ ጥሬ ገንዘብ" amount={s.closingCash} />
        </tbody>
      </AppTable>
    </div>
  );
}

// ── Equity Statement Tab ──────────────────────────────────────────────────────
function EquityTab({ s }: { s: any }) {
  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const cols = s.columns ?? []; const rows = s.rows ?? [];
  return (
    <div className="space-y-4">
      <div className="text-center text-sm">
        <p className="font-bold">{s.header?.companyName}</p>
        <p className="text-gray-500">Statement of Changes in Equity / የካፒታል ለውጦች (IAS 1.106)</p>
        <p className="text-xs text-gray-400">{s.periodLabel?.en}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--pro-azure-50)] dark:bg-green-900/20">
              <th className="text-left px-3 py-2 font-semibold border-b dark:border-gray-600 min-w-48">Movement</th>
              {cols.map((c: any, i: number) => (
                <th key={i} className="text-right px-3 py-2 font-semibold border-b dark:border-gray-600 whitespace-nowrap">
                  <div>{c.en}</div><div className="text-xs font-normal text-gray-400">{c.am}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => {
              const edge = i === 0 || i === rows.length - 1;
              return (
                <tr key={i} className={`border-b dark:border-gray-700 ${edge ? 'font-bold bg-white dark:bg-gray-800' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="text-sm">{row.label?.en}</div>
                    <div className="text-xs text-gray-400">{row.label?.am}</div>
                  </td>
                  {['shareCapital','retainedEarnings','revaluationReserve','ociAccumulated','total'].map(k => (
                    <td key={k} className={`px-3 py-2 text-right tabular-nums ${(row[k] ?? 0) < 0 ? 'text-red-600' : ''}`}>
                      {row[k] != null ? fmt(row[k], 0) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AppKpi cells={[
        kpi('Opening Equity', fmt(s.openingBalances?.total, 0), 'የመክፈቻ ካፒታል'),
        kpi('Profit for Period', fmt(s.profitForPeriod, 0), 'የዓመቱ ትርፍ'),
        kpi('Dividends Declared', fmt(s.dividendsDeclared, 0), 'የተወሰነ ትርፍ'),
        kpi('Closing Equity', fmt(s.closingBalances?.total, 0), 'የዝጊያ ካፒታል'),
      ]} />
    </div>
  );
}

// ── Schedule A Tab ────────────────────────────────────────────────────────────
function ScheduleATab({ s }: { s: any }) {
  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  return (
    <div className="space-y-5">
      <div className="text-center text-sm">
        <p className="font-bold">{s.header?.companyName}</p>
        <p className="text-gray-500">Schedule A — Business Income Tax / ሰሌዳ ሀ — ቢዝነስ ቀረጥ ስሌት</p>
        <p className="text-xs text-gray-400">EFY {s.fiscalYear} · Category {s.taxpayerCategory} · Proc. 979/2016 / 1395/2025</p>
      </div>
      <AppKpi cells={[
        kpi('IFRS Profit Before Tax', fmt(s.accountingProfitBeforeTax), 'ቀረጥ በፊት ትርፍ'),
        kpi('Taxable Net Income',     fmt(s.taxableNetIncome),          'የሚቀረጥ ገቢ'),
        kpi('CIT (30%)',              fmt(s.regularCIT),                'Proc. 979/2016'),
        kpi(`MAT (2.5%)${s.matApplies ? ' ✓' : ''}`, fmt(s.matPayable), 'Proc. 1395/2025'),
      ]} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Add-backs */}
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <SH en="Add-backs — Non-Deductible (Proc. 1395/2025 Art. 22)" am="ተጨማሪዎች — ሊቀናሹ ያልሆኑ" />
          <AppTable>
            <thead><tr><AppTh>Item / ንጥል</AppTh><AppTh>Ref</AppTh><AppTh align="right">ETB</AppTh></tr></thead>
            <tbody>
              {(s.addBacks ?? []).map((a: any, i: number) => (
                <AppTr key={i}>
                  <AppTd><div>{a.description?.en}</div><div className="text-xs text-gray-400">{a.description?.am}</div></AppTd>
                  <AppTd muted>{a.proclamationRef}</AppTd>
                  <AppTd align="right">{fmt(a.amount)}</AppTd>
                </AppTr>
              ))}
              <AppTr highlighted><AppTd>Total Add-backs</AppTd><AppTd muted>—</AppTd><AppTd align="right">{fmt(s.totalAddBacks)}</AppTd></AppTr>
            </tbody>
          </AppTable>
        </div>
        {/* Deductions */}
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <SH en="Deductions — Tax-Exempt (Art. 23 / 28)" am="ተቀናሾች — ቀረጥ-ነፃ" />
          <AppTable>
            <thead><tr><AppTh>Item / ንጥል</AppTh><AppTh>Ref</AppTh><AppTh align="right">ETB</AppTh></tr></thead>
            <tbody>
              {(s.deductions ?? []).map((d: any, i: number) => (
                <AppTr key={i}>
                  <AppTd><div>{d.description?.en}</div><div className="text-xs text-gray-400">{d.description?.am}</div></AppTd>
                  <AppTd muted>{d.proclamationRef}</AppTd>
                  <AppTd align="right">{fmt(d.amount)}</AppTd>
                </AppTr>
              ))}
              <AppTr highlighted><AppTd>Total Deductions</AppTd><AppTd muted>—</AppTd><AppTd align="right">{fmt(s.totalDeductions)}</AppTd></AppTr>
            </tbody>
          </AppTable>
        </div>
      </div>

      {/* Summary waterfall */}
      <div className="border dark:border-gray-700 rounded-lg p-4">
        <SH en="Tax Computation Waterfall / ቀረጥ ስሌት" am="Schedule A" />
        <div className="space-y-1 text-sm">
          {[
            { en: 'Accounting Profit Before Tax',                   am: 'ቀረጥ በፊት ትርፍ',              val: s.accountingProfitBeforeTax },
            { en: '+ Total Add-backs',                              am: '+ ጠቅላላ ተጨማሪዎች',            val: s.totalAddBacks },
            { en: '− Total Deductions',                             am: '− ጠቅላላ ተቀናሾች',             val: -s.totalDeductions },
            { en: '= Taxable Net Income',                           am: '= የሚቀረጥ ጥቅል ገቢ',           val: s.taxableNetIncome, bold: true },
            { en: `CIT @ ${((s.citRate ?? 0.3) * 100).toFixed(0)}%`,am: 'Proc. 979/2016',             val: s.regularCIT },
            { en: `MAT @ ${((s.matRate ?? 0.025) * 100).toFixed(1)}% × revenue`, am: 'Proc. 1395/2025', val: s.matPayable },
            { en: s.matApplies ? 'MAT APPLIES (MAT > CIT)' : 'CIT APPLIES (CIT ≥ MAT)', am: '', val: s.taxBeforeCredits, bold: true },
            { en: '− WHT Credits', am: '− ቀርቶ ቀረጥ',   val: -s.whtCredits },
            { en: '− Provisional Tax Paid', am: '− ቅድሚያ', val: -s.provisionalTaxPaid },
            { en: 'FINAL TAX PAYABLE', am: 'ጠቅላላ የሚከፈለው', val: s.finalTaxPayable, bold: true },
          ].map((r, i) => (
            <div key={i} className={`flex justify-between py-1 border-b dark:border-gray-700 ${r.bold ? 'font-bold bg-white dark:bg-gray-700/50 px-2 rounded' : ''}`}>
              <span>{r.en}{r.am ? <span className="text-xs text-gray-400 ml-1">/ {r.am}</span> : null}</span>
              <span className={`tabular-nums ${(r.val ?? 0) < 0 ? 'text-red-600' : ''}`}>{fmt(r.val)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Due: {s.dueDate} · Effective rate: {pct(s.effectiveTaxRate)} ·
          IAS 12 Net DT: {fmt(s.netDeferredTaxPosition)}
        </p>
      </div>
    </div>
  );
}

// ── HR & Payroll Tab ──────────────────────────────────────────────────────────
function HRPayrollTab({ s }: { s: any }) {
  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const p = s.payroll ?? {}; const c = s.compliance ?? {}; const i19 = s.ias19 ?? {};
  return (
    <div className="space-y-5">
      <SH en="HR Overview — Recruitment · Training · Performance · Relations · Compliance" am="ሰው ኃይል ማጠቃለያ" />
      <AppKpi cells={[
        kpi('Total Employees',        String(s.totalEmployees ?? '—'),  'ጠቅላላ ሠራተኞች'),
        kpi('New Hires (Recruitment)', String(s.newHires ?? 0),         'አዲስ ቅጥሮች'),
        kpi('Exits',                  String(s.exits ?? 0),             'ከሥራ የወጡ'),
        kpi('Training Participants',  String(s.trainingParticipants ?? 0), 'ስልጠናተኞች'),
      ]} />

      <div className="border dark:border-gray-700 rounded-lg p-4">
        <SH en="Payroll Summary — Ethiopian Tax Deductions" am="ደሞዝ ማጠቃለያ — Proc. 1395/2025" />
        <AppTable>
          <thead><tr><AppTh>Item / ንጥል</AppTh><AppTh>Reference</AppTh><AppTh align="right">ETB</AppTh></tr></thead>
          <tbody>
            {[
              { en:'Gross Payroll',                   am:'ጠቅላላ ደሞዝ',                val: p.grossPayroll,     ref:'IAS 19.8' },
              { en:'Employee Pension (7%)',            am:'የሠ. ጡረታ (7%)',             val:-p.employeePension,  ref:'PFSA Regs' },
              { en:'PIT Withheld (Progressive)',       am:'ቀርቶ ቀረጥ',                 val:-p.pitWithheld,      ref:'Proc. 1395/2025' },
              { en:'DRRF Levy (1%)',                   am:'DRRF (1%)',                 val:-p.drrfDeducted,     ref:'Art. 101' },
              { en:'Net Pay to Employees',             am:'ሠ. የሚቀበሉ',                 val: p.netPay,           ref:'', bold: true },
              { en:'Employer Pension (11%) — Expense', am:'የቀ. ጡረታ (11%)',            val: p.employerPension,  ref:'IAS 19.44' },
            ].map((r, i) => (
              <AppTr key={i} highlighted={!!r.bold}>
                <AppTd><div className={r.bold ? 'font-semibold' : ''}>{r.en}</div><div className="text-xs text-gray-400">{r.am}</div></AppTd>
                <AppTd muted>{r.ref}</AppTd>
                <AppTd align="right"><span className={`tabular-nums ${(r.val ?? 0) < 0 ? 'text-red-600' : ''} ${r.bold ? 'font-semibold' : ''}`}>{fmt(r.val)}</span></AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <SH en="PAYE — MoR Reconciliation" am="eTax (etax.mor.gov.et)" />
          <div className="space-y-2 text-sm">
            {[
              { en:'PIT Withheld', am:'ከሠ. ቀርቷል',    val: p.pitWithheld },
              { en:'Declared to MoR', am:'ቀርቧል',       val: p.pitDeclaredMoR },
              { en:'ERCA Ref', am:'eTax ማጣቀሻ',         val: p.ercaRemittanceRef, txt: true },
            ].map((r, i) => (
              <div key={i} className="flex justify-between border-b dark:border-gray-700 py-1">
                <span>{r.en} <span className="text-xs text-gray-400">/ {r.am}</span></span>
                <span className="font-medium">{r.txt ? (r.val ?? '—') : fmt(r.val as number)}</span>
              </div>
            ))}
            <p className={`text-xs font-semibold mt-1 ${c.payeFiledOnTime ? 'text-green-600' : 'text-red-600'}`}>
              {c.payeFiledOnTime ? '✓ PAYE filed on time' : `⚠ ${c.overduePAYEMonths} month(s) overdue`}
            </p>
          </div>
        </div>
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <SH en="Pension — PFSA Reconciliation" am="ጡረታ" />
          <div className="space-y-2 text-sm">
            {[
              { en:'Employee (7%)',    am:'የሠ. ክፍያ',     val: p.employeePension },
              { en:'Employer (11%)',   am:'የቀ. ክፍያ',     val: p.employerPension },
              { en:'Remitted to PFSA', am:'ለPFSA ተላልፏል', val: p.pensionRemittedPFSA },
              { en:'PFSA Ref',        am:'PFSA ማጣቀሻ',   val: p.pfsaRemittanceRef, txt: true },
            ].map((r, i) => (
              <div key={i} className="flex justify-between border-b dark:border-gray-700 py-1">
                <span>{r.en} <span className="text-xs text-gray-400">/ {r.am}</span></span>
                <span className="font-medium">{r.txt ? (r.val ?? '—') : fmt(r.val as number)}</span>
              </div>
            ))}
            <p className={`text-xs font-semibold mt-1 ${c.pensionRemittedOnTime ? 'text-green-600' : 'text-red-600'}`}>
              {c.pensionRemittedOnTime ? '✓ Pension remitted on time' : `⚠ ${c.overduePensionMonths} month(s) overdue`}
            </p>
          </div>
        </div>
      </div>

      <div className="border dark:border-gray-700 rounded-lg p-4">
        <SH en="IAS 19 — Employee Benefits Disclosure" am="IAS 19 — የሠ. ጥቅማጥቅሞች ግልጸት" />
        <AppKpi cells={[
          kpi('Short-term Benefits', fmt(i19.shortTermBenefitsExpense, 0), 'IAS 19.8'),
          kpi('Gratuity Provision',  fmt(i19.gratuityProvision, 0),        'IAS 19 DBO'),
          kpi('Leave Accrual',       fmt(i19.leaveAccrual, 0),             'IAS 19'),
          kpi('Pension Cost',        fmt(i19.pensionCost, 0),              'IAS 19.44'),
        ]} />
        <p className="text-xs text-gray-400 mt-2">
          Labour Proc. 1156/2019 compliance: {c.laborLawCompliant ? '✓ Confirmed' : '⚠ Review required'}
        </p>
      </div>
    </div>
  );
}

// ── Accounting Cycle Tab ──────────────────────────────────────────────────────
function CycleTab({ steps }: { steps: any[] }) {
  if (!steps?.length) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const srcLabel: Record<string, string> = {
    IOT:'📡 IoT', SRM:'🔗 SRM', OFFLINE_SYNC:'💾 Offline',
    BANK_PORTAL:'🏦 Bank Portal', API:'🌐 eTax API', MANUAL:'✏️ Manual',
  };
  return (
    <div className="space-y-3">
      <SH en="Accounting Cycle — IoT → SRM → Offline Sync → MoR Submission" am="የሂሳብ ዑደት የምርምር መዝገብ" />
      {steps.map((step: any) => (
        <div key={step.step} className={`rounded-lg border p-4 ${
          step.status === 'COMPLETE'    ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' :
          step.status === 'IN_PROGRESS' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10' :
          step.status === 'ERROR'       ? 'border-red-200 bg-red-50 dark:bg-red-900/10' :
          'border-gray-200 bg-white dark:bg-gray-800/50 dark:border-gray-700'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <span className="w-6 h-6 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-green-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{step.nameEn}</p>
                <p className="text-xs text-gray-400">{step.nameAm}</p>
                {step.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{step.notes}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <StepBadge status={step.status} />
              <span className="text-xs text-gray-400">{srcLabel[step.source] ?? step.source}</span>
              {step.documentCount > 0 && <span className="text-xs text-gray-400">{step.documentCount} docs</span>}
            </div>
          </div>
        </div>
      ))}
      <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] rounded-lg p-3 text-xs text-[var(--pro-azure-dark)]">
        <strong>Submit at:</strong>{' '}
        <a href="https://etax.mor.gov.et" target="_blank" rel="noreferrer" className="underline hover:text-[var(--pro-azure-dark)]">etax.mor.gov.et</a>
        {' '}— VAT (30th next month) · PAYE (monthly) · Pension (30th, PFSA) · BIT/CIT (Nov 7 / 4 months after EFY)
      </div>
    </div>
  );
}

// ── Compliance Dashboard Tab ──────────────────────────────────────────────────
function ComplianceTab({ c }: { c: any }) {
  if (!c) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;
  const s = c.overallStatus;
  const bannerCls = s === 'COMPLIANT' ? 'bg-green-100 border-green-300 text-green-800'
                  : s === 'PARTIAL'   ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                  :                    'bg-red-100 border-red-300 text-red-700';
  return (
    <div className="space-y-5">
      <div className={`border rounded-lg p-4 ${bannerCls}`}>
        <p className="text-base font-bold">Overall Status: {s}</p>
        <p className="text-sm mt-0.5">
          {s === 'COMPLIANT' ? '✓ All Ethiopian tax obligations are met.' : `${c.issues?.length ?? 0} issue(s) require attention before MoR submission.`}
        </p>
      </div>

      <SH en="Tax Obligation Status / የቀረጥ ግዴታ ሁኔታ" am="" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CF ok={c.vatCompliant}     label="VAT — 15% (Proc. 285/2002 / Reg. 570/2025) / ቅናሽ ቀረጥ" />
        <CF ok={c.payeCompliant}    label="PAYE — Income Tax Withholding (Proc. 1395/2025) / ተቀንሶ ቀረጥ" />
        <CF ok={c.pensionCompliant} label="Pension — PFSA (Employee 7% + Employer 11%) / ጡረታ" />
        <CF ok={c.citCompliant}     label="CIT / MAT — Business Income Tax (Proc. 979/2016) / ቢዝነስ ቀረጥ" />
        <CF ok={c.whtCompliant}     label="WHT — Withholding Tax (Proc. 1395/2025 Art. 89) / ቀርቶ ቀረጥ" />
        <CF ok={!c.auditRequired}   label={c.auditRequired ? 'External Audit Required (Cat A) — AABE' : 'No External Audit Required (Cat B/C)'} />
      </div>

      {c.issues?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">Issues / ማስተካከያ ያስፈልጋቸዋል</p>
          <ul className="space-y-1">
            {c.issues.map((iss: string, i: number) => (
              <li key={i} className="text-sm text-red-600 flex gap-2"><span>•</span><span>{iss}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
        <SH en="MoR Submission Deadlines / ለሚኒስቴር ገቢዎች ቀናት" am="" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
          {[
            { en:'VAT Return',          am:'ቅናሽ ቀረጥ',          due:'30th of following month' },
            { en:'PAYE Declaration',    am:'ተቀንሶ ቀረጥ',          due:'30th of following month' },
            { en:'Pension (PFSA)',      am:'ጡረታ',               due:'30th of following month' },
            { en:'Business Income Tax', am:'ቢዝነስ ቀረጥ (BIT/CIT)', due:'4 months after EFY end (Nov 7)' },
            { en:'WHT Remittance',      am:'ቀርቶ ቀረጥ',           due:'30th of following month' },
            { en:'TOT (Category C)',    am:'የሽያጭ ቀረጥ',          due:'30th of following month' },
          ].map((d, i) => (
            <div key={i} className="flex justify-between border-b dark:border-gray-700 py-1">
              <span>{d.en} <span className="text-gray-400">/ {d.am}</span></span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{d.due}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Portal:{' '}
          <a href="https://etax.mor.gov.et" className="text-[var(--pro-azure)] hover:underline" target="_blank" rel="noreferrer">
            etax.mor.gov.et
          </a>
        </p>
      </div>
    </div>
  );
}

// ── IFRS Notes Tab (IAS 1.117) ────────────────────────────────────────────────
function NotesTab({ s }: { s: any }) {
  const [open, setOpen] = useState<number | null>(1);

  if (!s) return <div className="py-12 text-center text-gray-400">Click Generate.</div>;

  const notesList: any[] = s.notes ?? [];

  return (
    <div className="space-y-3">
      <div className="text-center text-sm mb-4">
        <p className="font-bold">{s.header?.companyName}</p>
        <p className="text-gray-500">
          Notes to the Financial Statements / ለፋይናንሺያል መግለጫዎች ማስታወሻዎች (IAS 1.117)
        </p>
        <p className="text-xs text-gray-400">{s.header?.fiscalYear} · {s.header?.ifrsStandard}</p>
      </div>

      {notesList.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">No notes available — click Generate first.</div>
      )}

      {notesList.map((note: any) => {
        const isOpen = open === note.noteNumber;
        return (
          <div
            key={note.noteNumber}
            className="border dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Header — clickable accordion trigger */}
            <button
              className={`w-full flex items-start justify-between gap-3 px-4 py-3 text-left transition-colors
                ${isOpen
                  ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20'
                  : 'bg-white dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700/50'}`}
              onClick={() => setOpen(isOpen ? null : note.noteNumber)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/50 text-[var(--pro-azure-dark)] dark:text-green-300 text-xs font-bold flex items-center justify-center">
                  {note.noteNumber}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                    {note.titleEn}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{note.titleAm}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {note.ifrsRef && (
                  <span className="text-xs text-[var(--pro-azure)] hidden sm:block">{note.ifrsRef}</span>
                )}
                <Icon
                  name={isOpen ? 'CHEVRON_UP' : 'CHEVRON_DOWN'}
                  className="w-4 h-4 text-gray-400"
                />
              </div>
            </button>

            {/* Body — expanded content */}
            {isOpen && (
              <div className="px-4 py-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                {/* Narrative content */}
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">
                  {note.content}
                </div>

                {/* Optional supporting table */}
                {note.tableData && note.tableData.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-white dark:bg-gray-700">
                          {Object.keys(note.tableData[0]).map((col: string) => (
                            <th key={col} className="text-left px-3 py-2 font-semibold border-b dark:border-gray-600 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {note.tableData.map((row: any, i: number) => (
                          <tr key={i} className="border-b dark:border-gray-700">
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300 tabular-nums">
                                {typeof val === 'number'
                                  ? val.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                  : String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Proclamation reference footer */}
                {note.proclamationRef && (
                  <p className="mt-3 text-xs text-gray-400 italic">
                    Legal basis: {note.proclamationRef}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-400 mt-2">
        These notes form an integral part of the financial statements as required by IAS 1.117.
        Prepared in accordance with IFRS as adopted by AABE (Proc. No. 847/2014).
      </div>
    </div>
  );
}
