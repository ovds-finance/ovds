/**
 * Tests for shared constants — Ethiopian tax constants, PIT brackets,
 * business module map, and system-wide constants.
 *
 * These are pure value tests with no external dependencies.
 */
import { describe, it, expect } from 'vitest';
import {
  ETH_TAX,
  PIT_BRACKETS,
  calculatePIT,
  BUSINESS_MODULE_MAP,
  PAGINATION,
  CACHE_TTL,
  WS_EVENTS,
  APP_NAME,
  API_PREFIX,
} from './constants';

// -- App Identity --------------------------------------------------------------
describe('App Identity', () => {
  it('APP_NAME is OVDS', () => {
    expect(APP_NAME).toBe('OVDS');
  });

  it('API_PREFIX starts with /', () => {
    expect(API_PREFIX).toMatch(/^\//);
  });
});

// -- Ethiopian Tax Constants ---------------------------------------------------
describe('ETH_TAX constants (Proclamation No. 1395/2025)', () => {
  it('VAT_RATE is 15%', () => {
    expect(ETH_TAX.VAT_RATE).toBe(0.15);
  });

  it('WHT_IMPORT_RATE is 3%', () => {
    expect(ETH_TAX.WHT_IMPORT_RATE).toBe(0.03);
  });

  it('WHT_SERVICE_RATE is 3% (domestic services ≥ ETB 500)', () => {
    expect(ETH_TAX.WHT_SERVICE_RATE).toBe(0.03);
  });

  it('WHT_GOODS_RATE is 3% (domestic goods ≥ ETB 10,000)', () => {
    expect(ETH_TAX.WHT_GOODS_RATE).toBe(0.03);
  });

  it('WHT_DIVIDEND_RATE is 15%', () => {
    expect(ETH_TAX.WHT_DIVIDEND_RATE).toBe(0.15);
  });

  it('DRRF_RATE is 1%', () => {
    expect(ETH_TAX.DRRF_RATE).toBe(0.01);
  });

  it('PENSION_EMPLOYEE is 7%', () => {
    expect(ETH_TAX.PENSION_EMPLOYEE).toBe(0.07);
  });

  it('PENSION_EMPLOYER is 11%', () => {
    expect(ETH_TAX.PENSION_EMPLOYER).toBe(0.11);
  });

  it('BIT_MAX_RATE is 30%', () => {
    expect(ETH_TAX.BIT_MAX_RATE).toBe(0.30);
  });

  it('CURRENCY is ETB', () => {
    expect(ETH_TAX.CURRENCY).toBe('ETB');
  });

  it('FISCAL_YEAR_START is July (month 7)', () => {
    expect(ETH_TAX.FISCAL_YEAR_START).toBe(7);
  });

  it('VAT_REGISTRATION_THRESHOLD is ETB 2,000,000 (Regulation No. 570/2025)', () => {
    expect(ETH_TAX.VAT_REGISTRATION_THRESHOLD).toBe(2_000_000);
  });

  it('PENSION_CAP_ETB is ETB 15,000', () => {
    expect(ETH_TAX.PENSION_CAP_ETB).toBe(15_000);
  });

  it('MAT_RATE is 2.5%', () => {
    expect(ETH_TAX.MAT_RATE).toBe(0.025);
  });

  it('WHT_SERVICE_THRESHOLD is ETB 500', () => {
    expect(ETH_TAX.WHT_SERVICE_THRESHOLD).toBe(500);
  });

  it('WHT_GOODS_THRESHOLD is ETB 10,000', () => {
    expect(ETH_TAX.WHT_GOODS_THRESHOLD).toBe(10_000);
  });
});

// -- PIT Brackets -------------------------------------------------------------
describe('PIT_BRACKETS (Proclamation No. 1395/2025 — effective July 7, 2025)', () => {
  it('has 6 brackets (reduced from 7 under old law)', () => {
    expect(PIT_BRACKETS).toHaveLength(6);
  });

  it('first bracket: 0–2,000 ETB is tax-free (0%) — threshold raised from ETB 600', () => {
    const bracket = PIT_BRACKETS[0];
    expect(bracket.min).toBe(0);
    expect(bracket.max).toBe(2_000);
    expect(bracket.rate).toBe(0);
    expect(bracket.deduction).toBe(0);
  });

  it('second bracket: 2,001–4,000 ETB at 15%', () => {
    const bracket = PIT_BRACKETS[1];
    expect(bracket.min).toBe(2_001);
    expect(bracket.max).toBe(4_000);
    expect(bracket.rate).toBe(0.15);
    expect(bracket.deduction).toBe(300);
  });

  it('last bracket: above 14,000 ETB at 35%', () => {
    const bracket = PIT_BRACKETS[5];
    expect(bracket.min).toBe(14_001);
    expect(bracket.max).toBe(Infinity);
    expect(bracket.rate).toBe(0.35);
    expect(bracket.deduction).toBe(2_050);
  });

  it('brackets are ordered by min ascending', () => {
    for (let i = 1; i < PIT_BRACKETS.length; i++) {
      expect(PIT_BRACKETS[i].min).toBeGreaterThan(PIT_BRACKETS[i - 1].min);
    }
  });

  it('each bracket max equals next bracket min - 1 (no gaps)', () => {
    for (let i = 0; i < PIT_BRACKETS.length - 1; i++) {
      const current = PIT_BRACKETS[i];
      const next = PIT_BRACKETS[i + 1];
      expect(current.max + 1).toBe(next.min);
    }
  });

  // -- PIT calculation helper ------------------------------------------------
  function computePIT(grossIncome: number): number {
    const bracket = [...PIT_BRACKETS]
      .reverse()
      .find((b) => grossIncome >= b.min);
    if (!bracket || bracket.rate === 0) return 0;
    return Math.max(0, grossIncome * bracket.rate - bracket.deduction);
  }

  it('calculates 0 tax for ETB 2,000 (new tax-free threshold)', () => {
    expect(computePIT(2_000)).toBe(0);
  });

  it('calculates 0 tax for ETB 600 (also below new threshold)', () => {
    expect(computePIT(600)).toBe(0);
  });

  it('calculates correct tax for ETB 3,000 (15% bracket): 3000×0.15 − 300 = 150', () => {
    expect(computePIT(3_000)).toBe(150);
  });

  it('calculates correct tax for ETB 5,000 (20% bracket): 5000×0.20 − 500 = 500', () => {
    expect(computePIT(5_000)).toBe(500);
  });

  it('calculates correct tax for ETB 15,000 (35% bracket): 15000×0.35 − 2050 = 3200', () => {
    expect(computePIT(15_000)).toBe(3_200);
  });
});

// -- calculatePIT (PAYE) ---------------------------------------------------------
describe('calculatePIT (PAYE / Employment Income Tax)', () => {
  it('computes 7%/11% pension and zero income tax for tax-free income (ETB 2,000)', () => {
    const r = calculatePIT(2_000);
    expect(r.pensionEmployee).toBe(140); // 2000 * 7%
    expect(r.pensionEmployer).toBe(220); // 2000 * 11%
    expect(r.taxableIncome).toBe(1_860); // 2000 - 140
    expect(r.incomeTax).toBe(0);
  });

  it('caps pension contributions at ETB 15,000 insurable earnings', () => {
    const r = calculatePIT(100_000);
    expect(r.pensionEmployee).toBe(1_050); // 15_000 * 0.07
    expect(r.pensionEmployer).toBe(1_650); // 15_000 * 0.11
  });

  it('computes PIT on gross minus employee pension (ETB 3,000 gross)', () => {
    const r = calculatePIT(3_000);
    expect(r.pensionEmployee).toBe(210);
    expect(r.taxableIncome).toBe(2_790);
    expect(r.incomeTax).toBe(118.5); // 2790*0.15 - 300
  });

  it('applies the 35% top bracket for high earners (ETB 100,000 gross)', () => {
    const r = calculatePIT(100_000);
    expect(r.taxableIncome).toBe(98_950);
    expect(r.incomeTax).toBe(32_582.5); // 98950*0.35 - 2050
  });

  it('honours explicit per-employee pension rates', () => {
    const r = calculatePIT(10_000, 0.10, 0.12);
    expect(r.pensionEmployee).toBe(1_000);
    expect(r.pensionEmployer).toBe(1_200);
  });
});

// -- Business Module Map -------------------------------------------------------
describe('BUSINESS_MODULE_MAP', () => {
  it('LARGE_ENTERPRISE has the most modules', () => {
    const sizes = Object.values(BUSINESS_MODULE_MAP).map((m) => m.length);
    const maxSize = Math.max(...sizes);
    expect(BUSINESS_MODULE_MAP.LARGE_ENTERPRISE.length).toBe(maxSize);
  });

  it('FREELANCER has the fewest modules', () => {
    const sizes = Object.values(BUSINESS_MODULE_MAP).map((m) => m.length);
    const minSize = Math.min(...sizes);
    expect(BUSINESS_MODULE_MAP.FREELANCER.length).toBe(minSize);
  });

  it('all business types include ovds module', () => {
    for (const [type, modules] of Object.entries(BUSINESS_MODULE_MAP)) {
      expect(modules).toContain('ovds');
    }
  });

  it('SMALL_BUSINESS does not include payroll module', () => {
    expect(BUSINESS_MODULE_MAP.SMALL_BUSINESS).not.toContain('payroll');
  });

  it('GOVERNMENT includes audit module', () => {
    expect(BUSINESS_MODULE_MAP.GOVERNMENT).toContain('audit');
  });

  it('MANUFACTURING includes inventory module', () => {
    expect(BUSINESS_MODULE_MAP.MANUFACTURING).toContain('inventory');
  });
});

// -- Pagination Defaults -------------------------------------------------------
describe('PAGINATION', () => {
  it('DEFAULT_PAGE is 1', () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
  });

  it('DEFAULT_LIMIT is 20', () => {
    expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
  });

  it('MAX_LIMIT is 200', () => {
    expect(PAGINATION.MAX_LIMIT).toBe(200);
  });

  it('MAX_LIMIT > DEFAULT_LIMIT', () => {
    expect(PAGINATION.MAX_LIMIT).toBeGreaterThan(PAGINATION.DEFAULT_LIMIT);
  });
});

// -- Cache TTLs ----------------------------------------------------------------
describe('CACHE_TTL', () => {
  it('SHORT < MEDIUM < LONG < DAY', () => {
    expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.MEDIUM);
    expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG);
    expect(CACHE_TTL.LONG).toBeLessThan(CACHE_TTL.DAY);
  });

  it('DAY is 86,400 seconds', () => {
    expect(CACHE_TTL.DAY).toBe(86_400);
  });
});

// -- WebSocket Events ----------------------------------------------------------
describe('WS_EVENTS', () => {
  it('all event names follow namespace:action pattern', () => {
    for (const event of Object.values(WS_EVENTS)) {
      expect(event).toMatch(/^[a-z_]+:[a-z_]+$/);
    }
  });

  it('ATTENDANCE_UPDATE event exists', () => {
    expect(WS_EVENTS.ATTENDANCE_UPDATE).toBe('attendance:update');
  });

  it('NOTIFICATION_NEW event exists', () => {
    expect(WS_EVENTS.NOTIFICATION_NEW).toBe('notification:new');
  });
});
