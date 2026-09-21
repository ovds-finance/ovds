/**
 * Gratuity (Severance Pay) Calculator — Ethiopia
 * Based on: Labour Proclamation No. 1156/2019
 *
 * Ethiopian severance pay rules:
 * - Indefinite contract terminated by employer without cause: 30 days salary per year of service
 * - Fixed-term contract expires: 1/3 of monthly salary per year of service
 * - Employee terminates due to employer fault: same as termination by employer without cause
 * - Retirement or incapacity: 30 days salary per year of service
 *
 * Additional entitlements:
 * - Notice pay: 1 month salary for > 1 year service (if notice not given)
 * - Unused annual leave: paid out at daily rate
 * - Outstanding wages: all due unpaid wages
 */
import React, { useState, useMemo } from 'react';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Modal, FormField, Input, Select, Icon, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useGratuityRecords } from '../services/newTaxApi';

// -- Ethiopian Labour Act Constants --------------------------------------------
const SEVERANCE_DAYS_PER_YEAR    = 30;   // Days of salary per year of service
const FIXED_TERM_FRACTION        = 1/3;  // 1/3 month salary per year for fixed-term expiry
const ANNUAL_LEAVE_DAYS_PER_YEAR = 16;   // Min annual leave: 16 days/year + 1 day per year after 1st year
const OVERTIME_RATE_WEEKDAY      = 1.25; // 125% for weekday overtime
const OVERTIME_RATE_WEEKEND      = 1.50; // 150% for weekend overtime
const OVERTIME_RATE_HOLIDAY      = 2.00; // 200% for public holiday overtime
const WORKING_DAYS_PER_MONTH     = 26;   // Standard working days
const WORKING_HOURS_PER_DAY      = 8;    // Normal working hours

type TerminationType =
  | 'EMPLOYER_WITHOUT_CAUSE'
  | 'FIXED_TERM_EXPIRY'
  | 'MUTUAL_AGREEMENT'
  | 'EMPLOYEE_FAULT'
  | 'EMPLOYER_FAULT'
  | 'RETIREMENT'
  | 'INCAPACITY'
  | 'DEATH';

type ContractType = 'INDEFINITE' | 'FIXED_TERM' | 'PIECE_RATE';

interface GratuityResult {
  basicSeverancePay: number;
  noticePay: number;
  unusedLeavePay: number;
  totalGratuity: number;
  yearsOfService: number;
  monthsOfService: number;
  dailyRate: number;
  entitledToSeverance: boolean;
  notes: string[];
}

function calculateGratuity(
  monthlySalary: number,
  startDate: string,
  endDate: string,
  terminationType: TerminationType,
  contractType: ContractType,
  unusedLeaveDays: number,
  noticePeriodGiven: boolean,
): GratuityResult {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const totalDays    = diffMs / (1000 * 60 * 60 * 24);
  const yearsOfService  = Math.floor(totalDays / 365);
  const monthsOfService = Math.floor(totalDays / 30);
  const dailyRate = monthlySalary / WORKING_DAYS_PER_MONTH;
  const notes: string[] = [];

  let basicSeverancePay = 0;
  let entitledToSeverance = true;

  // -- Severance pay calculation ---------------------------------------------
  if (terminationType === 'EMPLOYEE_FAULT') {
    entitledToSeverance = false;
    basicSeverancePay   = 0;
    notes.push('No severance pay: terminated for cause (Labour Proc. 1156/2019, Art. 43)');
  } else if (terminationType === 'FIXED_TERM_EXPIRY' && contractType === 'FIXED_TERM') {
    basicSeverancePay = monthlySalary * FIXED_TERM_FRACTION * yearsOfService;
    notes.push(`Fixed-term expiry: 1/3 × monthly salary × ${yearsOfService} years`);
  } else if (['EMPLOYER_WITHOUT_CAUSE', 'EMPLOYER_FAULT', 'RETIREMENT', 'INCAPACITY', 'DEATH'].includes(terminationType)) {
    basicSeverancePay = dailyRate * SEVERANCE_DAYS_PER_YEAR * yearsOfService;
    notes.push(`Severance: ${SEVERANCE_DAYS_PER_YEAR} days/year × ${yearsOfService} years (Art. 40)`);
  } else if (terminationType === 'MUTUAL_AGREEMENT') {
    basicSeverancePay = dailyRate * SEVERANCE_DAYS_PER_YEAR * yearsOfService * 0.5;
    notes.push('Mutual agreement: 50% of standard severance (negotiable, Art. 28)');
  }

  // -- Notice pay ------------------------------------------------------------
  let noticePay = 0;
  if (!noticePeriodGiven && yearsOfService >= 1 && entitledToSeverance) {
    noticePay = monthlySalary; // 1 month salary in lieu of notice
    notes.push('Notice pay: 1 month salary (notice not given, Art. 33)');
  }

  // -- Unused annual leave payout --------------------------------------------
  const unusedLeavePay = unusedLeaveDays > 0 ? dailyRate * unusedLeaveDays : 0;
  if (unusedLeavePay > 0) {
    notes.push(`Unused leave: ${unusedLeaveDays} days × ETB ${dailyRate.toFixed(2)}/day (Art. 78)`);
  }

  const totalGratuity = basicSeverancePay + noticePay + unusedLeavePay;

  if (yearsOfService === 0) {
    notes.push('Less than 1 year of service: severance may be prorated by months');
  }

  return {
    basicSeverancePay,
    noticePay,
    unusedLeavePay,
    totalGratuity,
    yearsOfService,
    monthsOfService,
    dailyRate,
    entitledToSeverance,
    notes,
  };
}

// -- Overtime Calculator -------------------------------------------------------
const OvertimeCalculator: React.FC = () => {
  const [monthlySalary, setMonthlySalary] = useState('');
  const [weekdayHours, setWeekdayHours]   = useState('');
  const [weekendHours, setWeekendHours]   = useState('');
  const [holidayHours, setHolidayHours]   = useState('');

  const salary  = parseFloat(monthlySalary) || 0;
  const hourlyRate = salary / (WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY);

  const weekdayOT = (parseFloat(weekdayHours) || 0) * hourlyRate * OVERTIME_RATE_WEEKDAY;
  const weekendOT = (parseFloat(weekendHours) || 0) * hourlyRate * OVERTIME_RATE_WEEKEND;
  const holidayOT = (parseFloat(holidayHours) || 0) * hourlyRate * OVERTIME_RATE_HOLIDAY;
  const totalOT   = weekdayOT + weekendOT + holidayOT;

  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="p-4 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
        <p className="font-bold mb-1 flex items-center gap-2"><Icon name="INFO" size={12} /> Overtime Rules — Labour Proclamation No. 1156/2019, Art. 68–71</p>
        <ul className="space-y-0.5 ml-3 list-disc">
          <li>Weekday overtime (beyond 8 hrs): 125% of hourly rate</li>
          <li>Weekend/rest day work: 150% of hourly rate</li>
          <li>Public holiday work: 200% of hourly rate</li>
          <li>Max overtime: 2 hrs/day, 20 hrs/month, 100 hrs/year (Art. 68.3)</li>
          <li>Employee consent required for overtime (except emergencies)</li>
        </ul>
      </div>

      <div className="ovds-grid-layout cols-2">
        <FormField label="Monthly Basic Salary (ETB)">
          <Input type="number" min="0" step="0.01" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="0.00" />
        </FormField>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Hourly Rate</p>
          <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">ETB {fmt(hourlyRate)}</p>
          <p className="ovds-caption">salary ÷ ({WORKING_DAYS_PER_MONTH} days × {WORKING_HOURS_PER_DAY} hrs)</p>
        </div>
      </div>

      <div className="ovds-grid-layout cols-3">
        {[
          { label: 'Weekday Overtime Hours', value: weekdayHours, set: setWeekdayHours, rate: OVERTIME_RATE_WEEKDAY, pay: weekdayOT, color: 'text-amber-700' },
          { label: 'Weekend Hours',          value: weekendHours, set: setWeekendHours, rate: OVERTIME_RATE_WEEKEND, pay: weekendOT, color: 'text-orange-700' },
          { label: 'Public Holiday Hours',   value: holidayHours, set: setHolidayHours, rate: OVERTIME_RATE_HOLIDAY, pay: holidayOT, color: 'text-rose-700' },
        ].map(f => (
          <div key={f.label} className="space-y-2">
            <FormField label={`${f.label} (×${f.rate})`}>
              <Input type="number" min="0" step="0.5" value={f.value} onChange={e => f.set(e.target.value)} placeholder="0" />
            </FormField>
            <div className="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className={`text-sm font-bold tabular-nums ${f.color}`}>ETB {fmt(f.pay)}</p>
            </div>
          </div>
        ))}
      </div>

      {totalOT > 0 && (
        <div className="flex justify-between p-4 bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] dark:bg-green-950/20 dark:border-green-800 rounded-xl">
          <span className="text-sm font-semibold text-[var(--pro-azure-dark)] dark:text-green-300">Total Overtime Pay</span>
          <span className="text-xl font-bold tabular-nums text-[var(--pro-azure-dark)] dark:text-green-300">ETB {fmt(totalOT)}</span>
        </div>
      )}
    </div>
  );
};

// -- Annual Leave Calculator ---------------------------------------------------
const AnnualLeaveCalculator: React.FC = () => {
  const [yearsService, setYearsService] = useState('');
  const [daysUsed, setDaysUsed]         = useState('');
  const [salary, setSalary]             = useState('');

  const years   = parseInt(yearsService) || 0;
  const used    = parseInt(daysUsed) || 0;

  // Labour Proc. 1156/2019, Art. 76: 16 days base + 1 day per year after 1st year
  const entitledDays  = years <= 0 ? 0 : years <= 1 ? ANNUAL_LEAVE_DAYS_PER_YEAR : ANNUAL_LEAVE_DAYS_PER_YEAR + (years - 1);
  const remainingDays = Math.max(0, entitledDays - used);
  const dailyRate     = (parseFloat(salary) || 0) / WORKING_DAYS_PER_MONTH;
  const cashValue     = remainingDays * dailyRate;

  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="p-4 bg-sky-50 border border-sky-200 dark:bg-sky-950/20 dark:border-sky-800 rounded-xl text-xs text-sky-700 dark:text-sky-300">
        <p className="font-bold mb-1">Annual Leave — Art. 76, Labour Proc. 1156/2019</p>
        <ul className="space-y-0.5 ml-3 list-disc">
          <li>Year 1: 16 working days minimum annual leave</li>
          <li>Each additional year: +1 day (Year 2 = 17 days, Year 5 = 20 days, etc.)</li>
          <li>Leave carry-forward: maximum 1 year (use-it-or-lose-it after that)</li>
          <li>Cash-out on termination: all unused leave paid at basic daily rate</li>
          <li>Maternity leave: 90 days (30 pre, 60 post) — not deducted from annual leave</li>
        </ul>
      </div>

      <div className="ovds-grid-layout cols-3">
        <FormField label="Years of Service">
          <Input type="number" min="0" step="1" value={yearsService} onChange={e => setYearsService(e.target.value)} placeholder="0" />
        </FormField>
        <FormField label="Leave Days Used This Year">
          <Input type="number" min="0" step="1" value={daysUsed} onChange={e => setDaysUsed(e.target.value)} placeholder="0" />
        </FormField>
        <FormField label="Monthly Basic Salary (ETB)">
          <Input type="number" min="0" step="0.01" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0.00" />
        </FormField>
      </div>

      {years > 0 && (
        <div className="ovds-grid-layout cols-4 gap-sm">
          {[
            { label: 'Entitled Days',    value: `${entitledDays} days`,     accent: 'bg-sky-500' },
            { label: 'Used',             value: `${used} days`,             accent: 'bg-amber-500' },
            { label: 'Remaining',        value: `${remainingDays} days`,    accent: remainingDays > 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-400' },
            { label: 'Cash Value',       value: `ETB ${fmt(cashValue)}`,    accent: cashValue > 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-300' },
          ].map(k => (
            <div key={k.label} className="ovds-widget-card p-4">
              <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100 mt-1">{k.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -- Gratuity Records Table ----------------------------------------------------
const GratuityRecordsTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const { records, loading, refetch } = useGratuityRecords(companyId);
  const _fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-3">
      <AppTable>
        <thead><tr>
          <AppTh>Employee</AppTh>
          <AppTh>Start Date</AppTh>
          <AppTh>End Date</AppTh>
          <AppTh>Years</AppTh>
          <AppTh>Termination Type</AppTh>
          <AppTh align="right">Severance</AppTh>
          <AppTh align="right">Notice Pay</AppTh>
          <AppTh align="right">Leave Pay</AppTh>
          <AppTh align="right">Total</AppTh>
          <AppTh>Status</AppTh>
        </tr></thead>
        <tbody>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <AppTr key={i}>{Array.from({ length: 10 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
          )) : records.length === 0 ? (
            <AppTr><td colSpan={10} className="py-12 text-center text-sm text-slate-400">No gratuity records. Records are generated on employee termination.</td></AppTr>
          ) : records.map((r: any) => (
            <AppTr key={r.id}>
              <AppTd className="font-semibold">{r.employeeName}</AppTd>
              <AppTd>{r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'}</AppTd>
              <AppTd>{r.endDate ? new Date(r.endDate).toLocaleDateString() : '—'}</AppTd>
              <AppTd className="font-bold">{r.yearsOfService ?? '—'}</AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500">{r.terminationType?.replace(/_/g, ' ')}</span></AppTd>
              <AppTd align="right"><Amount value={r.basicSeverancePay ?? 0} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={r.noticePay ?? 0} size="sm" /></AppTd>
              <AppTd align="right"><Amount value={r.unusedLeavePay ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="font-bold"><Amount value={r.totalGratuity ?? 0} size="sm" /></AppTd>
              <AppTd>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.paid ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-amber-50 text-amber-700'}`}>
                  {r.paid ? 'PAID' : 'PENDING'}
                </span>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
    </div>
  );
};

// -- Gratuity Calculator Tab ---------------------------------------------------
const GratuityCalcTab: React.FC = () => {
  const [salary, setSalary]               = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState(new Date().toISOString().slice(0, 10));
  const [termType, setTermType]           = useState<TerminationType>('EMPLOYER_WITHOUT_CAUSE');
  const [contractType, setContractType]   = useState<ContractType>('INDEFINITE');
  const [unusedLeave, setUnusedLeave]     = useState('');
  const [noticePeriod, setNoticePeriod]   = useState(false);

  const result = useMemo(() => {
    if (!salary || !startDate) return null;
    return calculateGratuity(
      parseFloat(salary), startDate, endDate, termType, contractType,
      parseInt(unusedLeave) || 0, noticePeriod,
    );
  }, [salary, startDate, endDate, termType, contractType, unusedLeave, noticePeriod]);

  const fmt = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="ovds-grid-layout cols-2">
        <FormField label="Monthly Basic Salary (ETB)" required>
          <Input type="number" min="0" step="0.01" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Contract Type">
          <Select value={contractType} onChange={e => setContractType(e as ContractType)}>
            <option value="INDEFINITE">Indefinite (Permanent)</option>
            <option value="FIXED_TERM">Fixed-Term Contract</option>
            <option value="PIECE_RATE">Piece-Rate / Task-Based</option>
          </Select>
        </FormField>
        <FormField label="Employment Start Date" required>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </FormField>
        <FormField label="Termination Date">
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </FormField>
        <FormField label="Termination Type">
          <Select value={termType} onChange={e => setTermType(e as TerminationType)}>
            <option value="EMPLOYER_WITHOUT_CAUSE">Employer — Without Cause</option>
            <option value="EMPLOYER_FAULT">Employer — Employer Fault</option>
            <option value="EMPLOYEE_FAULT">Employee — Misconduct/Fault</option>
            <option value="FIXED_TERM_EXPIRY">Fixed-Term Contract Expiry</option>
            <option value="MUTUAL_AGREEMENT">Mutual Agreement</option>
            <option value="RETIREMENT">Retirement</option>
            <option value="INCAPACITY">Incapacity / Ill-Health</option>
            <option value="DEATH">Death</option>
          </Select>
        </FormField>
        <FormField label="Unused Annual Leave Days">
          <Input type="number" min="0" step="1" value={unusedLeave} onChange={e => setUnusedLeave(e.target.value)} placeholder="0" />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={noticePeriod} onChange={e => setNoticePeriod(e.target.checked)} className="rounded accent-indigo-500" />
        Proper notice period was given (1 month for &gt;1 year service)
      </label>

      {result && (
        <div className="space-y-4">
          <div className="ovds-grid-layout cols-4 gap-sm">
            {[
              { label: 'Years of Service', value: `${result.yearsOfService} yrs`, accent: 'bg-sky-500' },
              { label: 'Severance Pay',    value: `ETB ${fmt(result.basicSeverancePay)}`, accent: 'bg-violet-500' },
              { label: 'Notice Pay',       value: `ETB ${fmt(result.noticePay)}`,         accent: 'bg-amber-500' },
              { label: 'Total Gratuity',   value: `ETB ${fmt(result.totalGratuity)}`,     accent: result.totalGratuity > 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-400' },
            ].map(k => (
              <div key={k.label} className="ovds-widget-card p-4">
                <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100 mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="ovds-widget-card p-5 space-y-3">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Calculation Breakdown</p>
            <div className="space-y-2">
              {[
                { label: 'Daily Rate',         value: fmt(result.dailyRate),          sub: `ETB ${fmt(parseFloat(salary) || 0)} ÷ ${WORKING_DAYS_PER_MONTH} days` },
                { label: 'Basic Severance',    value: fmt(result.basicSeverancePay),  sub: result.entitledToSeverance ? `${SEVERANCE_DAYS_PER_YEAR} days × ${result.yearsOfService} yrs × ETB ${fmt(result.dailyRate)}/day` : 'Not entitled' },
                { label: 'Notice Pay',         value: fmt(result.noticePay),          sub: result.noticePay > 0 ? '1 month salary (notice not given)' : noticePeriod ? 'Notice given — no additional pay' : 'N/A' },
                { label: 'Unused Leave Pay',   value: fmt(result.unusedLeavePay),     sub: result.unusedLeavePay > 0 ? `${unusedLeave} days × ETB ${fmt(result.dailyRate)}/day` : 'No unused leave' },
                { label: 'TOTAL GRATUITY',     value: fmt(result.totalGratuity),      sub: 'Sum of all entitlements', bold: true },
              ].map(r => (
                <div key={r.label} className={`flex justify-between items-center px-4 py-2.5 rounded-xl ${r.bold ? 'bg-[var(--pro-azure)] text-white' : 'bg-white dark:bg-slate-800/50'}`}>
                  <div>
                    <p className={`text-[12px] font-bold ${r.bold ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{r.label}</p>
                    <p className={`text-[10px] ${r.bold ? 'text-green-100' : 'text-slate-400'}`}>{r.sub}</p>
                  </div>
                  <span className={`tabular-nums font-bold text-sm ${r.bold ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>ETB {r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            {result.notes.map((n, i) => (
              <p key={i} className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-light)] shrink-0" />
                {n}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const GratuityCalculator: React.FC = () => {
  usePageTitle('Gratuity & Labour Act');
  const { selectedCompanyId } = useBusiness();

  const [activeTab, setActiveTab] = useState<'gratuity' | 'records' | 'overtime' | 'leave' | 'guide'>('gratuity');

  const TABS = [
    { key: 'gratuity',  label: 'Gratuity Calculator' },
    { key: 'records',   label: 'Gratuity Records' },
    { key: 'overtime',  label: 'Overtime Calculator' },
    { key: 'leave',     label: 'Annual Leave' },
    { key: 'guide',     label: 'Labour Act Guide' },
  ] as const;

  return (
    <AppPage
      title="Gratuity & Labour Act"
      subtitle="Severance pay · Overtime · Annual leave — Labour Proclamation No. 1156/2019"
      icon={<Icon name="EMPLOYEE" size={18} />}
      crumbs={[{ label: 'HR', to: '/hr/employees' }, { label: 'Gratuity' }]}
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />}
    >
      {activeTab === 'gratuity' && <GratuityCalcTab />}
      {activeTab === 'records'  && <GratuityRecordsTab companyId={selectedCompanyId ?? undefined} />}
      {activeTab === 'overtime' && <OvertimeCalculator />}
      {activeTab === 'leave'    && <AnnualLeaveCalculator />}
      {activeTab === 'guide'    && (
        <div className="space-y-4 max-w-3xl">
          {[
            { ref: 'Art. 28', title: 'Employment Contract Types', color: 'border-sky-200 bg-sky-50', content: 'Three types: (1) Indefinite — no end date, most protections apply. (2) Fixed-term — for specific tasks or replacements; max 2 renewals before deemed indefinite. (3) Piece-rate/task-based — payment per output, still subject to minimum wage and overtime rules.' },
            { ref: 'Art. 40', title: 'Severance Pay (Termination Without Cause)', color: 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]', content: 'When employer terminates without valid cause: 30 days salary per year of service. Fractions of a year are prorated. Minimum: 1 month salary. Also payable on retirement, incapacity, or employer misconduct.' },
            { ref: 'Art. 43', title: 'Termination for Cause (No Severance)', color: 'border-rose-200 bg-rose-50', content: 'No severance payable when employee is dismissed for: theft, assault, serious misconduct, unauthorized disclosure, habitual negligence. Employer must give employee the right to be heard before dismissal. Notice required even for cause (unless grave misconduct).' },
            { ref: 'Art. 33', title: 'Notice Period Requirements', color: 'border-amber-200 bg-amber-50', content: '< 1 year: 30 days notice. 1–9 years: 60 days notice. > 10 years: 90 days notice. Either party may substitute with payment in lieu of notice (1 month salary for most cases).' },
            { ref: 'Art. 68', title: 'Overtime Rules', color: 'border-violet-200 bg-violet-50', content: 'Maximum: 2 hours/day, 20 hours/month, 100 hours/year. Rates: weekday 125%, weekend/rest day 150%, public holiday 200%. Employer needs employee consent (except emergency/force majeure). All overtime must be recorded and paid in same payroll period.' },
            { ref: 'Art. 76', title: 'Annual Leave Entitlement', color: 'border-teal-200 bg-teal-50', content: 'Minimum 16 working days after 1st year of service. Each additional year adds 1 more day. Leave can be split but at least 10 consecutive days must be given. Unused leave can be carried forward one year; after that it expires (except on termination — all unused leave is paid out).' },
            { ref: 'Art. 87', title: 'Maternity & Paternity Leave', color: 'border-pink-200 bg-pink-50', content: 'Maternity leave: 90 days paid (30 days before + 60 days after birth). Fathers: 3 days paid paternity leave. Employer cannot dismiss pregnant employee or on maternity leave. Leave fully paid by employer (ERCA reimbursement scheme may apply for formal sector).' },
          ].map(g => (
            <div key={g.ref} className={`border rounded-xl p-5 ${g.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black px-2 py-0.5 bg-white/60 rounded-full font-mono">{g.ref}</span>
                <p className="text-sm font-bold text-slate-800">{g.title}</p>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{g.content}</p>
            </div>
          ))}
          <div className="text-center mt-4">
            <a href="https://www.ilo.org/dyn/natlex/docs/ELECTRONIC/109956" target="_blank" rel="noopener noreferrer"
              className="text-xs text-[var(--pro-azure)] underline flex items-center justify-center gap-1">
              <Icon name="EXTERNAL_LINK" size={11} /> View full Labour Proclamation No. 1156/2019 (ILO database)
            </a>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default GratuityCalculator;


