/**
 * money.ts — exact integer-cents arithmetic for Ethiopian tax computation.
 *
 * Why cents and not `number`:
 *   IEEE-754 doubles cannot represent most decimal fractions exactly, so
 *   accumulating ETB amounts as floats drifts. The classic failure is
 *   `0.1 + 0.2 !== 0.3`; in a VAT return it shows up as a declaration whose
 *   line items sum to 1 santim more or less than the declared total, which the
 *   MoR rejects with a tax-calculation mismatch.
 *
 *   Every monetary value here is a whole number of santim (1 ETB = 100 santim)
 *   held in a JS `number`. Integers up to 2^53-1 are exact, i.e. ~90 trillion
 *   ETB — far beyond any Ethiopian filing — so no BigInt is needed in the
 *   compute layer. Persistence uses BigInt/Decimal columns; see the Prisma
 *   schema.
 *
 * Rounding convention:
 *   Ethiopian commercial practice (and the MoR e-invoicing schema) uses
 *   half-up rounding on the final santim. `roundHalfUp` is applied once, at
 *   the point a tax amount is derived — never repeatedly mid-accumulation.
 */
/** Santim per ETB. */
export declare const SANTIM_PER_ETB = 100;
/** Largest ETB amount representable exactly (2^53-1 santim). */
export declare const MAX_SAFE_ETB: number;
export declare class MoneyError extends Error {
    constructor(message: string);
}
/**
 * Half-up rounding that is stable for negative values and immune to the
 * `Math.round(-0.5) === -0` asymmetry.
 */
export declare function roundHalfUp(value: number): number;
/**
 * Convert an ETB amount (possibly a decimal string from a form or API) into
 * exact santim.
 *
 * Accepts strings to avoid a lossy `parseFloat` round-trip on values that
 * arrive as JSON decimals.
 */
export declare function toCents(etb: number | string): number;
/** Convert santim back to an ETB number. Presentation only — never re-accumulate. */
export declare function fromCents(cents: number): number;
/** Format santim as a fixed 2-decimal ETB string (safe for JSON / MoR payloads). */
export declare function formatCents(cents: number): string;
export declare function assertCents(cents: number): void;
/** Exact sum. Integer addition cannot drift, so no rounding is applied. */
export declare function sumCents(values: readonly number[]): number;
/**
 * Apply a fractional rate to a cents amount, rounding half-up once.
 *
 * `rate` is a decimal fraction (0.15 for 15%), matching ETH_TAX.*_RATE.
 */
export declare function applyRateToCents(cents: number, rate: number): number;
/**
 * Back out tax embedded in a VAT-inclusive amount.
 *
 * tax = gross * rate / (1 + rate), rounded half-up once. The caller derives
 * net as `gross - tax` so net + tax === gross exactly, with no residual santim.
 */
export declare function extractInclusiveTaxCents(grossCents: number, rate: number): {
    netCents: number;
    taxCents: number;
};
/**
 * Split `totalCents` across `weights` so the parts sum EXACTLY to the total.
 *
 * Uses largest-remainder: floor each share, then hand the leftover santim to
 * the entries with the biggest discarded remainder. Without this, apportioning
 * input VAT across cost centres loses or invents santim and the filing no
 * longer reconciles.
 */
export declare function allocateCents(totalCents: number, weights: readonly number[]): number[];
//# sourceMappingURL=money.d.ts.map