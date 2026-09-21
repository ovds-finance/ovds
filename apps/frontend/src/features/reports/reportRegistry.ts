import type { ReportTemplate, ReportCategory } from './types';
import type { AccountingBasis } from './types';

export const STANDARD_REPORTS: ReportTemplate[] = [
  {
    id: 'profit-and-loss',
    category: 'standard',
    title: 'Profit & Loss',
    description: 'Statement of comprehensive income — revenue vs. expenses for the selected period.',
    icon: 'trend-up',
    permission: 'reports:pl:read',
    basisSupported: ['accrual', 'cash'],
    endpoint: '/ovds/reports/profit-loss',
    groupByOptions: ['account', 'category', 'cost-center'],
  },
  {
    id: 'income-summary',
    category: 'standard',
    title: 'Income Summary',
    description: 'Total income broken down by category for the selected period.',
    icon: 'trend-up',
    permission: 'reports:pl:read',
    basisSupported: ['accrual', 'cash'],
    endpoint: '/ovds/reports/income-summary',
    groupByOptions: ['category', 'account'],
  },
  {
    id: 'expense-summary',
    category: 'standard',
    title: 'Expense Summary',
    description: 'Operating and non-operating expenses aggregated by category.',
    icon: 'list',
    permission: 'reports:read',
    basisSupported: ['accrual', 'cash'],
    endpoint: '/ovds/reports/expense-summary',
    groupByOptions: ['category', 'account', 'cost-center'],
  },
  {
    id: 'income-expense',
    category: 'standard',
    title: 'Income vs Expense',
    description: 'Side-by-side comparison of total income and total expenses with the net result.',
    icon: 'bar-chart-2',
    permission: 'reports:pl:read',
    basisSupported: ['accrual', 'cash'],
    endpoint: '/ovds/reports/income-expense',
    groupByOptions: ['month', 'category'],
  },
  {
    id: 'tax-summary',
    category: 'standard',
    title: 'Tax Summary',
    description: 'Output vs. input tax across invoices and bills, broken down by tax rate.',
    icon: 'shield-check',
    permission: 'reports:read',
    basisSupported: ['accrual'],
    endpoint: '/ovds/reports/tax-summary',
    groupByOptions: ['tax-rate', 'document-type'],
  },
];

export const MODULAR_REPORTS: ReportTemplate[] = [
  {
    id: 'double-entry-gl',
    category: 'modular',
    title: 'Double-Entry General Ledger',
    description: 'Full chart of accounts with debit, credit and running balances.',
    icon: 'book-open',
    permission: 'reports:gl:read',
    basisSupported: ['accrual'],
    endpoint: '/ovds/reports/general-ledger',
    groupByOptions: ['account', 'cost-center'],
  },
  {
    id: 'inventory-valuation',
    category: 'modular',
    title: 'Inventory Valuation',
    description: 'Stock on hand valued at cost, aggregated by warehouse and item type.',
    icon: 'box',
    permission: 'items:read',
    basisSupported: ['accrual'],
    endpoint: '/ovds/reports/inventory-valuation',
    groupByOptions: ['warehouse', 'category'],
  },
  {
    id: 'payroll-summary',
    category: 'modular',
    title: 'Payroll Summary',
    description: 'Total payroll cost and headcount broken down by department and component.',
    icon: 'banknote',
    permission: 'payroll:read',
    basisSupported: ['accrual'],
    endpoint: '/ovds/reports/payroll-summary',
    groupByOptions: ['department', 'component'],
  },
  {
    id: 'crm-sales',
    category: 'modular',
    title: 'CRM & Sales Summary',
    description: 'Revenue, invoiced amount and collections broken down by customer.',
    icon: 'users',
    permission: 'crm:contacts:read',
    basisSupported: ['accrual'],
    endpoint: '/ovds/reports/crm-sales',
    groupByOptions: ['customer', 'sales-rep', 'month'],
  },
];

export const ALL_TEMPLATES: ReportTemplate[] = [...STANDARD_REPORTS, ...MODULAR_REPORTS];

export function findTemplate(id: string): ReportTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

export function templatesByCategory(category: ReportCategory): ReportTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

export const BASIS_OPTIONS: AccountingBasis[] = ['accrual', 'cash'];
