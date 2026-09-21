/**
 * @ovds/shared — formatting utilities
 * Pure formatters with no framework or browser dependencies.
 * Shared between frontend (React/Vite) and backend (NestJS).
 */
/** Format a number with Ethiopian locale, no decimals. */
export declare function fmtNum(n: number): string;
/** Format a number with currency prefix. */
export declare function fmtCurrency(n: number, currency?: string): string;
/** Format a number with 2 decimal places. */
export declare function fmtDecimal(n: number): string;
/** Format a currency value with 2 decimal places. */
export declare function fmtCurrencyDecimal(n: number, currency: string): string;
/**
 * Compact number format — abbreviates large numbers.
 * e.g. 1_500_000 → "1.5M", 42_000 → "42K"
 */
export declare function fmtCompact(n: number, currency?: string): string;
/**
 * Format a percentage value.
 *
 * @param n             The value to format.
 * @param alreadyPercent  When `true`, `n` is already in percentage form (e.g. 15.67).
 *                        When `false` (default), `n` is a fraction (e.g. 0.1567).
 *
 * Examples:
 *   fmtPct(0.1567)       → "15.67%"  (fraction input, default)
 *   fmtPct(15.67, true)  → "15.67%"  (already-percent input)
 *
 * WARNING: passing an integer tax rate (e.g. 15) without `alreadyPercent: true`
 * will produce "1500.00%". Always pass `true` when the value is already a percent.
 */
export declare function fmtPct(n: number, alreadyPercent?: boolean): string;
/**
 * Format a date string or Date object to a short locale date.
 * e.g. "2026-04-03" → "Apr 3, 2026"
 */
export declare function fmtDate(d: string | Date | null | undefined): string;
/**
 * Format a date to a short month+day string.
 * e.g. "2026-04-03" → "Apr 3"
 */
export declare function fmtDateShort(d: string | Date | null | undefined): string;
/**
 * Format a date+time string.
 * e.g. "2026-04-03T14:30:00" → "Apr 3, 2026, 2:30 PM"
 */
export declare function fmtDateTime(d: string | Date | null | undefined): string;
/**
 * Relative time — "just now", "3m ago", "2h ago", "5d ago", or a short date.
 */
export declare function fmtRelative(d: string | Date | null | undefined): string;
/**
 * Days until a date (negative = overdue).
 * e.g. fmtDaysLeft("2026-04-10") → "7d left"  |  "3d overdue"  |  "Today"
 */
export declare function fmtDaysLeft(d: string | Date | null | undefined): string;
/**
 * Format a date as relative time from now.
 * e.g. "2 days ago", "in 3 months", "just now"
 */
export declare function fmtRelativeTime(d: string | Date | null | undefined): string;
/** Safe JSON parse with fallback — never throws. */
export declare function safeJsonParse<T = unknown>(raw: string | null, fallback: T): T;
/**
 * Format a TIN (Tax Identification Number) in Ministry of Revenues (MoR) format.
 * Inserts hyphens for readability: "0012345678" → "001-234-5678"
 * Register or verify your TIN at: https://etax.mor.gov.et
 */
export declare function fmtTin(tin: string | null | undefined): string;
/**
 * Format a phone number in Ethiopian format.
 * e.g. "0911234567" → "+251 91 123 4567"
 */
export declare function fmtPhone(phone: string | null | undefined): string;
/**
 * Format a byte size to a human-readable string.
 * e.g. fmtBytes(1536) → "1.5 KB"  |  fmtBytes(2_097_152) → "2.0 MB"
 */
export declare function fmtBytes(bytes: number): string;
/**
 * Format a duration in milliseconds to a human-readable string.
 * e.g. fmtDuration(65_000) → "1m 5s"  |  fmtDuration(3_700_000) → "1h 1m"
 */
export declare function fmtDuration(ms: number): string;
/**
 * Format a number as an ordinal string.
 * e.g. fmtOrdinal(1) → "1st"  |  fmtOrdinal(22) → "22nd"
 */
export declare function fmtOrdinal(n: number): string;
/**
 * Format a range of two values (e.g. for date ranges or amount ranges).
 * e.g. fmtRange('Jan 1', 'Dec 31') → "Jan 1 – Dec 31"
 */
export declare function fmtRange(from: string, to: string, sep?: string): string;
/**
 * Format a number as Ethiopian Birr with 2-decimal precision.
 * e.g. fmtETB(12500) → "ETB 12,500.00"
 * Alias re-exported from tax-calc; defined here for use in non-tax contexts.
 */
export declare function fmtBirr(n: number): string;
/**
 * Format an Ethiopian fiscal year period label.
 * e.g. fmtEFY(2016) → "EFY 2016/17"
 */
export declare function fmtEFY(efyYear: number): string;
/**
 * Format a tax rate as a percentage string.
 * e.g. fmtTaxRate(0.15) → "15%"  |  fmtTaxRate(0.03) → "3%"
 */
export declare function fmtTaxRate(rate: number): string;
/**
 * Format a WHT rate label.
 * e.g. fmtWhtRate('GOODS') → "3% WHT (Goods)"
 */
export declare function fmtWhtRate(type: 'GOODS' | 'SERVICES' | 'SERVICES_NR' | 'RENT' | 'DIVIDEND' | 'INTEREST' | 'IMPORT'): string;
/**
 * Format a bank account number with masked middle digits.
 * e.g. fmtBankAccount('1000123456789') → '1000 •••• •••• 6789'
 */
export declare function fmtBankAccount(account: string | null | undefined): string;
/**
 * Format a document reference number for display.
 * Pads short numbers with leading zeros to a fixed width.
 * e.g. fmtDocRef('INV', 42, 6) → "INV-000042"
 */
export declare function fmtDocRef(prefix: string, number: number, padWidth?: number): string;
/**
 * Format a percentage change with a +/- sign.
 * e.g. fmtChange(12.5) → "+12.5%"  |  fmtChange(-3.2) → "-3.2%"
 */
export declare function fmtChange(change: number, decimals?: number): string;
/**
 * Format a ratio as "X:1".
 * e.g. fmtRatio(2.5) → "2.5:1"  (current ratio, debt-equity, etc.)
 */
export declare function fmtRatio(value: number, decimals?: number): string;
/**
 * Format a weight in kilograms.
 * e.g. fmtWeight(1500) → "1,500 kg"  |  fmtWeight(0.25) → "0.25 kg"
 */
export declare function fmtWeight(kg: number): string;
/**
 * Truncate a string with an ellipsis, preserving word boundaries when possible.
 * e.g. fmtTruncate('Hello World Test', 10) → 'Hello W...'
 */
export declare function fmtTruncate(str: string, max: number, ellipsis?: string): string;
/**
 * Format a multi-line address to a single compact line.
 * e.g. fmtAddress({ city: 'Addis Ababa', country: 'Ethiopia' }) → 'Addis Ababa, Ethiopia'
 */
export declare function fmtAddress(parts: (string | null | undefined)[]): string;
/**
 * Format an invoice / bill period label.
 * e.g. fmtInvoicePeriod('2026-01') → 'January 2026'
 */
export declare function fmtInvoicePeriod(yyyyMM: string | null | undefined): string;
/**
 * Convert a number to English words (currency-aware).
 * e.g. amountInWords(1250.5, 'ETB') → "One thousand two hundred fifty Birr and 50 cents"
 */
export declare function amountInWords(n: number, currency?: string): string;
//# sourceMappingURL=fmt.d.ts.map