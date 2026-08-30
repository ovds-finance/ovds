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
export const SANTIM_PER_ETB = 100;

/** Largest ETB amount representable exactly (2^53-1 santim). */
export const MAX_SAFE_ETB = Number.MAX_SAFE_INTEGER / SANTIM_PER_ETB;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/**
 * Half-up rounding that is stable for negative values and immune to the
 * `Math.round(-0.5) === -0` asymmetry.
 */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new MoneyError(`Cannot round non-finite value: ${value}`);
  }
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Convert an ETB amount (possibly a decimal string from a form or API) into
 * exact santim.
 *
 * Accepts strings to avoid a lossy `parseFloat` round-trip on values that
 * arrive as JSON decimals.
 */
export function toCents(etb: number | string): number {
  if (typeof etb === 'number') {
    if (!Number.isFinite(etb)) {
      throw new MoneyError(`Invalid ETB amount: ${etb}`);
    }
    if (Math.abs(etb) > MAX_SAFE_ETB) {
      throw new MoneyError(`ETB amount exceeds safe range: ${etb}`);
    }
    // Scale via string to dodge e.g. 1.005 * 100 === 100.49999999999999
    return roundHalfUp(Number((etb * SANTIM_PER_ETB).toFixed(4)));
  }

  const trimmed = etb.trim();
  if (trimmed === '') return 0;
  if (!/^-?\d*(\.\d*)?$/.test(trimmed)) {
    throw new MoneyError(`Invalid ETB decimal string: "${etb}"`);
  }

  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole = '0', fraction = ''] = unsigned.split('.');

  // Keep 3 fraction digits so the 3rd can drive half-up on the 2nd.
  const padded = (fraction + '000').slice(0, 3);
  const wholeCents = Number(whole || '0') * SANTIM_PER_ETB;
  const fracCents = Number(padded.slice(0, 2));
  const thirdDigit = Number(padded[2]);

  let cents = wholeCents + fracCents + (thirdDigit >= 5 ? 1 : 0);
  if (!Number.isSafeInteger(cents)) {
    throw new MoneyError(`ETB amount exceeds safe range: "${etb}"`);
  }
  if (negative) cents = -cents;
  return cents;
}

/** Convert santim back to an ETB number. Presentation only — never re-accumulate. */
export function fromCents(cents: number): number {
  assertCents(cents);
  return cents / SANTIM_PER_ETB;
}

/** Format santim as a fixed 2-decimal ETB string (safe for JSON / MoR payloads). */
export function formatCents(cents: number): string {
  assertCents(cents);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / SANTIM_PER_ETB);
  const frac = abs % SANTIM_PER_ETB;
  return `${negative ? '-' : ''}${whole}.${String(frac).padStart(2, '0')}`;
}

export function assertCents(cents: number): void {
  if (!Number.isSafeInteger(cents)) {
    throw new MoneyError(
      `Monetary value must be a safe integer number of santim, received: ${cents}`,
    );
  }
}

/** Exact sum. Integer addition cannot drift, so no rounding is applied. */
export function sumCents(values: readonly number[]): number {
  let total = 0;
  for (const v of values) {
    assertCents(v);
    total += v;
  }
  if (!Number.isSafeInteger(total)) {
    throw new MoneyError('Sum exceeds safe integer range');
  }
  return total;
}

/**
 * Apply a fractional rate to a cents amount, rounding half-up once.
 *
 * `rate` is a decimal fraction (0.15 for 15%), matching ETH_TAX.*_RATE.
 */
export function applyRateToCents(cents: number, rate: number): number {
  assertCents(cents);
  if (!Number.isFinite(rate)) {
    throw new MoneyError(`Invalid rate: ${rate}`);
  }
  return roundHalfUp(cents * rate);
}

/**
 * Back out tax embedded in a VAT-inclusive amount.
 *
 * tax = gross * rate / (1 + rate), rounded half-up once. The caller derives
 * net as `gross - tax` so net + tax === gross exactly, with no residual santim.
 */
export function extractInclusiveTaxCents(
  grossCents: number,
  rate: number,
): { netCents: number; taxCents: number } {
  assertCents(grossCents);
  if (rate <= -1) {
    throw new MoneyError(`Invalid inclusive rate: ${rate}`);
  }
  const taxCents = roundHalfUp((grossCents * rate) / (1 + rate));
  return { netCents: grossCents - taxCents, taxCents };
}

/**
 * Split `totalCents` across `weights` so the parts sum EXACTLY to the total.
 *
 * Uses largest-remainder: floor each share, then hand the leftover santim to
 * the entries with the biggest discarded remainder. Without this, apportioning
 * input VAT across cost centres loses or invents santim and the filing no
 * longer reconciles.
 */
export function allocateCents(
  totalCents: number,
  weights: readonly number[],
): number[] {
  assertCents(totalCents);
  if (weights.length === 0) return [];
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) {
    throw new MoneyError('Allocation weights must be finite and non-negative');
  }

  const weightTotal = weights.reduce((a, b) => a + b, 0);
  if (weightTotal === 0) {
    // Nothing to weight by — put everything on the first slot.
    const parts = new Array<number>(weights.length).fill(0);
    parts[0] = totalCents;
    return parts;
  }

  const negative = totalCents < 0;
  const abs = Math.abs(totalCents);

  const exact = weights.map((w) => (abs * w) / weightTotal);
  const floored = exact.map((v) => Math.floor(v));
  let remainder = abs - floored.reduce((a, b) => a + b, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    floored[order[k].i] += 1;
  }

  return negative ? floored.map((v) => -v) : floored;
}
