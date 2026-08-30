/**
 * General Ledger & Journal Entry Types
 * Dual-book architecture: IFRS Book (IAS 1/2/9/12/15/16/19) + Tax Book (Proclamation No. 1395/2025)
 *
 * Design principles:
 *  - Every transaction posts to BOTH books simultaneously via parallel ledger entries
 *  - Tax Book enforces Ethiopian tax pool depreciation (Art. 25) and specific provision limits
 *  - IFRS Book applies ECL, component depreciation, and IFRS 15 revenue recognition
 *  - IAS 12 reconciles temporary differences between the two books at year-end
 */

// ---------------------------------------------------------------------------
// Book Type — which ledger the entry belongs to
// ---------------------------------------------------------------------------

export type LedgerBook = 'IFRS' | 'TAX';

// ---------------------------------------------------------------------------
// Account Types (Ethiopian AABE Chart of Accounts + IFRS classification)
// ---------------------------------------------------------------------------

export type GLAccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'INCOME'
  | 'EXPENSE'
  | 'COST_OF_GOODS_SOLD'
  | 'CONTRA_ASSET';

export type AccountSubType =
  // Assets
  | 'CASH'
  | 'BANK'
  | 'ACCOUNTS_RECEIVABLE'
  | 'INVENTORY'
  | 'PREPAID_EXPENSE'
  | 'FIXED_ASSET'
  | 'ACCUMULATED_DEPRECIATION'
  | 'RIGHT_OF_USE_ASSET'
  | 'INTANGIBLE_ASSET'
  | 'DEFERRED_TAX_ASSET'
  | 'INVESTMENT'
  | 'OTHER_ASSET'
  // Liabilities
  | 'ACCOUNTS_PAYABLE'
  | 'ACCRUED_EXPENSE'
  | 'VAT_PAYABLE'
  | 'TOT_PAYABLE'
  | 'WHT_PAYABLE'
  | 'INCOME_TAX_PAYABLE'
  | 'DRRF_PAYABLE'
  | 'PENSION_PAYABLE'
  | 'SALARY_PAYABLE'
  | 'LEASE_LIABILITY'
  | 'LOAN_PAYABLE'
  | 'DEFERRED_TAX_LIABILITY'
  | 'OTHER_LIABILITY'
  // Equity
  | 'SHARE_CAPITAL'
  | 'RETAINED_EARNINGS'
  | 'CURRENT_YEAR_PROFIT'
  | 'REVALUATION_RESERVE'
  | 'OTHER_EQUITY'
  // Income (IFRS 18 categories)
  | 'REVENUE_OPERATING'
  | 'OTHER_INCOME_OPERATING'
  | 'INTEREST_INCOME_INVESTING'
  | 'DIVIDEND_INCOME_INVESTING'
  | 'GAIN_ON_DISPOSAL_INVESTING'
  | 'FX_GAIN_FINANCING'
  // Expenses
  | 'COST_OF_SALES'
  | 'SELLING_EXPENSE'
  | 'ADMIN_EXPENSE'
  | 'DEPRECIATION_EXPENSE'
  | 'AMORTISATION_EXPENSE'
  | 'PENSION_EXPENSE'
  | 'DRRF_EXPENSE'
  | 'ECL_PROVISION_EXPENSE'
  | 'INTEREST_EXPENSE_FINANCING'
  | 'FX_LOSS_FINANCING'
  | 'INCOME_TAX_EXPENSE'
  | 'DEFERRED_TAX_EXPENSE'
  | 'OTHER_EXPENSE';

// ---------------------------------------------------------------------------
// Journal Entry Line — single debit or credit leg
// ---------------------------------------------------------------------------

export interface GLJournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: GLAccountType;
  /** Book this line is posted to */
  book: LedgerBook;
  debit: number;
  credit: number;
  /** IFRS 18 P&L category classification */
  ifrs18Category?: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'INCOME_TAX' | 'DISCONTINUED';
  /** Tax reference: VAT, WHT, PIT, etc. */
  taxReference?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Journal Entry — the parent posting document
// ---------------------------------------------------------------------------

export type JournalEntrySource =
  | 'INVOICE'
  | 'BILL'
  | 'PAYMENT'
  | 'PAYROLL'
  | 'DEPRECIATION'
  | 'ACCRUAL'
  | 'ADJUSTMENT'
  | 'OPENING_BALANCE'
  | 'PERIOD_CLOSE'
  | 'VAT_RECONCILIATION'
  | 'DEFERRED_TAX'
  | 'ECL_PROVISION'
  | 'ASSET_DISPOSAL'
  | 'REVALUATION'
  | 'MANUAL';

export interface GLJournalEntry {
  id: string;
  companyId: string;
  reference: string;            // e.g. JE-2026-001234
  date: string;                 // ISO YYYY-MM-DD
  period: string;               // YYYY-MM (locked after period close)
  fiscalYear: string;           // EFY or Gregorian
  description: string;
  source: JournalEntrySource;
  sourceId?: string;            // FK to invoice/bill/payroll run etc.
  lines: GLJournalLine[];
  /** Total debit == total credit (double-entry enforced) */
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  postedBy: string;
  approvedBy?: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'LOCKED';
  reverseOf?: string;           // FK to original entry if this is a reversal
  /** True when the system auto-generated this entry (invoice post, payroll run, etc.) */
  isAutomatic: boolean;
  /** Audit: cannot be modified once period is locked */
  periodLocked: boolean;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// GL Account — Chart of Accounts entry
// ---------------------------------------------------------------------------

export interface GLAccount {
  id: string;
  companyId: string;
  code: string;                 // e.g. "1101"
  name: string;                 // e.g. "Cash at Bank — CBE"
  type: GLAccountType;
  subType: AccountSubType;
  /** Parent account code for hierarchy (e.g. "11" → "1101") */
  parentCode?: string;
  /** AABE standard account code reference */
  aabeRef?: string;
  description?: string;
  isActive: boolean;
  isBankAccount: boolean;
  taxCode?: string;             // For VAT / WHT mapping
  currency: string;             // Defaults to ETB
  openingBalance: number;
  currentBalance: number;
  /** Whether this account appears in IFRS financial statements */
  ifrsStatement: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW' | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Ledger Entry — the queryable, aggregated view of a journal line
// ---------------------------------------------------------------------------

export interface LedgerEntry {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  date: string;
  period: string;
  journalRef: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  source: JournalEntrySource;
  book: LedgerBook;
  postedBy: string;
  status: 'POSTED' | 'REVERSED' | 'LOCKED';
}

// ---------------------------------------------------------------------------
// Trial Balance
// ---------------------------------------------------------------------------

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: GLAccountType;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  book: LedgerBook;
}

export interface TrialBalance {
  companyId: string;
  period: string;
  asOf: string;
  book: LedgerBook;
  lines: TrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// IAS 15 Performance Obligation — Revenue Recognition flag on line items
// ---------------------------------------------------------------------------

export type PerformanceObligationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SATISFIED'
  | 'PARTIALLY_SATISFIED';

export interface PerformanceObligation {
  id: string;
  invoiceId: string;
  lineItemId: string;
  description: string;
  transactionPrice: number;
  recognisedAmount: number;
  deferredAmount: number;
  status: PerformanceObligationStatus;
  satisfactionDate?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// IAS 2 — Inventory Valuation (parallel IFRS vs Tax book)
// ---------------------------------------------------------------------------

export type InventoryValuationMethod = 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_ID';

export interface InventoryValuationLine {
  itemId: string;
  description: string;
  quantity: number;
  /** IFRS book: lower of cost or NRV (IAS 2.9) */
  ifrsCarryingValue: number;
  ifrsNrv: number;
  ifrsAdjustmentToNrv: number;
  /** Tax book: actual acquisition cost */
  taxBookCost: number;
  temporaryDifference: number;
  valuationMethod: InventoryValuationMethod;
}

// ---------------------------------------------------------------------------
// IAS 16 / Ethiopian Tax — Dual Depreciation
//
// Two parallel depreciation schedules per asset:
//   IFRS Book:  component-based straight-line or revaluation model (IAS 16)
//   Tax Book:   pool-based declining balance (Art. 25, Proclamation 979/2016)
// ---------------------------------------------------------------------------

export type TaxDepreciationCategory =
  | 'CAT_1'   // 25% — Computers, software, data/information systems
  | 'CAT_2'   // 20% — Motor vehicles, trucks, tractors, trailers
  | 'CAT_3'   // 15% — Buildings, plant, machinery, fixtures, all other assets
  | 'CAT_4';  // 10% — Intangible assets (excluding Cat 1 software)

export const TAX_DEPRECIATION_RATES: Record<TaxDepreciationCategory, number> = {
  CAT_1: 0.25,
  CAT_2: 0.20,
  CAT_3: 0.15,
  CAT_4: 0.10,
};

export const TAX_DEPRECIATION_CATEGORY_LABELS: Record<TaxDepreciationCategory, string> = {
  CAT_1: 'Category 1 (25%) — Computers, Software, Data Systems',
  CAT_2: 'Category 2 (20%) — Motor Vehicles, Trucks, Tractors',
  CAT_3: 'Category 3 (15%) — Buildings, Plant, Machinery, Fixtures',
  CAT_4: 'Category 4 (10%) — Intangible Assets',
};

export interface DualDepreciationLine {
  assetId: string;
  assetName: string;
  category: string;             // User-defined e.g. "COMPUTER", "VEHICLE"
  taxCategory: TaxDepreciationCategory;
  purchaseCost: number;
  purchaseDate: string;

  // --- IFRS Book (IAS 16) ---
  ifrsUsefulLifeYears: number;
  ifrsSalvageValue: number;
  ifrsDepreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
  ifrsAnnualDepreciation: number;
  ifrsAccumulatedDepreciation: number;
  ifrsNetBookValue: number;
  /** Revalued amount if using revaluation model (IAS 16.31) */
  ifrsRevaluedAmount?: number;

  // --- Tax Book (Art. 25) ---
  taxPoolOpeningBalance: number;
  taxDepreciationRate: number;  // from TAX_DEPRECIATION_RATES
  taxAnnualDepreciation: number;
  taxPoolClosingBalance: number;

  // --- Reconciliation ---
  /** IAS 12 temporary difference = IFRS carrying amount − Tax base */
  temporaryDifference: number;
  /** Deferred tax liability (positive diff) or asset (negative diff) */
  deferredTaxAmount: number;   // temporaryDifference × 30%
  deferredTaxType: 'DTL' | 'DTA' | 'NONE';
}

export interface DualDepreciationSchedule {
  companyId: string;
  fiscalYear: string;
  asOf: string;
  lines: DualDepreciationLine[];
  /** Totals */
  totalIfrsDepreciation: number;
  totalTaxDepreciation: number;
  totalTemporaryDifference: number;
  totalDeferredTax: number;
  netDeferredTaxPosition: 'NET_DTA' | 'NET_DTL' | 'ZERO';
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// IAS 19 — Employee Benefits
// ---------------------------------------------------------------------------

export interface LeaveAccrualLine {
  employeeId: string;
  employeeName: string;
  basicMonthlySalary: number;
  dailyRate: number;            // basicMonthlySalary / 30
  remainingLeaveDays: number;
  /** IAS 19: accrued benefit liability = remaining days × daily rate */
  accruedBenefitLiability: number;
  /** Journal: DR Employee Benefits Expense / CR Accrued Leave Liability */
  journalPosted: boolean;
  period: string;
}

export interface SeveranceAccrual {
  employeeId: string;
  employeeName: string;
  startDate: string;
  yearsOfService: number;
  basicMonthlySalary: number;
  /** Ethiopian Labour Proclamation No. 1156/2019: 1 month per year */
  estimatedSeveranceLiability: number;
  journalPosted: boolean;
  period: string;
}

export interface EmployeeBenefitSummary {
  companyId: string;
  period: string;
  leaveAccruals: LeaveAccrualLine[];
  severanceAccruals: SeveranceAccrual[];
  totalLeaveAccrualLiability: number;
  totalSeveranceLiability: number;
  totalIas19Liability: number;
  pensionEmployeeContribution: number;  // 7% of insurable earnings
  pensionEmployerContribution: number;  // 11% of insurable earnings
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// IAS 12 — Deferred Tax Reconciliation Bridge
//
// Reconciles IFRS accounting profit to taxable profit:
//   Accounting Profit (IFRS Book)
//   + Permanent Adjustments (non-deductible / non-taxable items)
//   ± Temporary Differences → Deferred Tax Assets / Liabilities
//   = Taxable Net Income
//   × 30% = Corporate Income Tax
// ---------------------------------------------------------------------------

export type PermanentAdjustmentType =
  | 'REPRESENTATION_EXPENSE'     // Entertainment exceeding 1% of gross income
  | 'DONATION_EXCESS'            // Donations > 10% of taxable income
  | 'NON_VAT_COMPLIANT_SPEND'    // Expenses without valid VAT receipt
  | 'FINES_AND_PENALTIES'        // Non-deductible (all fines & penalties)
  | 'PERSONAL_EXPENSE'           // Personal costs charged through business
  | 'DEPRECIATION_TIMING'        // IFRS depr. > Tax pool depr. (timing add-back)
  | 'ECL_PROVISION'              // General ECL provision (not tax-deductible)
  | 'LEAVE_ACCRUAL'              // IAS 19 leave accrual (not deductible until paid)
  | 'TAX_EXEMPT_INCOME'          // Non-taxable income to be deducted
  | 'ACCELERATED_TAX_DEPR'       // Tax pool depr. > IFRS depr. (deductible)
  | 'OTHER_PERMANENT'
  | 'OTHER_TEMPORARY';

export interface TaxReconciliationItem {
  type: PermanentAdjustmentType;
  description: string;
  amount: number;
  /** Positive = increases taxable profit; Negative = decreases taxable profit */
  adjustment: number;
  isPermanent: boolean;         // true = permanent, false = temporary (IAS 12)
  deferredTaxImpact: number;    // temporary only: adjustment × 30%
  deferredTaxType: 'DTA' | 'DTL' | 'N/A';
  proclamationRef?: string;
  ifrsRef?: string;
}

export interface IAS12ReconciliationBridge {
  companyId: string;
  fiscalYear: string;
  period: string;

  // Step 1: IFRS Accounting Profit
  accountingProfitBeforeTax: number;

  // Step 2: Permanent Adjustments
  permanentAdjustments: TaxReconciliationItem[];
  totalPermanentAddBacks: number;
  totalPermanentDeductions: number;

  // Step 3: Temporary Differences (IAS 12)
  temporaryDifferences: TaxReconciliationItem[];
  totalTemporaryDifferences: number;

  // Step 4: Taxable Income
  taxableNetIncome: number;
  citRate: number;              // 30% flat (Proc. 979/2016)

  // Step 5: Tax
  corporateIncomeTax: number;   // taxableNetIncome × 30%
  matTax: number;               // 2.5% of gross turnover (if higher)
  matApplies: boolean;
  finalTaxPayable: number;      // max(CIT, MAT)

  // Step 6: Deferred Tax Position (IAS 12)
  totalDta: number;
  totalDtl: number;
  netDeferredTaxMovement: number;
  totalIncomeTaxExpense: number; // currentTax + deferred movement (IAS 12.46)

  // Disclosures (IAS 12.79/12.81)
  effectiveTaxRate: number;
  theoreticalTaxCharge: number; // accountingProfit × 30%
  permanentDifferenceImpact: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// IFRS 9 — Expected Credit Loss (ECL) Provision Matrix
// ---------------------------------------------------------------------------

export type EclStage = 'STAGE_1' | 'STAGE_2' | 'STAGE_3';

export interface EclProvisionLine {
  agingBucket: string;          // e.g. "0–30 days", "31–60 days", "> 90 days"
  daysOverdue: number;
  outstandingBalance: number;
  eclStage: EclStage;
  probabilityOfDefault: number; // % — forward-looking
  lossGivenDefault: number;     // % — recovery assumption
  exposureAtDefault: number;    // = outstanding balance (simplified)
  eclProvision: number;         // balance × PD × LGD
  /** Tax book: general provisions are NOT tax-deductible */
  taxDeductible: boolean;
  /** Only deductible if debtor bankrupt / deceased / legally exhausted */
  specificProvisionReason?: string;
}

export interface EclProvisionMatrix {
  companyId: string;
  asOf: string;
  period: string;
  lines: EclProvisionLine[];
  totalOutstanding: number;
  totalEclProvision: number;
  taxDeductibleProvision: number;
  nonDeductibleProvision: number;
  /** IAS 12 temporary difference = non-deductible provision */
  ias12TemporaryDifference: number;
  deferredTaxAsset: number;     // nonDeductible × 30%
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// IFRS 15 — Revenue Recognition per Performance Obligation
// ---------------------------------------------------------------------------

export interface RevenueRecognitionLine {
  contractId: string;
  customerId: string;
  performanceObligationId: string;
  description: string;
  totalContractValue: number;
  transactionPriceAllocated: number;
  recognisedToDate: number;
  deferredRevenue: number;
  completionPercentage: number;
  recognitionBasis: 'POINT_IN_TIME' | 'OVER_TIME';
  satisfactionDate?: string;
  /** Ethiopian tax: cash or accrual milestone for VAT/TOT computation */
  vatTriggerPoint: 'INVOICE_DATE' | 'CASH_RECEIPT' | 'DELIVERY';
}

// ---------------------------------------------------------------------------
// Barrel exports (re-exported via ovds/index.ts → @ovds/shared)
// ---------------------------------------------------------------------------
// All types above are exported as named declarations — no re-export block needed.

