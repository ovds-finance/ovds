/**
 * OVDS Workflow Task Catalog — single source of truth
 *
 * End-to-end accounting lifecycle (Ovds-inspired item GL inheritance):
 *   Core Operations → People → ovds → Compliance → Reporting → Admin → Developer
 *
 * Ethiopian IFRS context: Proc. 979/2016, 1341/2024, 1395/2025, AABE Directive 2/2012
 */
import type { BusinessProfile, BusinessSize } from './business-workflow.types';
import type { WorkflowModuleKey } from './workflow-engine.types';

// ---------------------------------------------------------------------------
// 7-module lifecycle keys
// ---------------------------------------------------------------------------

export type WorkflowLifecycleModule =
  | 'CORE_OPERATIONS'
  | 'PEOPLE'
  | 'ovds'
  | 'COMPLIANCE'
  | 'REPORTING'
  | 'ADMIN'
  | 'DEVELOPER';

export type WorkflowTaskPriority = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';

export type WorkflowExecutionMode = 'VALIDATE' | 'EXECUTE' | 'HYBRID';

/** Per-task runtime settings — what the engine configures or validates */
export interface WorkflowTaskSettings {
  books: ('IFRS' | 'TAX' | 'BOTH')[];
  frameworks: string[];
  taxTypes?: string[];
  executionMode: WorkflowExecutionMode;
  actionRoute?: string;
  /** Maps to period-close-workflow.service.ts step id */
  periodCloseStepId?: string;
  /** Maps to PERIOD_END_TASKS checklist id (p01–p15) */
  checklistId?: string;
  /** GL posting trigger from GL_POSTING_TEMPLATES */
  glTrigger?: string;
  /** Dual-calendar: Gregorian period and optional EFY label */
  calendarSystems?: ('GREGORIAN' | 'ETHIOPIAN')[];
}

/** Declarative execution conditions — evaluated at runtime by evaluateWorkflowTaskConditions */
export interface WorkflowTaskConditionSpec {
  sizes?: BusinessSize[];
  requiresModules?: WorkflowModuleKey[];
  requiresTaxTypes?: string[];
  minEmployees?: number;
  /** Month numbers (1–12) when task is in scope */
  months?: number[];
  requiresEnv?: string[];
  whenDescription?: string;
}

export interface WorkflowTaskDefinition {
  id: string;
  module: WorkflowLifecycleModule;
  label: string;
  description: string;
  priority: WorkflowTaskPriority;
  dependsOn: string[];
  settings: WorkflowTaskSettings;
  conditions: WorkflowTaskConditionSpec;
}

export interface WorkflowPeriodContext {
  month: number;
  year: number;
  hasEtaxConfig?: boolean;
}

// ---------------------------------------------------------------------------
// Period-close step ↔ workflow task mapping
// ---------------------------------------------------------------------------

export const PERIOD_CLOSE_STEP_MAP: Record<string, string> = {
  'trial-balance': 'M5_TRIAL_BALANCE',
  'unposted-journals': 'M5_UNPOSTED_JOURNALS',
  'bank-reconciliation': 'M3_BANK_RECONCILIATION',
  'ar-ap-subledger': 'M5_AR_AP_SUBLEDGER',
  'vat-compliance': 'M4_VAT_RETURN',
  'payroll-processed': 'M2_PAYROLL_APPROVED',
  'fx-revaluation': 'M3_FX_REVALUATION',
  'depreciation': 'M3_DEPRECIATION',
  'ias19-accrual': 'M2_IAS19_ACCRUAL',
  'ecl-provision': 'M3_ECL_PROVISION',
  'deferred-tax': 'M4_DEFERRED_TAX',
  'financial-statements': 'M5_FINANCIAL_STATEMENTS',
  'mor-report':           'M5_MOR_REPORT',
  'sign-off': 'M6_PERIOD_LOCK',
  'period-lock': 'M6_PERIOD_LOCK',
};

// ---------------------------------------------------------------------------
// Canonical task catalogue (38 tasks)
// ---------------------------------------------------------------------------

export const WORKFLOW_TASK_CATALOG: WorkflowTaskDefinition[] = [
  // ── MODULE 1: CORE OPERATIONS ─────────────────────────────────────────────
  {
    id: 'M1_VALIDATE_ITEM_LEDGER',
    module: 'CORE_OPERATIONS',
    label: 'Validate item & service ledger inheritance',
    description: 'Ovds pattern: every Item/Service inherits Revenue, COGS, and Inventory GL accounts from chart of accounts.',
    priority: 'RECOMMENDED',
    dependsOn: [],
    settings: {
      books: ['BOTH'],
      frameworks: ['IFRS 15', 'IAS 2', 'Proc. 1341/2024'],
      taxTypes: ['VAT', 'TOT', 'WHT_GOODS', 'WHT_SERVICES'],
      executionMode: 'VALIDATE',
      actionRoute: '/inventory/items',
      checklistId: 'p01',
      glTrigger: 'INVOICE_APPROVED',
    },
    conditions: {
      requiresModules: ['inventory', 'invoice'],
      whenDescription: 'Inventory module enabled',
    },
  },
  {
    id: 'M1_POST_INVOICES',
    module: 'CORE_OPERATIONS',
    label: 'Post approved sales invoices to GL',
    description: 'IFRS 15: recognise revenue when performance obligation satisfied. DR AR / CR Revenue; strip VAT/TOT from top line.',
    priority: 'REQUIRED',
    dependsOn: [],
    settings: {
      books: ['BOTH'],
      frameworks: ['IFRS 15', 'IAS 1', 'Proc. 1341/2024 Art. 16'],
      taxTypes: ['VAT', 'TOT'],
      executionMode: 'HYBRID',
      actionRoute: '/sales/invoices',
      checklistId: 'p01',
      glTrigger: 'INVOICE_APPROVED',
    },
    conditions: { requiresModules: ['invoice', 'core_operations'] },
  },
  {
    id: 'M1_IFRS15_OBLIGATIONS',
    module: 'CORE_OPERATIONS',
    label: 'Verify IFRS 15 performance obligations',
    description: 'Over-time contracts: revenue recognised by completion %. Point-in-time: on delivery. VAT triggered at invoice date.',
    priority: 'RECOMMENDED',
    dependsOn: ['M1_POST_INVOICES'],
    settings: {
      books: ['IFRS'],
      frameworks: ['IFRS 15.31–45'],
      executionMode: 'VALIDATE',
      actionRoute: '/sales/invoices',
    },
    conditions: {
      sizes: ['MEDIUM', 'LARGE', 'ENTERPRISE'],
      whenDescription: 'IFRS_FULL or IFRS_SME with contract revenue',
    },
  },
  {
    id: 'M1_POST_BILLS',
    module: 'CORE_OPERATIONS',
    label: 'Post approved purchase bills to GL',
    description: 'IAS 2/IAS 16: DR Expense or Inventory / CR AP / CR WHT Payable on supplier invoices.',
    priority: 'REQUIRED',
    dependsOn: [],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 2', 'IAS 16', 'Proc. 1395/2025 Art. 94'],
      taxTypes: ['WHT_GOODS', 'WHT_SERVICES', 'VAT'],
      executionMode: 'HYBRID',
      actionRoute: '/purchases/bills',
      checklistId: 'p02',
      glTrigger: 'BILL_APPROVED',
    },
    conditions: { requiresModules: ['procurement', 'core_operations'] },
  },
  {
    id: 'M1_WHT_CERTIFICATES',
    module: 'CORE_OPERATIONS',
    label: 'Issue WHT certificates to suppliers',
    description: 'WHT: 3% goods (≥ETB 10,000), 3% services (≥ETB 3,000), 30% government contracts. Certificates mandatory before remittance. Proc. 1395/2025 Art. 94.',
    priority: 'REQUIRED',
    dependsOn: ['M1_POST_BILLS'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 979/2016', 'Proc. 1395/2025 Art. 94'],
      taxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/wht-certificates',
      checklistId: 'p11',
    },
    conditions: {
      requiresTaxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
      requiresModules: ['wht'],
    },
  },
  {
    id: 'M1_GRN_3WAY_MATCH',
    module: 'CORE_OPERATIONS',
    label: 'Reconcile 3-way match (PO → GRN → Bill)',
    description: 'Procurement integrity: every GRN matched to PO and supplier bill before period close.',
    priority: 'RECOMMENDED',
    dependsOn: ['M1_POST_BILLS'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 2.9'],
      executionMode: 'VALIDATE',
      actionRoute: '/purchases/grn',
      checklistId: 'p03',
      glTrigger: 'GRN_CONFIRMED',
    },
    conditions: { requiresModules: ['procurement', 'inventory'] },
  },
  {
    id: 'M1_STOCK_VALUATION',
    module: 'CORE_OPERATIONS',
    label: 'Verify IAS 2 inventory valuation (FIFO / AVCO)',
    description: 'IAS 2: inventory at lower of cost or NRV. Tax book: acquisition cost. Flag negative stock.',
    priority: 'RECOMMENDED',
    dependsOn: ['M1_GRN_3WAY_MATCH'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 2', 'IAS 12'],
      executionMode: 'VALIDATE',
      actionRoute: '/inventory',
    },
    conditions: { requiresModules: ['inventory'] },
  },
  {
    id: 'M1_COGS_RECOGNITION',
    module: 'CORE_OPERATIONS',
    label: 'Verify COGS posted on product sales',
    description: 'On invoice post: DR COGS / CR Inventory using item-inherited account codes (Ovds pattern).',
    priority: 'RECOMMENDED',
    dependsOn: ['M1_POST_INVOICES', 'M1_STOCK_VALUATION'],
    settings: {
      books: ['IFRS'],
      frameworks: ['IAS 2', 'IFRS 15'],
      executionMode: 'VALIDATE',
      actionRoute: '/sales/invoices',
      glTrigger: 'INVOICE_APPROVED',
    },
    conditions: { requiresModules: ['inventory', 'invoice'] },
  },

  // ── MODULE 2: PEOPLE ──────────────────────────────────────────────────────
  {
    id: 'M2_PAYROLL_APPROVED',
    module: 'PEOPLE',
    label: 'Approve and post monthly payroll',
    description: 'Gross salary, progressive PIT (Proc. 979/2016 brackets), pension 7%+11%, DRRF 1%.',
    priority: 'REQUIRED',
    dependsOn: [],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 19', 'Proc. 979/2016 Art. 7–11', 'Pension Proc. 714/2011'],
      taxTypes: ['PAYROLL_PIT', 'PENSION', 'DRRF'],
      executionMode: 'HYBRID',
      actionRoute: '/hr/payroll',
      checklistId: 'p04',
      periodCloseStepId: 'payroll-processed',
      glTrigger: 'PAYROLL_APPROVED',
    },
    conditions: { minEmployees: 1, requiresModules: ['payroll'] },
  },
  {
    id: 'M2_PAYE_DECLARATION',
    module: 'PEOPLE',
    label: 'Submit PAYE declaration to MoR',
    description: 'Monthly employment income tax remittance — due 30th of following month (Hamle–Sene fiscal alignment).',
    priority: 'REQUIRED',
    dependsOn: ['M2_PAYROLL_APPROVED'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 979/2016', 'Proc. 1395/2025'],
      taxTypes: ['PAYROLL_PIT'],
      executionMode: 'VALIDATE',
      actionRoute: '/hr/paye-declarations',
      calendarSystems: ['GREGORIAN', 'ETHIOPIAN'],
    },
    conditions: { minEmployees: 1, requiresModules: ['payroll'] },
  },
  {
    id: 'M2_PENSION_REMITTANCE',
    module: 'PEOPLE',
    label: 'Remit pension to PFSA',
    description: 'Employee 7% + employer 11% on insurable earnings (cap ETB 15,000). Due 30th following month.',
    priority: 'REQUIRED',
    dependsOn: ['M2_PAYROLL_APPROVED'],
    settings: {
      books: ['TAX'],
      frameworks: ['Pension Proc. 714/2011'],
      taxTypes: ['PENSION'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/pension-submission',
    },
    conditions: { minEmployees: 1, requiresModules: ['payroll'] },
  },
  {
    id: 'M2_IAS19_ACCRUAL',
    module: 'PEOPLE',
    label: 'Post IAS 19 leave & severance accruals',
    description: 'Accrued leave = remaining days × (basic salary / 30). Severance per Labour Proc. 1156/2019.',
    priority: 'RECOMMENDED',
    dependsOn: ['M2_PAYROLL_APPROVED'],
    settings: {
      books: ['IFRS'],
      frameworks: ['IAS 19.11', 'IAS 37', 'Labour Proc. 1156/2019'],
      executionMode: 'EXECUTE',
      actionRoute: '/ifrs/employee-benefits',
      checklistId: 'p05',
      periodCloseStepId: 'ias19-accrual',
      glTrigger: 'IAS19_ACCRUAL',
    },
    conditions: {
      minEmployees: 1,
      sizes: ['MEDIUM', 'LARGE', 'ENTERPRISE'],
      requiresModules: ['employee_benefits'],
    },
  },

  // ── MODULE 3: ovds ─────────────────────────────────────────────────────
  {
    id: 'M3_BANK_RECONCILIATION',
    module: 'ovds',
    label: 'Reconcile all bank accounts',
    description: 'Match bank feed (MT940/ISO 20022) to Legal Doc IDs by amount + customer reference.',
    priority: 'REQUIRED',
    dependsOn: [],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 7'],
      executionMode: 'VALIDATE',
      actionRoute: '/banking/reconciliation',
      checklistId: 'p08',
      periodCloseStepId: 'bank-reconciliation',
    },
    conditions: { requiresModules: ['banking'] },
  },
  {
    id: 'M3_DEPRECIATION',
    module: 'ovds',
    label: 'Run IFRS depreciation (IAS 16)',
    description: 'IFRS book: straight-line / component depreciation per useful life.',
    priority: 'REQUIRED',
    dependsOn: [],
    settings: {
      books: ['IFRS'],
      frameworks: ['IAS 16'],
      executionMode: 'EXECUTE',
      actionRoute: '/accounting/fixed-assets',
      checklistId: 'p07',
      periodCloseStepId: 'depreciation',
      glTrigger: 'DEPRECIATION_RUN',
    },
    conditions: { requiresModules: ['fixed_assets'] },
  },
  {
    id: 'M3_TAX_POOL_DEPRECIATION',
    module: 'ovds',
    label: 'Run tax pool depreciation (Proc. 979 Art. 25)',
    description: 'Tax pools: Cat1 25%, Cat2 20%, Cat3 15%, Cat4 10%. Creates IAS 12 temporary difference.',
    priority: 'RECOMMENDED',
    dependsOn: ['M3_DEPRECIATION'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 979/2016 Art. 25', 'IAS 12'],
      executionMode: 'HYBRID',
      actionRoute: '/accounting/fixed-assets',
    },
    conditions: {
      requiresModules: ['fixed_assets', 'cit'],
      sizes: ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
    },
  },
  {
    id: 'M3_FX_REVALUATION',
    module: 'ovds',
    label: 'Revalue FX monetary items (IAS 21)',
    description: 'Revalue open FCY AR/AP at NBE period-end rate; post unrealised gain/loss to P&L.',
    priority: 'RECOMMENDED',
    dependsOn: ['M1_POST_INVOICES', 'M1_POST_BILLS'],
    settings: {
      books: ['IFRS'],
      frameworks: ['IAS 21', 'IFRS 18 Financing'],
      executionMode: 'HYBRID',
      actionRoute: '/banking/fx-rates',
      checklistId: 'p06',
      periodCloseStepId: 'fx-revaluation',
    },
    conditions: { requiresModules: ['fx_rates'] },
  },
  {
    id: 'M3_ECL_PROVISION',
    module: 'ovds',
    label: 'Post ECL provision (IFRS 9)',
    description: 'Forward-looking ECL matrix (Stage 1/2/3). Tax: specific provision only when recovery exhausted.',
    priority: 'RECOMMENDED',
    dependsOn: ['M1_POST_INVOICES'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IFRS 9.5.5', 'IAS 12'],
      executionMode: 'HYBRID',
      actionRoute: '/ifrs/ecl-provision',
      checklistId: 'p09',
      periodCloseStepId: 'ecl-provision',
      glTrigger: 'ECL_PROVISION',
    },
    conditions: {
      sizes: ['MEDIUM', 'LARGE', 'ENTERPRISE'],
      requiresModules: ['ecl_provision'],
    },
  },
  {
    id: 'M3_IFRS16_LEASE',
    module: 'ovds',
    label: 'Post IFRS 16 ROU asset & lease liability',
    description: 'Monthly ROU depreciation + lease liability principal + interest expense.',
    priority: 'RECOMMENDED',
    dependsOn: [],
    settings: {
      books: ['IFRS'],
      frameworks: ['IFRS 16'],
      executionMode: 'EXECUTE',
      actionRoute: '/accounting/leases',
    },
    conditions: { requiresModules: ['fixed_assets'] },
  },
  {
    id: 'M3_CAPITAL_GAINS_REGISTER',
    module: 'ovds',
    label: 'Review capital gains on disposals (Schedule D)',
    description: '15% CGT on disposal of shares, bonds, investment property. Track gain = proceeds − tax base.',
    priority: 'OPTIONAL',
    dependsOn: ['M3_DEPRECIATION'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 1395/2025 Art. 59–63'],
      taxTypes: ['CAPITAL_GAINS'],
      executionMode: 'VALIDATE',
      actionRoute: '/accounting/fixed-assets',
    },
    conditions: {
      requiresTaxTypes: ['CAPITAL_GAINS'],
      sizes: ['MEDIUM', 'LARGE', 'ENTERPRISE'],
    },
  },
  {
    id: 'M3_DIVIDEND_WHT',
    module: 'ovds',
    label: 'Account for dividend WHT (10%)',
    description: '10% withholding on dividends distributed to shareholders (Proc. 979/2016).',
    priority: 'OPTIONAL',
    dependsOn: ['M5_FINANCIAL_STATEMENTS'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 979/2016', 'Proc. 1395/2025 Art. 52'],
      taxTypes: ['WHT_DIVIDEND'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/investments',
    },
    conditions: {
      requiresTaxTypes: ['WHT_DIVIDEND'],
      months: [6, 12],
    },
  },

  // ── MODULE 4: COMPLIANCE ─────────────────────────────────────────────────
  {
    id: 'M4_VAT_RETURN',
    module: 'COMPLIANCE',
    label: 'File VAT return (Proc. 1341/2024)',
    description: '15% output VAT vs eligible input VAT. Net payable due 30th following month.',
    priority: 'REQUIRED',
    dependsOn: ['M1_POST_INVOICES', 'M1_POST_BILLS'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 1341/2024', 'Proc. 285/2002'],
      taxTypes: ['VAT'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/filing',
      checklistId: 'p10',
      periodCloseStepId: 'vat-compliance',
      calendarSystems: ['GREGORIAN', 'ETHIOPIAN'],
    },
    conditions: {
      requiresTaxTypes: ['VAT'],
      requiresModules: ['vat'],
    },
  },
  {
    id: 'M4_TOT_RETURN',
    module: 'COMPLIANCE',
    label: 'File TOT return',
    description: 'Turnover Tax: 2% goods / 10% services for Category B/C below VAT threshold.',
    priority: 'REQUIRED',
    dependsOn: ['M1_POST_INVOICES'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 1395/2025 Art. 35–38'],
      taxTypes: ['TOT'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/filing',
      checklistId: 'p10',
    },
    conditions: {
      requiresTaxTypes: ['TOT'],
      requiresModules: ['tot'],
    },
  },
  {
    id: 'M4_WHT_REGISTER',
    module: 'COMPLIANCE',
    label: 'Remit WHT register to MoR',
    description: 'Outgoing WHT certificates + incoming WHT credits. Remit by 30th following month.',
    priority: 'REQUIRED',
    dependsOn: ['M1_WHT_CERTIFICATES'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 1395/2025 Art. 94'],
      taxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/wht-certificates',
      checklistId: 'p11',
    },
    conditions: {
      requiresTaxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
      requiresModules: ['wht'],
    },
  },
  {
    id: 'M4_DEFERRED_TAX',
    module: 'COMPLIANCE',
    label: 'Compute deferred tax (IAS 12)',
    description: 'Temporary differences (depreciation, ECL, leave accruals) × 30% CIT rate → DTA/DTL.',
    priority: 'RECOMMENDED',
    dependsOn: ['M3_DEPRECIATION', 'M3_ECL_PROVISION', 'M2_IAS19_ACCRUAL'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 12', 'Proc. 979/2016'],
      taxTypes: ['CIT'],
      executionMode: 'EXECUTE',
      actionRoute: '/ifrs/deferred-tax',
      checklistId: 'p12',
      periodCloseStepId: 'deferred-tax',
    },
    conditions: {
      sizes: ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
      requiresModules: ['cit'],
    },
  },
  {
    id: 'M4_CIT_RECONCILIATION',
    module: 'COMPLIANCE',
    label: 'Reconcile accounting profit to taxable income',
    description: 'Permanent adjustments (entertainment, donations >10%) + timing differences → Schedule A.',
    priority: 'RECOMMENDED',
    dependsOn: ['M4_DEFERRED_TAX'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 12', 'Proc. 979/2016', 'Proc. 1395/2025'],
      taxTypes: ['CIT', 'PIT_BUSINESS'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/business-income',
    },
    conditions: {
      sizes: ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
      requiresModules: ['cit'],
      months: [6, 12],
    },
  },
  {
    id: 'M4_DRRF_LEVY',
    module: 'COMPLIANCE',
    label: 'Calculate DRRF quarterly levy',
    description: '1% DRRF levy on qualifying transactions — due 15th after quarter end.',
    priority: 'OPTIONAL',
    dependsOn: ['M1_POST_INVOICES'],
    settings: {
      books: ['TAX'],
      frameworks: ['Regulation 570/2025'],
      taxTypes: ['DRRF'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/filing',
      checklistId: 'p13',
      calendarSystems: ['GREGORIAN', 'ETHIOPIAN'],
    },
    conditions: {
      requiresTaxTypes: ['DRRF'],
      months: [3, 6, 9, 12],
    },
  },
  {
    id: 'M4_EXCISE_RETURN',
    module: 'COMPLIANCE',
    label: 'File excise tax return',
    description: 'Excise on manufacture/import of excisable goods (Proc. 1186/2020).',
    priority: 'OPTIONAL',
    dependsOn: ['M1_POST_INVOICES'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 1186/2020'],
      taxTypes: ['EXCISE'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/filing',
    },
    conditions: {
      requiresTaxTypes: ['EXCISE'],
      requiresModules: ['excise'],
    },
  },

  // ── MODULE 5: REPORTING ───────────────────────────────────────────────────
  {
    id: 'M5_TRIAL_BALANCE',
    module: 'REPORTING',
    label: 'Validate trial balance (DR = CR)',
    description: 'IAS 1.27: debits must equal credits before financial statements.',
    priority: 'REQUIRED',
    dependsOn: ['M1_POST_INVOICES', 'M1_POST_BILLS', 'M2_PAYROLL_APPROVED', 'M3_DEPRECIATION'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 1.27'],
      executionMode: 'VALIDATE',
      actionRoute: '/accounting',
      checklistId: 'p14',
      periodCloseStepId: 'trial-balance',
    },
    conditions: { requiresModules: ['accounting', 'reports'] },
  },
  {
    id: 'M5_UNPOSTED_JOURNALS',
    module: 'REPORTING',
    label: 'Clear all DRAFT journal entries',
    description: 'No DRAFT journals before close — POST or CANCEL.',
    priority: 'REQUIRED',
    dependsOn: ['M5_TRIAL_BALANCE'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 1'],
      executionMode: 'VALIDATE',
      actionRoute: '/accounting',
      periodCloseStepId: 'unposted-journals',
    },
    conditions: {},
  },
  {
    id: 'M5_AR_AP_SUBLEDGER',
    module: 'REPORTING',
    label: 'Reconcile AR/AP sub-ledgers to GL',
    description: 'Customer/Vendor sub-ledger totals must match control accounts in GL.',
    priority: 'REQUIRED',
    dependsOn: ['M5_TRIAL_BALANCE'],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 1', 'IFRS 9'],
      executionMode: 'VALIDATE',
      actionRoute: '/accounting',
      periodCloseStepId: 'ar-ap-subledger',
    },
    conditions: { requiresModules: ['accounting'] },
  },
  {
    id: 'M5_FINANCIAL_STATEMENTS',
    module: 'REPORTING',
    label: 'Generate IFRS financial statements',
    description: 'SoFP, SCI (IFRS 18 categories), Cash Flows, Changes in Equity + AABE notes.',
    priority: 'RECOMMENDED',
    dependsOn: ['M5_TRIAL_BALANCE', 'M5_UNPOSTED_JOURNALS', 'M5_AR_AP_SUBLEDGER'],
    settings: {
      books: ['IFRS'],
      frameworks: ['IAS 1', 'IAS 7', 'IFRS 18'],
      executionMode: 'HYBRID',
      actionRoute: '/reports/mor-report',
      checklistId: 'p15',
      periodCloseStepId: 'financial-statements',
    },
    conditions: { requiresModules: ['financial_statements', 'reports'] },
  },
  {
    id: 'M5_MOR_REPORT',
    module: 'REPORTING',
    label: 'MoR IFRS Report & Submission Package',
    description: 'Bilingual (Amharic/English) IFRS financial statements + Schedule A CIT/MAT + HR payroll + compliance — ready for submission at etax.mor.gov.et.',
    priority: 'RECOMMENDED',
    dependsOn: ['M5_FINANCIAL_STATEMENTS', 'M5_CIT_SCHEDULE_A'],
    settings: {
      books: ['IFRS', 'TAX'],
      frameworks: ['IAS 1', 'IAS 7', 'IAS 12', 'IAS 19', 'IFRS 15', 'IFRS 18', 'Proc. 979/2016', 'Proc. 1395/2025'],
      executionMode: 'HYBRID',
      actionRoute: '/reports/mor-report',
      checklistId: 'p16',
      periodCloseStepId: 'mor-report',
    },
    conditions: { requiresModules: ['financial_statements', 'reports'] },
  },
  {
    id: 'M5_WITHHOLDING_LEDGER',
    module: 'REPORTING',
    label: 'Generate WHT ledger (outgoing + incoming)',
    description: 'Statutory WHT register: certificates issued to suppliers + amounts withheld by clients.',
    priority: 'RECOMMENDED',
    dependsOn: ['M4_WHT_REGISTER'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 1395/2025'],
      taxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/wht-certificates',
    },
    conditions: {
      requiresTaxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
    },
  },
  {
    id: 'M5_CIT_SCHEDULE_A',
    module: 'REPORTING',
    label: 'Generate CIT Schedule A computation',
    description: '30% CIT on taxable income; MAT 2.5% check; non-deductible add-backs.',
    priority: 'OPTIONAL',
    dependsOn: ['M4_CIT_RECONCILIATION', 'M4_DEFERRED_TAX'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 979/2016', 'Proc. 1395/2025'],
      taxTypes: ['CIT'],
      executionMode: 'VALIDATE',
      actionRoute: '/tax/business-income',
      calendarSystems: ['GREGORIAN', 'ETHIOPIAN'],
    },
    conditions: {
      requiresModules: ['cit'],
      months: [6, 12],
    },
  },

  // ── MODULE 6: ADMIN ───────────────────────────────────────────────────────
  {
    id: 'M6_AUDIT_TRAIL_REVIEW',
    module: 'ADMIN',
    label: 'Review tax-sensitive audit trail',
    description: 'AABE: verify audit logs for VAT overrides, period unlocks, WHT flag changes (10-year retention).',
    priority: 'RECOMMENDED',
    dependsOn: ['M5_FINANCIAL_STATEMENTS'],
    settings: {
      books: ['BOTH'],
      frameworks: ['AABE Directive 2/2012'],
      executionMode: 'VALIDATE',
      actionRoute: '/settings/audit-logs',
    },
    conditions: { requiresModules: ['audit_logs', 'rbac'] },
  },
  {
    id: 'M6_DUAL_CALENDAR',
    module: 'ADMIN',
    label: 'Verify dual fiscal calendar alignment',
    description: 'Gregorian (Jan–Dec) and Ethiopian EFY (Hamle 1 – Sene 30) period mapping for filings.',
    priority: 'RECOMMENDED',
    dependsOn: [],
    settings: {
      books: ['BOTH'],
      frameworks: ['MoR eTax', 'AABE'],
      executionMode: 'VALIDATE',
      actionRoute: '/accounting',
      calendarSystems: ['GREGORIAN', 'ETHIOPIAN'],
    },
    conditions: {},
  },
  {
    id: 'M6_PERIOD_LOCK',
    module: 'ADMIN',
    label: 'Lock accounting period',
    description: 'Immutable period after all required tasks pass. Admin override creates audit event.',
    priority: 'REQUIRED',
    dependsOn: [
      'M5_TRIAL_BALANCE', 'M5_UNPOSTED_JOURNALS', 'M5_AR_AP_SUBLEDGER',
      'M4_VAT_RETURN', 'M4_TOT_RETURN', 'M6_AUDIT_TRAIL_REVIEW',
    ],
    settings: {
      books: ['BOTH'],
      frameworks: ['IAS 1.27', 'AABE'],
      executionMode: 'HYBRID',
      actionRoute: '/accounting/period-close',
      periodCloseStepId: 'period-lock',
    },
    conditions: { requiresModules: ['period_close'] },
  },

  // ── MODULE 7: DEVELOPER ───────────────────────────────────────────────────
  {
    id: 'M7_ETAX_SUBMISSION',
    module: 'DEVELOPER',
    label: 'Submit VAT/TOT eTax payload to MoR',
    description: 'TaxpayerDeclaration JSON: TIN, filing period, VatSummary, SystemSecurity signature.',
    priority: 'OPTIONAL',
    dependsOn: ['M4_VAT_RETURN', 'M4_TOT_RETURN'],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR eTax REST API'],
      taxTypes: ['VAT', 'TOT'],
      executionMode: 'EXECUTE',
      actionRoute: '/integrations/etax',
    },
    conditions: {
      requiresEnv: ['ETAX_API_URL', 'ETAX_CLIENT_ID'],
      requiresModules: ['etax_portal', 'api_integration'],
    },
  },
  {
    id: 'M7_ETAX_PAYE_SUBMISSION',
    module: 'DEVELOPER',
    label: 'Submit PAYE eTax payload to MoR',
    description: 'Monthly payroll tax declaration with employee count and withheld PIT totals.',
    priority: 'OPTIONAL',
    dependsOn: ['M2_PAYE_DECLARATION'],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR eTax REST API'],
      taxTypes: ['PAYROLL_PIT'],
      executionMode: 'EXECUTE',
      actionRoute: '/integrations/etax',
    },
    conditions: {
      minEmployees: 1,
      requiresEnv: ['ETAX_API_URL', 'ETAX_CLIENT_ID'],
      requiresModules: ['etax_portal'],
    },
  },
  {
    id: 'M7_ETAX_WHT_SUBMISSION',
    module: 'DEVELOPER',
    label: 'Submit WHT eTax payload to MoR',
    description: 'WithholdingTaxSummary: 3% goods (≥ETB 10K), 3% services (≥ETB 3K), total remittance — Proc. 1395/2025 Art. 94.',
    priority: 'OPTIONAL',
    dependsOn: ['M4_WHT_REGISTER'],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR eTax REST API'],
      taxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
      executionMode: 'EXECUTE',
      actionRoute: '/integrations/etax',
    },
    conditions: {
      requiresEnv: ['ETAX_API_URL', 'ETAX_CLIENT_ID'],
      requiresTaxTypes: ['WHT_GOODS', 'WHT_SERVICES'],
    },
  },
  {
    id: 'M7_WEBHOOK_DISPATCH',
    module: 'DEVELOPER',
    label: 'Dispatch period-close webhooks',
    description: 'Notify downstream systems: PERIOD_LOCKED, VAT_FILED, ETAX_RECEIPT_RECEIVED events.',
    priority: 'OPTIONAL',
    dependsOn: ['M6_PERIOD_LOCK'],
    settings: {
      books: ['BOTH'],
      frameworks: ['REST Webhooks'],
      executionMode: 'EXECUTE',
      actionRoute: '/integrations/webhooks',
    },
    conditions: {
      requiresModules: ['webhooks', 'api_integration'],
      sizes: ['LARGE', 'ENTERPRISE'],
    },
  },

  // ── M8: TASS / SRM / Customs / MoR Portal Tasks ───────────────────────────
  // Tasks covering MoR restructuring (formerly ERCA) and portal automation.
  // ERCA was officially renamed Ministry of Revenues (MoR) — Proc. No. 1097/2018.
  // Source: Ethiopian Tax Compliance Guide (2020) — Sections 3.3.x, 20, 23, 25, 27

  {
    id: 'M8_TASS_SRM_REGISTRATION',
    module: 'COMPLIANCE',
    label: 'Register SRM devices with TASS',
    description:
      'All VAT-registered businesses must register each Sales Register Machine (SRM/EFD) on the TASS portal (tass.mor.gov.et). ' +
      'Failure to register: ETB 50,000 penalty per device. ' +
      'ETB 100,000 penalty for fiscal memory tampering. (Tax Admin. Proc. s.26.1)',
    priority: 'REQUIRED',
    dependsOn: ['M1_COMPANY_REGISTRATION'],
    settings: {
      books: ['TAX'],
      frameworks: ['TASS Portal', 'MoR EFD Registry'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/tass/srm',
    },
    conditions: {
      requiresTaxTypes: ['VAT'],
    },
  },

  {
    id: 'M8_TASS_VEHICLE_VERIFY',
    module: 'COMPLIANCE',
    label: 'Verify vehicle annual tax (TASS)',
    description:
      'Annual motor vehicle tax must be verified and paid before vehicle inspection and registration renewal. ' +
      'Required for: asset transfers, insurance, change of plate/use. (Tax Clearance s.23, TASS portal)',
    priority: 'OPTIONAL',
    dependsOn: [],
    settings: {
      books: ['TAX'],
      frameworks: ['TASS Vehicle Verification'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/mor/tass/vehicle',
    },
    conditions: {},
  },

  {
    id: 'M8_GRADUATE_TAX',
    module: 'COMPLIANCE',
    label: 'Apply graduate tax deductions (Reg. 154/2008)',
    description:
      'Employers must deduct ≥10% of monthly income from employees who are graduates of public higher-learning institutions ' +
      'and remit alongside monthly PAYE to the Ministry of Revenues (MoR) via etax.mor.gov.et. ' +
      'Start within 6 months of graduation (max 1 year). ' +
      'Failure: employer liable for uncollected amounts + unpaid months. (Section 3.3.13)',
    priority: 'OPTIONAL',
    dependsOn: ['M2_PAYE_DECLARATION'],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR eTax', 'Reg. 154/2008'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/graduate-tax',
    },
    conditions: {
      minEmployees: 1,
    },
  },

  {
    id: 'M8_SCHEDULE_D_FINAL_WHT',
    module: 'COMPLIANCE',
    label: 'File Schedule D final withholding taxes',
    description:
      'Other income taxed as a FINAL TAX: dividends (15%), interest (5–10%), capital gains (15–30%), royalties (5–10%), ' +
      'casual rentals (15%), games of chance (20%), undistributed profit (10%), repatriated profit (10%). ' +
      'Monthly WHT → 30 days after month-end. Capital gains/rentals → 2 months after transaction. (Section 3.3.4)',
    priority: 'REQUIRED',
    dependsOn: ['M4_WHT_REGISTER'],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR eTax', 'Proc. 1395/2025 Art. 52–65'],
      taxTypes: ['DIVIDEND', 'INTEREST', 'CAPITAL_GAINS', 'ROYALTY', 'CASUAL_RENTAL', 'UNDISTRIBUTED_PROFIT'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/schedule-d',
    },
    conditions: {},
  },

  {
    id: 'M8_CUSTOMS_ESAD',
    module: 'COMPLIANCE',
    label: 'File e-SAD customs declaration (ECC Trade Portal)',
    description:
      'Electronic Single Administrative Document (e-SAD) for all imports/exports via the Ethiopia Customs Trade Portal (trade.gov.et). ' +
      'Full duty stack: customs (0–35%) + excise + 10% surtax + 15% VAT on imports + 3% advance BIT for Schedule C importers. ' +
      'COMESA preferential rate: standard − 10%. (Customs Proc. 859/2014)',
    priority: 'OPTIONAL',
    dependsOn: [],
    settings: {
      books: ['TAX'],
      frameworks: ['ECC Customs Trade Portal', 'ASYCUDA World', 'Proc. 859/2014'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/customs/declarations',
    },
    conditions: {
      requiresTaxTypes: ['CUSTOMS_DUTY'],
    },
  },

  {
    id: 'M8_CUSTOMS_EMANIFEST',
    module: 'COMPLIANCE',
    label: 'Submit e-Manifest for cargo arrivals (ECC)',
    description:
      'Electronic cargo manifest filed by shipping agents with the Ethiopian Customs Commission. ' +
      'Linked to e-SAD declarations for each consignment. Required for sea (ESLSE), air (EAL Cargo), and land freight.',
    priority: 'OPTIONAL',
    dependsOn: ['M8_CUSTOMS_ESAD'],
    settings: {
      books: ['TAX'],
      frameworks: ['ECC Customs Trade Portal', 'trade.gov.et'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/customs/manifests',
    },
    conditions: {
      requiresTaxTypes: ['CUSTOMS_DUTY'],
    },
  },

  {
    id: 'M8_NET_TAX_REPORT',
    module: 'COMPLIANCE',
    label: 'Generate consolidated net tax payable report',
    description:
      'Monthly net tax payable report combining: VAT/TOT + WHT + PAYE (PIT+DRRF) + Pension (PFSA) + Graduate Tax + ' +
      'Excise + Stamp Duty + Schedule D + DRRF + BIT provisional. Single MoR submission view.',
    priority: 'REQUIRED',
    dependsOn: ['M4_VAT_RETURN', 'M2_PAYE_DECLARATION', 'M4_WHT_REGISTER'],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR Net Tax Report', 'All Tax Types'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/net-report',
    },
    conditions: {},
  },

  {
    id: 'M8_TAX_CLEARANCE',
    module: 'COMPLIANCE',
    label: 'Obtain tax clearance certificate (Section 23)',
    description:
      'Written evidence from the Ministry of Revenues (MoR) confirming the taxpayer has discharged tax obligations. Required for: ' +
      'licence renewal (6 months validity), public tender (6 months), bank loan (6 months), ' +
      'vehicle registration, asset transfers, business closure, share transfers. (Tax Admin. Proc. s.23)',
    priority: 'OPTIONAL',
    dependsOn: [],
    settings: {
      books: ['TAX'],
      frameworks: ['MoR eTax', 'MoR Tax Clearance Portal'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/mor/international/clearance',
    },
    conditions: {},
  },

  {
    id: 'M8_TRANSFER_PRICING',
    module: 'COMPLIANCE',
    label: 'Prepare transfer pricing documentation (Section 20.5)',
    description:
      'Related-party transactions ≥ ETB 500,000 require contemporaneous arm\'s-length documentation. ' +
      'OECD TP Guidelines apply as secondary source; Ethiopian Directive and Proclamation take precedence. ' +
      'Penalty: ETB 100,000 for failure to provide TP details. (Tax Admin. Proc. s.26.1)',
    priority: 'OPTIONAL',
    dependsOn: ['M4_CIT_RECONCILIATION'],
    settings: {
      books: ['TAX', 'IFRS'],
      frameworks: ['Directive 2015', 'OECD TP Guidelines', 'Proc. 979/2016 s.20.5'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/mor/international/transfer-pricing',
    },
    conditions: {
      sizes: ['LARGE', 'ENTERPRISE'],
    },
  },

  {
    id: 'M8_THIN_CAP_ASSESSMENT',
    module: 'COMPLIANCE',
    label: 'Assess thin capitalisation (Section 20.3)',
    description:
      'For foreign-controlled entities (>50% non-resident ownership): interest deduction is proportionately ' +
      'disallowed when average debt:equity exceeds 2:1. Unless actual debt ≤ arm\'s-length debt amount. ' +
      'Run annually with BIT declaration. (Proc. 979/2016 s.20.3)',
    priority: 'OPTIONAL',
    dependsOn: ['M4_CIT_RECONCILIATION'],
    settings: {
      books: ['TAX', 'IFRS'],
      frameworks: ['Proc. 979/2016 s.20.3'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/mor/international/thin-cap',
    },
    conditions: {
      sizes: ['LARGE', 'ENTERPRISE'],
    },
  },

  {
    id: 'M8_FOREIGN_TAX_CREDIT',
    module: 'COMPLIANCE',
    label: 'Apply foreign tax credit (Section 20.1)',
    description:
      'Ethiopia uses the credit method. Resident taxpayers who paid foreign income tax can credit the lesser of ' +
      '(foreign tax paid) and (Ethiopian Schedule C BIT on that income). Must be paid within 2 years of year-end. ' +
      'No carry-forward of unused foreign tax credits. (Proc. 979/2016 s.20.1)',
    priority: 'OPTIONAL',
    dependsOn: ['M4_CIT_RECONCILIATION'],
    settings: {
      books: ['TAX'],
      frameworks: ['Proc. 979/2016 s.20.1'],
      executionMode: 'EXECUTE',
      actionRoute: '/ovds/mor/international/foreign-tax-credit',
    },
    conditions: {
      sizes: ['LARGE', 'ENTERPRISE'],
    },
  },

  {
    id: 'M8_LOSS_CARRY_FORWARD',
    module: 'COMPLIANCE',
    label: 'Review tax loss carry-forward schedule (Section 25)',
    description:
      'Carried-forward losses must be deducted in the following year; maximum 5 tax years. ' +
      'If losses have been carried forward for 2 consecutive years, no further carry-forward is allowed. ' +
      'Books must be audited. Earliest loss deducted first. Expires Jan 1 annually. (Proc. 979/2016 s.25)',
    priority: 'OPTIONAL',
    dependsOn: ['M4_CIT_RECONCILIATION'],
    settings: {
      books: ['TAX', 'IFRS'],
      frameworks: ['Proc. 979/2016 s.25', 'IAS 12'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/mor/international/tax-loss',
    },
    conditions: {},
  },

  {
    id: 'M8_TAX_DISPUTE_MANAGEMENT',
    module: 'COMPLIANCE',
    label: 'Manage tax dispute / objection (Section 27)',
    description:
      'File objection within 21 days of assessment notice. Stages: Review Dept → Tax Appeal Commission (50% deposit) ' +
      '→ Federal High Court (75% deposit, law only) → Federal Supreme Court. ' +
      'Authority has 180 days to decide; then taxpayer may appeal to TAC. (Tax Admin. Proc. s.27)',
    priority: 'OPTIONAL',
    dependsOn: [],
    settings: {
      books: ['TAX'],
      frameworks: ['Tax Admin. Proc. 983/2016 s.27'],
      executionMode: 'VALIDATE',
      actionRoute: '/ovds/mor/international/disputes',
    },
    conditions: {},
  },
];

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

const BROAD_MODULE_GATES: Record<string, string> = {
  payroll: 'payroll',
  hr: 'hr',
  employee_benefits: 'hr',
  vat: 'tax',
  tot: 'tax',
  wht: 'tax',
  cit: 'tax',
  drrf: 'tax',
  excise: 'tax',
  fixed_assets: 'ovds',
  banking: 'ovds',
  fx_rates: 'ovds',
  ecl_provision: 'ovds',
  accounting: 'ovds',
  procurement: 'ovds',
  inventory: 'inventory',
  financial_statements: 'reports',
  reports: 'reports',
  api_integration: 'api_integration',
  etax_portal: 'api_integration',
  webhooks: 'api_integration',
  period_close: 'ovds',
  multi_company: 'ovds',
  rbac: 'admin',
  audit_logs: 'admin',
  core_operations: 'ovds',
  invoice: 'ovds',
  tax_compliance: 'tax',
  // ── MoR portal modules (MoR = Ministry of Revenues, formerly ERCA) ─────────
  tass: 'tax',
  srm_device: 'tax',
  customs_duty: 'tax',
  customs: 'tax',
  schedule_d: 'tax',
  graduate_tax: 'tax',
  net_tax_report: 'tax',
  transfer_pricing: 'tax',
  thin_cap: 'tax',
  foreign_tax_credit: 'tax',
  tax_loss: 'tax',
  tax_clearance: 'tax',
  tax_dispute: 'tax',
};

function moduleEnabled(enabledModules: string[], moduleKey: string): boolean {
  if (enabledModules.includes(moduleKey)) return true;
  const parent = BROAD_MODULE_GATES[moduleKey];
  if (parent && enabledModules.includes(parent)) return true;
  if (!parent) return true;
  return false;
}

export function getWorkflowTaskDefinition(taskId: string): WorkflowTaskDefinition | undefined {
  return WORKFLOW_TASK_CATALOG.find(t => t.id === taskId);
}

export function evaluateWorkflowTaskConditions(
  def: WorkflowTaskDefinition,
  profile: Pick<
    BusinessProfile,
    'size' | 'enabledModules' | 'taxObligations' | 'employeeCount' | 'isVatRegistered' | 'ifrsStandard'
  >,
  period: WorkflowPeriodContext,
  envKeys?: Record<string, boolean>,
): { applicable: boolean; reason?: string } {
  const c = def.conditions;

  if (c.sizes && c.sizes.length > 0 && !c.sizes.includes(profile.size)) {
    return { applicable: false, reason: `Not required for ${profile.size} businesses` };
  }

  if (c.minEmployees !== undefined && profile.employeeCount < c.minEmployees) {
    return { applicable: false, reason: 'No active employees' };
  }

  if (c.months && c.months.length > 0 && !c.months.includes(period.month)) {
    return { applicable: false, reason: `Runs only in months: ${c.months.join(', ')}` };
  }

  if (c.requiresModules?.length) {
    const missing = c.requiresModules.filter(m => !moduleEnabled(profile.enabledModules, m));
    if (missing.length > 0) {
      return { applicable: false, reason: `Module(s) not enabled: ${missing.join(', ')}` };
    }
  }

  if (c.requiresTaxTypes?.length) {
    const active = profile.taxObligations.filter(o => o.applies).map(o => o.taxType);
    const hasTax = c.requiresTaxTypes.some(t =>
      active.some(a => a === t || a.startsWith(t)),
    );
    if (!hasTax) {
      return { applicable: false, reason: `Tax obligation not applicable: ${c.requiresTaxTypes.join(', ')}` };
    }
  }

  if (c.requiresEnv?.length) {
    const missingEnv = c.requiresEnv.filter(k => !(envKeys?.[k] ?? false));
    if (missingEnv.length > 0) {
      return { applicable: false, reason: `Environment not configured: ${missingEnv.join(', ')}` };
    }
  }

  // IFRS 15 obligations — medium+ with IFRS standards
  if (def.id === 'M1_IFRS15_OBLIGATIONS') {
    if (profile.ifrsStandard === 'LOCAL_GAAP') {
      return { applicable: false, reason: 'LOCAL_GAAP tier — IFRS 15 step-recognition not required' };
    }
  }

  // VAT vs TOT mutual exclusion at task level
  if (def.id === 'M4_VAT_RETURN' && !profile.isVatRegistered) {
    const vatApplies = profile.taxObligations.some(o => o.applies && o.taxType === 'VAT');
    if (!vatApplies) return { applicable: false, reason: 'Not VAT registered' };
  }
  if (def.id === 'M4_TOT_RETURN') {
    const totApplies = profile.taxObligations.some(o => o.applies && o.taxType === 'TOT');
    if (!totApplies) return { applicable: false, reason: 'VAT registered or below TOT threshold' };
  }

  return { applicable: true };
}

/** Topological execution order derived from catalog dependencies */
export function getWorkflowTaskExecutionOrder(): string[] {
  const ids = WORKFLOW_TASK_CATALOG.map(t => t.id);
  const ordered: string[] = [];
  const visited = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const def = getWorkflowTaskDefinition(id);
    def?.dependsOn.forEach(visit);
    ordered.push(id);
  }

  ids.forEach(visit);
  return ordered;
}
