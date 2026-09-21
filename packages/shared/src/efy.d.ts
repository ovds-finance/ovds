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
/** Ethiopian month names (1-indexed) */
export declare const ETH_MONTHS: readonly ["Meskerem", "Tikimit", "Hidar", "Tahisas", "Tir", "Yekatit", "Megabit", "Miyazya", "Ginbot", "Sene", "Hamle", "Nehase", "Pagumē"];
export type EthiopianMonthName = typeof ETH_MONTHS[number];
export interface EthiopianDate {
    year: number;
    month: number;
    day: number;
    monthName: EthiopianMonthName;
}
export interface EFYPeriod {
    efyYear: number;
    label: string;
    startGreg: Date;
    endGreg: Date;
}
/**
 * Returns the Ethiopian fiscal year number for a given Gregorian date.
 * EFY starts on Meskerem 1 (≈ Sep 11 Gregorian).
 *
 * @example
 * gregorianToEFY(new Date('2024-01-15')) → 2016  (Jan 2024 is in EFY 2016)
 * gregorianToEFY(new Date('2024-09-15')) → 2017  (Sep 15 2024 = new EFY 2017)
 */
export declare function gregorianToEFY(date?: Date): number;
/**
 * Returns the EFY period boundaries for a given EFY year number.
 */
export declare function efyBounds(efyYear: number): EFYPeriod;
/**
 * Returns the current EFY period.
 */
export declare function currentEFY(): EFYPeriod;
/**
 * Ethiopian month name for a Gregorian date.
 * Approximation — not a full Ge'ez calendar implementation.
 */
export declare function ethiopianMonthName(date?: Date): string;
/**
 * Returns the Gregorian date of the BIT annual filing deadline.
 * BIT is due 4 months after EFY end (Meskerem 1 + 4 months ≈ January 10 Gregorian).
 *
 * @example
 * bitFilingDeadline(2016) → Date('2024-01-10') (4 months after Sep 10 2023)
 */
export declare function bitFilingDeadline(efyYear: number): Date;
/**
 * VAT / TOT monthly filing deadline: 30th of the following Ethiopian month
 * (which maps to ~30th of the following Gregorian calendar month).
 *
 * @param period  Gregorian YYYY-MM string (e.g. "2024-03")
 * @returns       Deadline as Gregorian Date (last day of following month ≈ 30th)
 */
export declare function vatFilingDeadline(period: string): Date;
/**
 * DRRF quarterly levy deadline: 15th of the last month of the Ethiopian quarter.
 * Ethiopian quarters (Gregorian approximate):
 *   Q1: Sep 11 – Dec 10  → deadline ≈ Dec 10
 *   Q2: Dec 11 – Mar 10  → deadline ≈ Mar 10
 *   Q3: Mar 11 – Jun 10  → deadline ≈ Jun 10
 *   Q4: Jun 11 – Sep 10  → deadline ≈ Sep 10
 */
export declare function drrfQuarterDeadline(date?: Date): Date;
/**
 * Returns a human-readable period label combining EFY year and Ethiopian month.
 * Useful for tax filing period selectors.
 *
 * @example
 * efyPeriodLabel('2024-03') → "Megabit, EFY 2016"
 */
export declare function efyPeriodLabel(gregorianYYYYMM: string): string;
/**
 * Returns the days remaining (positive) or overdue (negative) until a deadline.
 */
export declare function daysUntil(deadline: Date): number;
/**
 * Returns all tax filing deadlines for the current or given EFY year,
 * with days remaining and overdue status — used by the tax dashboard.
 */
export declare function efyTaxDeadlines(efyYear?: number): Array<{
    type: string;
    label: string;
    deadline: Date;
    daysLeft: number;
    isOverdue: boolean;
    legalRef: string;
}>;
//# sourceMappingURL=efy.d.ts.map