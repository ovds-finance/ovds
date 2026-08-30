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

// ── Bilingual label ───────────────────────────────────────────────────────────
export interface BilingualLabel {
  en: string;   // English
  am: string;   // Amharic (አማርኛ)
}

// ── Bilingual line item ───────────────────────────────────────────────────────
export interface BilingualLineItem {
  code: string;
  label: BilingualLabel;
  currentPeriod: number;
  priorPeriod: number;
  ifrsRef?: string;        // e.g. "IAS 16.30"
  taxRef?: string;         // e.g. "Proc. 1395/2025 Art. 23"
  isMaterial: boolean;     // IAS 1.29 — omit immaterial items
  notes?: string;
}

// ── Company header for all statements ────────────────────────────────────────
export interface EthiopianCompanyHeader {
  companyId: string;
  companyName: string;
  companyNameAm?: string;           // Amharic legal name
  tin: string;                      // Tax Identification Number
  vatNumber?: string;               // ERCA VAT Registration Number
  businessType: 'PLC' | 'SC' | 'SOLE' | 'PARTNERSHIP' | 'NGO' | 'GOV' | 'OTHER';
  sector: string;                   // ISIC sector code + name
  address: string;
  city: string;                     // e.g. "Addis Ababa / አዲስ አበባ"
  fiscalYear: string;               // "EFY 2016/2017" or "GC 2024/2025"
  ifrsStandard: 'IFRS_FULL' | 'IFRS_SME' | 'IFRS_FOR_SMLES' | 'LOCAL_GAAP';
  currency: 'ETB';
  functionalCurrency: string;       // usually ETB
  presentationCurrency: string;     // ETB for MoR
  roundingUnit: 'BIRR' | 'THOUSANDS' | 'MILLIONS';
  ercaCategory: 'A' | 'B' | 'C';   // BIT schedule category
  auditRequired: boolean;           // Category A requires external audit
  preparedDate: string;             // ISO date
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  aabeSubmissionRef?: string;
}

// ── Ethiopian HR summary embedded in financial statements ─────────────────────
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

  // ── Payroll summary ─────────────────────────────────────────────────────────
  payroll: {
    grossPayroll: number;
    employeePension: number;         // 7% of insurable earnings ≤ ETB 15,000
    employerPension: number;         // 11% of insurable earnings
    pitWithheld: number;             // Schedule A PIT (progressive)
    drrfDeducted: number;            // 1% of gross salary (Proc. 1395/2025)
    netPay: number;
    pitDeclaredMoR: number;          // Amount on PAYE declaration filed to MoR
    pensionRemittedPFSA: number;     // Total remitted to PFSA
    ercaRemittanceRef?: string;      // e-Tax reference from MoR portal
    pfsaRemittanceRef?: string;      // PFSA portal reference
  };

  // ── Compliance flags ─────────────────────────────────────────────────────────
  compliance: {
    payeFiledOnTime: boolean;
    pensionRemittedOnTime: boolean;
    laborLawCompliant: boolean;      // Labour Proclamation No. 1156/2019
    overduePAYEMonths: number;
    overduePensionMonths: number;
  };

  // ── IAS 19 employee benefits disclosure ──────────────────────────────────────
  ias19: {
    shortTermBenefitsExpense: number;
    gratuityProvision: number;        // IAS 19 defined benefit
    leaveAccrual: number;             // IAS 19 short-term
    pensionCost: number;              // IAS 19.44 defined contribution
  };
}

// ── Cash flow line item (IAS 7) — separate from BilingualLineItem ─────────────
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

// ── Full IFRS Ethiopian Bilingual Income Statement ────────────────────────────
export interface EthiopianIncomeStatement {
  header: EthiopianCompanyHeader;
  periodLabel: BilingualLabel;       // "For the Year Ended / ለዓመቱ ያበቃ"

  // ── REVENUE (IFRS 15 / IAS 18 legacy) ───────────────────────────────────────
  revenue: {
    salesOfGoods: BilingualLineItem;
    servicesRevenue: BilingualLineItem;
    otherOperatingIncome: BilingualLineItem;
    totalRevenue: number;
  };

  costOfSales: BilingualLineItem;
  grossProfit: number;
  grossMarginPct: number;

  // ── OPERATING EXPENSES (IFRS 18 operating category) ─────────────────────────
  operatingExpenses: {
    employeeBenefits: BilingualLineItem;     // IAS 19 — salaries + pension cost
    depreciation: BilingualLineItem;         // IAS 16 + IAS 38
    rentAndUtilities: BilingualLineItem;     // IFRS 16 short-term lease
    sellingExpenses: BilingualLineItem;
    adminExpenses: BilingualLineItem;
    provisionForECL: BilingualLineItem;      // IFRS 9 expected credit losses
    vatNonRecoverable: BilingualLineItem;    // VAT on exempt supplies
    totExpense: BilingualLineItem;           // TOT paid as Cat C taxpayer
    otherOperatingExpenses: BilingualLineItem;
    totalOperatingExpenses: number;
  };

  operatingProfit: number;                   // EBIT

  // ── INVESTING (IFRS 18 investing category) ───────────────────────────────────
  interestIncome: BilingualLineItem;
  dividendIncome: BilingualLineItem;
  gainLossOnDisposal: BilingualLineItem;

  // ── FINANCING (IFRS 18 financing category) ───────────────────────────────────
  interestExpense: BilingualLineItem;        // IFRS 16 lease interest + loan
  fxGainLoss: BilingualLineItem;             // IAS 21

  profitBeforeTax: number;

  // ── INCOME TAX (IAS 12) ──────────────────────────────────────────────────────
  incomeTax: {
    currentTax: BilingualLineItem;           // CIT 30% or MAT 2.5%
    deferredTax: BilingualLineItem;          // IAS 12 timing differences
    totalIncomeTax: number;
    effectiveTaxRate: number;
    matApplies: boolean;
    citRate: number;
    matRate: number;
  };

  profitForPeriod: number;

  // ── OTHER COMPREHENSIVE INCOME (OCI) ─────────────────────────────────────────
  oci: {
    revaluationSurplus: BilingualLineItem;   // IAS 16
    actuarialGainLoss: BilingualLineItem;    // IAS 19
    fxTranslation: BilingualLineItem;        // IAS 21
    totalOCI: number;
  };

  totalComprehensiveIncome: number;
  generatedAt: string;
}

// ── Statement of Financial Position (IAS 1.54) ───────────────────────────────
export interface EthiopianBalanceSheet {
  header: EthiopianCompanyHeader;
  asAtLabel: BilingualLabel;         // "As at / እስከ"

  currentAssets: {
    cash: BilingualLineItem;
    bankDeposits: BilingualLineItem;
    tradeReceivables: BilingualLineItem;   // net of ECL (IFRS 9)
    inventories: BilingualLineItem;        // lower of cost/NRV (IAS 2)
    prepaidExpenses: BilingualLineItem;
    vatInputRecoverable: BilingualLineItem;
    otherCurrentAssets: BilingualLineItem;
    totalCurrentAssets: number;
  };

  nonCurrentAssets: {
    propertyPlantEquipment: BilingualLineItem;   // IAS 16 NBV
    rightOfUseAssets: BilingualLineItem;          // IFRS 16
    intangibleAssets: BilingualLineItem;          // IAS 38
    longTermInvestments: BilingualLineItem;
    deferredTaxAssets: BilingualLineItem;         // IAS 12
    goodwill: BilingualLineItem;                  // IFRS 3
    totalNonCurrentAssets: number;
  };

  totalAssets: number;

  currentLiabilities: {
    tradePayables: BilingualLineItem;
    vatPayable: BilingualLineItem;               // Output VAT – Input VAT
    withholdingTaxPayable: BilingualLineItem;     // WHT collected not remitted
    payePayable: BilingualLineItem;              // PIT withheld (PAYE)
    pensionPayable: BilingualLineItem;           // Employee + Employer contributions
    drrfPayable: BilingualLineItem;              // 1% Digital Risk Reserve
    corporateIncomeTaxPayable: BilingualLineItem;
    provisionsShortTerm: BilingualLineItem;      // IAS 37
    accruals: BilingualLineItem;                 // Accrued salaries, utilities
    currentPortionLoans: BilingualLineItem;
    currentLeaseLiability: BilingualLineItem;    // IFRS 16
    otherCurrentLiabilities: BilingualLineItem;
    totalCurrentLiabilities: number;
  };

  nonCurrentLiabilities: {
    longTermLoans: BilingualLineItem;
    deferredTaxLiabilities: BilingualLineItem;   // IAS 12
    leaseLiabilitiesLT: BilingualLineItem;       // IFRS 16
    gratuityObligation: BilingualLineItem;       // IAS 19 defined benefit
    provisionsLongTerm: BilingualLineItem;       // IAS 37 (tax disputes)
    totalNonCurrentLiabilities: number;
  };

  totalLiabilities: number;

  equity: {
    shareCapital: BilingualLineItem;
    retainedEarnings: BilingualLineItem;
    currentYearProfit: BilingualLineItem;
    revaluationReserve: BilingualLineItem;       // IAS 16 surplus
    ociAccumulated: BilingualLineItem;           // IAS 19 actuarial
    totalEquity: number;
  };

  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  generatedAt: string;
}

// ── Statement of Cash Flows — Indirect Method (IAS 7) ────────────────────────
export interface EthiopianCashFlowStatement {
  header: EthiopianCompanyHeader;
  periodLabel: BilingualLabel;

  profitBeforeTax: number;

  // Operating adjustments
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
    taxPayablesChange: EthiopianCashFlowLineItem;   // VAT, PIT, pension payables
  };

  taxPaid: EthiopianCashFlowLineItem;              // CIT paid in period
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
    leasePayments: EthiopianCashFlowLineItem;      // IFRS 16
    interestPaid: EthiopianCashFlowLineItem;
    dividendsPaid: EthiopianCashFlowLineItem;
  };
  netFinancing: number;

  netChangeInCash: number;
  openingCash: number;
  fxEffectOnCash: number;                 // IAS 21
  closingCash: number;
  generatedAt: string;
}

// ── Statement of Changes in Equity (IAS 1.106) ───────────────────────────────
export interface EthiopianEquityStatement {
  header: EthiopianCompanyHeader;
  periodLabel: BilingualLabel;

  columns: BilingualLabel[];           // Share Capital | Retained Earnings | Revaluation | OCI | Total
  rows: {
    label: BilingualLabel;
    shareCapital: number;
    retainedEarnings: number;
    revaluationReserve: number;
    ociAccumulated: number;
    total: number;
  }[];

  openingBalances: { shareCapital: number; retainedEarnings: number; revaluationReserve: number; ociAccumulated: number; total: number };
  profitForPeriod: number;
  otherComprehensiveIncome: number;
  dividendsDeclared: number;
  sharesIssuedInPeriod: number;
  revaluationMovement: number;
  closingBalances: { shareCapital: number; retainedEarnings: number; revaluationReserve: number; ociAccumulated: number; total: number };
  generatedAt: string;
}

// ── Notes to the Financial Statements (IFRS disclosure) ──────────────────────
export interface IFRSNote {
  noteNumber: number;
  titleEn: string;
  titleAm: string;
  ifrsRef: string;
  content: string;                    // narrative disclosure
  tableData?: Record<string, number | string>[]; // optional supporting table
  proclamationRef?: string;
}

export interface EthiopianIFRSNotes {
  header: EthiopianCompanyHeader;
  notes: IFRSNote[];
}

// ── Schedule A — Ethiopian CIT Computation (Business Income Tax) ──────────────
export interface EthiopianScheduleA {
  header: EthiopianCompanyHeader;
  fiscalYear: number;                  // EFY year
  taxpayerCategory: 'A' | 'B' | 'C'; // Proc. 1395/2025

  accountingProfitBeforeTax: number;  // Per IFRS income statement

  // Add-backs (non-deductible per Ethiopian tax law)
  addBacks: {
    description: BilingualLabel;
    amount: number;
    proclamationRef: string;
  }[];
  totalAddBacks: number;

  // Deductions (tax-exempt income)
  deductions: {
    description: BilingualLabel;
    amount: number;
    proclamationRef: string;
  }[];
  totalDeductions: number;

  taxableNetIncome: number;

  // BIT / CIT calculation
  citRate: number;                     // 30% standard (Proc. 979/2016)
  regularCIT: number;
  // Minimum Alternative Tax
  grossRevenue: number;
  matRate: number;                     // 2.5% (Proc. 1395/2025)
  matPayable: number;
  matApplies: boolean;
  taxBeforeCredits: number;

  // Credits
  whtCredits: number;                  // WHT certificates received
  provisionalTaxPaid: number;          // Advance BIT payments
  totalCredits: number;

  finalTaxPayable: number;
  dueDate: string;                     // 4 months after EFY end

  // IAS 12 deferred tax
  deferredTaxAssets: number;
  deferredTaxLiabilities: number;
  netDeferredTaxPosition: number;
  effectiveTaxRate: number;
  generatedAt: string;
}

// ── VAT Return summary for MoR ────────────────────────────────────────────────
export interface EthiopianVATReturn {
  header: EthiopianCompanyHeader;
  period: string;                      // YYYY-MM
  // Output VAT
  taxableSales: number;
  zeroRatedSales: number;
  exemptSales: number;
  outputVAT: number;
  reverseChargeVAT: number;
  // Input VAT
  claimableInputVAT: number;
  nonClaimableInputVAT: number;
  // Net
  netVATPayable: number;               // Output – Input
  withheldVAT: number;                 // 3% VAT withholding (Proc. 1395/2025)
  vatRefundClaim: number;
  balanceDue: number;
  dueDate: string;                     // 30th of following month
}

// ── Withholding Tax Summary ───────────────────────────────────────────────────
export interface EthiopianWHTSummary {
  header: EthiopianCompanyHeader;
  period: string;
  whtOnGoods: number;                  // 3% on purchases ≥ ETB 20K
  whtOnServices: number;               // 3% on services ≥ ETB 10K
  whtOnNonResidentServices: number;    // 15%
  whtOnDividends: number;              // 15%
  whtOnInterest: number;               // 10%
  whtOnRent: number;                   // 30%
  totalWHT: number;
  remittedToMoR: number;
  outstanding: number;
  dueDate: string;
}

// ── Turnover Tax (TOT) — Category C taxpayers ─────────────────────────────────
export interface EthiopianTOTReturn {
  header: EthiopianCompanyHeader;
  period: string;
  goodsSales: number;
  servicesSales: number;
  constructionSales: number;
  totOnGoods: number;                  // 2%
  totOnServices: number;               // 10%
  totOnConstruction: number;           // 2%
  totalTOT: number;
  dueDate: string;
}

// ── Trial Balance (IFRS-classified) ──────────────────────────────────────────
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

// ── Full MoR Submission Package ───────────────────────────────────────────────
export interface MoRSubmissionPackage {
  submissionRef: string;               // Auto-generated reference
  submissionType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  eTaxPortalUrl: string;               // https://etax.mor.gov.et
  header: EthiopianCompanyHeader;
  period: string;

  // The four IFRS statements
  incomeStatement: EthiopianIncomeStatement;
  balanceSheet: EthiopianBalanceSheet;
  cashFlowStatement: EthiopianCashFlowStatement;
  equityStatement: EthiopianEquityStatement;

  // Notes
  notesToAccounts: EthiopianIFRSNotes;

  // Tax schedules
  scheduleA: EthiopianScheduleA;       // CIT computation
  vatReturn?: EthiopianVATReturn;
  whtSummary: EthiopianWHTSummary;
  totReturn?: EthiopianTOTReturn;      // Only Cat C / non-VAT registered

  // HR & Payroll
  hrSummary: EthiopianHRSummary;

  // Accounting cycle audit trail
  accountingCycle: AccountingCycleStep[];

  // Reconciliation bridge
  morTaxBridge: {
    ifrsProfitToTaxableIncome: number;
    totalAddBacks: number;
    totalDeductions: number;
    taxableIncome: number;
    finalTaxPayable: number;
    reconciliationNotes: string[];
  };

  // Compliance status
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
  validUntil: string;                  // 30 days from generation
}
