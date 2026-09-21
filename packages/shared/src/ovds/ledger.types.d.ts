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
export type LedgerBook = 'IFRS' | 'TAX';
export type GLAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE' | 'COST_OF_GOODS_SOLD' | 'CONTRA_ASSET';
export type AccountSubType = 'CASH' | 'BANK' | 'ACCOUNTS_RECEIVABLE' | 'INVENTORY' | 'PREPAID_EXPENSE' | 'FIXED_ASSET' | 'ACCUMULATED_DEPRECIATION' | 'RIGHT_OF_USE_ASSET' | 'INTANGIBLE_ASSET' | 'DEFERRED_TAX_ASSET' | 'INVESTMENT' | 'OTHER_ASSET' | 'ACCOUNTS_PAYABLE' | 'ACCRUED_EXPENSE' | 'VAT_PAYABLE' | 'TOT_PAYABLE' | 'WHT_PAYABLE' | 'INCOME_TAX_PAYABLE' | 'DRRF_PAYABLE' | 'PENSION_PAYABLE' | 'SALARY_PAYABLE' | 'LEASE_LIABILITY' | 'LOAN_PAYABLE' | 'DEFERRED_TAX_LIABILITY' | 'OTHER_LIABILITY' | 'SHARE_CAPITAL' | 'RETAINED_EARNINGS' | 'CURRENT_YEAR_PROFIT' | 'REVALUATION_RESERVE' | 'OTHER_EQUITY' | 'REVENUE_OPERATING' | 'OTHER_INCOME_OPERATING' | 'INTEREST_INCOME_INVESTING' | 'DIVIDEND_INCOME_INVESTING' | 'GAIN_ON_DISPOSAL_INVESTING' | 'FX_GAIN_FINANCING' | 'COST_OF_SALES' | 'SELLING_EXPENSE' | 'ADMIN_EXPENSE' | 'DEPRECIATION_EXPENSE' | 'AMORTISATION_EXPENSE' | 'PENSION_EXPENSE' | 'DRRF_EXPENSE' | 'ECL_PROVISION_EXPENSE' | 'INTEREST_EXPENSE_FINANCING' | 'FX_LOSS_FINANCING' | 'INCOME_TAX_EXPENSE' | 'DEFERRED_TAX_EXPENSE' | 'OTHER_EXPENSE';
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
export type JournalEntrySource = 'INVOICE' | 'BILL' | 'PAYMENT' | 'PAYROLL' | 'DEPRECIATION' | 'ACCRUAL' | 'ADJUSTMENT' | 'OPENING_BALANCE' | 'PERIOD_CLOSE' | 'VAT_RECONCILIATION' | 'DEFERRED_TAX' | 'ECL_PROVISION' | 'ASSET_DISPOSAL' | 'REVALUATION' | 'MANUAL';
export interface GLJournalEntry {
    id: string;
    companyId: string;
    reference: string;
    date: string;
    period: string;
    fiscalYear: string;
    description: string;
    source: JournalEntrySource;
    sourceId?: string;
    lines: GLJournalLine[];
    /** Total debit == total credit (double-entry enforced) */
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    postedBy: string;
    approvedBy?: string;
    status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'LOCKED';
    reverseOf?: string;
    /** True when the system auto-generated this entry (invoice post, payroll run, etc.) */
    isAutomatic: boolean;
    /** Audit: cannot be modified once period is locked */
    periodLocked: boolean;
    notes?: string;
    attachments?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface GLAccount {
    id: string;
    companyId: string;
    code: string;
    name: string;
    type: GLAccountType;
    subType: AccountSubType;
    /** Parent account code for hierarchy (e.g. "11" → "1101") */
    parentCode?: string;
    /** AABE standard account code reference */
    aabeRef?: string;
    description?: string;
    isActive: boolean;
    isBankAccount: boolean;
    taxCode?: string;
    currency: string;
    openingBalance: number;
    currentBalance: number;
    /** Whether this account appears in IFRS financial statements */
    ifrsStatement: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW' | null;
    createdAt: string;
}
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
export type PerformanceObligationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SATISFIED' | 'PARTIALLY_SATISFIED';
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
export type TaxDepreciationCategory = 'CAT_1' | 'CAT_2' | 'CAT_3' | 'CAT_4';
export declare const TAX_DEPRECIATION_RATES: Record<TaxDepreciationCategory, number>;
export declare const TAX_DEPRECIATION_CATEGORY_LABELS: Record<TaxDepreciationCategory, string>;
export interface DualDepreciationLine {
    assetId: string;
    assetName: string;
    category: string;
    taxCategory: TaxDepreciationCategory;
    purchaseCost: number;
    purchaseDate: string;
    ifrsUsefulLifeYears: number;
    ifrsSalvageValue: number;
    ifrsDepreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
    ifrsAnnualDepreciation: number;
    ifrsAccumulatedDepreciation: number;
    ifrsNetBookValue: number;
    /** Revalued amount if using revaluation model (IAS 16.31) */
    ifrsRevaluedAmount?: number;
    taxPoolOpeningBalance: number;
    taxDepreciationRate: number;
    taxAnnualDepreciation: number;
    taxPoolClosingBalance: number;
    /** IAS 12 temporary difference = IFRS carrying amount − Tax base */
    temporaryDifference: number;
    /** Deferred tax liability (positive diff) or asset (negative diff) */
    deferredTaxAmount: number;
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
export interface LeaveAccrualLine {
    employeeId: string;
    employeeName: string;
    basicMonthlySalary: number;
    dailyRate: number;
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
    pensionEmployeeContribution: number;
    pensionEmployerContribution: number;
    generatedAt: string;
}
export type PermanentAdjustmentType = 'REPRESENTATION_EXPENSE' | 'DONATION_EXCESS' | 'NON_VAT_COMPLIANT_SPEND' | 'FINES_AND_PENALTIES' | 'PERSONAL_EXPENSE' | 'DEPRECIATION_TIMING' | 'ECL_PROVISION' | 'LEAVE_ACCRUAL' | 'TAX_EXEMPT_INCOME' | 'ACCELERATED_TAX_DEPR' | 'OTHER_PERMANENT' | 'OTHER_TEMPORARY';
export interface TaxReconciliationItem {
    type: PermanentAdjustmentType;
    description: string;
    amount: number;
    /** Positive = increases taxable profit; Negative = decreases taxable profit */
    adjustment: number;
    isPermanent: boolean;
    deferredTaxImpact: number;
    deferredTaxType: 'DTA' | 'DTL' | 'N/A';
    proclamationRef?: string;
    ifrsRef?: string;
}
export interface IAS12ReconciliationBridge {
    companyId: string;
    fiscalYear: string;
    period: string;
    accountingProfitBeforeTax: number;
    permanentAdjustments: TaxReconciliationItem[];
    totalPermanentAddBacks: number;
    totalPermanentDeductions: number;
    temporaryDifferences: TaxReconciliationItem[];
    totalTemporaryDifferences: number;
    taxableNetIncome: number;
    citRate: number;
    corporateIncomeTax: number;
    matTax: number;
    matApplies: boolean;
    finalTaxPayable: number;
    totalDta: number;
    totalDtl: number;
    netDeferredTaxMovement: number;
    totalIncomeTaxExpense: number;
    effectiveTaxRate: number;
    theoreticalTaxCharge: number;
    permanentDifferenceImpact: number;
    generatedAt: string;
}
export type EclStage = 'STAGE_1' | 'STAGE_2' | 'STAGE_3';
export interface EclProvisionLine {
    agingBucket: string;
    daysOverdue: number;
    outstandingBalance: number;
    eclStage: EclStage;
    probabilityOfDefault: number;
    lossGivenDefault: number;
    exposureAtDefault: number;
    eclProvision: number;
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
    deferredTaxAsset: number;
    generatedAt: string;
}
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
//# sourceMappingURL=ledger.types.d.ts.map