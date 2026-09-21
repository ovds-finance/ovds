/**
 * @ovds/shared — utility functions
 * Pure utilities with no framework dependencies.
 * Shared between frontend (React/Vite) and backend (NestJS).
 */

// -- Array / API response helpers ----------------------------------------------

/**
 * Ensures a value is an array. Returns [] for any non-array value.
 */
export function toArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Unwraps a standard OVDS API response to an array.
 *
 * Handles all common shapes:
 *   res.data.data.data  → paginated inner array
 *   res.data.data       → direct array
 *   res.data            → fallback
 *
 * Always returns an array — never throws.
 */
export function unwrapArray<T = any>(res: any): T[] {
  const d = res?.data;
  if (Array.isArray(d?.data?.data)) return d.data.data as T[];
  if (Array.isArray(d?.data))       return d.data as T[];
  if (Array.isArray(d))             return d as T[];
  return [];
}

/**
 * Unwraps a nested property from an API response to an array.
 * e.g. unwrapNestedArray(res, 'bills') handles:
 *   res.data.data.bills, res.data.bills, etc.
 */
export function unwrapNestedArray<T = any>(res: any, key: string): T[] {
  const d = res?.data;
  if (Array.isArray(d?.data?.[key])) return d.data[key] as T[];
  if (Array.isArray(d?.[key]))       return d[key] as T[];
  if (Array.isArray(d?.data))        return d.data as T[];
  if (Array.isArray(d))              return d as T[];
  return [];
}

// -- Pagination helpers --------------------------------------------------------

/** Extract pagination metadata from a standard OVDS paginated response */
export function unwrapPagination(res: any): { total: number; page: number; take: number } {
  const p = res?.data?.data?.pagination ?? res?.data?.pagination ?? {};
  return {
    total: p.total ?? 0,
    page:  p.page  ?? 1,
    take:  p.take  ?? 20,
  };
}

// -- String helpers ------------------------------------------------------------

/** Truncate a string to maxLen characters, appending '…' if truncated */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/** Convert a camelCase or snake_case string to Title Case */
export function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Slugify a string — lowercase, replace spaces/underscores with hyphens,
 * strip non-alphanumeric characters.
 * e.g. "Invoice Details_2025" → "invoice-details-2025"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Mask a sensitive string, showing only the last N characters.
 * e.g. maskSensitive('1234567890', 4) → '••••••7890'
 */
export function maskSensitive(value: string, visibleChars = 4, mask = '•'): string {
  if (value.length <= visibleChars) return value;
  return mask.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}

/**
 * Capitalize only the first letter of a string.
 * e.g. "hello world" → "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Check whether a string is a valid UUID v4.
 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// -- Number helpers ------------------------------------------------------------

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to N decimal places */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Linear interpolation between two numbers.
 * e.g. lerp(0, 100, 0.25) → 25
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Compute percentage of value relative to total, clamped to [0, 100].
 * Returns 0 when total is 0 or falsy.
 */
export function pct(value: number, total: number): number {
  if (!total) return 0;
  return clamp(Math.round((value / total) * 100 * 100) / 100, 0, 100);
}

/**
 * Sum an array of numbers safely (ignores NaN / undefined entries).
 */
export function sum(values: (number | undefined | null)[]): number {
  return values.reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
}

// -- Object helpers ------------------------------------------------------------

/**
 * Deep-equal comparison for plain objects, arrays, and primitives.
 * Does not handle circular references, Date objects as values, or Map/Set.
 * Use for JSON-serialisable data structures only.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(k => deepEqual(aObj[k], bObj[k]));
}

/**
 * Pick a subset of keys from an object.
 * e.g. pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) → { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k];
    return acc;
  }, {} as Pick<T, K>);
}

/**
 * Omit keys from an object.
 * e.g. omit({ a: 1, b: 2, c: 3 }, ['b']) → { a: 1, c: 3 }
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(k => delete result[k]);
  return result as Omit<T, K>;
}

/**
 * Group an array of objects by a key.
 * e.g. groupBy(invoices, 'status') → { PAID: [...], PENDING: [...] }
 */
export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key] ?? 'undefined');
    (acc[group] ??= []).push(item);
    return acc;
  }, {});
}

// -- Async helpers -------------------------------------------------------------

/**
 * Delay execution for `ms` milliseconds.
 * e.g. await sleep(500)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function up to `attempts` times with exponential backoff.
 * Throws the last error if all attempts fail.
 *
 * @example
 * const data = await withRetry(() => fetchFromApi(), { attempts: 3, baseDelay: 500 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelay?: number; onRetry?: (attempt: number, err: unknown) => void } = {},
): Promise<T> {
  const { attempts = 3, baseDelay = 500, onRetry } = opts;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (onRetry) onRetry(i + 1, err);
      if (i < attempts - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastErr;
}

// -- Validation helpers --------------------------------------------------------

/**
 * Check whether a string is a valid Ethiopian TIN (10 digits).
 */
export function isValidTin(tin: string | null | undefined): boolean {
  if (!tin) return false;
  return /^\d{10}$/.test(tin.replace(/[-\s]/g, ''));
}

/**
 * Validate an Ethiopian TIN with a structured result.
 * Returns { valid: true } or { valid: false, reason: string }.
 *
 * Rules (Ministry of Revenues — MoR, formerly ERCA):
 *   - Exactly 10 numeric digits
 *   - Not all-zeros
 *   - Not a known test pattern (1234567890)
 * Register or verify your TIN at: https://etax.mor.gov.et
 */
export function validateTin(
  tin: string | null | undefined,
): { valid: true } | { valid: false; reason: string } {
  if (!tin || tin.trim() === '') return { valid: false, reason: 'TIN is required' };
  const clean = tin.replace(/[-\s]/g, '');
  if (!/^\d{10}$/.test(clean)) return { valid: false, reason: `TIN must be exactly 10 numeric digits (got "${tin}")` };
  if (/^0{10}$/.test(clean))   return { valid: false, reason: 'TIN cannot be all zeros' };
  if (clean === '1234567890')  return { valid: false, reason: 'TIN appears to be a test value — verify with the Ministry of Revenues (etax.mor.gov.et)' };
  return { valid: true };
}

/**
 * Validate a VAT registration number (ETB-prefixed or 10-digit).
 * Ethiopian VAT numbers are typically the TIN with a "VAT" suffix or same as TIN.
 */
export function validateVatNumber(
  vat: string | null | undefined,
): { valid: true } | { valid: false; reason: string } {
  if (!vat || vat.trim() === '') return { valid: false, reason: 'VAT number is required' };
  const clean = vat.replace(/[-\s]/g, '').replace(/^VAT/i, '');
  if (!/^\d{10}$/.test(clean)) return { valid: false, reason: `VAT number must be exactly 10 numeric digits after any "VAT" prefix (got "${vat}")` };
  return { valid: true };
}

/**
 * Check whether a string is a valid Ethiopian phone number.
 * Accepts: 09xxxxxxxx, 07xxxxxxxx, +251xxxxxxxxx, 251xxxxxxxxx
 */
export function isValidEthPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-+]/g, '');
  return (
    /^(09|07)\d{8}$/.test(clean) ||
    /^251(9|7)\d{8}$/.test(clean)
  );
}

/**
 * Check whether a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check whether a value is a positive finite number.
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// -- Date helpers --------------------------------------------------------------

/**
 * Parse a YYYY-MM-DD date string to a Date object at UTC midnight.
 * Returns null if the input is falsy or invalid.
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a Date to a YYYY-MM-DD string without timezone conversion.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the start of the day (00:00:00.000) for a given date.
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the end of the day (23:59:59.999) for a given date.
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add a number of days to a date.
 * Returns a new Date — does not mutate the input.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Difference between two dates in calendar days (absolute value).
 * e.g. daysBetween(new Date('2026-01-01'), new Date('2026-01-10')) → 9
 */
export function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / 86_400_000));
}

// -- Collection helpers --------------------------------------------------------

/**
 * Remove duplicate values from a primitive array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Remove duplicates from an array of objects by a key.
 * Keeps the first occurrence of each key.
 * e.g. uniqueBy(invoices, 'id')
 */
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return arr.filter(item => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Chunk an array into sub-arrays of size `size`.
 * e.g. chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Flatten one level of nested arrays.
 * e.g. flatten([[1,2],[3,4]]) → [1,2,3,4]
 */
export function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}

/**
 * Sort an array of objects by a key (ascending by default).
 * Returns a new array — does not mutate.
 */
export function sortBy<T>(arr: T[], key: keyof T, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'desc' ? -cmp : cmp;
  });
}

/**
 * Returns the minimum value in an array, or 0 if empty.
 */
export function minOf(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values);
}

/**
 * Returns the maximum value in an array, or 0 if empty.
 */
export function maxOf(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

/**
 * Average of an array of numbers, or 0 if empty.
 */
export function avg(values: (number | undefined | null)[]): number {
  const nums = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (nums.length === 0) return 0;
  return sum(nums) / nums.length;
}

// -- Environment / platform helpers --------------------------------------------

/**
 * Returns true when running in a Node.js environment (backend).
 */
export const isNode: boolean =
  typeof process !== 'undefined' &&
  typeof process.versions?.node !== 'undefined';

/**
 * Returns true when running in a browser environment (frontend).
 */
export const isBrowser: boolean =
  typeof (globalThis as any).window !== 'undefined' &&
  typeof (globalThis as any).document !== 'undefined';

/**
 * Safely access an environment variable, returning a fallback if absent.
 * Works in Node.js only — returns fallback in browser environments.
 */
export function env(key: string, fallback = ''): string {
  if (!isNode) return fallback;
  return process.env[key] ?? fallback;
}

// -- Crypto helpers (Node.js only, fallback for browser) ------------------------

/**
 * Generate cryptographically-random bytes.
 * Uses Node.js crypto in Node, Web Crypto API (crypto.getRandomValues) in the browser.
 * Both paths are cryptographically secure.
 * Returns a Buffer in Node.js, Uint8Array in browser.
 */
export async function randomBytes(size: number): Promise<Uint8Array | Buffer> {
  if (!isNode) {
    // crypto.getRandomValues is cryptographically secure and available in all
    // modern browsers (Chrome 37+, Firefox 34+, Safari 7+, Edge 12+).
    const arr = new Uint8Array(size);
    (globalThis as any).crypto.getRandomValues(arr);
    return arr;
  }
  // Dynamic import for Node.js - avoids static require() detection
  const { randomBytes: nodeRandomBytes } = await import('crypto');
  return nodeRandomBytes(size);
}
