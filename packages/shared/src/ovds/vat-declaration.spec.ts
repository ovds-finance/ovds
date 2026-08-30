/**
 * Tests for the monthly VAT declaration computation.
 *
 * The invariant under test: declared totals must equal the sum of line items
 * exactly. A mismatch is what the MoR core API rejects as a tax-calculation
 * error, so these assertions are the guard against a rejected filing.
 */
import { describe, it, expect } from 'vitest';
import {
  computeVatDeclaration,
  validateVatDeclaration,
  computeMatCents,
  requiresVatRegistration,
  type VatDeclarationLineInput,
} from './vat-declaration';
import { toCents } from './money';
import { ETH_TAX } from '../constants';

const output = (
  ref: string,
  amount: string,
  treatment: VatDeclarationLineInput['treatment'] = 'STANDARD',
): VatDeclarationLineInput => ({
  invoiceReference: ref,
  direction: 'OUTPUT',
  treatment,
  amount,
});

const input = (
  ref: string,
  amount: string,
  treatment: VatDeclarationLineInput['treatment'] = 'STANDARD',
): VatDeclarationLineInput => ({
  invoiceReference: ref,
  direction: 'INPUT',
  treatment,
  amount,
});

describe('computeVatDeclaration', () => {
  it('computes 15% output VAT on standard-rated sales', () => {
    const r = computeVatDeclaration([output('INV-1', '1000')]);
    expect(r.totalSalesCents).toBe(toCents('1000'));
    expect(r.outputVatCents).toBe(toCents('150'));
    expect(r.netVatPayableCents).toBe(toCents('150'));
  });

  it('nets recoverable input VAT against output VAT', () => {
    const r = computeVatDeclaration([
      output('INV-1', '10000'),
      input('BILL-1', '4000'),
    ]);
    expect(r.outputVatCents).toBe(toCents('1500'));
    expect(r.inputVatCents).toBe(toCents('600'));
    expect(r.netVatPayableCents).toBe(toCents('900'));
  });

  it('produces a negative net when input exceeds output (refund position)', () => {
    const r = computeVatDeclaration([
      output('INV-1', '1000'),
      input('BILL-1', '5000'),
    ]);
    expect(r.netVatPayableCents).toBe(toCents('-600'));
  });

  it('charges no VAT on zero-rated exports but keeps standard-rated input recoverable', () => {
    // An exporter SELLS zero-rated (0% VAT) but BUYS at STANDARD 15%, and the
    // purchase is attributable to taxable supplies so the input VAT is recovered.
    const r = computeVatDeclaration([
      output('EXP-1', '50000', 'ZERO_RATED'),
      { ...input('BILL-1', '10000', 'STANDARD'), attributableTo: 'TAXABLE' },
    ]);
    expect(r.outputVatCents).toBe(0);
    expect(r.zeroRatedSalesCents).toBe(toCents('50000'));
    expect(r.inputVatCents).toBe(toCents('1500'));
    expect(r.nonRecoverableInputVatCents).toBe(0);
  });

  it('blocks input VAT recovery on exempt supplies', () => {
    const r = computeVatDeclaration([
      output('INV-1', '20000', 'EXEMPT'),
      { ...input('BILL-1', '10000', 'STANDARD'), attributableTo: 'EXEMPT' },
    ]);
    expect(r.outputVatCents).toBe(0);
    expect(r.inputVatCents).toBe(0);
    // Standard-rated input, but attributable to exempt supplies => not recoverable.
    expect(r.nonRecoverableInputVatCents).toBe(toCents('1500'));
    expect(r.exemptSalesCents).toBe(toCents('20000'));
  });

  it('splits VAT-inclusive amounts so net + vat === gross', () => {
    const r = computeVatDeclaration([
      {
        invoiceReference: 'POS-1',
        direction: 'OUTPUT',
        treatment: 'STANDARD',
        amount: '1150',
        amountIsVatInclusive: true,
      },
    ]);
    expect(r.totalSalesCents).toBe(toCents('1000'));
    expect(r.outputVatCents).toBe(toCents('150'));
    expect(r.lines[0].grossCents).toBe(toCents('1150'));
  });

  it('totals equal the sum of line items across many awkward amounts', () => {
    const lines: VatDeclarationLineInput[] = Array.from(
      { length: 500 },
      (_, i) => output(`INV-${i}`, `${(i + 1) * 0.07}`),
    );
    const r = computeVatDeclaration(lines);
    const summedVat = r.lines.reduce((s, l) => s + l.vatCents, 0);
    const summedNet = r.lines.reduce((s, l) => s + l.netCents, 0);
    expect(r.outputVatCents).toBe(summedVat);
    expect(r.totalSalesCents).toBe(summedNet);
    expect(validateVatDeclaration(r)).toEqual([]);
  });

  it('reproduces the MoR sample invoice exactly', () => {
    // EIMS collection sample: two lines 1000 and 10000 at VAT15,
    // TaxValue 1650, TotalValue 12650.
    const r = computeVatDeclaration([
      output('SAMPLE-L1', '1000'),
      output('SAMPLE-L2', '10000'),
    ]);
    expect(r.outputVatCents).toBe(toCents('1650'));
    expect(r.totalSalesCents + r.outputVatCents).toBe(toCents('12650'));
  });
});

describe('validateVatDeclaration', () => {
  it('passes a well-formed declaration', () => {
    const r = computeVatDeclaration([
      output('INV-1', '1234.56'),
      input('BILL-1', '789.01'),
    ]);
    expect(validateVatDeclaration(r)).toEqual([]);
  });

  it('detects a tampered total', () => {
    const r = computeVatDeclaration([output('INV-1', '1000')]);
    r.outputVatCents += 1;
    const errors = validateVatDeclaration(r);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ')).toContain('outputVatCents');
  });

  it('detects an inconsistent net payable', () => {
    const r = computeVatDeclaration([output('INV-1', '1000')]);
    r.netVatPayableCents = 999;
    expect(validateVatDeclaration(r).join(' ')).toContain('netVatPayableCents');
  });
});

describe('computeMatCents', () => {
  it('is 2.5% of annual turnover', () => {
    expect(computeMatCents(toCents('2000000'))).toBe(toCents('50000'));
  });
});

describe('requiresVatRegistration', () => {
  it('is true at or above the ETB 2M threshold', () => {
    expect(requiresVatRegistration(toCents('2000000'))).toBe(true);
    expect(requiresVatRegistration(toCents('2000000.01'))).toBe(true);
  });

  it('is false below the threshold', () => {
    expect(requiresVatRegistration(toCents('1999999.99'))).toBe(false);
  });

  it('uses the statutory threshold constant', () => {
    expect(ETH_TAX.VAT_REGISTRATION_THRESHOLD).toBe(2_000_000);
  });
});
