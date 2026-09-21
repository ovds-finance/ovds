import { describe, it, expect } from 'vitest';

import { normalizeReport, fmtMoney, fmtNumber } from '../features/reports/normalizers';

describe('normalizers', () => {
  describe('fmtMoney / fmtNumber', () => {
    it('formats currency to two decimals', () => {
      expect(fmtMoney(1234.5)).toContain('1,234.50');
    });
    it('formats whole numbers without decimals', () => {
      expect(fmtNumber(1234.9)).toContain('1,235');
    });
  });

  describe('profit-and-loss', () => {
    it('computes KPIs and merges income/expense rows', () => {
      const raw = {
        income: { total: 1000, items: [{ code: 'REV', name: 'Sales', amount: 1000 }] },
        expenses: { total: 400, items: [{ code: 'EXP', name: 'Rent', amount: 400 }] },
      };
      const r = normalizeReport('profit-and-loss', raw);
      expect(r.kpis.map((k) => k.label)).toEqual(['Income', 'Expenses', 'Net Profit']);
      expect(r.kpis.find((k) => k.label === 'Net Profit')?.value).toContain('600.00');
      expect(r.rows).toHaveLength(2);
      expect(r.columns.map((c) => c.key)).toEqual(['code', 'name', 'amount']);
    });

    it('prefers server-supplied grossProfit when provided', () => {
      const raw = { income: { total: 1000 }, expenses: { total: 400 }, grossProfit: 700 };
      const r = normalizeReport('profit-and-loss', raw);
      expect(r.kpis.find((k) => k.label === 'Net Profit')?.value).toContain('700.00');
    });
  });

  describe('income-expense', () => {
    it('net is income minus expenses', () => {
      const raw = { income: 5000, expenses: 3250.75, byMonth: [] };
      const r = normalizeReport('income-expense', raw);
      expect(r.kpis.find((k) => k.label === 'Net')?.value).toContain('1,749.25');
      expect(r.rows[0]).toEqual({ period: 'Total', income: 5000, expenses: 3250.75, net: 1749.25 });
    });
  });

  describe('expense-summary', () => {
    it('computes percent of total per category', () => {
      const raw = {
        totalExpenses: 1000,
        byCategory: [{ name: 'Rent', amount: 400 }, { name: 'Utils', amount: 100 }],
      };
      const r = normalizeReport('expense-summary', raw);
      expect(r.kpis.find((k) => k.label === 'Total Expenses')?.value).toContain('1,000.00');
      expect(r.rows[0]).toHaveProperty('percent', '40.0%');
      expect(r.rows[1]).toHaveProperty('percent', '10.0%');
    });

    it('falls back to a single Expenses row when no categories', () => {
      const r = normalizeReport('expense-summary', { totalExpenses: 800, byCategory: [] });
      expect(r.rows).toEqual([{ name: 'Expenses', amount: 800 }]);
    });
  });

  describe('tax-summary', () => {
    it('maps tax-rate rows and KPI summary', () => {
      const raw = {
        summary: { totalOutputTax: 200, totalInputTax: 50, netPayable: 150, totalTransactions: 42 },
        byTaxRate: [{ taxName: '15%', calculationType: 'on net', outputTax: 200, inputTax: 50, netPosition: 150, transactionCount: 42 }],
      };
      const r = normalizeReport('tax-summary', raw);
      expect(r.kpis).toHaveLength(4);
      expect(r.kpis.find((k) => k.label === 'Net Payable')?.value).toContain('150.00');
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0].taxName).toBe('15%');
    });
  });

  describe('income-summary', () => {
    it('falls back to a single Income row when no categories', () => {
      const r = normalizeReport('income-summary', { totalIncome: 3000, totalOtherIncome: 200, byCategory: [] });
      expect(r.rows).toEqual([{ name: 'Income', amount: 3000 }]);
      expect(r.kpis.find((k) => k.label === 'Other Income')?.value).toContain('200.00');
    });
  });

  describe('double-entry-gl', () => {
    it('reads accounts and totals', () => {
      const raw = {
        accounts: [{ code: '1010', name: 'Cash', debit: 1000, credit: 0, balance: 1000 }],
        totals: { debits: 1000, credits: 0 },
      };
      const r = normalizeReport('double-entry-gl', raw);
      expect(r.rows).toHaveLength(1);
      expect(r.kpis.find((k) => k.label === 'Total Debits')?.value).toContain('1,000.00');
    });
  });

  describe('modular inventory / payroll / crm', () => {
    it('inventory-valuation falls back to byWarehouse', () => {
      const raw = { totalValue: 5000, byWarehouse: [{ name: 'WH1', value: 5000 }] };
      const r = normalizeReport('inventory-valuation', raw);
      expect(r.kpis[0].label).toBe('Total Valuation');
      expect(r.rows).toHaveLength(1);
    });

    it('payroll-summary reads headcount', () => {
      const raw = { totalPayroll: 90000, headcount: 12, byDepartment: [{ name: 'Ops', count: 12, gross: 90000, total: 90000 }] };
      const r = normalizeReport('payroll-summary', raw);
      expect(r.kpis.find((k) => k.label === 'Headcount')?.value).toBe('12');
      expect(r.rows[0].name).toBe('Ops');
    });

    it('crm-sales computes the KPIs', () => {
      const raw = { totalRevenue: 8000, invoiced: 7000, paid: 6500, byCustomer: [{ name: 'ABC', total: 8000, paid: 6500, outstanding: 1500 }] };
      const r = normalizeReport('crm-sales', raw);
      expect(r.kpis.find((k) => k.label === 'Collected')?.value).toContain('6,500.00');
      expect(r.rows[0].outstanding).toBe(1500);
    });
  });

  describe('unknown report', () => {
    it('returns a generic two-column layout from rows', () => {
      const raw = { rows: [{ name: 'Foo', value: 42 }] };
      const r = normalizeReport('unknown-report', raw);
      expect(r.kpis).toEqual([]);
      expect(r.columns.map((c) => c.key)).toEqual(['name', 'value']);
      expect(r.rows).toHaveLength(1);
    });

    it('handles null/undefined raw input', () => {
      const r = normalizeReport('tax-summary', null);
      expect(r.kpis[0].label).toBe('Output Tax');
      expect(r.kpis[0].value).toContain('0.00');
      expect(r.rows).toEqual([]);
    });
  });
});
