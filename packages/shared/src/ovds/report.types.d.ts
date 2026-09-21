/**
 * IFRS Ethiopian Business Tax Report Types
 * =========================================
 * Bilingual (Amharic / English) financial statement types for MoR submission.
 *
 * Standards applied:
 *   IAS 1  — Presentation of Financial Statements
 *   IAS 2  — Inventories
 *   IAS 7  — Statement of Cash Flows
 *   IAS 12 — Income Taxes (CIT / deferred tax)
 *   IAS 16 — Property, Plant & Equipment
 *   IAS 19 — Employee Benefits (pension, gratuity)
 *   IAS 21 — Foreign Exchange
 *   IAS 37 — Provisions (tax disputes, warranties)
 *   IAS 38 — Intangible Assets
 *   IFRS 9 — Financial Instruments (ECL)
 *   IFRS 15 — Revenue Recognition
 *   IFRS 16 — Leases
 *   IFRS 18 — Presentation / Disclosure (P&L categories)
 *
 * Ethiopian law references:
 *   Proclamation No. 1395/2025 — Income Tax (PIT/BIT/WHT/DRRF)
 *   Proclamation No. 979/2016  — Business Income Tax (CIT 30%)
 *   Proclamation No. 285/2002  — VAT (15%)
 *   Regulation No. 570/2025    — VAT threshold ETB 2M
 *   PFSA Regulations           — Pension (employee 7%, employer 11%)
 *   AABE Framework 2016        — Tiered IFRS adoption
 */
export interface BilingualLabel {
    en: string;
    am: string;
}
export interface BilingualLineItem {
    code: string;
    label: BilingualLabel;
    currentPeriod: number;
    priorPeriod: number;
    ifrsRef?: string;
    taxRef?: string;
    isMaterial: boolean;
    notes?: string;
}
export interface EthiopianCompanyHeader {
    companyId: string;
    companyName: string;
    companyNameAm?: string;
    tin: string;
    vatNumber?: string;
    businessType: 'PLC' | 'SC' | 'SOLE' | 'PARTNERSHIP' | 'NGO' | 'GOV' | 'OTHER';
    sector: string;
    address: string;
    city: string;
    fiscalYear: string;
    ifrsStandard: 'IFRS_FULL' | 'IFRS_SME' | 'IFRS_FOR_SMLES' | 'LOCAL_GAAP';
    currency: 'ETB';
    functionalCurrency: string;
    presentationCurrency: string;
    roundingUnit: 'BIRR' | 'THOUSANDS' | 'MILLIONS';
    ercaCategory: 'A' | 'B' | 'C';
    auditRequired: boolean;
    preparedDate: string;
    preparedBy: string;
    reviewedBy?: string;
    approvedBy?: string;
    aabeSubmissionRef?: string;
}
export interface EthiopianHRSummary {
    reportingPeriod: string;
    /** Total headcount at period end */
    totalEmployees: number;
    /** New hires in period (recruitment) */
    newHires: number;
    /** Exits/terminations in period */
    exits: number;
    /** Employees who received training */
    trainingParticipants: number;
    /** Employees with performance appraisal completed */
    performanceAppraisalCount: number;
    /** Open disciplinary/employee relations cases */
    openRelationsCases: number;
    payroll: {
        grossPayroll: number;
        employeePension: number;
        employerPension: number;
        pitWithheld: number;
        drrfDeducted: number;
        netPay: number;
        pitDeclaredMoR: number;
        pensionRemittedPFSA: number;
        ercaRemittanceRef?: string;
        pfsaRemittanceRef?: string;
    };
    compliance: {
        payeFiledOnTime: boolean;
        pensionRemittedOnTime: boolean;
        laborLawCompliant: boolean;
        overduePAYEMonths: number;
        overduePensionMonths: number;
    };
    ias19: {
        shortTermBenefitsExpense: number;
        gratuityProvision: number;
        leaveAccrual: number;
        pensionCost: number;
    };
}
export interface EthiopianCashFlowLineItem {
    code: string;
    label: BilingualLabel;
    amount: number;
    isAdjustment: boolean;
    ifrsRef?: string;
    taxRef?: string;
}
export interface AccountingCycleStep {
    step: number;
    nameEn: string;
    nameAm: string;
    status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'ERROR';
    completedAt?: string;
    source: 'MANUAL' | 'IOT' | 'SRM' | 'OFFLINE_SYNC' | 'BANK_PORTAL' | 'API';
    documentCount: number;
    notes?: string;
}
export interface EthiopianIncomeStatement {
    header: EthiopianCompanyHeader;
    periodLabel: BilingualLabel;
    revenue: {
        salesOfGoods: BilingualLineItem;
        servicesRevenue: BilingualLineItem;
        otherOperatingIncome: BilingualLineItem;
        totalRevenue: number;
    };
    costOfSales: BilingualLineItem;
    grossProfit: number;
    grossMarginPct: number;
    operatingExpenses: {
        employeeBenefits: BilingualLineItem;
        depreciation: BilingualLineItem;
        rentAndUtilities: BilingualLineItem;
        sellingExpenses: BilingualLineItem;
        adminExpenses: BilingualLineItem;
        provisionForECL: BilingualLineItem;
        vatNonRecoverable: BilingualLineItem;
        totExpense: BilingualLineItem;
        otherOperatingExpenses: BilingualLineItem;
        totalOperatingExpenses: number;
    };
    operatingProfit: number;
    interestIncome: BilingualLineItem;
    dividendIncome: BilingualLineItem;
    gainLossOnDisposal: BilingualLineItem;
    interestExpense: BilingualLineItem;
    fxGainLoss: BilingualLineItem;
    profitBeforeTax: number;
    incomeTax: {
        currentTax: BilingualLineItem;
        deferredTax: BilingualLineItem;
        totalIncomeTax: number;
        effectiveTaxRate: number;
        matApplies: boolean;
        citRate: number;
        matRate: number;
    };
    profitForPeriod: number;
    oci: {
        revaluationSurplus: BilingualLineItem;
        actuarialGainLoss: BilingualLineItem;
        fxTranslation: BilingualLineItem;
        totalOCI: number;
    };
    totalComprehensiveIncome: number;
    generatedAt: string;
}
export interface EthiopianBalanceSheet {
    header: EthiopianCompanyHeader;
    asAtLabel: BilingualLabel;
    currentAssets: {
        cash: BilingualLineItem;
        bankDeposits: BilingualLineItem;
        tradeReceivables: BilingualLineItem;
        inventories: BilingualLineItem;
        prepaidExpenses: BilingualLineItem;
        vatInputRecoverable: BilingualLineItem;
        otherCurrentAssets: BilingualLineItem;
        totalCurrentAssets: number;
    };
    nonCurrentAssets: {
        propertyPlantEquipment: BilingualLineItem;
        rightOfUseAssets: BilingualLineItem;
        intangibleAssets: BilingualLineItem;
        longTermInvestments: BilingualLineItem;
        deferredTaxAssets: BilingualLineItem;
        goodwill: BilingualLineItem;
        totalNonCurrentAssets: number;
    };
    totalAssets: number;
    currentLiabilities: {
        tradePayables: BilingualLineItem;
        vatPayable: BilingualLineItem;
        withholdingTaxPayable: BilingualLineItem;
        payePayable: BilingualLineItem;
        pensionPayable: BilingualLineItem;
        drrfPayable: BilingualLineItem;
        corporateIncomeTaxPayable: BilingualLineItem;
        provisionsShortTerm: BilingualLineItem;
        accruals: BilingualLineItem;
        currentPortionLoans: BilingualLineItem;
        currentLeaseLiability: BilingualLineItem;
        otherCurrentLiabilities: BilingualLineItem;
        totalCurrentLiabilities: number;
    };
    nonCurrentLiabilities: {
        longTermLoans: BilingualLineItem;
        deferredTaxLiabilities: BilingualLineItem;
        leaseLiabilitiesLT: BilingualLineItem;
        gratuityObligation: BilingualLineItem;
        provisionsLongTerm: BilingualLineItem;
        totalNonCurrentLiabilities: number;
    };
    totalLiabilities: number;
    equity: {
        shareCapital: BilingualLineItem;
        retainedEarnings: BilingualLineItem;
        currentYearProfit: BilingualLineItem;
        revaluationReserve: BilingualLineItem;
        ociAccumulated: BilingualLineItem;
        totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    generatedAt: string;
}
export interface EthiopianCashFlowStatement {
    header: EthiopianCompanyHeader;
    periodLabel: BilingualLabel;
    profitBeforeTax: number;
    adjustments: {
        depreciation: EthiopianCashFlowLineItem;
        amortisation: EthiopianCashFlowLineItem;
        eclProvision: EthiopianCashFlowLineItem;
        ovdsExpense: EthiopianCashFlowLineItem;
        fxUnrealised: EthiopianCashFlowLineItem;
        ias19Charge: EthiopianCashFlowLineItem;
        gainOnDisposal: EthiopianCashFlowLineItem;
    };
    workingCapital: {
        receivablesChange: EthiopianCashFlowLineItem;
        inventoriesChange: EthiopianCashFlowLineItem;
        prepaymentsChange: EthiopianCashFlowLineItem;
        payablesChange: EthiopianCashFlowLineItem;
        taxPayablesChange: EthiopianCashFlowLineItem;
    };
    taxPaid: EthiopianCashFlowLineItem;
    netOperating: number;
    investing: {
        purchasePPE: EthiopianCashFlowLineItem;
        proceedsDisposal: EthiopianCashFlowLineItem;
        interestReceived: EthiopianCashFlowLineItem;
        dividendsReceived: EthiopianCashFlowLineItem;
    };
    netInvesting: number;
    financing: {
        loanProceeds: EthiopianCashFlowLineItem;
        loanRepayments: EthiopianCashFlowLineItem;
        leasePayments: EthiopianCashFlowLineItem;
        interestPaid: EthiopianCashFlowLineItem;
        dividendsPaid: EthiopianCashFlowLineItem;
    };
    netFinancing: number;
    netChangeInCash: number;
    openingCash: number;
    fxEffectOnCash: number;
    closingCash: number;
    generatedAt: string;
}
export interface EthiopianEquityStatement {
    header: EthiopianCompanyHeader;
    periodLabel: BilingualLabel;
    columns: BilingualLabel[];
    rows: {
        label: BilingualLabel;
        shareCapital: number;
        retainedEarnings: number;
        revaluationReserve: number;
        ociAccumulated: number;
        total: number;
    }[];
    openingBalances: {
        shareCapital: number;
        retainedEarnings: number;
        revaluationReserve: number;
        ociAccumulated: number;
        total: number;
    };
    profitForPeriod: number;
    otherComprehensiveIncome: number;
    dividendsDeclared: number;
    sharesIssuedInPeriod: number;
    revaluationMovement: number;
    closingBalances: {
        shareCapital: number;
        retainedEarnings: number;
        revaluationReserve: number;
        ociAccumulated: number;
        total: number;
    };
    generatedAt: string;
}
export interface IFRSNote {
    noteNumber: number;
    titleEn: string;
    titleAm: string;
    ifrsRef: string;
    content: string;
    tableData?: Record<string, number | string>[];
    proclamationRef?: string;
}
export interface EthiopianIFRSNotes {
    header: EthiopianCompanyHeader;
    notes: IFRSNote[];
}
export interface EthiopianScheduleA {
    header: EthiopianCompanyHeader;
    fiscalYear: number;
    taxpayerCategory: 'A' | 'B' | 'C';
    accountingProfitBeforeTax: number;
    addBacks: {
        description: BilingualLabel;
        amount: number;
        proclamationRef: string;
    }[];
    totalAddBacks: number;
    deductions: {
        description: BilingualLabel;
        amount: number;
        proclamationRef: string;
    }[];
    totalDeductions: number;
    taxableNetIncome: number;
    citRate: number;
    regularCIT: number;
    grossRevenue: number;
    matRate: number;
    matPayable: number;
    matApplies: boolean;
    taxBeforeCredits: number;
    whtCredits: number;
    provisionalTaxPaid: number;
    totalCredits: number;
    finalTaxPayable: number;
    dueDate: string;
    deferredTaxAssets: number;
    deferredTaxLiabilities: number;
    netDeferredTaxPosition: number;
    effectiveTaxRate: number;
    generatedAt: string;
}
export interface EthiopianVATReturn {
    header: EthiopianCompanyHeader;
    period: string;
    taxableSales: number;
    zeroRatedSales: number;
    exemptSales: number;
    outputVAT: number;
    reverseChargeVAT: number;
    claimableInputVAT: number;
    nonClaimableInputVAT: number;
    netVATPayable: number;
    withheldVAT: number;
    vatRefundClaim: number;
    balanceDue: number;
    dueDate: string;
}
export interface EthiopianWHTSummary {
    header: EthiopianCompanyHeader;
    period: string;
    whtOnGoods: number;
    whtOnServices: number;
    whtOnNonResidentServices: number;
    whtOnDividends: number;
    whtOnInterest: number;
    whtOnRent: number;
    totalWHT: number;
    remittedToMoR: number;
    outstanding: number;
    dueDate: string;
}
export interface EthiopianTOTReturn {
    header: EthiopianCompanyHeader;
    period: string;
    goodsSales: number;
    servicesSales: number;
    constructionSales: number;
    totOnGoods: number;
    totOnServices: number;
    totOnConstruction: number;
    totalTOT: number;
    dueDate: string;
}
export interface EthiopianTrialBalance {
    header: EthiopianCompanyHeader;
    asAt: string;
    lines: {
        accountCode: string;
        accountName: string;
        accountNameAm?: string;
        ifrs18Category: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'INCOME_TAX';
        debit: number;
        credit: number;
    }[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    generatedAt: string;
}
export interface MoRSubmissionPackage {
    submissionRef: string;
    submissionType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
    eTaxPortalUrl: string;
    header: EthiopianCompanyHeader;
    period: string;
    incomeStatement: EthiopianIncomeStatement;
    balanceSheet: EthiopianBalanceSheet;
    cashFlowStatement: EthiopianCashFlowStatement;
    equityStatement: EthiopianEquityStatement;
    notesToAccounts: EthiopianIFRSNotes;
    scheduleA: EthiopianScheduleA;
    vatReturn?: EthiopianVATReturn;
    whtSummary: EthiopianWHTSummary;
    totReturn?: EthiopianTOTReturn;
    hrSummary: EthiopianHRSummary;
    accountingCycle: AccountingCycleStep[];
    morTaxBridge: {
        ifrsProfitToTaxableIncome: number;
        totalAddBacks: number;
        totalDeductions: number;
        taxableIncome: number;
        finalTaxPayable: number;
        reconciliationNotes: string[];
    };
    compliance: {
        vatCompliant: boolean;
        payeCompliant: boolean;
        pensionCompliant: boolean;
        citCompliant: boolean;
        whtCompliant: boolean;
        auditRequired: boolean;
        aabeSubmissionRequired: boolean;
        overallStatus: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
        issues: string[];
    };
    generatedAt: string;
    validUntil: string;
}
//# sourceMappingURL=report.types.d.ts.map