/**
 * Unit tests for the V&V validation engine — the shared logic behind every
 * V&V process screen (tax invoice, journal entry, reconciliation).
 *
 * Covers: field validation, double-entry balance, and the Original-vs-Validated
 * diff that powers the Final Review split view.
 */
import { describe, it, expect } from 'vitest';
import {
  validateVV,
  diffVV,
  doubleEntryTotals,
  vvIsValidTin,
  vvIsPositiveNumber,
  vvRequired,
  type VVField,
} from './validate';

const FIELDS: VVField[] = [
  { key: 'tin', label: 'TIN', type: 'tin', required: true, value: '' },
  { key: 'docNo', label: 'Doc No.', required: true, value: '' },
  { key: 'debitAmount', label: 'Debit', type: 'currency', side: 'debit', value: 0 },
  { key: 'creditAmount', label: 'Credit', type: 'currency', side: 'credit', value: 0 },
];

describe('validateVV', () => {
  it('flags missing required fields', () => {
    const errs = validateVV(FIELDS, { tin: '', docNo: '', debitAmount: 100, creditAmount: 100 });
    expect(errs.tin).toBeTruthy();
    expect(errs.docNo).toBeTruthy();
  });

  it('flags an invalid TIN (not 15 digits)', () => {
    const errs = validateVV(FIELDS, { tin: '123', docNo: 'INV-1', debitAmount: 100, creditAmount: 100 });
    expect(errs.tin).toMatch(/TIN/);
  });

  it('passes for a valid 15-digit TIN', () => {
    const errs = validateVV(FIELDS, { tin: '123456789012345', docNo: 'INV-1', debitAmount: 100, creditAmount: 100 });
    expect(errs.tin).toBeUndefined();
  });

  it('rejects negative currency amounts', () => {
    const errs = validateVV(FIELDS, { tin: '1234567890', docNo: 'INV-1', debitAmount: -5, creditAmount: 100 });
    expect(errs.debitAmount).toMatch(/cannot be negative/);
  });
});

describe('doubleEntryTotals', () => {
  it('sums debit and credit sides and reports balance', () => {
    const t = doubleEntryTotals(FIELDS, { debitAmount: 115, creditAmount: 115 });
    expect(t.debit).toBe(115);
    expect(t.credit).toBe(115);
    expect(t.balanced).toBe(true);
    expect(t.balance).toBe(0);
  });

  it('detects an out-of-balance entry', () => {
    const t = doubleEntryTotals(FIELDS, { debitAmount: 100, creditAmount: 115 });
    expect(t.balanced).toBe(false);
    expect(t.balance).toBe(-15);
  });
});

describe('diffVV', () => {
  it('classifies added / edited / removed / unchanged', () => {
    const fields: VVField[] = [
      { key: 'a', label: 'A', value: '' },
      { key: 'b', label: 'B', value: '' },
      { key: 'c', label: 'C', value: '' },
      { key: 'd', label: 'D', value: '' },
    ];
    const original = { a: '', b: 'old', c: 'gone', d: 'same' };
    const validated = { a: 'new', b: 'new', c: '', d: 'same' };
    const diffs = diffVV(fields, original, validated);
    const byKey = Object.fromEntries(diffs.map((d) => [d.key, d.status]));
    expect(byKey.a).toBe('added');
    expect(byKey.b).toBe('edited');
    expect(byKey.c).toBe('removed');
    expect(byKey.d).toBe('unchanged');
  });

  it('treats a missing original as all-added', () => {
    const fields: VVField[] = [{ key: 'a', label: 'A', value: '' }];
    const diffs = diffVV(fields, undefined, { a: 'x' });
    expect(diffs[0].status).toBe('added');
  });
});

describe('built-in validators', () => {
  it('vvRequired', () => {
    expect(vvRequired('')).toBeTruthy();
    expect(vvRequired('x')).toBeNull();
    expect(vvRequired(null)).toBeTruthy();
  });
  it('vvIsValidTin', () => {
    expect(vvIsValidTin('123456789012345')).toBeNull();
    expect(vvIsValidTin('12345')).toBeTruthy();
    expect(vvIsValidTin('1234567890')).toBeTruthy();
    expect(vvIsValidTin('')).toBeNull();
  });
  it('vvIsPositiveNumber', () => {
    expect(vvIsPositiveNumber('-1')).toBeTruthy();
    expect(vvIsPositiveNumber('0')).toBeNull();
    expect(vvIsPositiveNumber('10')).toBeNull();
    expect(vvIsPositiveNumber('abc')).toBeTruthy();
  });
});
