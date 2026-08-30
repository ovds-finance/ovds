/**
 * @ovds/shared — formatting utilities
 * Pure formatters with no framework or browser dependencies.
 * Shared between frontend (React/Vite) and backend (NestJS).
 */

/** Format a number with Ethiopian locale, no decimals. */
export function fmtNum(n: number): string {
  return Number(n || 0).toLocaleString('en-ET', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format a number with currency prefix. */
export function fmtCurrency(n: number, currency = 'ETB'): string {
  return `${currency} ${fmtNum(n)}`;
}

/** Format a number with 2 decimal places. */
export function fmtDecimal(n: number): string {
  return Number(n || 0).toLocaleString('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format a currency value with 2 decimal places. */
export function fmtCurrencyDecimal(n: number, currency: string): string {
  return `${currency} ${fmtDecimal(n)}`;
}

/**
 * Compact number format — abbreviates large numbers.
 * e.g. 1_500_000 → "1.5M", 42_000 → "42K"
 */
export function fmtCompact(n: number, currency?: string): string {
  const abs = Math.abs(n || 0);
  let result: string;
  if (abs >= 1_000_000_000) {
    result = `${(n / 1_000_000_000).toFixed(1)}B`;
  } else if (abs >= 1_000_000) {
    result = `${(n / 1_000_000).toFixed(1)}M`;
  } else if (abs >= 1_000) {
    result = `${(n / 1_000).toFixed(1)}K`;
  } else {
    result = fmtNum(n);
  }
  return currency ? `${currency} ${result}` : result;
}

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
export function fmtPct(n: number, alreadyPercent = false): string {
  // Dev-mode guard: fractions should be between -1 and 1.
  // Values outside that range almost certainly mean the caller forgot alreadyPercent=true.
  if (
    !alreadyPercent &&
    typeof process !== 'undefined' &&
    process.env.NODE_ENV !== 'production' &&
    (n > 1 || n < -1)
  ) {
    console.warn(
      `[fmtPct] Received value ${n} without alreadyPercent=true. ` +
      `Did you mean fmtPct(${n}, true)? This would render as "${(n * 100).toFixed(2)}%".`,
    );
  }
  const val = alreadyPercent ? n : n * 100;
  return `${Number(val || 0).toFixed(2)}%`;
}

/**
 * Format a date string or Date object to a short locale date.
 * e.g. "2026-04-03" → "Apr 3, 2026"
 */
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format a date to a short month+day string.
 * e.g. "2026-04-03" → "Apr 3"
 */
export function fmtDateShort(d: string | Date | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-ET', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format a date+time string.
 * e.g. "2026-04-03T14:30:00" → "Apr 3, 2026, 2:30 PM"
 */
export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Relative time — "just now", "3m ago", "2h ago", "5d ago", or a short date.
 */
export function fmtRelative(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(d);
}

/**
 * Days until a date (negative = overdue).
 * e.g. fmtDaysLeft("2026-04-10") → "7d left"  |  "3d overdue"  |  "Today"
 */
export function fmtDaysLeft(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `${days}d left`;
}

/**
 * Format a date as relative time from now.
 * e.g. "2 days ago", "in 3 months", "just now"
 */
export function fmtRelativeTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  try {
    const diff = Date.now() - new Date(d).getTime();
    const abs = Math.abs(diff);
    const future = diff < 0;
    const prefix = future ? 'in ' : '';
    const suffix = future ? '' : ' ago';
    if (abs < 60_000) return 'just now';
    if (abs < 3_600_000) return `${prefix}${Math.round(abs / 60_000)}m${suffix}`;
    if (abs < 86_400_000) return `${prefix}${Math.round(abs / 3_600_000)}h${suffix}`;
    if (abs < 2_592_000_000) return `${prefix}${Math.round(abs / 86_400_000)}d${suffix}`;
    return `${prefix}${Math.round(abs / 2_592_000_000)}mo${suffix}`;
  } catch {
    return '—';
  }
}

/** Safe JSON parse with fallback — never throws. */
export function safeJsonParse<T = unknown>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Format a TIN (Tax Identification Number) in Ministry of Revenues (MoR) format.
 * Inserts hyphens for readability: "0012345678" → "001-234-5678"
 * Register or verify your TIN at: https://etax.mor.gov.et
 */
export function fmtTin(tin: string | null | undefined): string {
  if (!tin) return '—';
  const clean = tin.replace(/\D/g, '');
  if (clean.length === 10) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  return tin;
}

/**
 * Format a phone number in Ethiopian format.
 * e.g. "0911234567" → "+251 91 123 4567"
 */
export function fmtPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  // Ethiopian mobile: starts with 09 or 07 (10 digits)
  if (clean.startsWith('09') && clean.length === 10) {
    return `+251 ${clean.slice(1, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  if (clean.startsWith('07') && clean.length === 10) {
    return `+251 ${clean.slice(1, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  // Already has country code 251
  if (clean.startsWith('251') && clean.length === 12) {
    return `+${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  return phone;
}

/**
 * Format a byte size to a human-readable string.
 * e.g. fmtBytes(1536) → "1.5 KB"  |  fmtBytes(2_097_152) → "2.0 MB"
 */
export function fmtBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * e.g. fmtDuration(65_000) → "1m 5s"  |  fmtDuration(3_700_000) → "1h 1m"
 */
export function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs  = Math.floor(ms / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0)  return `${mins}m ${secs % 60}s`;
  return `${secs}s`;
}

/**
 * Format a number as an ordinal string.
 * e.g. fmtOrdinal(1) → "1st"  |  fmtOrdinal(22) → "22nd"
 */
export function fmtOrdinal(n: number): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  const mod10  = abs % 10;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/**
 * Format a range of two values (e.g. for date ranges or amount ranges).
 * e.g. fmtRange('Jan 1', 'Dec 31') → "Jan 1 – Dec 31"
 */
export function fmtRange(from: string, to: string, sep = ' – '): string {
  if (!from && !to) return '—';
  if (!from) return `until ${to}`;
  if (!to)   return `from ${from}`;
  return `${from}${sep}${to}`;
}

// -- Ethiopian-specific formatters ---------------------------------------------

/**
 * Format a number as Ethiopian Birr with 2-decimal precision.
 * e.g. fmtETB(12500) → "ETB 12,500.00"
 * Alias re-exported from tax-calc; defined here for use in non-tax contexts.
 */
export function fmtBirr(n: number): string {
  return `ETB ${fmtDecimal(n)}`;
}

/**
 * Format an Ethiopian fiscal year period label.
 * e.g. fmtEFY(2016) → "EFY 2016/17"
 */
export function fmtEFY(efyYear: number): string {
  return `EFY ${efyYear}/${String(efyYear + 1).slice(-2)}`;
}

/**
 * Format a tax rate as a percentage string.
 * e.g. fmtTaxRate(0.15) → "15%"  |  fmtTaxRate(0.03) → "3%"
 */
export function fmtTaxRate(rate: number): string {
  const pct = rate * 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

/**
 * Format a WHT rate label.
 * e.g. fmtWhtRate('GOODS') → "3% WHT (Goods)"
 */
export function fmtWhtRate(type: 'GOODS' | 'SERVICES' | 'SERVICES_NR' | 'RENT' | 'DIVIDEND' | 'INTEREST' | 'IMPORT'): string {
  const labels: Record<string, string> = {
    GOODS:       '3% WHT (Goods ≥ ETB 10K) — Proc. 1395/2025',
    SERVICES:    '3% WHT (Services ≥ ETB 3K) — Proc. 1395/2025',
    SERVICES_NR: '15% WHT (Non-Resident Services)',
    RENT:        '30% WHT (Rent)',
    DIVIDEND:    '15% WHT (Dividend) — Proc. 1395/2025',
    INTEREST:    '10% WHT (Interest)',
    IMPORT:      '3% WHT (Import)',
  };
  return labels[type] ?? `WHT (${type})`;
}

// -- Business & financial formatters ------------------------------------------

/**
 * Format a bank account number with masked middle digits.
 * e.g. fmtBankAccount('1000123456789') → '1000 •••• •••• 6789'
 */
export function fmtBankAccount(account: string | null | undefined): string {
  if (!account) return '—';
  const clean = account.replace(/\s/g, '');
  if (clean.length < 8) return clean;
  const last4  = clean.slice(-4);
  const first4 = clean.slice(0, 4);
  return `${first4} •••• •••• ${last4}`;
}

/**
 * Format a document reference number for display.
 * Pads short numbers with leading zeros to a fixed width.
 * e.g. fmtDocRef('INV', 42, 6) → "INV-000042"
 */
export function fmtDocRef(prefix: string, number: number, padWidth = 6): string {
  return `${prefix}-${String(number).padStart(padWidth, '0')}`;
}

/**
 * Format a percentage change with a +/- sign.
 * e.g. fmtChange(12.5) → "+12.5%"  |  fmtChange(-3.2) → "-3.2%"
 */
export function fmtChange(change: number, decimals = 1): string {
  if (!isFinite(change)) return '—';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
}

/**
 * Format a ratio as "X:1".
 * e.g. fmtRatio(2.5) → "2.5:1"  (current ratio, debt-equity, etc.)
 */
export function fmtRatio(value: number, decimals = 2): string {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(decimals)}:1`;
}

/**
 * Format a weight in kilograms.
 * e.g. fmtWeight(1500) → "1,500 kg"  |  fmtWeight(0.25) → "0.25 kg"
 */
export function fmtWeight(kg: number): string {
  if (kg >= 1000) return `${fmtDecimal(kg / 1000)} t`;
  return `${fmtDecimal(kg)} kg`;
}

/**
 * Truncate a string with an ellipsis, preserving word boundaries when possible.
 * e.g. fmtTruncate('Hello World Test', 10) → 'Hello W...'
 */
export function fmtTruncate(str: string, max: number, ellipsis = '...'): string {
  if (!str || str.length <= max) return str ?? '';
  return str.slice(0, max - ellipsis.length) + ellipsis;
}

/**
 * Format a multi-line address to a single compact line.
 * e.g. fmtAddress({ city: 'Addis Ababa', country: 'Ethiopia' }) → 'Addis Ababa, Ethiopia'
 */
export function fmtAddress(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ') || '—';
}

/**
 * Format an invoice / bill period label.
 * e.g. fmtInvoicePeriod('2026-01') → 'January 2026'
 */
export function fmtInvoicePeriod(yyyyMM: string | null | undefined): string {
  if (!yyyyMM) return '—';
  const [y, m] = yyyyMM.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-ET', { month: 'long', year: 'numeric' });
}

const ONES = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

function spellUnder1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
  return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ' ' + spellUnder1000(n % 100) : ''}`;
}

/**
 * Convert a number to English words (currency-aware).
 * e.g. amountInWords(1250.5, 'ETB') → "One thousand two hundred fifty Birr and 50 cents"
 */
export function amountInWords(n: number, currency = 'ETB'): string {
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  const words = (whole === 0 ? 'zero' : spellUnder1000(whole).replace(/\s+/g, ' ').trim());
  const label = `${words.charAt(0).toUpperCase() + words.slice(1)} ${currency}`;
  return cents > 0 ? `${label} and ${fmtDecimal(cents).split('.')[1]} cents` : label;
}
