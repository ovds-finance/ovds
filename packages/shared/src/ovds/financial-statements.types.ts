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

// ---------------------------------------------------------------------------
// 1. Statement of Financial Position (Balance Sheet) — IAS 1.54
// ---------------------------------------------------------------------------

export interface SfpLineItem {
  code: string;
  label: string;
  currentPeriod: number;
  priorPeriod: number;
  isCurrent: boolean;      // current vs non-current classification (IAS 1.66)
  ifrsRef?: string;        // e.g. "IAS 16", "IFRS 9"
  notes?: string;
}

export interface StatementOfFinancialPosition {
  companyId: string;
  period: string;           // YYYY-MM-DD (as-at date)
  priorPeriod: string;
  currency: string;         // ETB

  // ASSETS
  currentAssets: {
    cash: SfpLineItem;
    tradeReceivables: SfpLineItem;     // net of ECL provision (IFRS 9)
    inventories: SfpLineItem;          // lower of cost or NRV (IAS 2)
    prepaidExpenses: SfpLineItem;
    otherCurrentAssets: SfpLineItem;
    totalCurrentAssets: number;
  };
  nonCurrentAssets: {
    propertyPlantEquipment: SfpLineItem;  // IAS 16 net book value
    rightOfUseAssets: SfpLineItem;        // IFRS 16
    intangibleAssets: SfpLineItem;        // IAS 38
    investments: SfpLineItem;
    deferredTaxAssets: SfpLineItem;       // IAS 12
    otherNonCurrentAssets: SfpLineItem;
    totalNonCurrentAssets: number;
  };
  totalAssets: number;

  // LIABILITIES
  currentLiabilities: {
    tradePayables: SfpLineItem;
    vatPayable: SfpLineItem;
    whtPayable: SfpLineItem;
    pensionPayable: SfpLineItem;
    incomeTaxPayable: SfpLineItem;         // current year CIT
    drrfPayable: SfpLineItem;
    currentLeaseLibability: SfpLineItem;   // IFRS 16
    otherCurrentLiabilities: SfpLineItem;
    totalCurrentLiabilities: number;
  };
  nonCurrentLiabilities: {
    longTermLoans: SfpLineItem;
    deferredTaxLiabilities: SfpLineItem;   // IAS 12
    leaseLibabilities: SfpLineItem;        // IFRS 16 non-current
    definedBenefitObligation: SfpLineItem; // IAS 19 gratuity
    otherNonCurrentLiabilities: SfpLineItem;
    totalNonCurrentLiabilities: number;
  };
  totalLiabilities: number;

  // EQUITY
  equity: {
    shareCapital: SfpLineItem;
    retainedEarnings: SfpLineItem;
    currentYearProfit: SfpLineItem;
    revaluationReserve: SfpLineItem;    // IAS 16 revaluation surplus
    otherComprehensiveIncome: SfpLineItem;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  generatedAt: string;
  auditorNote?: string;
}

// ---------------------------------------------------------------------------
// 2. Statement of Comprehensive Income — IAS 1 / IFRS 18
// ---------------------------------------------------------------------------

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
  period: string;           // YYYY (annual) or YYYY-MM (monthly)
  priorPeriod: string;
  currency: string;

  // REVENUE & OPERATING SECTION (IFRS 18 Operating category)
  revenue: SciLineItem;                      // IFRS 15 recognised revenue (excl. VAT/TOT)
  costOfSales: SciLineItem;
  grossProfit: number;
  grossMargin: number;                       // %

  otherOperatingIncome: SciLineItem;
  sellingExpenses: SciLineItem;
  adminExpenses: SciLineItem;
  depreciationAmortisation: SciLineItem;     // IAS 16 + IAS 38
  employeeBenefitsExpense: SciLineItem;      // IAS 19 — pension + gratuity
  ias19PensionCost: SciLineItem;
  eclProvisionExpense: SciLineItem;          // IFRS 9 ECL movement
  otherOperatingExpenses: SciLineItem;
  operatingProfit: number;                   // EBIT

  // INVESTING SECTION (IFRS 18)
  interestIncomeInvesting: SciLineItem;
  dividendIncomeInvesting: SciLineItem;
  gainLossOnDisposal: SciLineItem;
  fairValueMovements: SciLineItem;

  // FINANCING SECTION (IFRS 18)
  ovdsIncome: SciLineItem;
  ovdsExpense: SciLineItem;               // interest on loans + IFRS 16 lease interest
  fxGainLoss: SciLineItem;                   // IAS 21

  profitBeforeTax: number;

  // INCOME TAX SECTION (IAS 12)
  currentIncomeTax: SciLineItem;
  deferredTaxExpense: SciLineItem;
  totalIncomeTaxExpense: number;

  profitForPeriod: number;

  // OTHER COMPREHENSIVE INCOME (not reclassified to P&L)
  ociRevaluationSurplus: SciLineItem;        // IAS 16 revaluation
  ociActuarialGainLoss: SciLineItem;         // IAS 19
  ociFxTranslation: SciLineItem;             // IAS 21 OCI items
  totalOci: number;

  totalComprehensiveIncome: number;
  eps?: number;                              // IAS 33 (listed entities)
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// 3. Statement of Cash Flows (Indirect Method) — IAS 7
// ---------------------------------------------------------------------------

export interface CashFlowLineItem {
  label: string;
  amount: number;
  isAdjustment: boolean;   // true = non-cash add-back (e.g. depreciation)
}

export interface StatementOfCashFlows {
  companyId: string;
  period: string;
  priorPeriod: string;
  currency: string;

  // OPERATING ACTIVITIES (indirect method)
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

  // INVESTING ACTIVITIES
  purchaseOfPPE: CashFlowLineItem;
  proceedsFromDisposal: CashFlowLineItem;
  purchaseOfInvestments: CashFlowLineItem;
  dividendsReceived: CashFlowLineItem;
  interestReceived: CashFlowLineItem;
  netCashFromInvesting: number;

  // FINANCING ACTIVITIES
  proceedsFromLoans: CashFlowLineItem;
  repaymentOfLoans: CashFlowLineItem;
  leasePayments: CashFlowLineItem;           // IFRS 16 principal
  dividendsPaid: CashFlowLineItem;
  interestPaid: CashFlowLineItem;
  netCashFromFinancing: number;

  netChangeInCash: number;
  openingCash: number;
  fxEffectOnCash: number;                    // IAS 21
  closingCash: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// 4. Statement of Changes in Equity — IAS 1.106
// ---------------------------------------------------------------------------

export interface EquityMovement {
  component: string;              // "Share Capital" | "Retained Earnings" | etc.
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

// ---------------------------------------------------------------------------
// 5. Schedule A — Ethiopian CIT Computation
// ---------------------------------------------------------------------------

export interface ScheduleALineItem {
  description: string;
  amount: number;
  isAddBack: boolean;    // true = increases taxable income; false = reduces
  proclamationRef: string;
  notes?: string;
}

export interface ScheduleACitComputation {
  companyId: string;
  fiscalYear: number;
  taxpayerCategory: 'A' | 'B' | 'C';

  accountingProfitBeforeTax: number;

  // Non-deductible expenses (add-backs)
  addBacks: ScheduleALineItem[];
  totalAddBacks: number;

  // Tax-exempt income (deductions)
  deductions: ScheduleALineItem[];
  totalDeductions: number;

  // Timing differences (IAS 12)
  timingDifferences: ScheduleALineItem[];
  netTimingDifference: number;

  taxableIncome: number;
  citRate: number;              // 30% standard; 15% for priority sectors
  regularCitPayable: number;
  matBase: number;              // Gross annual revenue for MAT
  matPayable: number;           // 2.5% of revenue (Proc. 1395/2025)
  matApplies: boolean;
  finalTaxPayable: number;      // max(CIT, MAT)
  whtCreditsApplied: number;    // WHT certificates received from clients
  provisionalPaid: number;
  balanceDue: number;
  dueDate: string;              // Proclamation No. 1395/2025 — 4 months after EFY end

  // Deferred tax disclosures (IAS 12.79)
  deferredTaxAssets: number;
  deferredTaxLiabilities: number;
  netDeferredTaxPosition: number;
  effectiveTaxRate: number;

  generatedAt: string;
}

// ---------------------------------------------------------------------------
// 6. MoR IFRS Bridge + Payroll Reconciliation
// ---------------------------------------------------------------------------

export type MorBridgeLineCategory =
  | 'IFRS_PROFIT'
  | 'ADD_BACK'
  | 'DEDUCTION'
  | 'TAX_BASE'
  | 'TAX_PAYABLE'
  | 'CREDIT'
  | 'BALANCE_DUE';

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

// ---------------------------------------------------------------------------
// 7. Complete Financial Report Bundle — all four statements + Schedule A
// ---------------------------------------------------------------------------

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
  aabeSubmissionRef?: string;   // AABE filing reference number
}
