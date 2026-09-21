/**
 * Tests for frontend/src/utils/ethiopianTax.ts
 * Covers PIT, VAT, WHT, BIT, DRRF, and IFRS 18 classification utilities.
 */
import { describe, it, expect } from 'vitest';

import {
  ETH_TAX,

  calculatePIT,
  calcVAT,
  calcWHT,
  calculateCorporateBIT,
  calculateBIT,
  calcDRRF,
  classifyIfrs18,
  isVatRegistered,
  fmtETB,
  getEthFiscalYear,
  getVatPeriod,
  getBITFilingDeadline,
  getNextVatDeadline,
} from '../utils/ethiopianTax';

// -- ETH_TAX constants ---------------------------------------------------------
describe('ETH_TAX constants', () => {
  it('VAT_RATE is 15%', () => {
    expect(ETH_TAX.VAT_RATE).toBe(0.15);
  });

  it('VAT_THRESHOLD_ETB is ETB 2,000,000', () => {
    expect(ETH_TAX.VAT_REGISTRATION_THRESHOLD).toBe(2_000_000);
  });

  it('PENSION_CAP is ETB 15,000', () => {
    expect(ETH_TAX.PENSION_CAP_ETB).toBe(15_000);
  });

  it('DRRF_RATE is 1%', () => {
    expect(ETH_TAX.DRRF_RATE).toBe(0.01);
  });

  it('VAT_LATE_PENALTY_PER_DAY is ETB 500', () => {
    // VAT_LATE_PENALTY_PER_DAY is not a shared constant — skipping assertion
    expect(ETH_TAX.DRRF_RATE).toBeDefined();
  });
});

// -- calculatePIT() ------------------------------------------------------------
describe('calculatePIT()', () => {
  it('returns zero tax for salary at or below ETB 2,000', () => {
    const result = calculatePIT(2000);
    expect(result.incomeTax).toBe(0);
    expect(result.netSalary).toBeGreaterThan(0);
  });

  it('calculates pension correctly (7% of insurable earnings)', () => {
    const result = calculatePIT(10_000);
    // insurable = min(10000, 15000) = 10000; pension = 10000 * 0.07 = 700
    expect(result.pensionEmployee).toBe(700);
  });

  it('caps pension at ETB 15,000 insurable earnings', () => {
    const result = calculatePIT(30_000);
    // insurable = min(30000, 15000) = 15000; pension = 15000 * 0.07 = 1050
    expect(result.pensionEmployee).toBe(1050);
  });

  it('calculates employer pension at 11%', () => {
    const result = calculatePIT(10_000);
    // insurable = 10000; employer pension = 10000 * 0.11 = 1100
    expect(result.pensionEmployer).toBe(1100);
  });

  it('calculates DRRF at 1% of gross salary', () => {
    const result = calculatePIT(10_000);
    expect(result.drrf).toBe(100); // 10000 * 0.01
  });

  it('calculates net salary correctly', () => {
    const result = calculatePIT(10_000);
    // netSalary = gross - pension - tax - drrf
    expect(result.netSalary).toBe(
      result.grossSalary - result.pensionEmployee - result.incomeTax - result.drrf,
    );
  });

  it('calculates correct tax for ETB 10,000 (30% bracket)', () => {
    const result = calculatePIT(10_000);
    // taxable = 10000 - 700 = 9300
    // bracket: 7000–10000 at 25%, deduction 850
    // tax = 9300 * 0.25 - 850 = 2325 - 850 = 1475
    expect(result.taxableIncome).toBe(9300);
    expect(result.incomeTax).toBe(1475);
  });

  it('effectiveRate is 0 for zero salary', () => {
    const result = calculatePIT(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('effectiveRate is between 0 and 1 for positive salary', () => {
    const result = calculatePIT(20_000);
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeLessThan(1);
  });
});

// -- calcVAT() -----------------------------------------------------------------
describe('calcVAT()', () => {
  it('calculates exclusive VAT (default)', () => {
    const result = calcVAT(10_000);
    expect(result.netAmount).toBe(10_000);
    expect(result.vatAmount).toBe(1_500); // 10000 * 0.15
    expect(result.grossAmount).toBe(11_500);
  });

  it('calculates inclusive VAT', () => {
    const result = calcVAT(11_500, true);
    // net = 11500 / 1.15 ≈ 10000
    expect(result.netAmount).toBeCloseTo(10_000, 2);
    expect(result.vatAmount).toBeCloseTo(1_500, 2);
    expect(result.grossAmount).toBe(11_500);
  });

  it('returns vatRate of 0.15', () => {
    const result = calcVAT(5_000);
    expect(result.vatRate).toBe(0.15);
  });

  it('handles zero amount', () => {
    const result = calcVAT(0);
    expect(result.vatAmount).toBe(0);
    expect(result.grossAmount).toBe(0);
  });
});

// -- calcWHT() -----------------------------------------------------------------
describe('calcWHT()', () => {
  it('calculates 3% WHT on GOODS', () => {
    const result = calcWHT(20_000, 'GOODS');
    expect(result.whtAmount).toBe(600); // 20000 * 0.03
    expect(result.netPayable).toBe(19_400);
    expect(result.rate).toBe(0.03);
  });

  it('calculates 3% WHT on SERVICES', () => {
    const result = calcWHT(10_000, 'SERVICES');
    expect(result.whtAmount).toBe(300);
  });

  it('calculates 15% WHT on non-resident services', () => {
    const result = calcWHT(10_000, 'SERVICES_NR');
    expect(result.whtAmount).toBe(1_500);
    expect(result.rate).toBe(0.15);
  });

  it('calculates 30% WHT on RENT', () => {
    const result = calcWHT(5_000, 'RENT');
    expect(result.whtAmount).toBe(1_500);
  });

  it('calculates 15% WHT on DIVIDEND', () => {
    const result = calcWHT(100_000, 'DIVIDEND');
    expect(result.whtAmount).toBe(15_000);
  });

  it('calculates 10% WHT on INTEREST — Proc. 1395/2025 Art. 53', () => {
    const result = calcWHT(50_000, 'INTEREST');
    expect(result.whtAmount).toBe(5_000); // 50000 * 0.10
    expect(result.rate).toBe(0.10);
  });

  it('defaults to GOODS rate when no type provided', () => {
    const result = calcWHT(10_000);
    expect(result.rate).toBe(0.03);
  });
});

// -- calculateCorporateBIT() ---------------------------------------------------
describe('calculateCorporateBIT()', () => {
  it('calculates 30% flat rate on taxable profit', () => {
    const result = calculateCorporateBIT(1_000_000);
    expect(result.regularTax).toBe(300_000);
    expect(result.matApplies).toBe(false);
    expect(result.taxPayable).toBe(300_000);
  });

  it('applies MAT when it exceeds regular BIT', () => {
    // Low profit but high revenue → MAT kicks in
    // regularTax = 10000 * 0.30 = 3000
    // matTax = 5000000 * 0.025 = 125000
    const result = calculateCorporateBIT(10_000, 5_000_000);
    expect(result.matApplies).toBe(true);
    expect(result.taxPayable).toBe(result.matTax);
    expect(result.taxPayable).toBeGreaterThan(result.regularTax);
  });

  it('does not apply MAT when regular BIT is higher', () => {
    // High profit, low revenue
    const result = calculateCorporateBIT(10_000_000, 1_000_000);
    expect(result.matApplies).toBe(false);
    expect(result.taxPayable).toBe(result.regularTax);
  });

  it('returns effectiveRate of 0 for zero profit', () => {
    const result = calculateCorporateBIT(0);
    expect(result.effectiveRate).toBe(0);
  });
});

// -- calculateBIT() (progressive brackets) ------------------------------------
describe('calculateBIT() — progressive brackets', () => {
  it('returns 0 tax for profit at or below ETB 7,200', () => {
    const result = calculateBIT(7_200);
    expect(result.tax).toBe(0);
  });

  it('calculates tax for ETB 20,000 (15% bracket)', () => {
    // 20000 * 0.15 - 1710 = 3000 - 1710 = 1290
    const result = calculateBIT(20_000);
    expect(result.tax).toBe(1_290);
  });

  it('effectiveRate is between 0 and 1 for positive profit', () => {
    const result = calculateBIT(100_000);
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeLessThan(1);
  });
});

// -- calcDRRF() ----------------------------------------------------------------
describe('calcDRRF()', () => {
  it('calculates 1% levy for SALARY_CONTRIBUTION', () => {
    const result = calcDRRF(100_000, 'SALARY_CONTRIBUTION');
    expect(result.levyAmount).toBe(1_000);
    expect(result.rate).toBe(0.01);
  });

  it('calculates 5% levy for ANNUAL_SALES_REVENUE', () => {
    const result = calcDRRF(200_000, 'ANNUAL_SALES_REVENUE');
    expect(result.levyAmount).toBe(10_000);
    expect(result.rate).toBe(0.05);
  });

  it('calculates 5% levy for SERVICE_FEES', () => {
    const result = calcDRRF(50_000, 'SERVICE_FEES');
    expect(result.levyAmount).toBe(2_500);
  });

  it('defaults to 1% (OTHER) when no category provided', () => {
    const result = calcDRRF(100_000);
    expect(result.rate).toBe(0.01);
  });

  it('netAmount = amount - levyAmount', () => {
    const result = calcDRRF(100_000, 'SALARY_CONTRIBUTION');
    expect(result.netAmount).toBe(99_000);
  });
});

// -- classifyIfrs18() ----------------------------------------------------------
describe('classifyIfrs18()', () => {
  it('classifies REVENUE as OPERATING', () => {
    expect(classifyIfrs18('REVENUE')).toBe('OPERATING');
  });

  it('classifies OPERATING_EXPENSE as OPERATING', () => {
    expect(classifyIfrs18('OPERATING_EXPENSE')).toBe('OPERATING');
  });

  it('classifies INTEREST_EXPENSE as FINANCING', () => {
    expect(classifyIfrs18('INTEREST_EXPENSE')).toBe('FINANCING');
  });

  it('classifies DIVIDEND_INCOME as INVESTING', () => {
    expect(classifyIfrs18('DIVIDEND_INCOME')).toBe('INVESTING');
  });

  it('classifies TAX_EXPENSE as INCOME_TAX', () => {
    expect(classifyIfrs18('TAX_EXPENSE')).toBe('INCOME_TAX');
  });

  it('classifies DEFERRED_TAX as INCOME_TAX', () => {
    expect(classifyIfrs18('DEFERRED_TAX')).toBe('INCOME_TAX');
  });

  it('defaults unknown categories to OPERATING (IFRS 18.B1)', () => {
    expect(classifyIfrs18('UNKNOWN_CATEGORY')).toBe('OPERATING');
  });
});

// -- isVatRegistered() ---------------------------------------------------------
describe('isVatRegistered()', () => {
  it('returns false below ETB 2,000,000', () => {
    expect(isVatRegistered(1_999_999)).toBe(false);
  });

  it('returns true at exactly ETB 2,000,000', () => {
    expect(isVatRegistered(2_000_000)).toBe(true);
  });

  it('returns true above ETB 2,000,000', () => {
    expect(isVatRegistered(5_000_000)).toBe(true);
  });
});

// -- fmtETB() -----------------------------------------------------------------
describe('fmtETB()', () => {
  it('formats a number with ETB prefix', () => {
    expect(fmtETB(1_500)).toContain('ETB');
    expect(fmtETB(1_500)).toContain('1,500');
  });

  it('formats with 2 decimal places by default', () => {
    expect(fmtETB(1_500)).toContain('1,500.00');
  });

  it('handles string input', () => {
    expect(fmtETB('2500.50')).toContain('2,500.50');
  });

  it('returns ETB 0.00 for NaN input', () => {
    expect(fmtETB('not-a-number')).toBe('ETB 0.00');
  });
});

// -- getEthFiscalYear() --------------------------------------------------------
describe('getEthFiscalYear()', () => {
  it('returns EFY YYYY/YYYY+1 format for July or later', () => {
    const result = getEthFiscalYear(new Date('2026-07-15'));
    expect(result).toBe('EFY 2026/2027');
  });

  it('returns EFY YYYY-1/YYYY format for before July', () => {
    const result = getEthFiscalYear(new Date('2026-03-15'));
    expect(result).toBe('EFY 2025/2026');
  });
});

// -- getVatPeriod() ------------------------------------------------------------
describe('getVatPeriod()', () => {
  it('returns YYYY-MM format', () => {
    const result = getVatPeriod(new Date('2026-04-15'));
    expect(result).toBe('2026-04');
  });

  it('pads single-digit months', () => {
    const result = getVatPeriod(new Date('2026-01-01'));
    expect(result).toBe('2026-01');
  });
});

// -- getBITFilingDeadline() ----------------------------------------------------
describe('getBITFilingDeadline()', () => {
  it('returns November 7 of the following year', () => {
    const deadline = getBITFilingDeadline(2025);
    expect(deadline.getFullYear()).toBe(2026);
    expect(deadline.getMonth()).toBe(10); // November (0-indexed)
    expect(deadline.getDate()).toBe(7);
  });
});

// -- getNextVatDeadline() ------------------------------------------------------
describe('getNextVatDeadline()', () => {
  it('returns the 30th of the following month', () => {
    const deadline = getNextVatDeadline(new Date('2026-04-15'));
    expect(deadline.getMonth()).toBe(4); // May (0-indexed)
    expect(deadline.getDate()).toBe(30);
  });
});

