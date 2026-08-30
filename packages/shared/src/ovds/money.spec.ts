/**
 * Tests for exact integer-santim money arithmetic.
 *
 * These lock in the property the MoR cares about: a declaration's totals must
 * equal the sum of its line items exactly, with no residual santim.
 */
import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  formatCents,
  sumCents,
  roundHalfUp,
  applyRateToCents,
  extractInclusiveTaxCents,
  allocateCents,
  MoneyError,
  SANTIM_PER_ETB,
} from './money';

describe('toCents', () => {
  it('converts whole ETB', () => {
    expect(toCents(1000)).toBe(100_000);
    expect(toCents('1000')).toBe(100_000);
  });

  it('converts 2-decimal ETB exactly', () => {
    expect(toCents('1234.56')).toBe(123_456);
    expect(toCents(1234.56)).toBe(123_456);
  });

  it('rounds the 3rd decimal half-up', () => {
    expect(toCents('0.005')).toBe(1);
    expect(toCents('0.004')).toBe(0);
    expect(toCents('1.005')).toBe(101);
  });

  it('handles the classic float trap 1.005 * 100', () => {
    // 1.005 * 100 === 100.49999999999999 in IEEE-754, which naive
    // Math.round() would floor to 100 instead of 101.
    expect(toCents('1.005')).toBe(101);
  });

  it('handles negatives (credit notes)', () => {
    expect(toCents('-250.75')).toBe(-25_075);
  });

  it('treats empty string as zero', () => {
    expect(toCents('')).toBe(0);
  });

  it('rejects malformed decimal strings', () => {
    expect(() => toCents('12,50')).toThrow(MoneyError);
    expect(() => toCents('abc')).toThrow(MoneyError);
  });

  it('rejects non-finite numbers', () => {
    expect(() => toCents(NaN)).toThrow(MoneyError);
    expect(() => toCents(Infinity)).toThrow(MoneyError);
  });
});

describe('fromCents / formatCents', () => {
  it('round-trips', () => {
    expect(fromCents(123_456)).toBeCloseTo(1234.56, 10);
  });

  it('formats with 2 decimals', () => {
    expect(formatCents(123_456)).toBe('1234.56');
    expect(formatCents(5)).toBe('0.05');
    expect(formatCents(100)).toBe('1.00');
    expect(formatCents(-25_075)).toBe('-250.75');
  });

  it('rejects fractional santim', () => {
    expect(() => formatCents(10.5)).toThrow(MoneyError);
  });
});

describe('roundHalfUp', () => {
  it('rounds .5 away from zero symmetrically', () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(-0.5)).toBe(-1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(-1.5)).toBe(-2);
  });
});

describe('sumCents', () => {
  it('does not drift where floats would', () => {
    // 0.1 + 0.2 !== 0.3 as floats; as santim it is exact.
    const cents = [toCents('0.1'), toCents('0.2')];
    expect(sumCents(cents)).toBe(toCents('0.3'));
  });

  it('sums a large declaration exactly', () => {
    const lines = Array.from({ length: 10_000 }, () => toCents('0.07'));
    expect(sumCents(lines)).toBe(70_000); // ETB 700.00
  });
});

describe('applyRateToCents — 15% VAT', () => {
  it('computes standard VAT on a whole amount', () => {
    expect(applyRateToCents(toCents('1000'), 0.15)).toBe(toCents('150'));
  });

  it('rounds a half-santim result half-up', () => {
    // 3.10 * 15% = 0.465 → 47 santim
    expect(applyRateToCents(toCents('3.10'), 0.15)).toBe(47);
  });

  it('matches the MoR sample invoice lines', () => {
    // From the EIMS collection: 1000 @ VAT15 => 150, 10000 @ VAT15 => 1500
    expect(applyRateToCents(toCents('1000'), 0.15)).toBe(toCents('150'));
    expect(applyRateToCents(toCents('10000'), 0.15)).toBe(toCents('1500'));
  });

  it('computes 3% domestic WHT (Proc. 1395/2025)', () => {
    expect(applyRateToCents(toCents('11000'), 0.03)).toBe(toCents('330'));
  });

  it('computes 2.5% MAT', () => {
    expect(applyRateToCents(toCents('2000000'), 0.025)).toBe(toCents('50000'));
  });
});

describe('extractInclusiveTaxCents', () => {
  it('splits a VAT-inclusive amount with no residual santim', () => {
    const gross = toCents('1150');
    const { netCents, taxCents } = extractInclusiveTaxCents(gross, 0.15);
    expect(netCents).toBe(toCents('1000'));
    expect(taxCents).toBe(toCents('150'));
    expect(netCents + taxCents).toBe(gross);
  });

  it('always reconciles even when the split is not exact', () => {
    for (const etb of ['0.01', '1.00', '99.99', '12345.67']) {
      const gross = toCents(etb);
      const { netCents, taxCents } = extractInclusiveTaxCents(gross, 0.15);
      expect(netCents + taxCents).toBe(gross);
    }
  });
});

describe('allocateCents', () => {
  it('distributes without losing santim', () => {
    // ETB 100.00 across 3 equal cost centres = 33.34 / 33.33 / 33.33
    const parts = allocateCents(10_000, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10_000);
    expect(parts).toEqual([3334, 3333, 3333]);
  });

  it('respects weights', () => {
    const parts = allocateCents(1000, [70, 30]);
    expect(parts).toEqual([700, 300]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it('handles an indivisible remainder', () => {
    const parts = allocateCents(100, [1, 1, 1, 1, 1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('handles negative totals (credit apportionment)', () => {
    const parts = allocateCents(-10_000, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(-10_000);
  });

  it('falls back to the first slot when all weights are zero', () => {
    expect(allocateCents(500, [0, 0])).toEqual([500, 0]);
  });

  it('returns an empty array for no weights', () => {
    expect(allocateCents(500, [])).toEqual([]);
  });
});

describe('SANTIM_PER_ETB', () => {
  it('is 100', () => {
    expect(SANTIM_PER_ETB).toBe(100);
  });
});
