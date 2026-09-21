/**
 * IFRS Financial Statement Types — @ovds/shared
 *
 * Complete type contracts for the four primary IFRS statements:
 *   1. Statement of Financial Position (IAS 1)
 *   2. Statement of Comprehensive Income (IAS 1 / IFRS 18)
 *   3. Statement of Cash Flows (IAS 7)
 *   4. Statement of Changes in Equity (IAS 1)
 *
 * Plus Schedule A (Ethiopian CIT computation) and related disclosures.
 * All amounts in ETB unless otherwise stated.
 */
export interface SfpLineItem {
    code: string;
    label: string;
    currentPeriod: number;
    priorPeriod: number;
    isCurrent: boolean;
    ifrsRef?: string;
    notes?: string;
}
export interface StatementOfFinancialPosition {
    companyId: string;
    period: string;
    priorPeriod: string;
    currency: string;
    currentAssets: {
        cash: SfpLineItem;
        tradeReceivables: SfpLineItem;
        inventories: SfpLineItem;
        prepaidExpenses: SfpLineItem;
        otherCurrentAssets: SfpLineItem;
        totalCurrentAssets: number;
    };
    nonCurrentAssets: {
        propertyPlantEquipment: SfpLineItem;
        rightOfUseAssets: SfpLineItem;
        intangibleAssets: SfpLineItem;
        investments: SfpLineItem;
        deferredTaxAssets: SfpLineItem;
        otherNonCurrentAssets: SfpLineItem;
        totalNonCurrentAssets: number;
    };
    totalAssets: number;
    currentLiabilities: {
        tradePayables: SfpLineItem;
        vatPayable: SfpLineItem;
        whtPayable: SfpLineItem;
        pensionPayable: SfpLineItem;
        incomeTaxPayable: SfpLineItem;
        drrfPayable: SfpLineItem;
        currentLeaseLibability: SfpLineItem;
        otherCurrentLiabilities: SfpLineItem;
        totalCurrentLiabilities: number;
    };
    nonCurrentLiabilities: {
        longTermLoans: SfpLineItem;
        deferredTaxLiabilities: SfpLineItem;
        leaseLibabilities: SfpLineItem;
        definedBenefitObligation: SfpLineItem;
        otherNonCurrentLiabilities: SfpLineItem;
        totalNonCurrentLiabilities: number;
    };
    totalLiabilities: number;
    equity: {
        shareCapital: SfpLineItem;
        retainedEarnings: SfpLineItem;
        currentYearProfit: SfpLineItem;
        revaluationReserve: SfpLineItem;
        otherComprehensiveIncome: SfpLineItem;
        totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    generatedAt: string;
    auditorNote?: string;
}
export interface SciLineItem {
    code: string;
    label: string;
    currentPeriod: number;
    priorPeriod: number;
    ifrs18Category: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'INCOME_TAX';
    ifrsRef?: string;
    notes?: string;
}
export interface StatementOfComprehensiveIncome {
    companyId: string;
    period: string;
    priorPeriod: string;
    currency: string;
    revenue: SciLineItem;
    costOfSales: SciLineItem;
    grossProfit: number;
    grossMargin: number;
    otherOperatingIncome: SciLineItem;
    sellingExpenses: SciLineItem;
    adminExpenses: SciLineItem;
    depreciationAmortisation: SciLineItem;
    employeeBenefitsExpense: SciLineItem;
    ias19PensionCost: SciLineItem;
    eclProvisionExpense: SciLineItem;
    otherOperatingExpenses: SciLineItem;
    operatingProfit: number;
    interestIncomeInvesting: SciLineItem;
    dividendIncomeInvesting: SciLineItem;
    gainLossOnDisposal: SciLineItem;
    fairValueMovements: SciLineItem;
    ovdsIncome: SciLineItem;
    ovdsExpense: SciLineItem;
    fxGainLoss: SciLineItem;
    profitBeforeTax: number;
    currentIncomeTax: SciLineItem;
    deferredTaxExpense: SciLineItem;
    totalIncomeTaxExpense: number;
    profitForPeriod: number;
    ociRevaluationSurplus: SciLineItem;
    ociActuarialGainLoss: SciLineItem;
    ociFxTranslation: SciLineItem;
    totalOci: number;
    totalComprehensiveIncome: number;
    eps?: number;
    generatedAt: string;
}
export interface CashFlowLineItem {
    label: string;
    amount: number;
    isAdjustment: boolean;
}
export interface StatementOfCashFlows {
    companyId: string;
    period: string;
    priorPeriod: string;
    currency: string;
    profitBeforeTax: number;
    adjustments: {
        depreciation: CashFlowLineItem;
        amortisation: CashFlowLineItem;
        eclProvision: CashFlowLineItem;
        ovdsExpense: CashFlowLineItem;
        fxUnrealised: CashFlowLineItem;
        gainOnDisposal: CashFlowLineItem;
        ias19Charge: CashFlowLineItem;
        otherNonCash: CashFlowLineItem;
    };
    workingCapitalChanges: {
        tradeReceivables: CashFlowLineItem;
        inventories: CashFlowLineItem;
        prepayments: CashFlowLineItem;
        tradePayables: CashFlowLineItem;
        taxPayables: CashFlowLineItem;
        otherWorkingCapital: CashFlowLineItem;
    };
    taxPaid: CashFlowLineItem;
    netCashFromOperations: number;
    purchaseOfPPE: CashFlowLineItem;
    proceedsFromDisposal: CashFlowLineItem;
    purchaseOfInvestments: CashFlowLineItem;
    dividendsReceived: CashFlowLineItem;
    interestReceived: CashFlowLineItem;
    netCashFromInvesting: number;
    proceedsFromLoans: CashFlowLineItem;
    repaymentOfLoans: CashFlowLineItem;
    leasePayments: CashFlowLineItem;
    dividendsPaid: CashFlowLineItem;
    interestPaid: CashFlowLineItem;
    netCashFromFinancing: number;
    netChangeInCash: number;
    openingCash: number;
    fxEffectOnCash: number;
    closingCash: number;
    generatedAt: string;
}
export interface EquityMovement {
    component: string;
    openingBalance: number;
    profitForPeriod: number;
    otherComprehensiveIncome: number;
    dividendsDeclared: number;
    sharesIssued: number;
    revaluationMovement: number;
    otherMovements: number;
    closingBalance: number;
}
export interface StatementOfChangesInEquity {
    companyId: string;
    period: string;
    currency: string;
    movements: EquityMovement[];
    totalOpeningEquity: number;
    totalClosingEquity: number;
    generatedAt: string;
}
export interface ScheduleALineItem {
    description: string;
    amount: number;
    isAddBack: boolean;
    proclamationRef: string;
    notes?: string;
}
export interface ScheduleACitComputation {
    companyId: string;
    fiscalYear: number;
    taxpayerCategory: 'A' | 'B' | 'C';
    accountingProfitBeforeTax: number;
    addBacks: ScheduleALineItem[];
    totalAddBacks: number;
    deductions: ScheduleALineItem[];
    totalDeductions: number;
    timingDifferences: ScheduleALineItem[];
    netTimingDifference: number;
    taxableIncome: number;
    citRate: number;
    regularCitPayable: number;
    matBase: number;
    matPayable: number;
    matApplies: boolean;
    finalTaxPayable: number;
    whtCreditsApplied: number;
    provisionalPaid: number;
    balanceDue: number;
    dueDate: string;
    deferredTaxAssets: number;
    deferredTaxLiabilities: number;
    netDeferredTaxPosition: number;
    effectiveTaxRate: number;
    generatedAt: string;
}
export type MorBridgeLineCategory = 'IFRS_PROFIT' | 'ADD_BACK' | 'DEDUCTION' | 'TAX_BASE' | 'TAX_PAYABLE' | 'CREDIT' | 'BALANCE_DUE';
export interface MorBridgeLineItem {
    description: string;
    amount: number;
    category: MorBridgeLineCategory;
    ifrsRef?: string;
    taxRef?: string;
    notes?: string;
}
export interface IfrsToMorTaxBridge {
    companyId: string;
    period: string;
    currency: string;
    accountingProfitBeforeTax: number;
    addBacks: MorBridgeLineItem[];
    totalAddBacks: number;
    deductions: MorBridgeLineItem[];
    totalDeductions: number;
    taxableIncomeBeforeLossRelief: number;
    taxableIncomeForBit: number;
    bitRate: number;
    bitPayable: number;
    matBase: number;
    matRate: number;
    matPayable: number;
    matApplies: boolean;
    taxPayableBeforeCredits: number;
    advanceTaxPaid: number;
    finalBalanceDue: number;
    generatedAt: string;
    controlChecks: {
        ifrsProfitTiedToStatement: boolean;
        matComparedToBit: boolean;
        advanceTaxDeducted: boolean;
    };
    notes: string[];
}
export interface PayrollMorReconciliation {
    companyId: string;
    period: string;
    currency: string;
    payrollRecordCount: number;
    employeeCount: number;
    grossPayroll: number;
    payrollExpense: number;
    pitWithheld: number;
    pitDeclared: number;
    pitRemitted: number;
    pitOutstanding: number;
    employeePension: number;
    employerPension: number;
    pensionDeclared: number;
    pensionRemitted: number;
    pensionOutstanding: number;
    netPay: number;
    generatedAt: string;
    checks: {
        pitMatchesDeclaration: boolean;
        pensionMatchesDeclaration: boolean;
        payrollExpenseIncludesEmployerPension: boolean;
    };
    notes: string[];
}
export interface FullFinancialReportBundle {
    companyId: string;
    companyName: string;
    period: string;
    ifrsStandard: 'IFRS_FULL' | 'IFRS_SME' | 'LOCAL_GAAP';
    statementOfFinancialPosition: StatementOfFinancialPosition;
    statementOfComprehensiveIncome: StatementOfComprehensiveIncome;
    statementOfCashFlows: StatementOfCashFlows;
    statementOfChangesInEquity: StatementOfChangesInEquity;
    scheduleCitComputation: ScheduleACitComputation;
    morTaxBridge?: IfrsToMorTaxBridge;
    payrollMorReconciliation?: PayrollMorReconciliation;
    auditOpinion?: 'UNQUALIFIED' | 'QUALIFIED' | 'ADVERSE' | 'DISCLAIMER';
    preparedBy: string;
    reviewedBy?: string;
    approvedBy?: string;
    generatedAt: string;
    aabeSubmissionRef?: string;
}
//# sourceMappingURL=financial-statements.types.d.ts.map