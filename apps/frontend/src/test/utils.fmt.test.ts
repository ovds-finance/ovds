/**
 * Tests for frontend/src/utils/fmt.ts
 * Covers all formatting utilities used across the app.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fmtNum,
  fmtCurrency,
  fmtDecimal,
  fmtCurrencyDecimal,
  fmtCompact,
  fmtPct,
  fmtDate,
  fmtDateShort,
  fmtRelative,
  fmtDaysLeft,
  computeReceiptConfidence,
  getLocale,
} from '../utils/fmt';

// -- fmtNum --------------------------------------------------------------------
describe('fmtNum()', () => {
  it('formats zero', () => {
    expect(fmtNum(0)).toBe('0');
  });

  it('formats a whole number', () => {
    expect(fmtNum(1500)).toBe('1,500');
  });

  it('truncates decimals', () => {
    expect(fmtNum(1500.99)).toBe('1,501');
  });

  it('handles negative numbers', () => {
    expect(fmtNum(-2500)).toBe('-2,500');
  });

  it('handles NaN-like falsy input', () => {
    // @ts-expect-error testing runtime behaviour
    expect(fmtNum(null)).toBe('0');
  });
});

// -- fmtCurrency ---------------------------------------------------------------
describe('fmtCurrency()', () => {
  it('prepends currency symbol', () => {
    expect(fmtCurrency(5000, 'ETB')).toBe('ETB 5,000');
  });

  it('works with USD', () => {
    expect(fmtCurrency(1234, 'USD')).toBe('USD 1,234');
  });
});

// -- fmtDecimal ----------------------------------------------------------------
describe('fmtDecimal()', () => {
  it('formats with 2 decimal places', () => {
    expect(fmtDecimal(1500)).toBe('1,500.00');
  });

  it('rounds to 2 decimal places', () => {
    expect(fmtDecimal(1500.999)).toBe('1,501.00');
  });

  it('handles zero', () => {
    expect(fmtDecimal(0)).toBe('0.00');
  });
});

// -- fmtCurrencyDecimal --------------------------------------------------------
describe('fmtCurrencyDecimal()', () => {
  it('formats with currency and 2 decimals', () => {
    expect(fmtCurrencyDecimal(15000.5, 'ETB')).toBe('ETB 15,000.50');
  });
});

// -- fmtCompact ----------------------------------------------------------------
describe('fmtCompact()', () => {
  it('formats thousands as K', () => {
    expect(fmtCompact(42_000)).toBe('42.0K');
  });

  it('formats millions as M', () => {
    expect(fmtCompact(1_500_000)).toBe('1.5M');
  });

  it('formats billions as B', () => {
    expect(fmtCompact(2_000_000_000)).toBe('2.0B');
  });

  it('formats small numbers without suffix', () => {
    expect(fmtCompact(999)).toBe('999');
  });

  it('prepends currency when provided', () => {
    expect(fmtCompact(1_000_000, 'ETB')).toBe('ETB 1.0M');
  });
});

// -- fmtPct --------------------------------------------------------------------
describe('fmtPct()', () => {
  it('converts decimal to percentage', () => {
    expect(fmtPct(0.15)).toBe('15.00%');
  });

  it('uses already-percent value when flag is true', () => {
    expect(fmtPct(15.67, true)).toBe('15.67%');
  });

  it('handles zero', () => {
    expect(fmtPct(0)).toBe('0.00%');
  });
});

// -- fmtDate -------------------------------------------------------------------
describe('fmtDate()', () => {
  it('returns em-dash for null', () => {
    expect(fmtDate(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(fmtDate(undefined)).toBe('—');
  });

  it('formats a valid ISO date string', () => {
    const result = fmtDate('2026-04-29');
    expect(result).toContain('2026');
    expect(result).toContain('Apr');
  });

  it('formats a Date object', () => {
    const result = fmtDate(new Date('2026-01-15'));
    expect(result).toContain('2026');
    expect(result).toContain('Jan');
  });
});

// -- fmtDateShort --------------------------------------------------------------
describe('fmtDateShort()', () => {
  it('returns em-dash for null', () => {
    expect(fmtDateShort(null)).toBe('—');
  });

  it('formats without year', () => {
    const result = fmtDateShort('2026-04-29');
    expect(result).toContain('Apr');
    expect(result).not.toContain('2026');
  });
});

// -- fmtRelative ---------------------------------------------------------------
describe('fmtRelative()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns em-dash for null', () => {
    expect(fmtRelative(null)).toBe('—');
  });

  it('returns "just now" for < 1 minute ago', () => {
    expect(fmtRelative('2026-04-29T11:59:30Z')).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(fmtRelative('2026-04-29T11:55:00Z')).toBe('5m ago');
  });

  it('returns hours ago', () => {
    expect(fmtRelative('2026-04-29T09:00:00Z')).toBe('3h ago');
  });

  it('returns days ago', () => {
    expect(fmtRelative('2026-04-26T12:00:00Z')).toBe('3d ago');
  });
});

// -- fmtDaysLeft ---------------------------------------------------------------
describe('fmtDaysLeft()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns em-dash for null', () => {
    expect(fmtDaysLeft(null)).toBe('—');
  });

  it('returns "Today" for same day', () => {
    expect(fmtDaysLeft('2026-04-29')).toBe('Today');
  });

  it('returns days left for future date', () => {
    expect(fmtDaysLeft('2026-05-06')).toBe('7d left');
  });

  it('returns overdue for past date', () => {
    expect(fmtDaysLeft('2026-04-22')).toBe('7d overdue');
  });
});

// -- getLocale -----------------------------------------------------------------
describe('getLocale()', () => {
  it('maps en to en-US', () => {
    expect(getLocale('en')).toBe('en-US');
  });

  it('maps am to am-ET', () => {
    expect(getLocale('am')).toBe('am-ET');
  });

  it('maps ti to am-ET (fallback)', () => {
    expect(getLocale('ti')).toBe('am-ET');
  });

  it('falls back to en-US for unknown lang', () => {
    expect(getLocale('fr')).toBe('en-US');
  });
});

// -- computeReceiptConfidence --------------------------------------------------
describe('computeReceiptConfidence()', () => {
  it('returns 0 for empty evidence', () => {
    expect(computeReceiptConfidence({})).toBe(0);
  });

  it('adds score for telecom ref', () => {
    expect(computeReceiptConfidence({ telecomRef: 'TXN123' })).toBe(15);
  });

  it('adds score for TIN validation', () => {
    expect(computeReceiptConfidence({ tinValidated: true })).toBe(15);
  });

  it('caps at 100', () => {
    const score = computeReceiptConfidence({
      telecomRef: 'TXN123',
      telecomParsed: { amount: 500, paidAt: '2026-04-29', payer: 'Abebe' },
      bankName: 'CBE',
      bankAccountNo: '1000123456789',
      mcc: '5411',
      qrType: 'DYNAMIC',
      tinValidated: true,
      orderNo: 'ORD-001',
      receiptImageData: 'base64...',
      bankSlipImageData: 'base64...',
      interactionType: 'ONLINE',
      archType: 'DIRECT',
      processType: 'REAL_TIME',
    });
    expect(score).toBe(100);
  });

  it('penalises duplicate payments', () => {
    const withoutDuplicate = computeReceiptConfidence({ telecomRef: 'TXN123', tinValidated: true });
    const withDuplicate = computeReceiptConfidence({ telecomRef: 'TXN123', tinValidated: true, isDuplicate: true });
    expect(withDuplicate).toBeLessThan(withoutDuplicate);
  });

  it('never goes below 0 even with duplicate penalty', () => {
    expect(computeReceiptConfidence({ isDuplicate: true })).toBe(0);
  });
});

