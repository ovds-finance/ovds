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
/**
 * Canonical GL posting template for each transaction type.
 * When a document is approved, the engine iterates these rules and creates
 * journal lines in both IFRS Book and Tax Book simultaneously.
 */
export interface GlPostingRule {
    trigger: 'INVOICE_APPROVED' | 'PAYMENT_RECEIVED' | 'BILL_APPROVED' | 'PAYMENT_MADE' | 'GRN_CONFIRMED' | 'PAYROLL_APPROVED' | 'DEPRECIATION_RUN' | 'PERIOD_CLOSE' | 'VAT_RECONCILIATION' | 'ECL_PROVISION' | 'ASSET_DISPOSAL' | 'IAS19_ACCRUAL' | 'MANUAL';
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
export declare const GL_POSTING_TEMPLATES: GlPostingRule[];
/**
 * Full payroll computation result for one employee for one period.
 * Implements Proclamation No. 1395/2025 PIT brackets + IAS 19 benefit accruals.
 */
export interface PayrollComputationResult {
    employeeId: string;
    employeeName: string;
    period: string;
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
        leaveAccrualLiability: number;
        gratuityAccrual: number;
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
    filingDeadline: string;
}
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
    taxPoolRate: number;
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
        deferredTaxAmount: number;
    };
    /** CGT on disposal: gain × 15% (Schedule D, Proc. 1395/2025 Art. 59) */
    disposal?: {
        proceeds: number;
        carryingValueAtDisposal: number;
        gainLoss: number;
        cgtRate: number;
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
    nbeRateUsed: number;
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
    dependsOn?: string[];
    /** Maps to WORKFLOW_TASK_CATALOG task id (M1_*, M2_*, …) */
    workflowTaskId?: string;
    /** Maps to period-close-workflow.service.ts step id */
    periodCloseStepId?: string;
}
/** Canonical period-end tasks — populated for every period.
 *  Must stay in sync with buildSteps() in period-close-workflow.service.ts.
 */
export declare const PERIOD_END_TASKS: Omit<PeriodEndChecklistItem, 'status' | 'completedAt' | 'completedBy'>[];
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
    dueDate: string;
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
    addBacks: Array<{
        description: string;
        amount: number;
        ref: string;
    }>;
    totalAddBacks: number;
    /** Tax-exempt income deductions */
    deductions: Array<{
        description: string;
        amount: number;
        ref: string;
    }>;
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
    dueDate: string;
    /** IAS 12 disclosures */
    deferredTaxAssets: number;
    deferredTaxLiabilities: number;
    netDeferredTaxPosition: number;
    effectiveTaxRate: number;
    status: 'DRAFT' | 'REVIEWED' | 'SUBMITTED' | 'PAID';
    eTaxReceiptId?: string;
    generatedAt: string;
}
/**
 * Accounting period configuration — supports both Gregorian and Ethiopian fiscal calendars.
 * Once locked, no backdating is permitted without admin override (creates audit log entry).
 */
export interface AccountingPeriod {
    id: string;
    companyId: string;
    period: string;
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
    vatDueDate: string;
    whtDueDate: string;
    payeDueDate: string;
    annualBitDueDate?: string;
    drrfDueDate?: string;
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
    action: 'PERIOD_UNLOCK' | 'TAX_RATE_CHANGE' | 'MANUAL_JOURNAL' | 'PERIOD_CLOSE' | 'VAT_OVERRIDE' | 'WHT_FLAG_CHANGE' | 'ASSET_POOL_RECLASSIFY' | 'ECL_RATE_OVERRIDE' | 'DEFERRED_TAX_MANUAL' | 'PAYROLL_ADJUSTMENT' | 'CIT_COMPUTATION_OVERRIDE' | 'USER_ROLE_CHANGE' | 'API_KEY_ACCESS';
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
/**
 * MoR eTax submission record — tracks every filing attempt with receipt IDs.
 */
export interface ETaxSubmissionRecord {
    id: string;
    companyId: string;
    tin: string;
    period: string;
    taxType: 'VAT' | 'TOT' | 'WHT' | 'PAYE' | 'CIT' | 'DRRF' | 'EXCISE';
    payloadHash: string;
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
    eventType: 'INVOICE_APPROVED' | 'PAYMENT_RECEIVED' | 'PAYROLL_PAID' | 'VAT_FILED' | 'WHT_FILED' | 'CIT_FILED' | 'PERIOD_LOCKED' | 'ASSET_DEPRECIATED' | 'ECL_PROVISION_POSTED' | 'JOURNAL_REVERSED' | 'ETAX_SUBMITTED' | 'ETAX_RECEIPT_RECEIVED';
    payload: Record<string, unknown>;
    timestamp: string;
    retryCount: number;
    deliveredAt?: string;
}
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
export type WorkflowModuleKey = 'core_operations' | 'invoice' | 'procurement' | 'inventory' | 'payroll' | 'hr' | 'employee_benefits' | 'accounting' | 'fixed_assets' | 'banking' | 'fx_rates' | 'ecl_provision' | 'tax_compliance' | 'vat' | 'tot' | 'wht' | 'cit' | 'drrf' | 'excise' | 'financial_statements' | 'reports' | 'budget' | 'rbac' | 'audit_logs' | 'period_close' | 'multi_company' | 'api_integration' | 'etax_portal' | 'webhooks';
/** Module configs by business size */
export declare const BUSINESS_MODULE_CONFIGS: BusinessModuleConfig[];
/** Get the module config for a given business size */
export declare function getBusinessModuleConfig(size: BusinessModuleConfig['size']): BusinessModuleConfig;
/** Check if a specific module is required for a business size */
export declare function isModuleRequired(size: BusinessModuleConfig['size'], module: WorkflowModuleKey): boolean;
//# sourceMappingURL=workflow-engine.types.d.ts.map