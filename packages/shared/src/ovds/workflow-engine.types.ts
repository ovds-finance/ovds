/**
 * OVDS — End-to-End Accounting Workflow Engine Types
 *
 * Defines the canonical data structures for the full 7-module lifecycle:
 *   Core Operations → People → ovds → Compliance → Reporting → Admin → Developer
 *
 * Governing frameworks:
 *   IFRS: IAS 1, 2, 7, 12, 15, 16, 19, 21, 36; IFRS 9, 15, 16, 18
 *   Ethiopian: Proclamation No. 1395/2025, 979/2016, 1341/2024, 1186/2020
 *   AABE Directive No. 2/2012 (IFRS tier applicability)
 *
 * Architecture: every transaction posts to BOTH IFRS Book and Tax Book in one atomic operation.
 */

// ---------------------------------------------------------------------------
// MODULE 1 — CORE OPERATIONS: Sales, Procurement, Inventory
// ---------------------------------------------------------------------------

/** Tax flags on every transaction line — computed automatically at entry time */
export interface TransactionLineTaxFlags {
  /** Is the seller/company VAT registered? (Proc. 1341/2024, threshold ETB 2M) */
  isVatRegistered: boolean;
  /** VAT rate: 0.15 standard, 0 exempt/zero-rated, or custom override */
  vatRate: number;
  /** VAT category for this specific line */
  vatCategory: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
  /** TOT applies only when NOT VAT-registered and turnover ETB 500K–2M */
  totApplicable: boolean;
  /** TOT rate: 0.02 goods, 0.10 services, 0.02 construction/grain/farm */
  totRate: number;
  /** WHT on this purchase: 3% goods (≥ETB 10K, Proc. 1395/2025) or 3% services (≥ETB 3K) */
  whtRate: number;
  whtType: 'GOODS' | 'SERVICES' | 'DIVIDEND' | 'INTEREST' | 'NONE';
  /** Excise tax rate (0 if not applicable) */
  exciseRate: number;
  /** DRRF levy rate (1% on qualifying transactions) */
  drrfRate: number;
  /** Import surtax (10% on CIF + duty + excise) */
  importSurtaxRate: number;
  /** Stamp duty required (contracts only) */
  stampDutyRequired: boolean;
  stampDutyAmount: number;
}

/**
 * IAS 2 — Inventory line augmented with IFRS vs tax-book dual valuation.
 * The IFRS book carries lower-of-cost-or-NRV; the tax book carries acquisition cost.
 */
export interface InventoryLineIas2 {
  itemId: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  /** NRV = estimated selling price − estimated costs of completion and sale */
  netRealisableValue: number;
  /** IFRS Book carrying value: min(cost, NRV) */
  ifrsCarryingValue: number;
  /** IAS 2.34 write-down to NRV, posted as operating expense */
  nrvWriteDownAmount: number;
  /** Tax Book: always acquisition cost (no NRV write-down for tax purposes) */
  taxBookCost: number;
  /** Temporary difference → DTA at 30% */
  ias12TemporaryDifference: number;
  valuationMethod: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_ID';
}

/**
 * IFRS 15 — Performance Obligation on a sales transaction line.
 * Determines when revenue is recognised: point-in-time vs. over-time.
 */
export interface PerformanceObligationLine {
  lineId: string;
  description: string;
  transactionPriceAllocated: number;
  recognitionBasis: 'POINT_IN_TIME' | 'OVER_TIME';
  /** For over-time recognition: % completion drives revenue recognised */
  completionPercentage: number;
  recognisedAmount: number;
  deferredRevenue: number;
  satisfactionDate?: string;
  /** Ethiopian VAT: VAT is triggered at invoice date regardless of IFRS 15 timing */
  vatTriggerPoint: 'INVOICE_DATE' | 'DELIVERY' | 'CASH_RECEIPT';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SATISFIED' | 'PARTIALLY_SATISFIED';
}

/** Full operational transaction — captures sales, purchases, and all tax dimensions */
export interface OperationalTransaction {
  id: string;
  companyId: string;
  type: 'SALE' | 'PURCHASE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'GRN';
  documentRef: string;
  date: string;
  period: string;
  lines: OperationalTransactionLine[];
  taxFlags: TransactionLineTaxFlags;
  /** IFRS 15: performance obligations for each line */
  performanceObligations: PerformanceObligationLine[];
  /** Inventory movements — drives IAS 2 dual-valuation */
  inventoryLines: InventoryLineIas2[];
  /** Computed totals */
  subtotal: number;
  vatAmount: number;
  totAmount: number;
  exciseAmount: number;
  whtDeducted: number;
  drrfAmount: number;
  stampDutyAmount: number;
  grossTotal: number;
  netPayable: number;
  /** GL auto-post reference — created when document is approved */
  journalEntryId?: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'CANCELLED';
  postedBy?: string;
  approvedAt?: string;
}

export interface OperationalTransactionLine {
  lineId: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineSubtotal: number;
  vatAmount: number;
  totAmount: number;
  exciseAmount: number;
  whtAmount: number;
  lineTotal: number;
  taxFlags: TransactionLineTaxFlags;
  performanceObligation?: PerformanceObligationLine;
  inventoryLine?: InventoryLineIas2;
  /** IFRS 18 operating category for P&L classification */
  ifrs18Category: 'OPERATING' | 'INVESTING' | 'FINANCING';
  cogs?: number;
  /** WHT withholding threshold check */
  whtThresholdMet: boolean;
}

// ---------------------------------------------------------------------------
// MODULE 1 — GL Auto-Post Rules: what journals fire on transaction approval
// ---------------------------------------------------------------------------

/**
 * Canonical GL posting template for each transaction type.
 * When a document is approved, the engine iterates these rules and creates
 * journal lines in both IFRS Book and Tax Book simultaneously.
 */
export interface GlPostingRule {
  trigger: 'INVOICE_APPROVED' | 'PAYMENT_RECEIVED' | 'BILL_APPROVED'
    | 'PAYMENT_MADE' | 'GRN_CONFIRMED' | 'PAYROLL_APPROVED'
    | 'DEPRECIATION_RUN' | 'PERIOD_CLOSE' | 'VAT_RECONCILIATION'
    | 'ECL_PROVISION' | 'ASSET_DISPOSAL' | 'IAS19_ACCRUAL' | 'MANUAL';
  book: 'IFRS' | 'TAX' | 'BOTH';
  lines: GlPostingTemplateLine[];
  description: string;
  ifrsRef: string;
}

export interface GlPostingTemplateLine {
  accountSubType: string;
  side: 'DEBIT' | 'CREDIT';
  /** Amount source — which field from the trigger document */
  amountSource: string;
  /** IFRS 18 P&L classification */
  ifrs18Category?: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'INCOME_TAX';
  taxReference?: string;
  description?: string;
}

/** Pre-built posting templates — the canonical GL automation rules */
export const GL_POSTING_TEMPLATES: GlPostingRule[] = [
  {
    trigger: 'INVOICE_APPROVED',
    book: 'BOTH',
    description: 'IFRS 15: Recognise revenue when performance obligation satisfied',
    ifrsRef: 'IFRS 15.31, IAS 1',
    lines: [
      { accountSubType: 'ACCOUNTS_RECEIVABLE', side: 'DEBIT',  amountSource: 'grossTotal',  ifrs18Category: 'OPERATING' },
      { accountSubType: 'REVENUE_OPERATING',   side: 'CREDIT', amountSource: 'subtotal',     ifrs18Category: 'OPERATING' },
      { accountSubType: 'VAT_PAYABLE',         side: 'CREDIT', amountSource: 'vatAmount',    taxReference: 'VAT' },
      { accountSubType: 'TOT_PAYABLE',         side: 'CREDIT', amountSource: 'totAmount',    taxReference: 'TOT' },
    ],
  },
  {
    trigger: 'PAYMENT_RECEIVED',
    book: 'BOTH',
    description: 'Settle AR on customer payment receipt',
    ifrsRef: 'IAS 1',
    lines: [
      { accountSubType: 'BANK',                side: 'DEBIT',  amountSource: 'amountReceived' },
      { accountSubType: 'ACCOUNTS_RECEIVABLE', side: 'CREDIT', amountSource: 'amountReceived' },
    ],
  },
  {
    trigger: 'BILL_APPROVED',
    book: 'BOTH',
    description: 'Record supplier bill: DR Expense/Inventory, CR AP, CR WHT Payable',
    ifrsRef: 'IAS 2, IAS 16',
    lines: [
      { accountSubType: 'ACCOUNTS_PAYABLE', side: 'CREDIT', amountSource: 'netPayable' },
      { accountSubType: 'WHT_PAYABLE',      side: 'CREDIT', amountSource: 'whtDeducted', taxReference: 'WHT' },
    ],
  },
  {
    trigger: 'GRN_CONFIRMED',
    book: 'BOTH',
    description: 'IAS 2: Record inventory receipt at cost; IFRS Book uses lower of cost/NRV',
    ifrsRef: 'IAS 2.9',
    lines: [
      { accountSubType: 'INVENTORY',        side: 'DEBIT',  amountSource: 'ifrsCarryingValue', ifrs18Category: 'OPERATING' },
      { accountSubType: 'ACCOUNTS_PAYABLE', side: 'CREDIT', amountSource: 'totalCost' },
    ],
  },
  {
    trigger: 'PAYROLL_APPROVED',
    book: 'BOTH',
    description: 'IAS 19: Post payroll — gross salary, PIT, pension, DRRF',
    ifrsRef: 'IAS 19',
    lines: [
      { accountSubType: 'ADMIN_EXPENSE',    side: 'DEBIT',  amountSource: 'grossTotal',        ifrs18Category: 'OPERATING' },
      { accountSubType: 'PENSION_EXPENSE',  side: 'DEBIT',  amountSource: 'employerPension',   ifrs18Category: 'OPERATING' },
      { accountSubType: 'DRRF_EXPENSE',     side: 'DEBIT',  amountSource: 'drrfAmount',        ifrs18Category: 'OPERATING' },
      { accountSubType: 'SALARY_PAYABLE',   side: 'CREDIT', amountSource: 'netSalary' },
      { accountSubType: 'INCOME_TAX_PAYABLE', side: 'CREDIT', amountSource: 'pitWithheld',     taxReference: 'PIT' },
      { accountSubType: 'PENSION_PAYABLE',  side: 'CREDIT', amountSource: 'totalPension',      taxReference: 'PENSION' },
      { accountSubType: 'DRRF_PAYABLE',     side: 'CREDIT', amountSource: 'drrfAmount',        taxReference: 'DRRF' },
    ],
  },
  {
    trigger: 'DEPRECIATION_RUN',
    book: 'BOTH',
    description: 'IAS 16: Monthly depreciation — IFRS straight-line vs Tax pool (Art. 25)',
    ifrsRef: 'IAS 16, Proc. 979/2016 Art. 25',
    lines: [
      { accountSubType: 'DEPRECIATION_EXPENSE',       side: 'DEBIT',  amountSource: 'ifrsDepreciation',  ifrs18Category: 'OPERATING' },
      { accountSubType: 'ACCUMULATED_DEPRECIATION',   side: 'CREDIT', amountSource: 'ifrsDepreciation' },
    ],
  },
  {
    trigger: 'ECL_PROVISION',
    book: 'BOTH',
    description: 'IFRS 9: Recognise ECL provision — tax book uses specific provision only',
    ifrsRef: 'IFRS 9.5.5, IAS 12',
    lines: [
      { accountSubType: 'ECL_PROVISION_EXPENSE', side: 'DEBIT',  amountSource: 'eclProvision',    ifrs18Category: 'OPERATING' },
      { accountSubType: 'CONTRA_ASSET',          side: 'CREDIT', amountSource: 'eclProvision' },
    ],
  },
  {
    trigger: 'IAS19_ACCRUAL',
    book: 'BOTH',
    description: 'IAS 19: Month-end leave accrual and gratuity provision',
    ifrsRef: 'IAS 19.11, IAS 37',
    lines: [
      { accountSubType: 'PENSION_EXPENSE',  side: 'DEBIT',  amountSource: 'leaveAccrualCharge', ifrs18Category: 'OPERATING' },
      { accountSubType: 'ACCRUED_EXPENSE',  side: 'CREDIT', amountSource: 'leaveAccrualCharge' },
    ],
  },
];

// ---------------------------------------------------------------------------
// MODULE 2 — PEOPLE: Payroll Engine (IAS 19 + Proclamation No. 1395/2025)
// ---------------------------------------------------------------------------

/**
 * Full payroll computation result for one employee for one period.
 * Implements Proclamation No. 1395/2025 PIT brackets + IAS 19 benefit accruals.
 */
export interface PayrollComputationResult {
  employeeId: string;
  employeeName: string;
  period: string;            // YYYY-MM
  /** Gross includes: base salary + overtime + transport + housing allowances */
  grossSalary: number;
  /** Insurable earnings cap: ETB 15,000 (pension base) */
  insurableEarnings: number;
  /** Employee pension: insurableEarnings × 7% */
  pensionEmployee: number;
  /** Taxable income after pension deduction */
  taxableIncome: number;
  /** PIT per Proclamation No. 1395/2025 progressive brackets */
  incomeTax: number;
  /** DRRF levy: grossSalary × 1% */
  drrf: number;
  /** Net salary = gross − pensionEmployee − incomeTax − drrf − other deductions */
  netSalary: number;
  /** Employer pension: insurableEarnings × 11% (expense, not deducted from employee) */
  pensionEmployer: number;
  /** Effective PIT rate */
  effectivePitRate: number;
  /** Loan deductions */
  loanDeductions: number;
  /** Other deductions (provident fund, etc.) */
  otherDeductions: number;
  /** Payroll GL journal template */
  glPostings: {
    drGrossExpense: number;
    drEmployerPension: number;
    drDrrf: number;
    crSalaryPayable: number;
    crPitPayable: number;
    crEmployeePension: number;
    crDrrfPayable: number;
  };
  /** IAS 19 accruals computed at month-end */
  ias19: {
    leaveDaysRemaining: number;
    dailyRate: number;
    leaveAccrualLiability: number;   // remainingDays × (basicSalary/30)
    gratuityAccrual: number;          // 1 month per year of service
    totalIas19Liability: number;
  };
  status: 'DRAFT' | 'APPROVED' | 'PAID';
}

/**
 * Company-level payroll run summary for a period.
 * Posted to GL as single journal entry after approval.
 */
export interface PayrollRunSummary {
  companyId: string;
  period: string;
  employeeCount: number;
  totalGrossSalary: number;
  totalPensionEmployee: number;
  totalPensionEmployer: number;
  totalPit: number;
  totalDrrf: number;
  totalNetSalary: number;
  totalLoanDeductions: number;
  /** IAS 19 total leave liability for the period */
  totalLeaveAccrual: number;
  /** IAS 19 total gratuity accrual for the period */
  totalGratuityAccrual: number;
    /** eTax PAYE payload for MoR (Ministry of Revenues) submission via etax.mor.gov.et */
    eTaxPayeSummary: {
      EmployeeCount: number;
      TotalGrossSalaryETB: number;
      TotalPitWithheldETB: number;
      TotalEmployeePensionETB: number;
      TotalEmployerPensionETB: number;
      TotalDrrfETB: number;
      /** PIT + DRRF → MoR (field kept as NetPayableErcaETB for API schema compat) */
      NetPayableErcaETB: number;
      NetPayablePfsaETB: number;
    };
  /** GL journal entry reference after posting */
  journalEntryId?: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'FILED';
  filingDeadline: string;   // 30th of following month
}

// ---------------------------------------------------------------------------
// MODULE 3 — ovds: GL, Assets (IAS 16), FX (IAS 21), ECL (IFRS 9)
// ---------------------------------------------------------------------------

/**
 * Fixed asset with DUAL depreciation schedules:
 *   IFRS Book: IAS 16 straight-line / revaluation model
 *   Tax Book:  Ethiopian pool depreciation (Art. 25, Proc. 979/2016)
 */
export interface FixedAssetWorkflow {
  assetId: string;
  companyId: string;
  assetName: string;
  assetCode: string;
  /** User-defined category: COMPUTER, VEHICLE, BUILDING, MACHINERY, etc. */
  category: string;
  /** Ethiopian tax pool category */
  taxPoolCategory: 'CAT_1' | 'CAT_2' | 'CAT_3' | 'CAT_4';
  taxPoolRate: number;    // 0.25 | 0.20 | 0.15 | 0.10
  purchaseCost: number;
  purchaseDate: string;
  disposalDate?: string;

  /** IFRS Book (IAS 16) */
  ifrs: {
    usefulLifeYears: number;
    salvageValue: number;
    method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
    annualDepreciation: number;
    accumulatedDepreciation: number;
    netBookValue: number;
    /** Revaluation model: revalued amount if asset was revalued (IAS 16.31) */
    revaluedAmount?: number;
    revaluationDate?: string;
    /** IAS 36: last impairment test date */
    lastImpairmentTest?: string;
    impairmentLoss?: number;
  };

  /** Tax Book (Proc. 979/2016 Art. 25) — pool-based declining balance */
  tax: {
    poolOpeningBalance: number;
    additions: number;
    disposals: number;
    annualDepreciation: number;
    poolClosingBalance: number;
  };

  /** IAS 12: temporary difference = IFRS NBV − Tax Book base */
  ias12: {
    temporaryDifference: number;
    deferredTaxType: 'DTL' | 'DTA' | 'NONE';
    deferredTaxAmount: number;   // temporaryDifference × 30%
  };

  /** CGT on disposal: gain × 15% (Schedule D, Proc. 1395/2025 Art. 59) */
  disposal?: {
    proceeds: number;
    carryingValueAtDisposal: number;
    gainLoss: number;
    cgtRate: number;             // 0.15 for shares/buildings/investment property
    cgtPayable: number;
    journalEntryId?: string;
  };
}

/**
 * IAS 21 FX revaluation for monetary items.
 * Triggered at each period end; gain/loss goes to P&L (IFRS 18 Financing).
 */
export interface FxRevaluationWorkflow {
  companyId: string;
  period: string;
  items: FxRevaluationItem[];
  totalFxGain: number;
  totalFxLoss: number;
  netFxMovement: number;
  /** Posted to P&L: IFRS 18 Financing category (IAS 21.28) */
  journalEntryId?: string;
  nbeRateUsed: number;   // NBE closing rate at period end
  rateDate: string;
}

export interface FxRevaluationItem {
  accountId: string;
  accountName: string;
  currency: string;
  foreignAmount: number;
  openingRate: number;
  closingRate: number;
  openingEtbValue: number;
  closingEtbValue: number;
  fxGainLoss: number;
  /** IAS 12 deferred tax on FX gains (taxed when realised) */
  deferredTaxImpact: number;
}

// ---------------------------------------------------------------------------
// MODULE 4 — COMPLIANCE: IAS 12 Reconciliation + Tax Returns
// ---------------------------------------------------------------------------

/**
 * Period-end compliance checklist — all tasks required before period close.
 * System enforces this sequence; period cannot be locked until all REQUIRED
 * items are COMPLETED.
 */
export interface PeriodEndChecklist {
  companyId: string;
  period: string;
  items: PeriodEndChecklistItem[];
  allRequiredComplete: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface PeriodEndChecklistItem {
  id: string;
  module: 'OPERATIONS' | 'PEOPLE' | 'ovds' | 'COMPLIANCE' | 'REPORTING';
  task: string;
  description: string;
  required: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'WAIVED';
  completedAt?: string;
  completedBy?: string;
  /** Link to the relevant page in the app */
  actionRoute?: string;
  dependsOn?: string[];   // IDs of tasks that must be completed first
  /** Maps to WORKFLOW_TASK_CATALOG task id (M1_*, M2_*, …) */
  workflowTaskId?: string;
  /** Maps to period-close-workflow.service.ts step id */
  periodCloseStepId?: string;
}

/** Canonical period-end tasks — populated for every period.
 *  Must stay in sync with buildSteps() in period-close-workflow.service.ts.
 */
export const PERIOD_END_TASKS: Omit<PeriodEndChecklistItem, 'status' | 'completedAt' | 'completedBy'>[] = [
  { id: 'p01', module: 'OPERATIONS',  required: true,  task: 'Post all approved invoices',       description: 'Ensure no approved invoices are unposted to GL',            actionRoute: '/sales/invoices', workflowTaskId: 'M1_POST_INVOICES' },
  { id: 'p02', module: 'OPERATIONS',  required: true,  task: 'Post all approved bills',          description: 'All vendor bills must be posted before close',              actionRoute: '/purchases/bills', workflowTaskId: 'M1_POST_BILLS' },
  { id: 'p03', module: 'OPERATIONS',  required: true,  task: 'Reconcile 3-way matches',          description: 'PO → GRN → Bill match must be approved or waived',          actionRoute: '/purchases/grn', workflowTaskId: 'M1_GRN_3WAY_MATCH' },
  { id: 'p04', module: 'PEOPLE',      required: true,  task: 'Approve payroll run',              description: 'Process and approve monthly payroll; post GL journal',       actionRoute: '/hr/payroll', workflowTaskId: 'M2_PAYROLL_APPROVED', periodCloseStepId: 'payroll-processed' },
  { id: 'p05', module: 'PEOPLE',      required: true,  task: 'Post IAS 19 accruals',             description: 'Gratuity obligation + leave liability accrual posted to GL',  actionRoute: '/ifrs/employee-benefits', workflowTaskId: 'M2_IAS19_ACCRUAL', periodCloseStepId: 'ias19-accrual' },
  { id: 'p06', module: 'ovds',     required: true,  task: 'Revalue FX items (IAS 21)',        description: 'Revalue open FCY AR/AP at NBE period-end closing rate',       actionRoute: '/banking/fx-rates', workflowTaskId: 'M3_FX_REVALUATION', periodCloseStepId: 'fx-revaluation' },
  { id: 'p07', module: 'ovds',     required: true,  task: 'Run depreciation (IAS 16)',        description: 'Post IFRS and Tax book depreciation for all active assets',   actionRoute: '/accounting/fixed-assets', workflowTaskId: 'M3_DEPRECIATION', periodCloseStepId: 'depreciation' },
  { id: 'p08', module: 'ovds',     required: true,  task: 'Reconcile bank statements',        description: 'All bank accounts reconciled to closing balance',            actionRoute: '/banking/reconciliation', workflowTaskId: 'M3_BANK_RECONCILIATION', periodCloseStepId: 'bank-reconciliation' },
  { id: 'p09', module: 'ovds',     required: false, task: 'Review ECL provision (IFRS 9)',    description: 'Update Stage 1/2/3 provision matrix for receivables',        actionRoute: '/ifrs/ecl-provision', workflowTaskId: 'M3_ECL_PROVISION', periodCloseStepId: 'ecl-provision' },
  { id: 'p10', module: 'COMPLIANCE',  required: true,  task: 'Generate VAT/TOT return',          description: 'Draft VAT return: output vs input reconciliation',           actionRoute: '/tax/filing', workflowTaskId: 'M4_VAT_RETURN', periodCloseStepId: 'vat-compliance' },
  { id: 'p11', module: 'COMPLIANCE',  required: true,  task: 'Submit WHT register',             description: 'Outgoing WHT certificates + incoming amounts',              actionRoute: '/tax/wht-certificates', workflowTaskId: 'M4_WHT_REGISTER' },
  { id: 'p12', module: 'COMPLIANCE',  required: true,  task: 'Run IAS 12 deferred tax',         description: 'Compute DTA/DTL from temporary differences',                actionRoute: '/ifrs/deferred-tax', workflowTaskId: 'M4_DEFERRED_TAX', periodCloseStepId: 'deferred-tax' },
  { id: 'p13', module: 'COMPLIANCE',  required: false, task: 'DRRF quarterly levy (Q-end)',      description: 'Calculate and remit DRRF levy to Ministry of Revenues (MoR)',           actionRoute: '/tax/filing', workflowTaskId: 'M4_DRRF_LEVY' },
  { id: 'p14', module: 'REPORTING',   required: true,  task: 'Generate trial balance',           description: 'Verify IFRS Book trial balance is balanced',                actionRoute: '/accounting', workflowTaskId: 'M5_TRIAL_BALANCE', periodCloseStepId: 'trial-balance' },
  { id: 'p15', module: 'REPORTING',   required: false, task: 'Generate financial statements',    description: 'Statement of Financial Position, SCI, Cash Flows, Equity',  actionRoute: '/reports/financial-statements', workflowTaskId: 'M5_FINANCIAL_STATEMENTS', periodCloseStepId: 'financial-statements' },
  { id: 'p16', module: 'REPORTING',   required: false, task: 'MoR IFRS Report & Submission Package', description: 'Bilingual IFRS financial statements + Schedule A (CIT/MAT) + HR payroll reconciliation ready for etax.mor.gov.et', actionRoute: '/reports/mor-report', workflowTaskId: 'M5_MOR_REPORT', periodCloseStepId: 'mor-report' },
];

// ---------------------------------------------------------------------------
// MODULE 5 — REPORTING: IFRS Statement Generation + Ethiopian Schedules
// ---------------------------------------------------------------------------

/**
 * VAT return draft — prepared from the GL and ready for MoR eTax submission.
 * Matches the ETaxVatSummary / ETaxTotSummary payload schemas.
 */
export interface VatReturnDraft {
  companyId: string;
  tin: string;
  period: string;
  calendarSystem: 'Gregorian' | 'Ethiopian';

  /** Standard taxable sales (15% VAT) */
  standardTaxableSales: number;
  outputVatCollected: number;

  /** Zero-rated sales (exports, basic goods) */
  zeroRatedSales: number;

  /** Exempt sales */
  exemptSales: number;

  /** Input VAT on purchases — claimable */
  eligibleInputVat: number;

  /** Net VAT payable: outputVat − inputVat */
  netVatPayable: number;

  /** TOT section (only if NOT VAT-registered) */
  tot?: {
    goodsSales: number;
    servicesSales: number;
    totOnGoods: number;
    totOnServices: number;
    totalTotPayable: number;
  };

  /** Outstanding WHT certificates to remit */
  whtSummary: {
    whtGoodsBase: number;
    whtGoodsAmount: number;
    whtServicesBase: number;
    whtServicesAmount: number;
    whtDividends: number;
    whtInterest: number;
    totalWhtToRemit: number;
  };

  dueDate: string;            // 30th of the following month
  status: 'DRAFT' | 'REVIEWED' | 'SUBMITTED' | 'PAID' | 'AMENDED';
  eTaxReceiptId?: string;
  submittedAt?: string;
  submittedByUserId?: string;
}

/**
 * Annual CIT computation summary — combines IAS 12 bridge + Schedule A output.
 * Used for the annual Business Income Tax return to the Ministry of Revenues (MoR).
 * Portal: etax.mor.gov.et — formerly submitted to ERCA.
 */
export interface AnnualCitReturn {
  companyId: string;
  tin: string;
  fiscalYear: number;
  taxpayerCategory: 'A' | 'B' | 'C';
  businessType: string;

  /** From IFRS Book income statement */
  accountingProfitBeforeTax: number;

  /** Schedule A add-backs: non-deductible per Proc. 979/2016 */
  addBacks: Array<{ description: string; amount: number; ref: string }>;
  totalAddBacks: number;

  /** Tax-exempt income deductions */
  deductions: Array<{ description: string; amount: number; ref: string }>;
  totalDeductions: number;

  /** IAS 12 timing differences */
  timingDifferences: number;

  taxableNetIncome: number;

  /** CIT: 30% for Category A bodies */
  regularCit: number;

  /** MAT: 2.5% of gross annual revenue (applies if > CIT) */
  matBase: number;
  matPayable: number;
  matApplies: boolean;

  finalTaxPayable: number;

  /** WHT credits from WHT certificates received from clients */
  whtCreditsApplied: number;

  /** Quarterly provisional tax already paid */
  provisionalPaid: number;

  balanceDue: number;
  dueDate: string;     // 4 months after EFY end (Proc. 1395/2025)

  /** IAS 12 disclosures */
  deferredTaxAssets: number;
  deferredTaxLiabilities: number;
  netDeferredTaxPosition: number;
  effectiveTaxRate: number;

  status: 'DRAFT' | 'REVIEWED' | 'SUBMITTED' | 'PAID';
  eTaxReceiptId?: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// MODULE 6 — ADMIN: Period Lock, Dual Calendar, RBAC Audit
// ---------------------------------------------------------------------------

/**
 * Accounting period configuration — supports both Gregorian and Ethiopian fiscal calendars.
 * Once locked, no backdating is permitted without admin override (creates audit log entry).
 */
export interface AccountingPeriod {
  id: string;
  companyId: string;
  period: string;              // YYYY-MM (Gregorian) or EFY year/period
  calendarType: 'GREGORIAN' | 'ETHIOPIAN';
  /** Ethiopian fiscal year: Hamle 1 (≈ Jul 8) to Sene 30 (≈ Jul 7) */
  efyStart?: string;
  efyEnd?: string;
  status: 'OPEN' | 'SOFT_CLOSED' | 'LOCKED';
  lockedAt?: string;
  lockedBy?: string;
  /** Admin override required to post into a locked period */
  unlockToken?: string;
  /** Statutory filing deadlines for this period */
  vatDueDate: string;          // 30th of following month
  whtDueDate: string;          // 30th of following month
  payeDueDate: string;         // 30th of following month
  annualBitDueDate?: string;   // 4 months after EFY end (annual periods only)
  drrfDueDate?: string;        // 15th of the month after quarter end
  notes?: string;
}

/**
 * Audit log entry for tax-sensitive operations.
 * Every manual override, rate change, or period unlock generates one of these.
 */
export interface TaxAuditLogEntry {
  id: string;
  companyId: string;
  userId: string;
  userRole: string;
  action: 'PERIOD_UNLOCK' | 'TAX_RATE_CHANGE' | 'MANUAL_JOURNAL' | 'PERIOD_CLOSE'
        | 'VAT_OVERRIDE' | 'WHT_FLAG_CHANGE' | 'ASSET_POOL_RECLASSIFY'
        | 'ECL_RATE_OVERRIDE' | 'DEFERRED_TAX_MANUAL' | 'PAYROLL_ADJUSTMENT'
        | 'CIT_COMPUTATION_OVERRIDE' | 'USER_ROLE_CHANGE' | 'API_KEY_ACCESS';
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
  ipAddress?: string;
  sessionId?: string;
  timestamp: string;
  /** AABE compliance: audit records must be retained 10 years */
  retentionYear: number;
}

// ---------------------------------------------------------------------------
// MODULE 7 — DEVELOPER: eTax Integration + API Lifecycle
// ---------------------------------------------------------------------------

/**
 * MoR eTax submission record — tracks every filing attempt with receipt IDs.
 */
export interface ETaxSubmissionRecord {
  id: string;
  companyId: string;
  tin: string;
  period: string;
  taxType: 'VAT' | 'TOT' | 'WHT' | 'PAYE' | 'CIT' | 'DRRF' | 'EXCISE';
  payloadHash: string;          // SHA-256 of the submitted payload
  auditLogRef: string;
  submittedAt: string;
  submittedByUserId: string;
  status: 'PENDING' | 'SUCCESS' | 'REJECTED' | 'AMENDED';
  receiptId?: string;
  paymentSlipUrl?: string;
  validationErrors?: string[];
  retryCount: number;
  lastRetryAt?: string;
  /** The full TaxpayerDeclaration JSON — stored for audit trail */
  payloadSnapshot?: string;
}

/**
 * Webhook event payload for downstream integrations.
 * Fired on every significant financial event.
 */
export interface WorkflowWebhookEvent {
  eventId: string;
  companyId: string;
  eventType: 'INVOICE_APPROVED' | 'PAYMENT_RECEIVED' | 'PAYROLL_PAID'
           | 'VAT_FILED' | 'WHT_FILED' | 'CIT_FILED' | 'PERIOD_LOCKED'
           | 'ASSET_DEPRECIATED' | 'ECL_PROVISION_POSTED' | 'JOURNAL_REVERSED'
           | 'ETAX_SUBMITTED' | 'ETAX_RECEIPT_RECEIVED';
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
  deliveredAt?: string;
}

// ---------------------------------------------------------------------------
// Business-Size-Specific Module Enablement
// ---------------------------------------------------------------------------

/**
 * Maps business size + type to the REQUIRED and OPTIONAL modules.
 * Used to hide/show UI pages and enforce RBAC at the module level.
 */
export interface BusinessModuleConfig {
  size: 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  type: string;
  requiredModules: WorkflowModuleKey[];
  optionalModules: WorkflowModuleKey[];
  ifrsStandard: 'IFRS_FULL' | 'IFRS_SME' | 'LOCAL_GAAP';
  taxObligationSummary: string;
}

export type WorkflowModuleKey =
  | 'core_operations' | 'invoice' | 'procurement' | 'inventory'
  | 'payroll' | 'hr' | 'employee_benefits'
  | 'accounting' | 'fixed_assets' | 'banking' | 'fx_rates' | 'ecl_provision'
  | 'tax_compliance' | 'vat' | 'tot' | 'wht' | 'cit' | 'drrf' | 'excise'
  | 'financial_statements' | 'reports' | 'budget'
  | 'rbac' | 'audit_logs' | 'period_close' | 'multi_company'
  | 'api_integration' | 'etax_portal' | 'webhooks';

/** Module configs by business size */
export const BUSINESS_MODULE_CONFIGS: BusinessModuleConfig[] = [
  {
    size: 'MICRO',
    type: 'SOLE_PROPRIETOR',
    requiredModules: ['core_operations', 'invoice', 'accounting', 'tax_compliance', 'reports'],
    optionalModules: ['banking', 'budget'],
    ifrsStandard: 'LOCAL_GAAP',
    taxObligationSummary: 'TOT (2%/10%) only — below VAT threshold. Annual BIT Schedule A.',
  },
  {
    size: 'SMALL',
    type: 'PLC',
    requiredModules: ['core_operations', 'invoice', 'procurement', 'payroll', 'hr',
                      'accounting', 'banking', 'tax_compliance', 'vat', 'wht', 'reports', 'period_close'],
    optionalModules: ['inventory', 'fixed_assets', 'fx_rates', 'budget', 'ecl_provision'],
    ifrsStandard: 'IFRS_SME',
    taxObligationSummary: 'VAT 15% (if ≥ ETB 2M). WHT on suppliers. PAYE + Pension. Annual CIT 30%.',
  },
  {
    size: 'MEDIUM',
    type: 'PLC',
    requiredModules: ['core_operations', 'invoice', 'procurement', 'inventory', 'payroll',
                      'hr', 'employee_benefits', 'accounting', 'fixed_assets', 'banking',
                      'fx_rates', 'ecl_provision', 'tax_compliance', 'vat', 'wht', 'cit',
                      'drrf', 'financial_statements', 'reports', 'budget', 'rbac',
                      'audit_logs', 'period_close'],
    optionalModules: ['excise', 'multi_company', 'api_integration', 'etax_portal'],
    ifrsStandard: 'IFRS_SME',
    taxObligationSummary: 'Full VAT/WHT/PAYE/CIT/DRRF. IAS 19 accruals. IAS 12 deferred tax. MAT 2.5%.',
  },
  {
    size: 'LARGE',
    type: 'SC',
    requiredModules: ['core_operations', 'invoice', 'procurement', 'inventory', 'payroll',
                      'hr', 'employee_benefits', 'accounting', 'fixed_assets', 'banking',
                      'fx_rates', 'ecl_provision', 'tax_compliance', 'vat', 'wht', 'cit',
                      'drrf', 'excise', 'financial_statements', 'reports', 'budget',
                      'rbac', 'audit_logs', 'period_close', 'multi_company',
                      'api_integration', 'etax_portal', 'webhooks'],
    optionalModules: [],
    ifrsStandard: 'IFRS_FULL',
    taxObligationSummary: 'Full IFRS reporting. All tax types. MAT 2.5%. CGT. Schedule D. AABE compliance.',
  },
  {
    size: 'ENTERPRISE',
    type: 'FINANCIAL_INSTITUTION',
    requiredModules: ['core_operations', 'invoice', 'procurement', 'inventory', 'payroll',
                      'hr', 'employee_benefits', 'accounting', 'fixed_assets', 'banking',
                      'fx_rates', 'ecl_provision', 'tax_compliance', 'vat', 'wht', 'cit',
                      'drrf', 'excise', 'financial_statements', 'reports', 'budget',
                      'rbac', 'audit_logs', 'period_close', 'multi_company',
                      'api_integration', 'etax_portal', 'webhooks'],
    optionalModules: [],
    ifrsStandard: 'IFRS_FULL',
    taxObligationSummary: 'Full IFRS 9 credit loss. NBE reporting. All Ethiopian tax types. AABE Tier 1.',
  },
];

/** Get the module config for a given business size */
export function getBusinessModuleConfig(size: BusinessModuleConfig['size']): BusinessModuleConfig {
  return BUSINESS_MODULE_CONFIGS.find(c => c.size === size) ?? BUSINESS_MODULE_CONFIGS[1];
}

/** Check if a specific module is required for a business size */
export function isModuleRequired(size: BusinessModuleConfig['size'], module: WorkflowModuleKey): boolean {
  const config = getBusinessModuleConfig(size);
  return config.requiredModules.includes(module);
}
