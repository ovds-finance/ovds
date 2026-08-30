/**
 * Ethiopian Fiscal Year (EFY) Calendar Utilities
 *
 * Ethiopia uses the Ge'ez calendar:
 *   - 13 months: 12 months of 30 days + Pagumē (5 or 6 days in leap year)
 *   - New Year (Enkutatash) = Meskerem 1 = September 11 (or Sep 12 in Gregorian leap years)
 *   - Ethiopian fiscal year (EFY): Meskerem 1 → Pagumē 5/6 (roughly Sep 11 → Sep 10)
 *   - EFY is 7–8 years behind Gregorian (e.g. EFY 2016 = Gregorian 2023/24)
 *
 * Ministry of Revenues (MoR) tax deadlines use EFY periods:
 *   - VAT:  30th of the following Ethiopian month    (etax.mor.gov.et)
 *   - BIT:  4 months after EFY end (i.e. around January 10 Gregorian)
 *   - TOT:  30th of the following Ethiopian month (same as VAT)
 *   - DRRF: 15th of the last month of the Ethiopian quarter
 *
 * References:
 *   - Ministry of Revenues (MoR) tax calendar — mor.gov.et
 *     (formerly Ethiopian Revenues and Customs Authority / ERCA,
 *      restructured under Proclamation No. 1097/2018)
 *   - Federal Income Tax Proclamation No. 979/2016
 *   - Ethiopian Standard Time is UTC+3 (EAT)
 */

// -- Gregorian → Ethiopian conversion -----------------------------------------
// The offset between Gregorian and Ethiopian calendars:
//   Before September 11 Gregorian: Ethiopian year = Gregorian year − 8
//   On/after September 11 Gregorian: Ethiopian year = Gregorian year − 7

/** Ethiopian month names (1-indexed) */
export const ETH_MONTHS = [
  'Meskerem',  // 1  (Sep 11 – Oct 10)
  'Tikimit',   // 2  (Oct 11 – Nov 9)
  'Hidar',     // 3  (Nov 10 – Dec 9)
  'Tahisas',   // 4  (Dec 10 – Jan 8)
  'Tir',       // 5  (Jan 9 – Feb 7)
  'Yekatit',   // 6  (Feb 8 – Mar 9)
  'Megabit',   // 7  (Mar 10 – Apr 8)
  'Miyazya',   // 8  (Apr 9 – May 8)
  'Ginbot',    // 9  (May 9 – Jun 7)
  'Sene',      // 10 (Jun 8 – Jul 7)
  'Hamle',     // 11 (Jul 8 – Aug 6)
  'Nehase',    // 12 (Aug 7 – Sep 5)
  'Pagumē',    // 13 (Sep 6 – Sep 10/11)
] as const;

export type EthiopianMonthName = typeof ETH_MONTHS[number];

export interface EthiopianDate {
  year:  number;
  month: number; // 1–13
  day:   number; // 1–30 (1–5/6 for Pagumē)
  monthName: EthiopianMonthName;
}

export interface EFYPeriod {
  efyYear:    number;   // e.g. 2016
  label:      string;   // e.g. "EFY 2016/17"
  startGreg:  Date;     // Sep 11 Gregorian
  endGreg:    Date;     // Sep 10 Gregorian next year
}

/**
 * Returns the Ethiopian fiscal year number for a given Gregorian date.
 * EFY starts on Meskerem 1 (≈ Sep 11 Gregorian).
 *
 * @example
 * gregorianToEFY(new Date('2024-01-15')) → 2016  (Jan 2024 is in EFY 2016)
 * gregorianToEFY(new Date('2024-09-15')) → 2017  (Sep 15 2024 = new EFY 2017)
 */
export function gregorianToEFY(date: Date = new Date()): number {
  const month = date.getMonth() + 1; // 1-based
  const day   = date.getDate();

  // Ethiopian new year ≈ Sep 11 in most years (Sep 12 in years before Gregorian leap)
  const isAfterNewYear = month > 9 || (month === 9 && day >= 11);
  return date.getFullYear() - (isAfterNewYear ? 7 : 8);
}

/**
 * Returns the EFY period boundaries for a given EFY year number.
 */
export function efyBounds(efyYear: number): EFYPeriod {
  // EFY start: Sep 11 of Gregorian year (efyYear + 7)
  const gregStartYear = efyYear + 7;
  const startGreg     = new Date(gregStartYear, 8, 11); // Sep 11
  const endGreg       = new Date(gregStartYear + 1, 8, 10, 23, 59, 59); // Sep 10 next year

  return {
    efyYear,
    label:     `EFY ${efyYear}/${String(efyYear + 1).slice(-2)}`,
    startGreg,
    endGreg,
  };
}

/**
 * Returns the current EFY period.
 */
export function currentEFY(): EFYPeriod {
  return efyBounds(gregorianToEFY());
}

/**
 * Ethiopian month name for a Gregorian date.
 * Approximation — not a full Ge'ez calendar implementation.
 */
export function ethiopianMonthName(date: Date = new Date()): string {
  const efy      = gregorianToEFY(date);
  const efyStart = new Date(efy + 7, 8, 11); // Sep 11
  const daysIn   = Math.floor((date.getTime() - efyStart.getTime()) / (1000 * 60 * 60 * 24));
  const monthIdx = Math.min(12, Math.floor(daysIn / 30)); // 0-based 0–12
  return ETH_MONTHS[monthIdx] ?? 'Pagumē';
}

/**
 * Returns the Gregorian date of the BIT annual filing deadline.
 * BIT is due 4 months after EFY end (Meskerem 1 + 4 months ≈ January 10 Gregorian).
 *
 * @example
 * bitFilingDeadline(2016) → Date('2024-01-10') (4 months after Sep 10 2023)
 */
export function bitFilingDeadline(efyYear: number): Date {
  const { endGreg } = efyBounds(efyYear);
  const deadline    = new Date(endGreg);
  deadline.setMonth(deadline.getMonth() + 4);
  deadline.setDate(10); // 10th of the 4th month after EFY close
  return deadline;
}

/**
 * VAT / TOT monthly filing deadline: 30th of the following Ethiopian month
 * (which maps to ~30th of the following Gregorian calendar month).
 *
 * @param period  Gregorian YYYY-MM string (e.g. "2024-03")
 * @returns       Deadline as Gregorian Date (last day of following month ≈ 30th)
 */
export function vatFilingDeadline(period: string): Date {
  const [y, m] = period.split('-').map(Number);
  // 30th of the month following the tax period
  return new Date(m === 12 ? y + 1 : y, m, 30); // months are 0-based in Date constructor
}

/**
 * DRRF quarterly levy deadline: 15th of the last month of the Ethiopian quarter.
 * Ethiopian quarters (Gregorian approximate):
 *   Q1: Sep 11 – Dec 10  → deadline ≈ Dec 10
 *   Q2: Dec 11 – Mar 10  → deadline ≈ Mar 10
 *   Q3: Mar 11 – Jun 10  → deadline ≈ Jun 10
 *   Q4: Jun 11 – Sep 10  → deadline ≈ Sep 10
 */
export function drrfQuarterDeadline(date: Date = new Date()): Date {
  const month = date.getMonth() + 1;
  // Map Gregorian month to approximate end-of-quarter deadline month
  let deadlineMonth: number;
  if      (month >= 9  && month <= 11) deadlineMonth = 12;
  else if (month >= 12 || month <= 2)  deadlineMonth = 3;
  else if (month >= 3  && month <= 5)  deadlineMonth = 6;
  else                                  deadlineMonth = 9;

  const year = deadlineMonth < month && month > 6 ? date.getFullYear() + 1 : date.getFullYear();
  return new Date(year, deadlineMonth - 1, 15); // 15th of deadline month
}

/**
 * Returns a human-readable period label combining EFY year and Ethiopian month.
 * Useful for tax filing period selectors.
 *
 * @example
 * efyPeriodLabel('2024-03') → "Megabit, EFY 2016"
 */
export function efyPeriodLabel(gregorianYYYYMM: string): string {
  const [y, m] = gregorianYYYYMM.split('-').map(Number);
  const date   = new Date(y, m - 1, 15); // mid-month
  const month  = ethiopianMonthName(date);
  const efy    = gregorianToEFY(date);
  return `${month}, EFY ${efy}`;
}

/**
 * Returns the days remaining (positive) or overdue (negative) until a deadline.
 */
export function daysUntil(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns all tax filing deadlines for the current or given EFY year,
 * with days remaining and overdue status — used by the tax dashboard.
 */
export function efyTaxDeadlines(efyYear?: number): Array<{
  type:     string;
  label:    string;
  deadline: Date;
  daysLeft: number;
  isOverdue:boolean;
  legalRef: string;
}> {
  const efy     = efyYear ?? gregorianToEFY();
  const bounds  = efyBounds(efy);
  const now     = new Date();

  // Generate monthly VAT/TOT deadlines for the current EFY
  const deadlines: Array<{ type: string; label: string; deadline: Date; daysLeft: number; isOverdue: boolean; legalRef: string }> = [];

  // BIT annual
  const bitDeadline = bitFilingDeadline(efy);
  deadlines.push({
    type:     'BIT',
    label:    `Business Income Tax — EFY ${efy}`,
    deadline: bitDeadline,
    daysLeft: daysUntil(bitDeadline),
    isOverdue:daysUntil(bitDeadline) < 0,
    legalRef: 'Proclamation No. 1395/2025 — Art. 83',
  });

  // DRRF quarterly deadlines
  const drrfDl = drrfQuarterDeadline(now);
  deadlines.push({
    type:     'DRRF',
    label:    `DRRF Quarterly Levy`,
    deadline: drrfDl,
    daysLeft: daysUntil(drrfDl),
    isOverdue:daysUntil(drrfDl) < 0,
    legalRef: 'Regulation No. 570/2025',
  });

  // Current month VAT/TOT
  const period = now.toISOString().slice(0, 7);
  const vatDl  = vatFilingDeadline(period);
  deadlines.push({
    type:     'VAT',
    label:    `VAT Return — ${efyPeriodLabel(period)}`,
    deadline: vatDl,
    daysLeft: daysUntil(vatDl),
    isOverdue:daysUntil(vatDl) < 0,
    legalRef: 'Proclamation No. 1341/2024 — Art. 24',
  });
  deadlines.push({
    type:     'WHT',
    label:    `WHT Remittance — ${efyPeriodLabel(period)}`,
    deadline: vatDl, // same deadline as VAT
    daysLeft: daysUntil(vatDl),
    isOverdue:daysUntil(vatDl) < 0,
    legalRef: 'Proclamation No. 1395/2025 — Art. 95',
  });

  return deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
}
