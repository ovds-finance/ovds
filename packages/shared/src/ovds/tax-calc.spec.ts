/**
 * Tests for the tax calculation type model — the OVDS tax-type engine that
 * mirrors Ovds's Normal / Inclusive / Compound / Fixed / Withholding types.
 */
import { describe, it, expect } from 'vitest';
import {
  TaxCalculationType,
  TAX_CALCULATION_TYPE_LABELS,
  computeTaxFromType,
  TaxCalculationTypeSchema,
} from './tax-calc';

describe('computeTaxFromType', () => {
  it('NORMAL adds an exclusive percentage tax on top', () => {
    const r = computeTaxFromType(TaxCalculationType.NORMAL, { amount: 100, rate: 0.15 });
    expect(r).toEqual({ net: 100, tax: 15, total: 115, effectiveRate: 0.15 });
  });

  it('WITHHOLDING computes the withheld portion (remitted to authority)', () => {
    const r = computeTaxFromType(TaxCalculationType.WITHHOLDING, { amount: 1000, rate: 0.03 });
    expect(r).toEqual({ net: 1000, tax: 30, total: 1030, effectiveRate: 0.03 });
  });

  it('INCLUSIVE back-calculates tax embedded in the gross price', () => {
    const r = computeTaxFromType(TaxCalculationType.INCLUSIVE, { amount: 110, rate: 0.1 });
    expect(r.net).toBeCloseTo(100, 6);
    expect(r.tax).toBeCloseTo(10, 6);
    expect(r.total).toBe(110);
    expect(r.effectiveRate).toBeCloseTo(0.1, 6);
  });

  it('FIXED uses a fixed monetary amount regardless of rate', () => {
    const r = computeTaxFromType(TaxCalculationType.FIXED, { amount: 35.5, fixedAmount: 2.63 });
    expect(r).toEqual({ net: 35.5, tax: 2.63, total: 38.13, effectiveRate: 0.07408450704225352 });
  });

  it('COMPOUND applies on top of a primary tax (tax-on-tax)', () => {
    const r = computeTaxFromType(TaxCalculationType.COMPOUND, {
      amount: 200,
      rate: 0.02,
      baseTax: 9, // primary 4.5% VAT on 200
    });
    // primary 9 + compound 2% of (200 + 9) = 9 + 4.18 = 13.18
    expect(r.tax).toBeCloseTo(13.18, 6);
    expect(r.total).toBeCloseTo(213.18, 6);
    expect(r.net).toBe(200);
    expect(r.effectiveRate).toBeCloseTo(0.0659, 6);
  });

  it('exposes human-readable labels', () => {
    expect(TAX_CALCULATION_TYPE_LABELS[TaxCalculationType.COMPOUND]).toBe('Compound');
    expect(TAX_CALCULATION_TYPE_LABELS[TaxCalculationType.WITHHOLDING]).toBe('Withholding');
  });

  it('validates against the Zod schema', () => {
    expect(TaxCalculationTypeSchema.safeParse('INCLUSIVE').success).toBe(true);
    expect(TaxCalculationTypeSchema.safeParse('NOPE').success).toBe(false);
  });
});
