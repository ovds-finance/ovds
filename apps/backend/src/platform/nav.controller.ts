import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { NavGroupDto, NavSectionDto, NavTreeDto, NavItemDto } from '@ovds/contracts/schemas';
import { Role, allowedSectionsForRole, isSuperUser, STATIC_SECTIONS, NAV_CACHE_TTL_SECONDS } from '@ovds/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

type StaticGroup = {
  key: string;
  label: string;
  i18nKey: string;
  icon: string;
  permission?: string;
  flat?: boolean;
  to?: string;
  sectionKey: string;
  items: Array<{
    to: string;
    label: string;
    icon: string;
    i18nKey?: string;
    permission?: string;
    isNew?: boolean;
    badge?: number;
    pinnable?: boolean;
    end?: boolean;
    keywords?: string[];
    priority: number;
  }>;
};

const STATIC_GROUPS: StaticGroup[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    i18nKey: 'nav.groups.dashboard',
    icon: 'DASHBOARD',
    sectionKey: '__sec_dashboard',
    flat: true,
    to: '/dashboard',
    items: [],
  },
  {
    key: 'sales',
    label: 'Sales',
    i18nKey: 'nav.groups.sales',
    icon: 'TRENDING_UP',
    sectionKey: '__sec_sales',
    permission: 'invoices:read',
    items: [
      { to: '/sales/invoices',     label: 'Invoices',           icon: 'INVOICE',        permission: 'invoices:read',      pinnable: true, priority: 10, keywords: ['invoice', 'sales invoice'] },
      { to: '/sales/estimates',    label: 'Estimates & Quotes', icon: 'CLIPBOARD_LIST',  permission: 'invoices:read',      priority: 20 },
      { to: '/sales/proforma',     label: 'Proforma Invoices',  icon: 'FILE_TEXT',       permission: 'invoices:read',      priority: 30 },
      { to: '/sales/orders',       label: 'Sales Orders',       icon: 'PROJECT',         permission: 'invoices:read',      priority: 40 },
      { to: '/sales/credit-notes', label: 'Credit Notes',       icon: 'RECEIPT',         permission: 'invoices:read',      priority: 50 },
      { to: '/sales/debit-notes',  label: 'Sales Debit Notes',  icon: 'FILE_TEXT',       permission: 'invoices:read',      priority: 60, isNew: true },
      { to: '/sales/receipts',     label: 'Receipts',           icon: 'SUCCESS',         permission: 'invoices:read',      priority: 70 },
      { to: '/crm/contacts',       label: 'Customers',          icon: 'CUSTOMER',        permission: 'crm:contacts:read',  pinnable: true, priority: 80 },
      { to: '/customers/summary',  label: 'Customer Summary',   icon: 'CUSTOMER',        permission: 'invoices:read',      priority: 85, isNew: true },
      { to: '/crm/pipeline',       label: 'Pipeline',           icon: 'TREND_UP',        permission: 'crm:deals:read',     priority: 90 },
      { to: '/crm/interactions',   label: 'Interactions',       icon: 'MESSAGE_SQUARE',  permission: 'crm:activities:read', priority: 95, isNew: true },
    ],
  },
  {
    key: 'purchases',
    label: 'Purchases',
    i18nKey: 'nav.groups.purchases',
    icon: 'CLIPBOARD_LIST',
    sectionKey: '__sec_purchases',
    permission: 'bills:read',
    items: [
      { to: '/purchases/bills',         label: 'Bills',            icon: 'INVOICE',       permission: 'bills:read',          pinnable: true, priority: 10 },
      { to: '/purchases/vendors',       label: 'Vendors',          icon: 'VENDOR',         permission: 'bills:read',          pinnable: true, priority: 20 },
      { to: '/purchases/orders',        label: 'Purchase Orders',  icon: 'CLIPBOARD_LIST', permission: 'purchase_orders:read', priority: 30 },
      { to: '/purchases/grn',           label: 'Goods Received',   icon: 'BOXES',          permission: 'bills:read',          priority: 40 },
      { to: '/purchases/debit-notes',   label: 'Debit Notes',      icon: 'MINUS',          permission: 'bills:read',          priority: 50 },
      { to: '/purchases/scanned-bills', label: 'Scan Receipts',    icon: 'UPLOAD',         permission: 'bills:read',          priority: 60, isNew: true },
      { to: '/purchases/expenses',      label: 'Expenses',         icon: 'MONEY',          permission: 'expenses:read',       priority: 70 },
      { to: '/expense-claims',          label: 'Expense Claims',   icon: 'RECEIPT',        permission: 'expenses:read',       pinnable: true, priority: 80 },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    i18nKey: 'nav.groups.inventory',
    icon: 'BOXES',
    sectionKey: '__sec_inventory',
    permission: 'items:read',
    items: [
      { to: '/inventory',           label: 'Stock Overview',      icon: 'INVENTORY',   permission: 'items:read',  pinnable: true, priority: 10 },
      { to: '/items',               label: 'Products & Services', icon: 'ITEM',        permission: 'items:read',  pinnable: true, priority: 20 },
      { to: '/inventory/variants',  label: 'Variants & Bundles',  icon: 'BOXES',       permission: 'items:read',  priority: 30 },
      { to: '/inventory/adjustments', label: 'Stock Adjustments', icon: 'REFRESH_CW',  permission: 'items:write', priority: 40, isNew: true },
      { to: '/inventory/valuation', label: 'Inventory Valuation', icon: 'CHART',       permission: 'items:read',  priority: 50 },
      { to: '/manufacturing',       label: 'Manufacturing',       icon: 'SETTINGS',    permission: 'items:read',  priority: 60 },
    ],
  },
  {
    key: 'banking',
    label: 'Banking',
    i18nKey: 'nav.groups.banking',
    icon: 'WALLET',
    sectionKey: '__sec_banking',
    permission: 'banking:read',
    items: [
      { to: '/banking/accounts',          label: 'Accounts',          icon: 'BANK',            permission: 'banking:read',           pinnable: true, priority: 10 },
      { to: '/banking/transactions',      label: 'Transactions',      icon: 'REFRESH',          permission: 'banking:read',         priority: 20 },
      { to: '/banking/reconciliation',    label: 'Reconciliation',    icon: 'REFRESH_CW',       permission: 'bank_reconciliation:read', priority: 30 },
      { to: '/banking/cash-flow',         label: 'Cash Flow',         icon: 'TREND_UP',         permission: 'banking:read',           priority: 40, isNew: true },
      { to: '/banking/petty-cash',        label: 'Petty Cash',        icon: 'MONEY',            permission: 'banking:read',           priority: 50 },
      { to: '/banking/transfers',         label: 'Transfers',         icon: 'ARROW_LEFT_RIGHT', permission: 'fund_transfers:read',   priority: 60 },
      { to: '/banking/fx-rates',          label: 'FX & Currencies',   icon: 'GLOBE',             permission: 'banking:read',           priority: 70 },
      { to: '/banking/digital-payments',  label: 'Telebirr & Chapa',  icon: 'CREDIT_CARD',      permission: 'banking:read',           priority: 80, isNew: true },
      { to: '/banking/treasury',          label: 'Treasury Forecast', icon: 'TRENDING_UP',      permission: 'fund_transfers:read',   priority: 90 },
      { to: '/banking/feeds',             label: 'Bank Feeds',        icon: 'REFRESH_CW',       permission: 'banking:read',           priority: 100 },
      { to: '/banking/statement-import',  label: 'Statement Import',  icon: 'UPLOAD',           permission: 'bank_statement_import:write', priority: 110 },
      { to: '/banking/year-end',          label: 'Year-End Close',    icon: 'CALENDAR',         permission: 'banking:read',           priority: 120 },
      { to: '/banking/rules',             label: 'Matching Rules',    icon: 'GIT_MERGE',        permission: 'banking:read',           priority: 130 },
      { to: '/banking/workflow',          label: 'Banking Workflow',  icon: 'REFRESH_CW',       permission: 'banking:read',           priority: 140, isNew: true },
      { to: '/banking/verify',            label: 'Banking Verification', icon: 'CHECK_CIRCLE',  permission: 'banking:read',           priority: 150, isNew: true },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    i18nKey: 'nav.groups.accounting',
    icon: 'BOOK_OPEN',
    sectionKey: '__sec_accounting',
    permission: 'ovds:read',
    items: [
      { to: '/ovds/accounts',                    label: 'Chart of Accounts',         icon: 'CHART',         permission: 'ovds:read',            pinnable: true, end: true, priority: 10 },
      { to: '/double-entry/journals',            label: 'Journal Entries',           icon: 'FILE_TEXT',      permission: 'ovds:write',           priority: 20 },
      { to: '/ovds/reports/general-ledger',      label: 'General Ledger',            icon: 'BOOK_OPEN',      permission: 'reports:gl:read',      priority: 30 },
      { to: '/ovds/reports/trial-balance',       label: 'Trial Balance',             icon: 'LIST',           permission: 'reports:gl:read',      priority: 40 },
      { to: '/accounting/categories',            label: 'Categories',                icon: 'TAG',            permission: 'ovds:read',            priority: 50 },
      { to: '/accounting/cost-centers',          label: 'Cost Centers',              icon: 'CALCULATOR',     permission: 'ovds:read',            priority: 60 },
      { to: '/accounting/opening-balances',      label: 'Opening Balances',          icon: 'MONEY',          permission: 'ovds:write',           priority: 70, isNew: true },
      { to: '/accounting/period-close',          label: 'Period Close',              icon: 'LOCK',           permission: 'period_close:read',    priority: 80 },
      { to: '/accounting/accruals-prepayments',  label: 'Accruals & Prepayments',    icon: 'CLOCK',          permission: 'ovds:read',            priority: 90, isNew: true },
      { to: '/accounting/workflow',              label: 'Workflow Automation',       icon: 'REFRESH_CW',     permission: 'ovds:read',            priority: 100, isNew: true },
      { to: '/ifrs',                             label: 'IFRS Dashboard',            icon: 'CLIPBOARD_LIST', permission: 'ifrs:read',           priority: 110 },
      { to: '/ifrs/consolidated-statements',     label: 'Consolidated Statements',   icon: 'GIT_MERGE',      permission: 'ifrs:read',           priority: 120, isNew: true },
      { to: '/ifrs/intercompany-eliminations',   label: 'Intercompany Eliminations', icon: 'GIT_MERGE',      permission: 'ifrs:read',           priority: 130, isNew: true },
      { to: '/general-ledger-compliance',        label: 'GL & Compliance',           icon: 'SHIELD_CHECK',   permission: 'ovds:read',            priority: 140 },
      { to: '/accounting/aabe-audit',            label: 'AABE Audit Readiness',      icon: 'CHECK_CIRCLE',   permission: 'reports:read',         priority: 150, isNew: true },
      { to: '/accounting/consolidation',         label: 'Group Consolidation',       icon: 'LAYERS',         permission: 'ifrs:read',           priority: 160, isNew: true },
      { to: '/accounting/fixed-assets',          label: 'Fixed Assets',              icon: 'COMPANY',        permission: 'fixed_assets:read',   priority: 170 },
      { to: '/accounting/leases',                label: 'Leases (IFRS 16)',          icon: 'HOME',           permission: 'ovds:read',            priority: 180 },
      { to: '/accounting/budgets',               label: 'Budgets',                   icon: 'TARGET',         permission: 'ovds:read',            priority: 190 },
      { to: '/accounting/budgets/variance',      label: 'Budget Variance',           icon: 'TREND_UP',       permission: 'ovds:read',            priority: 200 },
      { to: '/accounting/hub',                   label: 'Accounting Hub',            icon: 'LAYERS',         permission: 'ovds:read',            priority: 210 },
      { to: '/accounting/collections',           label: 'Collections',               icon: 'INBOX',          permission: 'ovds:read',            priority: 220 },
      { to: '/accounting/sub-ledger',            label: 'Sub-Ledger',                icon: 'BOOK_OPEN',      permission: 'ovds:read',            priority: 230 },
      { to: '/accounting-dashboard',             label: 'Accounting Dashboard',      icon: 'DASHBOARD',      permission: 'ovds:read',            priority: 240, isNew: true },
    ],
  },
  {
    key: 'ifrs_compliance',
    label: 'IFRS Standards',
    i18nKey: 'nav.groups.ifrs_compliance',
    icon: 'CLIPBOARD_LIST',
    sectionKey: '__sec_ifrs',
    permission: 'ifrs:read',
    items: [
      { to: '/ifrs',                              label: 'IFRS Dashboard',            icon: 'LAYOUT_DASHBOARD', permission: 'ifrs:read',      priority: 10 },
      { to: '/ifrs/consolidated-statements',      label: 'Consolidated Statements',   icon: 'GIT_MERGE',        permission: 'ifrs:read',      priority: 20, isNew: true },
      { to: '/ifrs/intercompany-eliminations',    label: 'Intercompany Eliminations', icon: 'GIT_MERGE',        permission: 'ifrs:read',      priority: 30, isNew: true },
      { to: '/accounting/leases',                 label: 'Leases (IFRS 16)',          icon: 'HOME',             permission: 'ovds:read',      priority: 40 },
      { to: '/accounting/fixed-assets',           label: 'Property, Plant & Equipment', icon: 'COMPANY',        permission: 'fixed_assets:read', priority: 50 },
      { to: '/reports?type=ifrs15',               label: 'IFRS 15 Revenue Recognition', icon: 'TREND_UP',       permission: 'reports:read',   priority: 60, isNew: true },
      { to: '/reports?type=ifrs18',               label: 'IFRS 18 Performance Measures', icon: 'BAR_CHART_2',   permission: 'reports:read',   priority: 70, isNew: true },
      { to: '/accounting/estimates',              label: 'Estimates & Judgments',     icon: 'CALCULATOR',       permission: 'ovds:read',      priority: 90, isNew: true },
    ],
  },
  {
    key: 'aabe_compliance',
    label: 'AABE Compliance',
    i18nKey: 'nav.groups.aabe_compliance',
    icon: 'CHECK_CIRCLE',
    sectionKey: '__sec_aabe',
    permission: 'reports:read',
    items: [
      { to: '/accounting/aabe-audit',             label: 'AABE Audit Readiness',      icon: 'CHECK_CIRCLE',   permission: 'reports:read',         priority: 10, isNew: true },
      { to: '/compliance/audit-outsourcing',      label: 'Audit Outsourcing',         icon: 'USERS',           permission: 'audit_logs:read',  priority: 50 },
      { to: '/compliance/auditor?view=audit-opinion', label: "Auditor's Report",      icon: 'FILE_TEXT',      permission: 'reports:read',     priority: 60 },
    ],
  },
  {
    key: 'commercial_code',
    label: 'Commercial Code',
    i18nKey: 'nav.groups.commercial_code',
    icon: 'BUILDING',
    sectionKey: '__sec_cc',
    permission: 'settings:read',
    items: [
      { to: '/settings/business-registration',    label: 'Business Registration',     icon: 'BUILDING',       permission: 'settings:write',  priority: 10 },
      { to: '/settings/company-profile?tab=tin',  label: 'TIN & MoR Credentials',     icon: 'KEY',            permission: 'settings:write',  priority: 20 },
      { to: '/settings/company-profile?tab=ma',   label: 'Memorandum & Articles',     icon: 'FILE_TEXT',      permission: 'settings:write',  priority: 30 },
      { to: '/ovds/partnerships?tab=capital',        label: 'Share Capital Management',  icon: 'BANKNOTE',       permission: 'business_loans:read', priority: 40 },
      { to: '/reports/mor-report?section=directors', label: "Directors' / Management Report", icon: 'FILE_TEXT', permission: 'reports:read',  priority: 60 },
      { to: '/reports/financial-statements',         label: 'Financial Statements Package', icon: 'BAR_CHART_2',  permission: 'reports:read',     priority: 80 },
    ],
  },
  {
    key: 'regulatory_reporting',
    label: 'Regulatory Reporting',
    i18nKey: 'nav.groups.regulatory_reporting',
    icon: 'SEND',
    sectionKey: '__sec_reg',
    permission: 'vat:read',
    items: [
      { to: '/tax/filing',                        label: 'MoR/ERCA Tax Portal',       icon: 'SEND',            permission: 'vat:file',         priority: 10 },
      { to: '/tax/etax-declaration',              label: 'e-Tax Declaration',         icon: 'SEND',            permission: 'vat:file',         priority: 20, isNew: true },
      { to: '/tax/tot',                           label: 'TOT Filing',                icon: 'SEND',            permission: 'vat:file',         priority: 30, isNew: true },
      { to: '/tax/pension-submission',            label: 'Pension Submission',        icon: 'SEND',            permission: 'payroll:read',    priority: 40, isNew: true },
      { to: '/compliance/invoices',               label: 'E-Invoicing Compliance',    icon: 'INVOICE',         permission: 'vat:read',         priority: 50, isNew: true },
      { to: '/compliance/receipts',               label: 'E-Receipts',                icon: 'SUCCESS',         permission: 'vat:read',         priority: 60, isNew: true },
      { to: '/compliance/certificates',           label: 'Digital Certificate Mgmt',  icon: 'AWARD',           permission: 'vat:read',         priority: 70, isNew: true },
      { to: '/compliance/bulk',                   label: 'Bulk Operations',           icon: 'UPLOAD',          permission: 'vat:read',         priority: 80, isNew: true },
    ],
  },
  {
    key: 'tax_compliance',
    label: 'Tax & Compliance',
    i18nKey: 'nav.groups.tax_compliance',
    icon: 'SHIELD_CHECK',
    sectionKey: '__sec_tax',
    permission: 'vat:read',
    items: [
      { to: '/tax/dashboard',           label: 'Tax Dashboard',          icon: 'LAYOUT_DASHBOARD', permission: 'vat:read',         priority: 10, isNew: true },
      { to: '/tax/vat',                 label: 'VAT Administration',     icon: 'SEND',             permission: 'vat:file',         pinnable: true, priority: 20 },
      { to: '/tax/tot',                 label: 'TOT Filing',             icon: 'SEND',             permission: 'vat:file',         priority: 30, isNew: true },
      { to: '/tax/excise-tax',          label: 'Excise Tax',             icon: 'SHIELD_CHECK',     permission: 'vat:file',         priority: 40 },
      { to: '/tax/stamp-duty',          label: 'Stamp Duty',             icon: 'FILE_TEXT',        permission: 'vat:file',         priority: 50 },
      { to: '/tax/wht-certificates',    label: 'WHT Certificates',       icon: 'INVOICE',          permission: 'vat:read',         priority: 60 },
      { to: '/tax/schedule-d',          label: 'Schedule D',             icon: 'CLIPBOARD_LIST',   permission: 'vat:read',         priority: 70 },
      { to: '/tax/etax-declaration',    label: 'e-Tax Declaration',      icon: 'SEND',             permission: 'vat:file',         priority: 75, isNew: true },
      { to: '/tax/acknowledgement-vault', label: 'Acknowledgement Vault', icon: 'FILE_TEXT',      permission: 'vat:read',         priority: 76, isNew: true },
      { to: '/tax/liability-estimator', label: 'Tax Liability Estimator', icon: 'CALCULATOR',      permission: 'vat:read',         priority: 77, isNew: true },
      { to: '/tax/pension-submission',  label: 'Pension Submission',     icon: 'SEND',             permission: 'payroll:read',     priority: 78, isNew: true },
      { to: '/tax/payment-reference',   label: 'Payment Reference',      icon: 'CREDIT_CARD',      permission: 'vat:read',         priority: 79, isNew: true },
      { to: '/compliance/vandv',        label: 'TASS (SRM Devices)',     icon: 'BADGE_CHECK',      permission: 'vat:read',         priority: 80 },
      { to: '/compliance/security',     label: 'Security Evaluator',     icon: 'LOCK',             permission: 'audit_logs:read',  priority: 90, isNew: true },
      { to: '/compliance/audit-outsourcing', label: 'Audit Outsourcing', icon: 'USERS',            permission: 'audit_logs:read',  priority: 100 },
      { to: '/compliance/eims',         label: 'EIMS / MoR',             icon: 'SEND',             permission: 'settings:write',   priority: 105, isNew: true },
      { to: '/compliance/dashboard',    label: 'Compliance Dashboard',   icon: 'SHIELD_CHECK',     permission: 'vat:read',         priority: 106, isNew: true },
      { to: '/compliance/invoices',     label: 'E-Invoices',             icon: 'INVOICE',          permission: 'vat:read',         priority: 107, isNew: true },
      { to: '/compliance/receipts',     label: 'E-Receipts',             icon: 'SUCCESS',          permission: 'vat:read',         priority: 108, isNew: true },
      { to: '/compliance/bulk',         label: 'Bulk Operations',        icon: 'UPLOAD',           permission: 'vat:read',         priority: 109, isNew: true },
      { to: '/compliance/checklists',   label: 'Compliance Checklists',  icon: 'CHECK_CIRCLE',     permission: 'vat:read',         priority: 110, isNew: true },
      { to: '/compliance/master-checklist', label: 'Master Compliance Checklist', icon: 'CLIPBOARD_LIST', permission: 'vat:read', priority: 111, isNew: true },
      { to: '/compliance/accreditation', label: 'System Accreditation (1142/2026)', icon: 'AWARD', permission: 'vat:read', priority: 112, isNew: true },
      { to: '/compliance/cyber-audit',  label: 'Cyber Audit Checklist',  icon: 'SHIELD',           permission: 'audit_logs:read',  priority: 113, isNew: true },
      { to: '/compliance/tax-reports',  label: 'Tax Reports',            icon: 'BAR_CHART_2',      permission: 'reports:read',     priority: 114, isNew: true },
      { to: '/compliance/withholding',  label: 'Withholding Tax',        icon: 'INVOICE',          permission: 'vat:read',         priority: 115, isNew: true },
      { to: '/tax/property-tax',        label: 'Property Tax',           icon: 'HOME',             permission: 'vat:read',         priority: 113 },
      { to: '/tax/penalty-calculator',  label: 'Penalty Calculator',     icon: 'CALCULATOR',       permission: 'vat:read',         priority: 120, isNew: true },
      { to: '/tax/universal-config',    label: 'Universal Tax Config',   icon: 'SETTINGS',         permission: 'settings:read',    priority: 130 },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    i18nKey: 'nav.groups.reports',
    icon: 'BAR_CHART_2',
    sectionKey: '__sec_reports',
    permission: 'reports:read',
    items: [
      { to: '/reports-dashboard',             label: 'Reports Dashboard',           icon: 'BAR_CHART_2',   permission: 'reports:read',         priority: 10, isNew: true },
      { to: '/reports/financial-statements?tab=pl',    label: 'Profit & Loss',          icon: 'TREND_UP',   permission: 'reports:pl:read',       pinnable: true, end: true, priority: 20 },
      { to: '/reports/financial-statements?tab=bs',    label: 'Balance Sheet',          icon: 'CHART',      permission: 'reports:bs:read',        pinnable: true, end: true, priority: 30 },
      { to: '/reports/financial-statements?tab=cf',    label: 'Cash Flow Statement',    icon: 'REFRESH',    permission: 'reports:cf:read',        end: true, priority: 40 },
      { to: '/reports/financial-statements?tab=notes', label: 'Notes to Financials',    icon: 'BOOK_OPEN',  permission: 'reports:financial:read', end: true, priority: 50 },
      { to: '/reports?type=income-expense',            label: 'Income vs Expense',      icon: 'BAR_CHART_2', permission: 'reports:pl:read',     priority: 60 },
      { to: '/reports?type=expense-summary',           label: 'Expense Summary',        icon: 'LIST',       permission: 'reports:read',         priority: 70 },
      { to: '/reports?type=tax',                       label: 'Tax Summary',            icon: 'SHIELD_CHECK', permission: 'reports:read',     priority: 80 },
      { to: '/reports/equity',                         label: "Statement of Changes in Equity", icon: 'TREND_UP', permission: 'reports:financial:read', priority: 90 },
      { to: '/reports/mor-report',                     label: "Directors' / Management Report", icon: 'FILE_TEXT', permission: 'reports:financial:read', priority: 100 },
      { to: '/reports/trial-balance',                  label: 'Trial Balance',          icon: 'LIST',           permission: 'reports:gl:read',  priority: 105 },
      { to: '/reports/notes',                          label: 'Notes to Financials',    icon: 'BOOK_OPEN',      permission: 'reports:financial:read', priority: 106 },
      { to: '/reports/insights',                       label: 'Business Insights',      icon: 'LIGHTBULB',  permission: 'insights:read',         priority: 110, isNew: true },
    ],
  },
  {
    key: 'hr_payroll',
    label: 'HR & Payroll',
    i18nKey: 'nav.groups.hr_payroll',
    icon: 'USERS',
    sectionKey: '__sec_hr',
    permission: 'employees:read',
    items: [
      { to: '/hr/employees',              label: 'Employees',              icon: 'EMPLOYEE',    permission: 'employees:read',  pinnable: true, priority: 10 },
      { to: '/hr/departments',            label: 'Departments',            icon: 'LAYERS',       permission: 'employees:read',  priority: 20 },
      { to: '/hr/payroll',                label: 'Payroll',                icon: 'BANKNOTE',     permission: 'payroll:read',    pinnable: true, priority: 30 },
      { to: '/hr/payroll-administration', label: 'Payroll Administration', icon: 'SETTINGS',     permission: 'payroll:read',    priority: 40 },
      { to: '/hr/paye-declarations',      label: 'PAYE Declarations',      icon: 'SEND',         permission: 'payroll:read',    priority: 50, isNew: true },
      { to: '/hr/attendance',             label: 'Attendance',             icon: 'CLOCK',        permission: 'attendance:read', priority: 60 },
      { to: '/hr/leaves',                 label: 'Leave Management',       icon: 'CALENDAR',     permission: 'leaves:read',     priority: 70 },
      { to: '/hr/shifts',                 label: 'Shifts & Schedules',     icon: 'REFRESH_CW',   permission: 'employees:read',  priority: 80 },
      { to: '/hr/holidays',               label: 'Holidays',               icon: 'BADGE_CHECK',  permission: 'employees:read',  priority: 90 },
      { to: '/hr/gratuity',               label: 'Gratuity & Severance',   icon: 'SHIELD_CHECK', permission: 'employees:read',  priority: 100 },
      { to: '/hr/calendar',               label: 'HR Calendar',            icon: 'CALENDAR',     permission: 'employees:read',  priority: 110 },
      { to: '/hr/payroll-bank-export',    label: 'Bank Payroll Export',    icon: 'BANK',         permission: 'payroll:admin',   priority: 120 },
    ],
  },
  {
    key: 'system',
    label: 'System',
    i18nKey: 'nav.groups.system',
    icon: 'GAUGE',
    sectionKey: '__sec_system',
    permission: 'settings:read',
    items: [
      { to: '/getting-started',       label: 'Setup Wizard',         icon: 'ZAP',          permission: 'settings:read', priority: 10, keywords: ['setup wizard', 'first run', 'company setup', 'wizard'] },
      { to: '/settings',              label: 'Settings',             icon: 'SETTINGS',     permission: 'settings:read', pinnable: true, end: true, priority: 20, keywords: ['company', 'localization', 'invoice', 'currency', 'email', 'smtp', 'tax', 'modules', 'defaults', 'financial', 'fiscal year'] },
      { to: '/settings/company-profile', label: 'Company Profile',  icon: 'BUILDING',     permission: 'settings:write', priority: 30, keywords: ['company name', 'tin', 'vat', 'business type', 'logo'] },
      { to: '/settings/email',        label: 'Email & SMTP',         icon: 'MAIL',          permission: 'settings:write', priority: 40, keywords: ['smtp', 'email config', 'mail server'] },
      { to: '/settings/users-access', label: 'Users & Access',       icon: 'USERS',         permission: 'users:read',     pinnable: true, priority: 50, keywords: ['users', 'roles', 'access', 'portal', '2fa'] },
      { to: '/settings/modules',      label: 'Modules',              icon: 'LAYERS',        permission: 'settings:write', priority: 60, keywords: ['enable module', 'disable module', 'extensions'] },
      { to: '/settings/roles',  label: 'Roles & Permissions', icon: 'LOCK', permission: 'role_permissions:read', priority: 70 },
      { to: '/settings/eims',     label: 'EIMS / MoR',        icon: 'SEND',         permission: 'eims:compliance', priority: 90, keywords: ['eims', 'mor', 'insa', 'bsp', 'source system'] },
      { to: '/settings/taxes',    label: 'Tax Rate Profiles',  icon: 'RECEIPT',      permission: 'settings:read',  priority: 110, keywords: ['vat rate', 'tot', 'wht', 'bit', 'drrf', 'tax profile'] },
      { to: '/settings/currencies', label: 'Currencies',        icon: 'GLOBE',         permission: 'settings:write', priority: 115, isNew: true },
      { to: '/settings/maintaining-technology', label: 'Maintaining Technology', icon: 'SETTINGS', permission: 'settings:write', priority: 116, isNew: true },
      { to: '/control',           label: 'Control Center',     icon: 'GAUGE',        permission: 'settings:read',  pinnable: true, end: true, priority: 120 },
      { to: '/settings/catalog',  label: 'Settings Catalog',   icon: 'DATABASE',     permission: 'settings:write', priority: 130, keywords: ['settings catalog', 'setting definitions', 'categories'] },
      { to: '/settings/license',                 label: 'License & Subscription',  icon: 'KEY',           permission: 'settings:write', priority: 180 },
      { to: '/settings/app-store',               label: 'App Store',               icon: 'ITEM',          permission: 'apps:read',      pinnable: true, priority: 190 },
      { to: '/settings/digital-wallets',         label: 'Digital Wallets',         icon: 'WALLET',        permission: 'banking:read',   priority: 200 },
      { to: '/settings/payment-gateways/chapa',  label: 'Chapa Gateway',           icon: 'CREDIT_CARD',   permission: 'apps:read',      priority: 210 },
    ],
  },
  {
    key: 'ovds_module',
    label: 'OVDS Module',
    i18nKey: 'nav.groups.ovds_module',
    icon: 'LAYERS',
    sectionKey: '__sec_ovds',
    permission: 'ovds:read',
    items: [
      { to: '/ovds/loans',           label: 'Business Loans',       icon: 'BANKNOTE',   permission: 'business_loans:read', priority: 10 },
      { to: '/ovds/investments',     label: 'Investments',          icon: 'TREND_UP',   permission: 'investments:read',    priority: 20 },
      { to: '/ovds/partnerships',    label: 'Partnerships',         icon: 'USERS',      permission: 'partnerships:read',   priority: 30 },
      { to: '/ovds/loyalty',         label: 'Loyalty Dashboard',    icon: 'STAR',       permission: 'loyalty:read',        priority: 40, isNew: true },
      { to: '/ovds/payment-gateways', label: 'Payment Gateways',   icon: 'CREDIT_CARD', permission: 'ovds:read',         priority: 50 },
      { to: '/ovds/cost-accounting', label: 'Cost Accounting',      icon: 'CALCULATOR', permission: 'ovds:read',         priority: 60, isNew: true },
      { to: '/nodes',                label: 'Connected Nodes',      icon: 'SERVER',      permission: 'node:manage',       priority: 70, isNew: true },
    ],
  },
  {
    key: 'disaster_fund',
    label: 'Disaster Fund',
    i18nKey: 'nav.groups.disaster_fund',
    icon: 'ALERT_TRIANGLE',
    sectionKey: '__sec_disaster',
    permission: 'disaster_fund:read',
    items: [
      { to: '/disaster-fund',      label: 'Disaster Fund',        icon: 'ALERT_TRIANGLE', permission: 'disaster_fund:read', pinnable: true, priority: 10 },
    ],
  },
  {
    key: 'device_control',
    label: 'Device Control',
    i18nKey: 'nav.groups.device_control',
    icon: 'SERVER',
    sectionKey: '__sec_device',
    permission: 'device_control:read',
    items: [
      { to: '/device-control',           label: 'Device Control Center', icon: 'SERVER',      permission: 'device_control:read', pinnable: true, priority: 10 },
      { to: '/device-control/requests',  label: 'Change Requests',       icon: 'REFRESH_CW',  permission: 'device_control:read', priority: 20 },
    ],
  },
  {
    key: 'iot',
    label: 'IoT & Smart Devices',
    i18nKey: 'nav.groups.iot',
    icon: 'SERVER',
    sectionKey: '__sec_iot',
    permission: 'iot:read',
    items: [
      { to: '/control/iot', label: 'IoT Dashboard', icon: 'SERVER', permission: 'iot:read', pinnable: true, priority: 10 },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    i18nKey: 'nav.groups.administration',
    icon: 'SETTINGS',
    sectionKey: '__sec_admin',
    permission: 'settings:read',
    items: [
      { to: '/admin/settings', label: 'Menu Customization', icon: 'LIST', permission: 'settings:write', priority: 10 },
    ],
  },
  {
    key: 'developer',
    label: 'Developer',
    i18nKey: 'nav.groups.developer',
    icon: 'CODE',
    sectionKey: '__sec_dev',
    permission: 'api_docs:read',
    items: [
      { to: '/settings/api-docs',     label: 'API Documentation',  icon: 'FILE_TEXT', permission: 'api_docs:read', pinnable: true, priority: 10 },
      { to: '/settings/developers',   label: 'Developer Guide',    icon: 'WEBHOOK',   permission: 'api_docs:read', priority: 20 },
    ],
  },
  {
    key: 'governance',
    label: 'System Administration',
    i18nKey: 'nav.groups.governance',
    icon: 'SHIELD',
    sectionKey: '__sec_governance',
    permission: 'settings:read',
    items: [
      { to: '/settings/security', label: 'Security Settings', icon: 'LOCK', permission: 'settings:write', priority: 10 },
      { to: '/settings/releases', label: 'System Updates',   icon: 'REFRESH_CW', permission: 'settings:read', priority: 20 },
    ],
  },
  // ── CRM — dedicated group so the sidebar CRM parent resolves correctly ──
  {
    key: 'crm',
    label: 'CRM',
    i18nKey: 'nav.groups.crm',
    icon: 'CUSTOMER',
    sectionKey: '__sec_crm',
    permission: 'crm:contacts:read',
    items: [
      { to: '/crm/dashboard',      label: 'CRM Dashboard',   icon: 'LAYOUT_DASHBOARD', permission: 'crm:contacts:read',   priority: 10 },
      { to: '/crm/contacts',       label: 'Contacts',         icon: 'CUSTOMER',         permission: 'crm:contacts:read',   pinnable: true, priority: 20 },
      { to: '/crm/companies',      label: 'Companies',        icon: 'BUILDING',         permission: 'crm:contacts:read',   priority: 30 },
      { to: '/crm/deals',          label: 'Deals',            icon: 'TREND_UP',         permission: 'crm:deals:read',      priority: 40 },
      { to: '/crm/pipeline',       label: 'Pipeline',         icon: 'TREND_UP',         permission: 'crm:deals:read',      pinnable: true, priority: 50 },
      { to: '/crm/activities',     label: 'Activities',       icon: 'CALENDAR',         permission: 'crm:activities:read', priority: 60 },
      { to: '/crm/interactions',   label: 'Interactions',     icon: 'MESSAGE_SQUARE',   permission: 'crm:activities:read', priority: 70, isNew: true },
      { to: '/customers',          label: 'All Customers',    icon: 'USERS',            permission: 'crm:contacts:read',   priority: 80 },
      { to: '/customers/statement', label: 'Customer Statement', icon: 'FILE_TEXT',    permission: 'crm:contacts:read',   priority: 90 },
      { to: '/customers/growth',   label: 'Customer Growth',  icon: 'TREND_UP',        permission: 'insights:read',        priority: 100, isNew: true },
      { to: '/customers/portal',   label: 'Client Portal',    icon: 'EXTERNAL_LINK',   permission: 'crm:contacts:read',   priority: 110 },
      { to: '/helpdesk',           label: 'Helpdesk',         icon: 'INBOX',            permission: 'crm:contacts:read',   priority: 120 },
    ],
  },
  // ── Trade & Customs — dedicated group so the sidebar Trade parent resolves ──
  {
    key: 'trade',
    label: 'Trade & Customs',
    i18nKey: 'nav.groups.trade',
    icon: 'GLOBE',
    sectionKey: '__sec_trade',
    permission: 'items:read',
    items: [
      { to: '/trade',                  label: 'Trade Dashboard',      icon: 'GLOBE',          permission: 'items:read',  pinnable: true, priority: 10 },
      { to: '/trade/shipments',        label: 'Import / Export',      icon: 'PACKAGE',         permission: 'items:read',  priority: 20 },
      { to: '/procurement/import-shipments', label: 'Import Shipments', icon: 'ARCHIVE',      permission: 'bills:read',  priority: 30 },
      { to: '/procurement/letter-of-credit', label: 'Letter of Credit', icon: 'FILE_TEXT',    permission: 'bills:read',  priority: 40 },
      { to: '/procurement/landed-cost', label: 'Landed Cost',         icon: 'CALCULATOR',     permission: 'bills:read',  priority: 50 },
      { to: '/trade/portals',          label: 'Portal Integrations',  icon: 'EXTERNAL_LINK',  permission: 'items:read',  priority: 60, isNew: true },
    ],
  },
];

@ApiTags('navigation')
@Controller('nav')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NavController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('groups')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get navigation groups for the current user role' })
  @ApiResponse({ status: 200, description: 'Navigation tree with role-filtered groups' })
  async getGroups(@Req() req: any, @Query('companyId') companyId?: string, @Query('businessType') _businessType?: string) {
    // Role is derived from the authenticated JWT, never from a client-supplied query param.
    const userRole = (req?.user?.role as Role) || Role.EMPLOYEE;
    const allowedSections = allowedSectionsForRole(userRole);
    const superUser = isSuperUser(userRole);

    // Fetch admin-created menu items for this company
    let adminItems: Array<{ id: string; label: string; path: string; to: string | null; icon: string | null; parentKey: string | null; order: number; roles: string | null }> = [];
    try {
      adminItems = await this.prisma.adminCreatedMenuItem.findMany({
        where: {
          isActive: true,
          ...(companyId ? { companyId } : {}),
        },
        select: {
          id: true,
          label: true,
          path: true,
          to: true,
          icon: true,
          parentKey: true,
          order: true,
          roles: true,
        },
        orderBy: { order: 'asc' },
      });
    } catch {
      // Table may not exist yet — fall back to static groups only
    }

    // Build role filter for admin items
    const roleFilter = (itemRoles: string | null): boolean => {
      if (!itemRoles || !itemRoles.trim()) return true;
      const allowed = itemRoles.split(',').map(r => r.trim());
      return allowed.includes(userRole) || superUser;
    };

    // Build groups from static config, overlay admin items
    const groups: NavGroupDto[] = STATIC_GROUPS.map(g => {
      // Start with static items
      const items: NavItemDto[] = g.items.map(item => ({
        to: item.to,
        label: item.label,
        icon: item.icon,
        i18nKey: item.i18nKey,
        permission: item.permission,
        priority: item.priority,
        isNew: item.isNew,
        badge: item.badge,
        pinnable: item.pinnable,
        end: item.end,
        keywords: item.keywords,
        source: 'static' as const,
      }));

      // Append admin items for this group
      const adminForGroup = adminItems.filter(ai => ai.parentKey === g.key && roleFilter(ai.roles));
      for (const ai of adminForGroup) {
        items.push({
          to: ai.to ?? ai.path,
          label: ai.label,
          icon: (ai.icon as any) ?? 'EXTERNAL_LINK',
          priority: ai.order,
          isNew: true,
          source: 'admin' as const,
        });
      }

      items.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

      return {
        key: g.key,
        label: g.label,
        i18nKey: g.i18nKey,
        icon: g.icon,
        permission: g.permission,
        flat: g.flat,
        to: g.to,
        sectionKey: g.sectionKey,
        priority: 0,
        items,
        source: 'static' as const,
      };
    });

    // Add dynamic admin-only groups (no static parent)
    const staticKeys = new Set(STATIC_GROUPS.map(g => g.key));
    const dynamicAdminGroups = adminItems.filter(ai => ai.parentKey && !staticKeys.has(ai.parentKey) && roleFilter(ai.roles));
    const dynamicGroupMap = new Map<string, NavGroupDto>();
    for (const ai of dynamicAdminGroups) {
      const existing = dynamicGroupMap.get(ai.parentKey!);
      if (existing) {
        existing.items.push({
          to: ai.to ?? ai.path,
          label: ai.label,
          icon: (ai.icon as any) ?? 'EXTERNAL_LINK',
          priority: ai.order,
          isNew: true,
          source: 'admin' as const,
        });
        existing.items.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
      } else {
        dynamicGroupMap.set(ai.parentKey!, {
          key: ai.parentKey!,
          label: ai.parentKey!,
          icon: (ai.icon as any) ?? 'EXTERNAL_LINK',
          permission: undefined,
          flat: false,
          sectionKey: '__sec_system',
          items: [{
            to: ai.to ?? ai.path,
            label: ai.label,
            icon: (ai.icon as any) ?? 'EXTERNAL_LINK',
            priority: ai.order,
            isNew: true,
            source: 'admin' as const,
          }],
          source: 'admin' as const,
          priority: 0,
        });
      }
    }

    // Filter groups by section access
    const filteredGroups = groups
      .filter(g => {
        if ((g as any).sectionLabel) return true;
        const sectionKey = g.sectionKey ?? g.key;
        if (!superUser && sectionKey !== '__sec_dashboard' && !allowedSections.includes(sectionKey)) {
          return false;
        }
        return true;
      })
      .concat(Array.from(dynamicGroupMap.values()));

    // Single source of truth (shared with the frontend) — see @ovds/shared section-access.ts.
    const allSections = STATIC_SECTIONS;

    const visibleSections = superUser
      ? allSections
      : allSections.filter(s => allowedSections.includes(s.key));

    const response: NavTreeDto = {
      sections: visibleSections,
      groups: filteredGroups,
      computedAt: new Date().toISOString(),
      ttl: NAV_CACHE_TTL_SECONDS,
    };

    return { success: true, data: response };
  }
}

