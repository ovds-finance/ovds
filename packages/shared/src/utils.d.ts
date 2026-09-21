/**
 * @ovds/shared — utility functions
 * Pure utilities with no framework dependencies.
 * Shared between frontend (React/Vite) and backend (NestJS).
 */
/**
 * Ensures a value is an array. Returns [] for any non-array value.
 */
export declare function toArray<T = any>(value: unknown): T[];
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
export declare function unwrapArray<T = any>(res: any): T[];
/**
 * Unwraps a nested property from an API response to an array.
 * e.g. unwrapNestedArray(res, 'bills') handles:
 *   res.data.data.bills, res.data.bills, etc.
 */
export declare function unwrapNestedArray<T = any>(res: any, key: string): T[];
/** Extract pagination metadata from a standard OVDS paginated response */
export declare function unwrapPagination(res: any): {
    total: number;
    page: number;
    take: number;
};
/** Truncate a string to maxLen characters, appending '…' if truncated */
export declare function truncate(str: string, maxLen: number): string;
/** Convert a camelCase or snake_case string to Title Case */
export declare function toTitleCase(str: string): string;
/**
 * Slugify a string — lowercase, replace spaces/underscores with hyphens,
 * strip non-alphanumeric characters.
 * e.g. "Invoice Details_2025" → "invoice-details-2025"
 */
export declare function slugify(str: string): string;
/**
 * Mask a sensitive string, showing only the last N characters.
 * e.g. maskSensitive('1234567890', 4) → '••••••7890'
 */
export declare function maskSensitive(value: string, visibleChars?: number, mask?: string): string;
/**
 * Capitalize only the first letter of a string.
 * e.g. "hello world" → "Hello world"
 */
export declare function capitalize(str: string): string;
/**
 * Check whether a string is a valid UUID v4.
 */
export declare function isUuid(value: string): boolean;
/** Clamp a number between min and max */
export declare function clamp(value: number, min: number, max: number): number;
/** Round to N decimal places */
export declare function round(value: number, decimals?: number): number;
/**
 * Linear interpolation between two numbers.
 * e.g. lerp(0, 100, 0.25) → 25
 */
export declare function lerp(a: number, b: number, t: number): number;
/**
 * Compute percentage of value relative to total, clamped to [0, 100].
 * Returns 0 when total is 0 or falsy.
 */
export declare function pct(value: number, total: number): number;
/**
 * Sum an array of numbers safely (ignores NaN / undefined entries).
 */
export declare function sum(values: (number | undefined | null)[]): number;
/**
 * Deep-equal comparison for plain objects, arrays, and primitives.
 * Does not handle circular references, Date objects as values, or Map/Set.
 * Use for JSON-serialisable data structures only.
 */
export declare function deepEqual(a: unknown, b: unknown): boolean;
/**
 * Pick a subset of keys from an object.
 * e.g. pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) → { a: 1, c: 3 }
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit keys from an object.
 * e.g. omit({ a: 1, b: 2, c: 3 }, ['b']) → { a: 1, c: 3 }
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Group an array of objects by a key.
 * e.g. groupBy(invoices, 'status') → { PAID: [...], PENDING: [...] }
 */
export declare function groupBy<T>(items: T[], key: keyof T): Record<string, T[]>;
/**
 * Delay execution for `ms` milliseconds.
 * e.g. await sleep(500)
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry an async function up to `attempts` times with exponential backoff.
 * Throws the last error if all attempts fail.
 *
 * @example
 * const data = await withRetry(() => fetchFromApi(), { attempts: 3, baseDelay: 500 });
 */
export declare function withRetry<T>(fn: () => Promise<T>, opts?: {
    attempts?: number;
    baseDelay?: number;
    onRetry?: (attempt: number, err: unknown) => void;
}): Promise<T>;
/**
 * Check whether a string is a valid Ethiopian TIN (10 digits).
 */
export declare function isValidTin(tin: string | null | undefined): boolean;
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
export declare function validateTin(tin: string | null | undefined): {
    valid: true;
} | {
    valid: false;
    reason: string;
};
/**
 * Validate a VAT registration number (ETB-prefixed or 10-digit).
 * Ethiopian VAT numbers are typically the TIN with a "VAT" suffix or same as TIN.
 */
export declare function validateVatNumber(vat: string | null | undefined): {
    valid: true;
} | {
    valid: false;
    reason: string;
};
/**
 * Check whether a string is a valid Ethiopian phone number.
 * Accepts: 09xxxxxxxx, 07xxxxxxxx, +251xxxxxxxxx, 251xxxxxxxxx
 */
export declare function isValidEthPhone(phone: string | null | undefined): boolean;
/**
 * Check whether a value is a non-empty string.
 */
export declare function isNonEmptyString(value: unknown): value is string;
/**
 * Check whether a value is a positive finite number.
 */
export declare function isPositiveNumber(value: unknown): value is number;
/**
 * Parse a YYYY-MM-DD date string to a Date object at UTC midnight.
 * Returns null if the input is falsy or invalid.
 */
export declare function parseDate(dateStr: string | null | undefined): Date | null;
/**
 * Format a Date to a YYYY-MM-DD string without timezone conversion.
 */
export declare function toDateString(date: Date): string;
/**
 * Returns the start of the day (00:00:00.000) for a given date.
 */
export declare function startOfDay(date: Date): Date;
/**
 * Returns the end of the day (23:59:59.999) for a given date.
 */
export declare function endOfDay(date: Date): Date;
/**
 * Add a number of days to a date.
 * Returns a new Date — does not mutate the input.
 */
export declare function addDays(date: Date, days: number): Date;
/**
 * Difference between two dates in calendar days (absolute value).
 * e.g. daysBetween(new Date('2026-01-01'), new Date('2026-01-10')) → 9
 */
export declare function daysBetween(a: Date, b: Date): number;
/**
 * Remove duplicate values from a primitive array.
 */
export declare function unique<T>(arr: T[]): T[];
/**
 * Remove duplicates from an array of objects by a key.
 * Keeps the first occurrence of each key.
 * e.g. uniqueBy(invoices, 'id')
 */
export declare function uniqueBy<T>(arr: T[], key: keyof T): T[];
/**
 * Chunk an array into sub-arrays of size `size`.
 * e.g. chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 */
export declare function chunk<T>(arr: T[], size: number): T[][];
/**
 * Flatten one level of nested arrays.
 * e.g. flatten([[1,2],[3,4]]) → [1,2,3,4]
 */
export declare function flatten<T>(arr: T[][]): T[];
/**
 * Sort an array of objects by a key (ascending by default).
 * Returns a new array — does not mutate.
 */
export declare function sortBy<T>(arr: T[], key: keyof T, dir?: 'asc' | 'desc'): T[];
/**
 * Returns the minimum value in an array, or 0 if empty.
 */
export declare function minOf(values: number[]): number;
/**
 * Returns the maximum value in an array, or 0 if empty.
 */
export declare function maxOf(values: number[]): number;
/**
 * Average of an array of numbers, or 0 if empty.
 */
export declare function avg(values: (number | undefined | null)[]): number;
/**
 * Returns true when running in a Node.js environment (backend).
 */
export declare const isNode: boolean;
/**
 * Returns true when running in a browser environment (frontend).
 */
export declare const isBrowser: boolean;
/**
 * Safely access an environment variable, returning a fallback if absent.
 * Works in Node.js only — returns fallback in browser environments.
 */
export declare function env(key: string, fallback?: string): string;
/**
 * Generate cryptographically-random bytes.
 * Uses Node.js crypto in Node, Web Crypto API (crypto.getRandomValues) in the browser.
 * Both paths are cryptographically secure.
 * Returns a Buffer in Node.js, Uint8Array in browser.
 */
export declare function randomBytes(size: number): Promise<Uint8Array | Buffer>;
//# sourceMappingURL=utils.d.ts.map