import { describe, it, expect } from 'vitest';
import { ALL_TEMPLATES, STANDARD_REPORTS, MODULAR_REPORTS, findTemplate, templatesByCategory } from '../features/reports/reportRegistry';
import type { ReportCategory } from '../features/reports/types';

describe('reportRegistry', () => {
  it('registers the 5 standard core reports', () => {
    expect(STANDARD_REPORTS).toHaveLength(5);
    expect(STANDARD_REPORTS.map((t) => t.id)).toEqual([
      'profit-and-loss',
      'income-summary',
      'expense-summary',
      'income-expense',
      'tax-summary',
    ]);
  });

  it('registers the 4 modular app reports', () => {
    expect(MODULAR_REPORTS).toHaveLength(4);
    expect(MODULAR_REPORTS.map((t) => t.id)).toEqual([
      'double-entry-gl',
      'inventory-valuation',
      'payroll-summary',
      'crm-sales',
    ]);
  });

  it('exposes all templates combined', () => {
    expect(ALL_TEMPLATES).toHaveLength(9);
  });

  it('findTemplate resolves by id', () => {
    expect(findTemplate('tax-summary')?.title).toBe('Tax Summary');
    expect(findTemplate('nope')).toBeUndefined();
  });

  it('templatesByCategory filters by category', () => {
    const standard = templatesByCategory('standard' as ReportCategory);
    const modular = templatesByCategory('modular' as ReportCategory);
    expect(standard.every((t) => t.category === 'standard')).toBe(true);
    expect(modular.every((t) => t.category === 'modular')).toBe(true);
    expect(standard).toHaveLength(5);
    expect(modular).toHaveLength(4);
  });

  it('every template declares an endpoint and permission', () => {
    for (const t of ALL_TEMPLATES) {
      expect(t.endpoint).toMatch(/^\/ovds\//);
      expect(t.permission.length).toBeGreaterThan(0);
      expect(t.basisSupported.length).toBeGreaterThan(0);
    }
  });
});
