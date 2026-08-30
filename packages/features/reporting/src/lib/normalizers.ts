import type { KpiCell, ReportColumn, ReportRow } from '../types/reporting.types';

export interface RenderedReport {
  kpis: KpiCell[];
  columns: ReportColumn[];
  rows: ReportRow[];
}

export function fmtMoney(value: number, currency = 'ETB'): string {
  try {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return String(value);
  }
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function fmtCell(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return fmtMoney(value);
  return String(value);
}

function pct(value: number, total: number): string {
  if (!total) return '-';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function normalizeReport(reportId: string, raw: unknown): RenderedReport {
  const r = (raw ?? {}) as Record<string, unknown>;

  switch (reportId) {
    case 'profit-and-loss': {
      const income = (r.income as Record<string, unknown>) ?? {};
      const expenses = (r.expenses as Record<string, unknown>) ?? {};
      const items = (income.items as ReportRow[]) ?? [];
      const expItems = (expenses.items as ReportRow[]) ?? [];
      const gross = (Number(income.total) || 0) - (Number(expenses.total) || 0);
      const net = r.grossProfit != null ? Number(r.grossProfit) : gross;
      const kpis: KpiCell[] = [
        { label: 'Income', value: fmtMoney(Number(income.total) || 0), color: 'emerald' },
        { label: 'Expenses', value: fmtMoney(Number(expenses.total) || 0), color: 'rose' },
        { label: 'Net Profit', value: fmtMoney(net), color: net >= 0 ? 'emerald' : 'rose' },
      ];
      const columns: ReportColumn[] = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Account' },
        { key: 'amount', label: 'Amount', align: 'right' },
      ];
      return { kpis, columns, rows: [...items, ...expItems] };
    }

    case 'income-summary': {
      const total = Number(r.totalIncome) || 0;
      const other = Number(r.totalOtherIncome) || 0;
      const byCat = (r.byCategory as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Total Income', value: fmtMoney(total), color: 'emerald' },
        { label: 'Other Income', value: fmtMoney(other), color: 'sky' },
      ];
      const columns: ReportColumn[] = [
        { key: 'name', label: 'Category' },
        { key: 'amount', label: 'Amount', align: 'right' },
      ];
      const rows = byCat.length ? byCat : [{ name: 'Income', amount: total }];
      return { kpis, columns, rows };
    }

    case 'expense-summary': {
      const total = Number(r.totalExpenses) || 0;
      const byCat = (r.byCategory as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Total Expenses', value: fmtMoney(total), color: 'rose' },
        { label: 'Categories', value: fmtNumber(byCat.length), color: 'slate' },
      ];
      const columns: ReportColumn[] = [
        { key: 'name', label: 'Category' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'percent', label: '% of Total', align: 'right' },
      ];
      const rows = byCat.length
        ? byCat.map((x) => ({ ...x, percent: pct(Number(x.amount), total) }))
        : [{ name: 'Expenses', amount: total }];
      return { kpis, columns, rows };
    }

    case 'income-expense': {
      const income = Number(r.income) || 0;
      const expenses = Number(r.expenses) || 0;
      const net = income - expenses;
      const byMonth = (r.byMonth as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Income', value: fmtMoney(income), color: 'emerald' },
        { label: 'Expenses', value: fmtMoney(expenses), color: 'rose' },
        { label: 'Net', value: fmtMoney(net), color: net >= 0 ? 'emerald' : 'rose' },
      ];
      const columns: ReportColumn[] = [
        { key: 'period', label: 'Period' },
        { key: 'income', label: 'Income', align: 'right' },
        { key: 'expenses', label: 'Expenses', align: 'right' },
        { key: 'net', label: 'Net', align: 'right' },
      ];
      const rows = byMonth.length
        ? byMonth
        : [{ period: 'Total', income, expenses, net }];
      return { kpis, columns, rows };
    }

    case 'tax-summary': {
      const summary = (r.summary as Record<string, unknown>) ?? {};
      const byTax = (r.byTaxRate as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Output Tax', value: fmtMoney(Number(summary.totalOutputTax) || 0), color: 'emerald' },
        { label: 'Input Tax', value: fmtMoney(Number(summary.totalInputTax) || 0), color: 'sky' },
        { label: 'Net Payable', value: fmtMoney(Number(summary.netPayable) || 0), color: 'violet' },
        { label: 'Transactions', value: fmtNumber(Number(summary.totalTransactions) || 0), color: 'amber' },
      ];
      const columns: ReportColumn[] = [
        { key: 'taxName', label: 'Tax Rate' },
        { key: 'calculationType', label: 'Type' },
        { key: 'outputTax', label: 'Output', align: 'right' },
        { key: 'inputTax', label: 'Input', align: 'right' },
        { key: 'netPosition', label: 'Net', align: 'right' },
        { key: 'transactionCount', label: '# Txns', align: 'right' },
      ];
      return { kpis, columns, rows: byTax };
    }

    case 'double-entry-gl': {
      const totals = (r.totals as Record<string, unknown>) ?? {};
      const accounts = (r.accounts as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Total Debits', value: fmtMoney(Number(totals.debits) || 0), color: 'emerald' },
        { label: 'Total Credits', value: fmtMoney(Number(totals.credits) || 0), color: 'rose' },
        { label: 'Accounts', value: fmtNumber(accounts.length), color: 'slate' },
      ];
      const columns: ReportColumn[] = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Account' },
        { key: 'debit', label: 'Debits', align: 'right' },
        { key: 'credit', label: 'Credits', align: 'right' },
        { key: 'balance', label: 'Balance', align: 'right' },
      ];
      return { kpis, columns, rows: accounts };
    }

    case 'inventory-valuation': {
      const total = Number(r.totalValue) || 0;
      const items = (r.items as ReportRow[]) ?? (r.byWarehouse as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Total Valuation', value: fmtMoney(total), color: 'emerald' },
        { label: 'Lines', value: fmtNumber(items.length), color: 'slate' },
      ];
      const columns: ReportColumn[] = [
        { key: 'name', label: 'Item / Location' },
        { key: 'quantity', label: 'Qty', align: 'right' },
        { key: 'unitCost', label: 'Unit Cost', align: 'right' },
        { key: 'value', label: 'Value', align: 'right' },
      ];
      return { kpis, columns, rows: items };
    }

    case 'payroll-summary': {
      const total = Number(r.totalPayroll) || 0;
      const headcount = Number(r.headcount) || 0;
      const byDept = (r.byDepartment as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Total Payroll', value: fmtMoney(total), color: 'emerald' },
        { label: 'Headcount', value: fmtNumber(headcount), color: 'slate' },
      ];
      const columns: ReportColumn[] = [
        { key: 'name', label: 'Department' },
        { key: 'count', label: 'Staff', align: 'right' },
        { key: 'gross', label: 'Gross', align: 'right' },
        { key: 'total', label: 'Total', align: 'right' },
      ];
      return { kpis, columns, rows: byDept };
    }

    case 'crm-sales': {
      const revenue = Number(r.totalRevenue) || 0;
      const invoiced = Number(r.invoiced) || 0;
      const paid = Number(r.paid) || 0;
      const byCust = (r.byCustomer as ReportRow[]) ?? [];
      const kpis: KpiCell[] = [
        { label: 'Revenue', value: fmtMoney(revenue), color: 'emerald' },
        { label: 'Invoiced', value: fmtMoney(invoiced), color: 'sky' },
        { label: 'Collected', value: fmtMoney(paid), color: 'teal' },
      ];
      const columns: ReportColumn[] = [
        { key: 'name', label: 'Customer' },
        { key: 'total', label: 'Total', align: 'right' },
        { key: 'paid', label: 'Paid', align: 'right' },
        { key: 'outstanding', label: 'Outstanding', align: 'right' },
      ];
      return { kpis, columns, rows: byCust };
    }

    default: {
      const columns: ReportColumn[] = [
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value', align: 'right' },
      ];
      const rows = (r.rows as ReportRow[]) ?? [];
      return { kpis: [], columns, rows };
    }
  }
}
