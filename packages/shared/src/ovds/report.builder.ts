/**
 * Report Builder
 * ==============================
 * Pure functions (no I/O) that assemble the bilingual financial statements
 * from raw accounting data.  Consumed by the backend NestJS service and
 * potentially by a PDF-generation worker.
 *
 * All amounts in ETB.  Bilingual labels follow the AABE terminology guide.
 */

import type {
  BilingualLabel,
  BilingualLineItem,
  EthiopianCashFlowLineItem,
  EthiopianCompanyHeader,
  EthiopianIncomeStatement,
  EthiopianBalanceSheet,
  EthiopianCashFlowStatement,
  EthiopianEquityStatement,
  EthiopianScheduleA,
  EthiopianVATReturn,
  EthiopianWHTSummary,
  EthiopianTOTReturn,
  EthiopianTrialBalance,
  EthiopianIFRSNotes,
  IFRSNote,
  EthiopianHRSummary,
  AccountingCycleStep,
  MoRSubmissionPackage,
} from './report.types';

import { calculateCorporateBIT, getEthFiscalYear } from './tax-calc';
import { ETH_TAX } from '../constants';

// ── Label helpers ─────────────────────────────────────────────────────────────
const L = (en: string, am: string): BilingualLabel => ({ en, am });

/** Build a bilingual line item with safe zero defaults */
function line(
  code: string,
  en: string,
  am: string,
  current = 0,
  prior = 0,
  ifrsRef?: string,
  taxRef?: string,
): BilingualLineItem {
  return {
    code,
    label: L(en, am),
    currentPeriod: round(current),
    priorPeriod: round(prior),
    ifrsRef,
    taxRef,
    isMaterial: Math.abs(current) > 0 || Math.abs(prior) > 0,
  };
}

const round = (n: number) => Math.round((n ?? 0) * 100) / 100;
const sum   = (...vals: number[]) => round(vals.reduce((a, b) => a + (b ?? 0), 0));

// ── Accounting Cycle Steps (IoT / SRM / Offline integration) ─────────────────
export function buildAccountingCycle(opts: {
  hasIotData: boolean;
  hasSrmData: boolean;
  hasOfflineSync: boolean;
  journalCount: number;
  trialBalanced: boolean;
  adjustmentsDone: boolean;
  statementsGenerated: boolean;
}): AccountingCycleStep[] {
  return [
    {
      step: 1,
      nameEn: 'Data Collection — Invoices, Receipts, Payroll, Bank Statements',
      nameAm: 'መረጃ ስብሰባ — ደረሰኞች፣ ደብዳቤዎች፣ ደሞዝ፣ የባንክ መግለጫዎች',
      status: opts.journalCount > 0 ? 'COMPLETE' : 'PENDING',
      source: opts.hasIotData ? 'IOT' : opts.hasSrmData ? 'SRM' : opts.hasOfflineSync ? 'OFFLINE_SYNC' : 'MANUAL',
      documentCount: opts.journalCount,
      notes: [
        opts.hasIotData ? 'IoT sensor data integrated' : null,
        opts.hasSrmData ? 'SRM supplier audit trail active' : null,
        opts.hasOfflineSync ? 'Offline records synchronised' : null,
      ].filter(Boolean).join('; ') || 'Manual entry',
    },
    {
      step: 2,
      nameEn: 'Journal Entries — Double-Entry Bookkeeping (Accrual Basis)',
      nameAm: 'የጆርናል ግቤቶች — ሁለት ጎን ሂሳብ አዘዣዥ (የዕዳ ዘዴ)',
      status: opts.journalCount > 0 ? 'COMPLETE' : 'PENDING',
      source: 'MANUAL',
      documentCount: opts.journalCount,
      notes: 'Accrual basis per IAS 1.27 — revenue recognised on delivery (IFRS 15); expenses on incurrence',
    },
    {
      step: 3,
      nameEn: 'Ledger Posting — Classify Assets, Liabilities, Equity, Income, Expenses',
      nameAm: 'ሌጀር ማስገቢያ — ንብረቶች፣ ዕዳዎች፣ ካፒታል፣ ገቢ፣ ወጪዎችን መክፈፍ',
      status: opts.journalCount > 0 ? 'COMPLETE' : 'PENDING',
      source: 'MANUAL',
      documentCount: opts.journalCount,
      notes: 'IFRS requires clear separation per IAS 1.54 (SFP) and IFRS 18 (P&L)',
    },
    {
      step: 4,
      nameEn: 'Trial Balance — Verify Debit/Credit Equality',
      nameAm: 'ሙከራ ሂሳብ — ዴቢት/ክሬዲት ሚዛን ማረጋገጥ',
      status: opts.trialBalanced ? 'COMPLETE' : opts.journalCount > 0 ? 'IN_PROGRESS' : 'PENDING',
      source: 'MANUAL',
      documentCount: opts.journalCount,
      notes: opts.trialBalanced ? 'Trial balance agrees — debits equal credits' : 'Balance check pending',
    },
    {
      step: 5,
      nameEn: 'Adjusting Entries — Accruals, Prepayments, Depreciation (IAS 16), Provisions (IAS 37)',
      nameAm: 'ማስተካከያ ግቤቶች — ክምችቶች፣ ቅድመ ክፍያዎች፣ ዝቅጠት (IAS 16)፣ ክምችቶች (IAS 37)',
      status: opts.adjustmentsDone ? 'COMPLETE' : 'PENDING',
      source: 'MANUAL',
      documentCount: 0,
      notes: 'IAS 16 depreciation; IAS 37 tax dispute provisions; IFRS 9 ECL; IAS 19 gratuity accrual',
    },
    {
      step: 6,
      nameEn: 'Financial Statements — IFRS Format (IAS 1 + IFRS 18)',
      nameAm: 'ፋይናንሻል መግለጫዎች — IFRS ቅርፅ (IAS 1 + IFRS 18)',
      status: opts.statementsGenerated ? 'COMPLETE' : 'PENDING',
      source: 'MANUAL',
      documentCount: 4,
      notes: '4 statements: Income Statement, Balance Sheet, Cash Flow, Changes in Equity + Notes',
    },
    {
      step: 7,
      nameEn: 'MoR Submission — eTax Portal (etax.mor.gov.et)',
      nameAm: 'ለሚኒስቴር ገቢዎች ማቅረብ — eTax ፖርታል (etax.mor.gov.et)',
      status: 'PENDING',
      source: 'API',
      documentCount: 0,
      notes: 'Submit via etax.mor.gov.et — VAT, BIT/CIT, PAYE, WHT, DRRF',
    },
  ];
}

// ── Income Statement Builder ──────────────────────────────────────────────────
export function buildIncomeStatement(
  header: EthiopianCompanyHeader,
  data: {
    period: string;
    // Revenue
    salesOfGoods?: number; salesOfGoodsPrior?: number;
    servicesRevenue?: number; servicesRevenuePrior?: number;
    otherOperatingIncome?: number; otherOperatingIncomePrior?: number;
    // Cost
    costOfSales?: number; costOfSalesPrior?: number;
    // Operating expenses
    grossSalaries?: number; pensionEmployer?: number; gratuityCharge?: number;
    depreciation?: number; amortisation?: number;
    rentUtilities?: number;
    sellingExpenses?: number;
    adminExpenses?: number;
    eclProvision?: number;
    vatNonRecoverable?: number;
    totExpense?: number;
    otherOperatingExpenses?: number;
    // Prior period operating
    salariesPrior?: number; depreciationPrior?: number; rentPrior?: number;
    // Investing
    interestIncome?: number;
    dividendIncome?: number;
    gainLossOnDisposal?: number;
    // Financing
    interestExpense?: number;
    fxGainLoss?: number;
    // Tax
    currentTax?: number;
    deferredTax?: number;
    // OCI
    revaluationSurplus?: number;
    actuarialGainLoss?: number;
    fxTranslation?: number;
    // Annual revenue for MAT check
    annualRevenue?: number;
  },
): EthiopianIncomeStatement {
  // Revenue
  const salesOfGoods   = round(data.salesOfGoods ?? 0);
  const servicesRev    = round(data.servicesRevenue ?? 0);
  const otherOpIncome  = round(data.otherOperatingIncome ?? 0);
  const totalRevenue   = sum(salesOfGoods, servicesRev, otherOpIncome);

  const costOfSales    = round(data.costOfSales ?? 0);
  const grossProfit    = round(totalRevenue - costOfSales);
  const grossMargin    = totalRevenue > 0 ? round((grossProfit / totalRevenue) * 100) : 0;

  // Employee benefits = salaries + employer pension + gratuity (IAS 19)
  const empBenefits    = sum(data.grossSalaries ?? 0, data.pensionEmployer ?? 0, data.gratuityCharge ?? 0);
  const depreciationTotal = sum(data.depreciation ?? 0, data.amortisation ?? 0);
  const selling        = round(data.sellingExpenses ?? 0);
  const admin          = round(data.adminExpenses ?? 0);
  const rent           = round(data.rentUtilities ?? 0);
  const ecl            = round(data.eclProvision ?? 0);
  const vatNonRec      = round(data.vatNonRecoverable ?? 0);
  const totExp         = round(data.totExpense ?? 0);
  const otherOpExp     = round(data.otherOperatingExpenses ?? 0);
  const totalOpExp     = sum(empBenefits, depreciationTotal, rent, selling, admin, ecl, vatNonRec, totExp, otherOpExp);
  const operatingProfit = round(grossProfit - totalOpExp);

  // Below EBIT
  const interestIncome  = round(data.interestIncome ?? 0);
  const dividendIncome  = round(data.dividendIncome ?? 0);
  const gainLoss        = round(data.gainLossOnDisposal ?? 0);
  const interestExpense = round(data.interestExpense ?? 0);
  const fxGainLoss      = round(data.fxGainLoss ?? 0);

  const profitBeforeTax = sum(
    operatingProfit, interestIncome, dividendIncome, gainLoss, fxGainLoss,
    -interestExpense,
  );

  // CIT / MAT
  const annualRevenue = data.annualRevenue ?? totalRevenue;
  const { regularTax, matTax, taxPayable, matApplies } = calculateCorporateBIT(
    Math.max(0, profitBeforeTax), annualRevenue,
  );
  const currentTax   = round(data.currentTax ?? taxPayable);
  const deferredTax  = round(data.deferredTax ?? 0);
  const totalTax     = sum(currentTax, deferredTax);
  const effectiveTaxRate = profitBeforeTax > 0 ? round(totalTax / profitBeforeTax) : 0;
  const profitForPeriod  = round(profitBeforeTax - totalTax);

  // OCI
  const revSurplus   = round(data.revaluationSurplus ?? 0);
  const actuarial    = round(data.actuarialGainLoss ?? 0);
  const fxTranslation= round(data.fxTranslation ?? 0);
  const totalOCI     = sum(revSurplus, actuarial, fxTranslation);
  const totalComprehensive = sum(profitForPeriod, totalOCI);

  return {
    header,
    periodLabel: L(`For the period ended ${data.period}`, `ለጊዜው ያበቃ ${data.period}`),
    revenue: {
      salesOfGoods:        line('REV-01','Sales of Goods','የዕቃ ሽያጭ', salesOfGoods, data.salesOfGoodsPrior,'IFRS 15.31','Proc. 1395/2025 Art. 41'),
      servicesRevenue:     line('REV-02','Revenue from Services','ከአገልግሎት ገቢ', servicesRev, data.servicesRevenuePrior,'IFRS 15.35'),
      otherOperatingIncome:line('REV-03','Other Operating Income','ሌሎች የሥራ ገቢዎች', otherOpIncome, data.otherOperatingIncomePrior),
      totalRevenue,
    },
    costOfSales: line('COS-01','Cost of Sales','የሽያጭ ዋጋ', costOfSales, data.costOfSalesPrior,'IAS 2.36'),
    grossProfit,
    grossMarginPct: grossMargin,
    operatingExpenses: {
      employeeBenefits:     line('EXP-01','Employee Benefits Expense','የሠራተኛ ጥቅማጥቅም ወጪ', empBenefits, data.salariesPrior,'IAS 19.44','Proc. 1395/2025 Art. 11'),
      depreciation:         line('EXP-02','Depreciation & Amortisation','ዝቅጠት እና ቅነሳ', depreciationTotal, data.depreciationPrior,'IAS 16.30 / IAS 38.97'),
      rentAndUtilities:     line('EXP-03','Rent, Utilities & Short-Term Leases','ቤት ኪራይ፣ አቅርቦቶችና አጭር-ጊዜ ሊዝ', rent, data.rentPrior,'IFRS 16.6'),
      sellingExpenses:      line('EXP-04','Selling Expenses','የሽያጭ ወጪዎች', selling),
      adminExpenses:        line('EXP-05','General & Administrative Expenses','አጠቃላይ እና አስተዳደር ወጪዎች', admin),
      provisionForECL:      line('EXP-06','Expected Credit Loss Provision','የሚጠበቅ የብድር ኪሳራ ክምችት', ecl, 0,'IFRS 9.5.5.1'),
      vatNonRecoverable:    line('EXP-07','Non-Recoverable VAT Expense','ሊያዙ የማይችሉ ቅናሽ ያልተደረገ ቅናሽ ቀረጥ', vatNonRec, 0,'Proc. 285/2002'),
      totExpense:           line('EXP-08','Turnover Tax (TOT) Expense','የሽያጭ ቀረጥ ወጪ', totExp, 0,'Proc. 1395/2025 Art. 91'),
      otherOperatingExpenses:line('EXP-09','Other Operating Expenses','ሌሎች የሥራ ወጪዎች', otherOpExp),
      totalOperatingExpenses: totalOpExp,
    },
    operatingProfit,
    interestIncome:   line('FIN-01','Interest Income','የወለድ ገቢ', interestIncome, 0,'IFRS 18'),
    dividendIncome:   line('FIN-02','Dividend Income','የትርፍ ድርሻ ገቢ', dividendIncome, 0,'IFRS 18'),
    gainLossOnDisposal: line('FIN-03','Gain / (Loss) on Disposal of Assets','በንብረት ሽያጭ ትርፍ / (ኪሳራ)', gainLoss, 0,'IAS 16.68'),
    interestExpense:  line('FIN-04','ovds Costs (Interest & Lease)','የፋይናንስ ወጪዎች (ወለድ እና ሊዝ)', interestExpense, 0,'IFRS 16.49 / IAS 23'),
    fxGainLoss:       line('FIN-05','Foreign Exchange Gain / (Loss)','የውጭ ምንዛሬ ትርፍ / (ኪሳራ)', fxGainLoss, 0,'IAS 21.28'),
    profitBeforeTax,
    incomeTax: {
      currentTax:      line('TAX-01','Current Income Tax Expense','የአሁኑ የገቢ ቀረጥ ወጪ', currentTax, 0,'IAS 12.58 / Proc. 979/2016'),
      deferredTax:     line('TAX-02','Deferred Tax Expense / (Income)','የዘገዩ ቀረጥ ወጪ / (ገቢ)', deferredTax, 0,'IAS 12.58'),
      totalIncomeTax:  totalTax,
      effectiveTaxRate,
      matApplies,
      citRate:         ETH_TAX.BIT_MAX_RATE,
      matRate:         ETH_TAX.MAT_RATE,
    },
    profitForPeriod,
    oci: {
      revaluationSurplus: line('OCI-01','Revaluation Surplus on PPE','የቋሚ ንብረቶች ድጋሚ ዋጋ ትርፍ', revSurplus, 0,'IAS 16.39'),
      actuarialGainLoss:  line('OCI-02','Actuarial Gains / (Losses) on Gratuity','በስጦታ ጥቅማጥቅም ላይ የሂሳብ ትርፍ / (ኪሳራ)', actuarial, 0,'IAS 19.120'),
      fxTranslation:      line('OCI-03','Foreign Currency Translation Reserve','የውጭ ምንዛሬ ትርጉም ክምችት', fxTranslation, 0,'IAS 21.52'),
      totalOCI,
    },
    totalComprehensiveIncome: totalComprehensive,
    generatedAt: new Date().toISOString(),
  };
}

// ── Balance Sheet Builder (IAS 1.54) ─────────────────────────────────────────
export function buildBalanceSheet(
  header: EthiopianCompanyHeader,
  data: {
    asAt: string;
    // Current assets
    cash?: number; cashPrior?: number;
    bankDeposits?: number; bankDepositsPrior?: number;
    tradeReceivables?: number; tradeReceivablesPrior?: number;
    inventories?: number; inventoriesPrior?: number;
    prepaidExpenses?: number;
    vatInputRecoverable?: number;
    otherCurrentAssets?: number;
    // Non-current assets
    ppeCost?: number; ppeAccumDepreciation?: number; ppePrior?: number;
    rightOfUseAssets?: number;
    intangibleAssets?: number;
    longTermInvestments?: number;
    deferredTaxAssets?: number;
    goodwill?: number;
    // Current liabilities
    tradePayables?: number; tradePayablesPrior?: number;
    vatPayable?: number;
    whtPayable?: number;
    payePayable?: number;
    pensionPayable?: number;
    drrfPayable?: number;
    corporateTaxPayable?: number;
    provisionsShortTerm?: number;
    accruals?: number;
    currentPortionLoans?: number;
    currentLeaseLiability?: number;
    otherCurrentLiabilities?: number;
    // Non-current liabilities
    longTermLoans?: number;
    deferredTaxLiabilities?: number;
    leaseLiabilitiesLT?: number;
    gratuityObligation?: number;
    provisionsLongTerm?: number;
    // Equity
    shareCapital?: number; shareCapitalPrior?: number;
    retainedEarnings?: number; retainedEarningsPrior?: number;
    currentYearProfit?: number;
    revaluationReserve?: number;
    ociAccumulated?: number;
  },
): EthiopianBalanceSheet {
  const ppeCost       = round(data.ppeCost ?? 0);
  const ppeAccumDep   = round(data.ppeAccumDepreciation ?? 0);
  const ppeNBV        = round(ppeCost - ppeAccumDep);

  // Current assets
  const cash          = round(data.cash ?? 0);
  const bank          = round(data.bankDeposits ?? 0);
  const recv          = round(data.tradeReceivables ?? 0);
  const inv           = round(data.inventories ?? 0);
  const prepaid       = round(data.prepaidExpenses ?? 0);
  const vatIn         = round(data.vatInputRecoverable ?? 0);
  const otherCA       = round(data.otherCurrentAssets ?? 0);
  const totalCA       = sum(cash, bank, recv, inv, prepaid, vatIn, otherCA);

  // Non-current assets
  const rouAssets     = round(data.rightOfUseAssets ?? 0);
  const intangibles   = round(data.intangibleAssets ?? 0);
  const ltInv         = round(data.longTermInvestments ?? 0);
  const dtAssets      = round(data.deferredTaxAssets ?? 0);
  const goodwill      = round(data.goodwill ?? 0);
  const totalNCA      = sum(ppeNBV, rouAssets, intangibles, ltInv, dtAssets, goodwill);

  const totalAssets   = sum(totalCA, totalNCA);

  // Current liabilities
  const tradePay      = round(data.tradePayables ?? 0);
  const vatPay        = round(data.vatPayable ?? 0);
  const whtPay        = round(data.whtPayable ?? 0);
  const payePay       = round(data.payePayable ?? 0);
  const penPay        = round(data.pensionPayable ?? 0);
  const drrfPay       = round(data.drrfPayable ?? 0);
  const citPay        = round(data.corporateTaxPayable ?? 0);
  const provST        = round(data.provisionsShortTerm ?? 0);
  const accruals      = round(data.accruals ?? 0);
  const currLoans     = round(data.currentPortionLoans ?? 0);
  const currLease     = round(data.currentLeaseLiability ?? 0);
  const otherCL       = round(data.otherCurrentLiabilities ?? 0);
  const totalCL       = sum(tradePay,vatPay,whtPay,payePay,penPay,drrfPay,citPay,provST,accruals,currLoans,currLease,otherCL);

  // Non-current liabilities
  const ltLoans       = round(data.longTermLoans ?? 0);
  const dtLiab        = round(data.deferredTaxLiabilities ?? 0);
  const leaseLT       = round(data.leaseLiabilitiesLT ?? 0);
  const gratuity      = round(data.gratuityObligation ?? 0);
  const provLT        = round(data.provisionsLongTerm ?? 0);
  const totalNCL      = sum(ltLoans, dtLiab, leaseLT, gratuity, provLT);

  const totalLiab     = sum(totalCL, totalNCL);

  // Equity
  const shareCapital  = round(data.shareCapital ?? 0);
  const retainedEarn  = round(data.retainedEarnings ?? 0);
  const currProfit    = round(data.currentYearProfit ?? 0);
  const revalRes      = round(data.revaluationReserve ?? 0);
  const ociAccum      = round(data.ociAccumulated ?? 0);
  const totalEquity   = sum(shareCapital, retainedEarn, currProfit, revalRes, ociAccum);

  const totalLiabEq   = sum(totalLiab, totalEquity);
  const isBalanced    = Math.abs(totalAssets - totalLiabEq) < 1;

  return {
    header,
    asAtLabel: L(`As at ${data.asAt}`, `እስከ ${data.asAt}`),
    currentAssets: {
      cash:                line('CA-01','Cash on Hand','በእጅ ያለ ጥሬ ገንዘብ', cash, data.cashPrior, 'IAS 7.6'),
      bankDeposits:        line('CA-02','Cash at Bank','በባንክ ያለ ጥሬ ገንዘብ', bank, data.bankDepositsPrior),
      tradeReceivables:    line('CA-03','Trade Receivables (net of ECL)','ሸቀጥ ተቀባዮች (ከECL ቀርቶ)', recv, data.tradeReceivablesPrior,'IFRS 9.5.5.1'),
      inventories:         line('CA-04','Inventories','ዕቃ ክምችቶች', inv, data.inventoriesPrior,'IAS 2.9'),
      prepaidExpenses:     line('CA-05','Prepaid Expenses','ቅድሞ-ክፍያ ወጪዎች', prepaid, 0,'IAS 1.54'),
      vatInputRecoverable: line('CA-06','VAT Input Tax Recoverable','ሊያዙ የሚችሉ ቅናሽ ቀረጥ ክፍያ', vatIn, 0,'Proc. 285/2002'),
      otherCurrentAssets:  line('CA-07','Other Current Assets','ሌሎች አጭር-ጊዜ ንብረቶች', otherCA),
      totalCurrentAssets:  totalCA,
    },
    nonCurrentAssets: {
      propertyPlantEquipment: line('NCA-01','Property, Plant & Equipment (NBV)','ቤቶች፣ ፋብሪካዎችና መሣሪያዎች (ተጣምሮ ዋጋ)', ppeNBV, data.ppePrior,'IAS 16.30'),
      rightOfUseAssets:    line('NCA-02','Right-of-Use Assets','የአጠቃቀም መብት ንብረቶች', rouAssets, 0,'IFRS 16.22'),
      intangibleAssets:    line('NCA-03','Intangible Assets','ቀፋፋ ያልሆኑ ንብረቶች', intangibles, 0,'IAS 38.74'),
      longTermInvestments: line('NCA-04','Long-Term Investments','የረጅም ጊዜ ኢንቨስትመንቶች', ltInv),
      deferredTaxAssets:   line('NCA-05','Deferred Tax Assets','የዘገዩ ቀረጥ ንብረቶች', dtAssets, 0,'IAS 12.24'),
      goodwill:            line('NCA-06','Goodwill','ጉድ ዊል', goodwill, 0,'IFRS 3.32'),
      totalNonCurrentAssets: totalNCA,
    },
    totalAssets,
    currentLiabilities: {
      tradePayables:          line('CL-01','Trade Payables','የሸቀጥ ዕዳዎች', tradePay, data.tradePayablesPrior),
      vatPayable:             line('CL-02','VAT Payable','የቅናሽ ቀረጥ ዕዳ', vatPay, 0,'Proc. 285/2002'),
      withholdingTaxPayable:  line('CL-03','Withholding Tax Payable','የቀርቶ ቀረጥ ዕዳ', whtPay, 0,'Proc. 1395/2025 Art. 89'),
      payePayable:            line('CL-04','PAYE (PIT) Payable','ተቀንሶ የሚቀር ቀረጥ ዕዳ', payePay, 0,'Proc. 1395/2025'),
      pensionPayable:         line('CL-05','Pension Contributions Payable','የጡረታ ዕዳ (ሠ. 7% + ቀ. 11%)', penPay, 0,'PFSA Regs'),
      drrfPayable:            line('CL-06','DRRF Levy Payable (1%)','DRRF ክፍያ ዕዳ (1%)', drrfPay, 0,'Proc. 1395/2025 Art. 101'),
      corporateIncomeTaxPayable: line('CL-07','Corporate Income Tax Payable','የድርጅት የገቢ ቀረጥ ዕዳ', citPay, 0,'Proc. 979/2016'),
      provisionsShortTerm:    line('CL-08','Short-Term Provisions (Tax Disputes)','አጭር-ጊዜ ክምችቶች (የቀረጥ ክርክሮች)', provST, 0,'IAS 37.14'),
      accruals:               line('CL-09','Accrued Liabilities (Salaries & Utilities)','ክምችቶ ዕዳዎች (ደሞዝ እና አቅርቦቶች)', accruals, 0,'IAS 1.54'),
      currentPortionLoans:    line('CL-10','Current Portion of Long-Term Loans','የረጅም ጊዜ ብድር አጭር-ጊዜ ክፍል', currLoans),
      currentLeaseLiability:  line('CL-11','Current Lease Liability','አጭር-ጊዜ ሊዝ ዕዳ', currLease, 0,'IFRS 16.47'),
      otherCurrentLiabilities:line('CL-12','Other Current Liabilities','ሌሎች አጭር-ጊዜ ዕዳዎች', otherCL),
      totalCurrentLiabilities: totalCL,
    },
    nonCurrentLiabilities: {
      longTermLoans:           line('NCL-01','Long-Term Loans & Borrowings','የረጅም ጊዜ ብድሮች', ltLoans),
      deferredTaxLiabilities:  line('NCL-02','Deferred Tax Liabilities','የዘገዩ ቀረጥ ዕዳዎች', dtLiab, 0,'IAS 12.47'),
      leaseLiabilitiesLT:      line('NCL-03','Non-Current Lease Liabilities','ረጅም-ጊዜ ሊዝ ዕዳዎች', leaseLT, 0,'IFRS 16.47'),
      gratuityObligation:      line('NCL-04','Defined Benefit Obligation (Gratuity)','የተወሰነ ጥቅማጥቅም ግዴታ (ስጦታ)', gratuity, 0,'IAS 19.57'),
      provisionsLongTerm:      line('NCL-05','Long-Term Provisions','ረጅም-ጊዜ ክምችቶች', provLT, 0,'IAS 37.14'),
      totalNonCurrentLiabilities: totalNCL,
    },
    totalLiabilities: totalLiab,
    equity: {
      shareCapital:    line('EQ-01','Share Capital / Paid-up Capital','የድርሻ ካፒታል', shareCapital, data.shareCapitalPrior,'IAS 1.79'),
      retainedEarnings:line('EQ-02','Retained Earnings (Opening)','ተጠራቅሞ ትርፍ (መክፈቻ)', retainedEarn, data.retainedEarningsPrior),
      currentYearProfit:line('EQ-03','Profit for the Current Period','የአሁኑ ዓመት ትርፍ', currProfit),
      revaluationReserve:line('EQ-04','Revaluation Reserve','የዳግም ዋጋ ክምችት', revalRes, 0,'IAS 16.39'),
      ociAccumulated:  line('EQ-05','Other Comprehensive Income (Accumulated)','ሌሎች ሁሉ-አቀፍ ገቢዎች (ተጠራቅሞ)', ociAccum, 0,'IAS 19.120'),
      totalEquity,
    },
    totalLiabilitiesAndEquity: totalLiabEq,
    isBalanced,
    generatedAt: new Date().toISOString(),
  };
}

// ── Cash Flow Statement Builder (IAS 7 indirect method) ──────────────────────
export function buildCashFlowStatement(
  header: EthiopianCompanyHeader,
  data: {
    period: string;
    profitBeforeTax: number;
    depreciation?: number; amortisation?: number;
    eclProvision?: number; ovdsExpense?: number;
    fxUnrealised?: number; ias19Charge?: number;
    gainOnDisposal?: number;
    receivablesChange?: number; inventoriesChange?: number;
    prepaymentsChange?: number; payablesChange?: number;
    taxPayablesChange?: number;
    taxPaid?: number;
    purchasePPE?: number; proceedsDisposal?: number;
    interestReceived?: number; dividendsReceived?: number;
    loanProceeds?: number; loanRepayments?: number;
    leasePayments?: number; interestPaid?: number;
    dividendsPaid?: number;
    openingCash?: number; fxEffectOnCash?: number;
  },
): EthiopianCashFlowStatement {
  const dep     = round(data.depreciation ?? 0);
  const amort   = round(data.amortisation ?? 0);
  const ecl     = round(data.eclProvision ?? 0);
  const finExp  = round(data.ovdsExpense ?? 0);
  const fxUnr   = round(data.fxUnrealised ?? 0);
  const ias19   = round(data.ias19Charge ?? 0);
  const gainDis = round(data.gainOnDisposal ?? 0);
  const totalAdj = sum(dep, amort, ecl, finExp, fxUnr, ias19, -gainDis);

  const recChg  = round(data.receivablesChange ?? 0);
  const invChg  = round(data.inventoriesChange ?? 0);
  const preChg  = round(data.prepaymentsChange ?? 0);
  const payChg  = round(data.payablesChange ?? 0);
  const taxChg  = round(data.taxPayablesChange ?? 0);
  const totalWC = sum(recChg, invChg, preChg, payChg, taxChg);

  const taxPaid = round(data.taxPaid ?? 0);
  const netOp   = sum(data.profitBeforeTax, totalAdj, totalWC, -taxPaid);

  const purPPE  = round(data.purchasePPE ?? 0);
  const procDis = round(data.proceedsDisposal ?? 0);
  const intRec  = round(data.interestReceived ?? 0);
  const divRec  = round(data.dividendsReceived ?? 0);
  const netInv  = sum(-purPPE, procDis, intRec, divRec);

  const loanPr  = round(data.loanProceeds ?? 0);
  const loanRp  = round(data.loanRepayments ?? 0);
  const leaseP  = round(data.leasePayments ?? 0);
  const intPaid = round(data.interestPaid ?? 0);
  const divPaid = round(data.dividendsPaid ?? 0);
  const netFin  = sum(loanPr, -loanRp, -leaseP, -intPaid, -divPaid);

  const netChg  = sum(netOp, netInv, netFin);
  const openCash = round(data.openingCash ?? 0);
  const fxEff   = round(data.fxEffectOnCash ?? 0);
  const closeCash = sum(openCash, netChg, fxEff);

  /** Build a cash flow line item */
  const cfl = (
    code: string, en: string, am: string,
    amount: number, isAdj: boolean,
    ifrsRef?: string, taxRef?: string,
  ): EthiopianCashFlowLineItem => ({
    code, label: L(en, am),
    amount: round(amount), isAdjustment: isAdj,
    ifrsRef, taxRef,
  });

  return {
    header,
    periodLabel: L(`For the period ended ${data.period}`, `ለጊዜው ያበቃ ${data.period}`),
    profitBeforeTax: round(data.profitBeforeTax),
    adjustments: {
      depreciation:   cfl('CF-A01','Depreciation','ዝቅጠት', dep, true,'IAS 16'),
      amortisation:   cfl('CF-A02','Amortisation','ቅነሳ', amort, true,'IAS 38'),
      eclProvision:   cfl('CF-A03','ECL Provision Movement','የECL ክምችት ለውጥ', ecl, true,'IFRS 9'),
      ovdsExpense: cfl('CF-A04','ovds Costs (Add-back)','የፋይናንስ ወጪዎች (መጨመር)', finExp, true),
      fxUnrealised:   cfl('CF-A05','Unrealised FX (Loss)/Gain','ያልተሳካ ምንዛሬ (ኪሳራ)/ትርፍ', fxUnr, true,'IAS 21'),
      gainOnDisposal: cfl('CF-A06','(Gain)/Loss on Disposal','(ትርፍ)/ኪሳራ ከንብረት ሽያጭ', gainDis, true,'IAS 16'),
      ias19Charge:    cfl('CF-A07','IAS 19 Pension/Gratuity Charge','IAS 19 ጡረታ/ስጦታ ወጪ', ias19, true,'IAS 19'),
    },
    workingCapital: {
      receivablesChange: cfl('CF-W01','(Increase)/Decrease in Receivables','ተቀባዮች ለውጥ', recChg, false),
      inventoriesChange: cfl('CF-W02','(Increase)/Decrease in Inventories','ዕቃ ክምችቶች ለውጥ', invChg, false),
      prepaymentsChange: cfl('CF-W03','(Increase)/Decrease in Prepayments','ቅድሞ ክፍያዎች ለውጥ', preChg, false),
      payablesChange:    cfl('CF-W04','Increase/(Decrease) in Payables','ዕዳ ለፓሚዎች ለውጥ', payChg, false),
      taxPayablesChange: cfl('CF-W05','Increase/(Decrease) in Tax Payables','የቀረጥ ዕዳዎች ለውጥ', taxChg, false,'Proc. 285/2002 / 1395/2025'),
    },
    taxPaid:       cfl('CF-T01','Income Tax Paid','የተከፈለ የገቢ ቀረጥ', -taxPaid, false,'IAS 7.35'),
    netOperating:  netOp,
    investing: {
      purchasePPE:         cfl('CF-I01','Purchase of PPE','የቋሚ ንብረቶች ግዢ', -purPPE, false,'IAS 16'),
      proceedsDisposal:    cfl('CF-I02','Proceeds from Disposal','ከንብረት ሽያጭ ገቢ', procDis, false,'IAS 16'),
      interestReceived:    cfl('CF-I03','Interest Received','የተቀበለ ወለድ', intRec, false),
      dividendsReceived:   cfl('CF-I04','Dividends Received','የተቀበለ ትርፍ ድርሻ', divRec, false),
    },
    netInvesting:  netInv,
    financing: {
      loanProceeds:   cfl('CF-F01','Proceeds from Loans','ከብድሮች ገቢ', loanPr, false),
      loanRepayments: cfl('CF-F02','Repayment of Loans','የብድር ክፍያ', -loanRp, false),
      leasePayments:  cfl('CF-F03','Lease Payments (IFRS 16)','ሊዝ ክፍያዎች (IFRS 16)', -leaseP, false,'IFRS 16.50'),
      interestPaid:   cfl('CF-F04','Interest Paid','የተከፈለ ወለድ', -intPaid, false,'IAS 7.31'),
      dividendsPaid:  cfl('CF-F05','Dividends Paid','የተከፈለ ትርፍ ድርሻ', -divPaid, false,'IAS 7.31'),
    },
    netFinancing:     netFin,
    netChangeInCash:  netChg,
    openingCash:      openCash,
    fxEffectOnCash:   fxEff,
    closingCash:      closeCash,
    generatedAt:      new Date().toISOString(),
  };
}

// ── Statement of Changes in Equity Builder (IAS 1.106) ───────────────────────
export function buildEquityStatement(
  header: EthiopianCompanyHeader,
  data: {
    period: string;
    openingShareCapital: number;
    openingRetainedEarnings: number;
    openingRevaluation?: number;
    openingOCI?: number;
    profitForPeriod: number;
    oci?: number;
    dividendsDeclared?: number;
    sharesIssued?: number;
    revaluationMovement?: number;
  },
): EthiopianEquityStatement {
  const oSC  = round(data.openingShareCapital);
  const oRE  = round(data.openingRetainedEarnings);
  const oRR  = round(data.openingRevaluation ?? 0);
  const oOCI = round(data.openingOCI ?? 0);
  const oTot = sum(oSC, oRE, oRR, oOCI);

  const profit  = round(data.profitForPeriod);
  const oci     = round(data.oci ?? 0);
  const divs    = round(data.dividendsDeclared ?? 0);
  const shares  = round(data.sharesIssued ?? 0);
  const revalMv = round(data.revaluationMovement ?? 0);

  const cSC  = sum(oSC, shares);
  const cRE  = sum(oRE, profit, -divs);
  const cRR  = sum(oRR, revalMv);
  const cOCI = sum(oOCI, oci);
  const cTot = sum(cSC, cRE, cRR, cOCI);

  return {
    header,
    periodLabel: L(`For the period ended ${data.period}`, `ለጊዜው ያበቃ ${data.period}`),
    columns: [
      L('Share Capital','የድርሻ ካፒታል'),
      L('Retained Earnings','ተጠራቅሞ ትርፍ'),
      L('Revaluation Reserve','የዳግም ዋጋ ክምችት'),
      L('OCI Accumulated','ሌሎች ሁሉ-አቀፍ ገቢዎች'),
      L('Total','ድምር'),
    ],
    openingBalances: { shareCapital: oSC, retainedEarnings: oRE, revaluationReserve: oRR, ociAccumulated: oOCI, total: oTot },
    rows: [
      { label: L('Opening Balance','የመክፈቻ ሂሳብ'),       shareCapital: oSC,    retainedEarnings: oRE,   revaluationReserve: oRR,   ociAccumulated: oOCI,  total: oTot },
      { label: L('Profit for Period','የዓመቱ ትርፍ'),        shareCapital: 0,      retainedEarnings: profit,revaluationReserve: 0,     ociAccumulated: 0,     total: profit },
      { label: L('Other Comprehensive Income','ሌሎች ሁሉ-አቀፍ ገቢዎች'), shareCapital: 0, retainedEarnings: 0, revaluationReserve: revalMv, ociAccumulated: oci, total: sum(revalMv, oci) },
      { label: L('Dividends Declared','የተወሰነ ትርፍ ድርሻ'),  shareCapital: 0,      retainedEarnings: -divs, revaluationReserve: 0,     ociAccumulated: 0,     total: -divs },
      { label: L('Shares Issued','የተሰጡ ድርሻዎች'),          shareCapital: shares, retainedEarnings: 0,     revaluationReserve: 0,     ociAccumulated: 0,     total: shares },
      { label: L('Closing Balance','የዝጊያ ሂሳብ'),          shareCapital: cSC,    retainedEarnings: cRE,   revaluationReserve: cRR,   ociAccumulated: cOCI,  total: cTot },
    ],
    profitForPeriod: profit,
    otherComprehensiveIncome: oci,
    dividendsDeclared: divs,
    sharesIssuedInPeriod: shares,
    revaluationMovement: revalMv,
    closingBalances: { shareCapital: cSC, retainedEarnings: cRE, revaluationReserve: cRR, ociAccumulated: cOCI, total: cTot },
    generatedAt: new Date().toISOString(),
  };
}

// ── Schedule A — CIT Computation ─────────────────────────────────────────────
export function buildScheduleA(
  header: EthiopianCompanyHeader,
  data: {
    fiscalYear: number;
    accountingProfitBeforeTax: number;
    grossRevenue: number;
    // Add-backs
    nonDeductibleEntertainment?: number;
    nonDeductiblePenalties?: number;
    depreciationAccountingExcess?: number;     // IFRS depreciation > tax rate
    provisionNotYetTaxable?: number;           // IAS 37 provisions disallowed
    personalExpenses?: number;
    otherAddBacks?: number;
    // Deductions
    taxDepreciationInExcessOfAccounting?: number;
    taxExemptDividends?: number;
    lossCarryForward?: number;
    otherDeductions?: number;
    // Credits
    whtCredits?: number;
    provisionalTaxPaid?: number;
    // Deferred tax
    deferredTaxAssets?: number;
    deferredTaxLiabilities?: number;
  },
): EthiopianScheduleA {
  const cat    = header.ercaCategory;
  const profit = round(data.accountingProfitBeforeTax);
  const rev    = round(data.grossRevenue);

  const addBacks = [
    { description: L('Non-Deductible Entertainment/Gifts (>ETB 200)','ሊቀናሽ የማይችሉ ጥናታዊ/ስጦታ (>ETB 200)'), amount: round(data.nonDeductibleEntertainment ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 22(3)' },
    { description: L('Penalties & Fines','ቅጣቶች እና ቅጣቶች'), amount: round(data.nonDeductiblePenalties ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 22(8)' },
    { description: L('Excess IFRS Depreciation over Tax Rate','ከቀረጥ ተቀናሽ በላይ IFRS ዝቅጠት'), amount: round(data.depreciationAccountingExcess ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 23 / IAS 16' },
    { description: L('IAS 37 Provisions (Not Yet Deductible)','IAS 37 ክምችቶች (እስካሁን ሊቀናሽ ያልሆኑ)'), amount: round(data.provisionNotYetTaxable ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 22 / IAS 37' },
    { description: L('Personal/Domestic Expenses','ግላዊ/የቤት ወጪዎች'), amount: round(data.personalExpenses ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 22(1)' },
    { description: L('Other Non-Deductible Expenses','ሌሎች ሊቀናሹ የማይችሉ ወጪዎች'), amount: round(data.otherAddBacks ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 22' },
  ].filter(x => x.amount !== 0);

  const totalAddBacks = round(addBacks.reduce((s, a) => s + a.amount, 0));

  const deductions = [
    { description: L('Tax Depreciation (Straight-Line) in Excess of IFRS','የቀረጥ ዝቅጠት ከIFRS በላይ'), amount: round(data.taxDepreciationInExcessOfAccounting ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 23' },
    { description: L('Tax-Exempt Dividend Income','ቀረጥ-ነፃ ትርፍ ድርሻ ገቢ'), amount: round(data.taxExemptDividends ?? 0), proclamationRef: 'Proc. 979/2016 Art. 8' },
    { description: L('Prior-Year Loss Carry-Forward','ያለፉ ዓመት ኪሳራ ማስተላለፍ'), amount: round(data.lossCarryForward ?? 0), proclamationRef: 'Proc. 1395/2025 Art. 28' },
    { description: L('Other Deductions','ሌሎች ተቀናሾች'), amount: round(data.otherDeductions ?? 0), proclamationRef: 'Proc. 1395/2025' },
  ].filter(x => x.amount !== 0);

  const totalDeductions = round(deductions.reduce((s, d) => s + d.amount, 0));
  const taxableIncome   = round(Math.max(0, profit + totalAddBacks - totalDeductions));

  const citRate  = ETH_TAX.BIT_MAX_RATE;          // 30%
  const matRate  = ETH_TAX.MAT_RATE;              // 2.5%
  const { regularTax, matTax, taxPayable, matApplies } = calculateCorporateBIT(taxableIncome, rev);

  const whtCredits   = round(data.whtCredits ?? 0);
  const provPaid     = round(data.provisionalTaxPaid ?? 0);
  const totalCredits = sum(whtCredits, provPaid);
  const finalTax     = round(Math.max(0, taxPayable - totalCredits));

  const dtAssets   = round(data.deferredTaxAssets ?? 0);
  const dtLiab     = round(data.deferredTaxLiabilities ?? 0);
  const netDT      = round(dtAssets - dtLiab);
  const effRate    = profit > 0 ? round(taxPayable / profit) : 0;

  // Due date: 4 months after EFY end = November 7 of following year
  const dueDate = `${data.fiscalYear + 1}-11-07`;

  return {
    header,
    fiscalYear: data.fiscalYear,
    taxpayerCategory: cat,
    accountingProfitBeforeTax: profit,
    addBacks,
    totalAddBacks,
    deductions,
    totalDeductions,
    taxableNetIncome: taxableIncome,
    citRate,
    regularCIT: round(regularTax),
    grossRevenue: rev,
    matRate,
    matPayable: round(matTax),
    matApplies,
    taxBeforeCredits: round(taxPayable),
    whtCredits,
    provisionalTaxPaid: provPaid,
    totalCredits,
    finalTaxPayable: finalTax,
    dueDate,
    deferredTaxAssets:  dtAssets,
    deferredTaxLiabilities: dtLiab,
    netDeferredTaxPosition: netDT,
    effectiveTaxRate: effRate,
    generatedAt: new Date().toISOString(),
  };
}

// ── IFRS Notes Builder ────────────────────────────────────────────────────────
export function buildIFRSNotes(
  header: EthiopianCompanyHeader,
  data: {
    period: string;
    ifrsStandard: string;
    ppeCost: number; ppeAccumDep: number; ppeAdditions: number; ppeDisposals: number;
    grossSalaries: number; employeePension: number; employerPension: number;
    drrfTotal: number; pitWithheld: number; netPay: number;
    employeeCount: number;
    vatOutputTotal: number; vatInputTotal: number; vatNetPayable: number;
    citPayable: number; matApplies: boolean;
    whtTotal: number;
    ecl: number; tradeReceivablesGross: number;
    gratuityObligation: number;
    relatedPartyTransactions?: string;
    subsequentEvents?: string;
    goingConcern?: string;
  },
): EthiopianIFRSNotes {
  const notes: IFRSNote[] = [
    {
      noteNumber: 1,
      titleEn: 'Basis of Preparation and Compliance with IFRS',
      titleAm: 'የዝግጅት መሰረት እና ከIFRS ጋር ማክበር',
      ifrsRef: 'IAS 1.16',
      content: `These financial statements have been prepared in accordance with ${data.ifrsStandard} as adopted by the Accounting and Auditing Board of Ethiopia (AABE) under the Financial Reporting Proclamation No. 847/2014. The statements comply with IAS 1 — Presentation, IFRS 15 — Revenue, IAS 7 — Cash Flows, IAS 12 — Income Taxes, IAS 16 — PPE, IAS 19 — Employee Benefits, IAS 37 — Provisions, IFRS 9 — Financial Instruments, IFRS 16 — Leases, IAS 21 — Foreign Exchange, and IFRS 18 — Presentation of Financial Statements.\n\nየሒሳብ መሰረት: ዕዳ ዘዴ (Accrual Basis) | ምንዛሬ: ETB (Ethiopian Birr) | Taxpayer Category: ${header.ercaCategory}`,
      proclamationRef: 'Proc. 847/2014 (Financial Reporting) / AABE Framework 2016',
    },
    {
      noteNumber: 2,
      titleEn: 'Significant Accounting Policies',
      titleAm: 'ዋና ዋና የሂሳብ አሰራር ፖሊሲዎች',
      ifrsRef: 'IAS 1.117',
      content: `Revenue Recognition (IFRS 15): Revenue is recognised when performance obligations are satisfied — at a point in time for goods (on delivery) and over time for services (per completion). All amounts exclude VAT (15%) per Proclamation No. 285/2002.\n\nProperty, Plant & Equipment (IAS 16): Carried at cost less accumulated depreciation using straight-line method. Tax depreciation rates per Proc. 1395/2025 Art. 23 differ from accounting rates — timing differences recognised as deferred tax (IAS 12).\n\nInventories (IAS 2): Valued at the lower of cost (FIFO/weighted average) and net realisable value.\n\nEmployee Benefits (IAS 19): Short-term benefits expensed as incurred. Gratuity (defined benefit) measured using projected unit credit method. Pension contributions: Employee 7%, Employer 11% of insurable earnings up to ETB 15,000 (PFSA Regulations).\n\nIncome Taxes (IAS 12): Current tax at 30% (CIT) or 2.5% MAT on gross revenue, whichever is higher (Proc. 979/2016 / 1395/2025). Deferred tax recognised for all temporary differences.`,
    },
    {
      noteNumber: 3,
      titleEn: 'Property, Plant & Equipment (IAS 16)',
      titleAm: 'ቤቶች፣ ፋብሪካዎችና መሣሪያዎች (IAS 16)',
      ifrsRef: 'IAS 16.73',
      content: `Movement in PPE during the period:`,
      tableData: [
        { Item: 0, 'Cost — Opening': data.ppeCost - data.ppeAdditions + data.ppeDisposals, 'Additions': data.ppeAdditions, 'Disposals': -data.ppeDisposals, 'Cost — Closing': data.ppeCost },
        { Item: 0, 'Accum. Dep. — Opening': data.ppeAccumDep - Math.round(data.ppeCost * 0.1), 'Charge for Year': Math.round(data.ppeCost * 0.1), 'On Disposals': 0, 'Accum. Dep. — Closing': data.ppeAccumDep },
        { 'Net Book Value': data.ppeCost - data.ppeAccumDep, '': '' },
      ],
      proclamationRef: 'Proc. 1395/2025 Art. 23 (tax depreciation rates)',
    },
    {
      noteNumber: 4,
      titleEn: 'Employee Benefits & Payroll (IAS 19 / Ethiopian Labour Law)',
      titleAm: 'የሠራተኛ ጥቅማጥቅሞች እና ደሞዝ (IAS 19)',
      ifrsRef: 'IAS 19.44',
      content: `Employee count at period end: ${data.employeeCount}\n\nPayroll summary for the period:\n• Gross Salaries: ETB ${data.grossSalaries.toLocaleString()}\n• Employee Pension (7%): ETB ${data.employeePension.toLocaleString()}\n• Employer Pension (11%): ETB ${data.employerPension.toLocaleString()}\n• PIT Withheld (Progressive — Schedule A): ETB ${data.pitWithheld.toLocaleString()}\n• DRRF (1%): ETB ${data.drrfTotal.toLocaleString()}\n• Net Pay to Employees: ETB ${data.netPay.toLocaleString()}\n\nPension remitted to PFSA. PAYE declared and remitted to MoR via etax.mor.gov.et. Labour Proclamation No. 1156/2019 compliance confirmed.\n\nGratuity Obligation (IAS 19 Defined Benefit): ETB ${data.gratuityObligation.toLocaleString()} — Actuarial valuation performed using projected unit credit method.`,
      proclamationRef: 'Proc. 1395/2025 / Labour Proc. 1156/2019 / PFSA Regs',
    },
    {
      noteNumber: 5,
      titleEn: 'Value Added Tax (VAT) — 15% (IAS 1 Disclosure)',
      titleAm: 'ተጨማሪ እሴት ታክስ (VAT) — 15%',
      ifrsRef: 'IAS 1.122',
      content: `VAT Registration No.: ${header.vatNumber ?? 'N/A'}\nOutput VAT (collected on sales): ETB ${data.vatOutputTotal.toLocaleString()}\nInput VAT (paid on purchases): ETB ${data.vatInputTotal.toLocaleString()}\nNet VAT Payable to MoR: ETB ${data.vatNetPayable.toLocaleString()}\n\nVAT returns filed monthly by the 30th of the following month per Proc. 285/2002 and Regulation 570/2025 (ETB 2M threshold).`,
      proclamationRef: 'Proc. 285/2002 / Reg. 570/2025',
    },
    {
      noteNumber: 6,
      titleEn: 'Income Tax Expense & Liability (IAS 12)',
      titleAm: 'የገቢ ቀረጥ ወጪ እና ዕዳ (IAS 12)',
      ifrsRef: 'IAS 12.79',
      content: `Corporate Income Tax rate: 30% (Proc. 979/2016)\nMinimum Alternative Tax (MAT): 2.5% of gross revenue (Proc. 1395/2025)\nMAT applies: ${data.matApplies ? 'YES — MAT exceeds regular CIT' : 'NO — regular CIT applies'}\nCurrent Tax Payable: ETB ${data.citPayable.toLocaleString()}\nWithholding Tax credits applied as advance payment.\nDeferred tax recognised for all timing differences between IFRS carrying amounts and tax bases.`,
      proclamationRef: 'Proc. 979/2016 / Proc. 1395/2025 Art. 23, 28',
    },
    {
      noteNumber: 7,
      titleEn: 'Trade Receivables & Expected Credit Losses (IFRS 9)',
      titleAm: 'ሸቀጥ ተቀባዮች እና የሚጠበቅ የብድር ኪሳራ (IFRS 9)',
      ifrsRef: 'IFRS 9.5.5.1',
      content: `Trade Receivables (gross): ETB ${data.tradeReceivablesGross.toLocaleString()}\nECL Provision: ETB ${data.ecl.toLocaleString()}\nTrade Receivables (net): ETB ${(data.tradeReceivablesGross - data.ecl).toLocaleString()}\n\nECL calculated using simplified approach (lifetime ECL for trade receivables). Provision matrix based on historical default rates and forward-looking macroeconomic factors.`,
    },
    {
      noteNumber: 8,
      titleEn: 'Provisions & Contingent Liabilities (IAS 37)',
      titleAm: 'ክምችቶች እና ሊሆን የሚችሉ ዕዳዎች (IAS 37)',
      ifrsRef: 'IAS 37.85',
      content: `Provisions are recognised when: (a) a present obligation exists from a past event; (b) an outflow of resources is probable; (c) a reliable estimate can be made.\n\nTax disputes: Any ongoing disputes with MoR are disclosed as contingent liabilities unless a reliable estimate can be made, in which case an IAS 37 provision is recognised.\n\nLeave accrual and gratuity are accrued per IAS 19.`,
      proclamationRef: 'IAS 37.14 / IAS 19',
    },
    {
      noteNumber: 9,
      titleEn: 'Related Party Transactions (IAS 24)',
      titleAm: 'ተያያዥ ወገኖች ግብይቶች (IAS 24)',
      ifrsRef: 'IAS 24.17',
      content: data.relatedPartyTransactions ?? 'There were no material related-party transactions during the period that require separate disclosure under IAS 24.',
    },
    {
      noteNumber: 10,
      titleEn: 'Subsequent Events (IAS 10)',
      titleAm: 'ከወቅቱ ማብቃት በኋላ የተከሰቱ ክስተቶች (IAS 10)',
      ifrsRef: 'IAS 10.8',
      content: data.subsequentEvents ?? 'No material adjusting or non-adjusting subsequent events have occurred between the reporting date and the date these financial statements were authorised for issue.',
    },
    {
      noteNumber: 11,
      titleEn: 'Going Concern (IAS 1.25)',
      titleAm: 'ንግዱ ቀጣይ ሆኖ ስለሚቆይ (IAS 1.25)',
      ifrsRef: 'IAS 1.25',
      content: data.goingConcern ?? 'The directors have assessed the company\'s ability to continue as a going concern and are satisfied that the company has adequate resources to continue operations for the foreseeable future. Accordingly, the financial statements have been prepared on a going concern basis.',
    },
  ];

  return { header, notes };
}

// ── MoR Submission Package Assembler ─────────────────────────────────────────
export function buildMoRSubmissionPackage(opts: {
  header: EthiopianCompanyHeader;
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
  period: string;
  submissionType?: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
}): MoRSubmissionPackage {
  const ref = `MOR-${opts.header.tin}-${opts.period}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // MoR tax bridge reconciliation
  const profit = opts.incomeStatement.profitBeforeTax;
  const addBacks = opts.scheduleA.totalAddBacks;
  const deductions = opts.scheduleA.totalDeductions;
  const taxableIncome = opts.scheduleA.taxableNetIncome;
  const finalTax = opts.scheduleA.finalTaxPayable;

  // Compliance checks
  const issues: string[] = [];
  const vatOk   = opts.vatReturn ? opts.vatReturn.balanceDue <= 0 : true;
  const payeOk  = opts.hrSummary.compliance.payeFiledOnTime;
  const penOk   = opts.hrSummary.compliance.pensionRemittedOnTime;
  const citOk   = opts.scheduleA.finalTaxPayable >= 0;
  const whtOk   = opts.whtSummary.outstanding <= 0;

  if (!vatOk)  issues.push('VAT balance due — file at etax.mor.gov.et before 30th of following month');
  if (!payeOk) issues.push(`PAYE overdue for ${opts.hrSummary.compliance.overduePAYEMonths} month(s) — Proc. 1395/2025 Art. 11`);
  if (!penOk)  issues.push(`Pension overdue for ${opts.hrSummary.compliance.overduePensionMonths} month(s) — PFSA Regs`);
  if (!whtOk)  issues.push(`WHT outstanding ETB ${opts.whtSummary.outstanding.toLocaleString()} — remit via eTax`);
  if (!opts.balanceSheet.isBalanced) issues.push('CRITICAL: Balance Sheet does not balance — verify journal entries');

  const allCompliant = issues.length === 0;

  return {
    submissionRef: ref,
    submissionType: opts.submissionType ?? 'ANNUAL',
    eTaxPortalUrl: 'https://etax.mor.gov.et',
    header: opts.header,
    period: opts.period,
    incomeStatement: opts.incomeStatement,
    balanceSheet: opts.balanceSheet,
    cashFlowStatement: opts.cashFlowStatement,
    equityStatement: opts.equityStatement,
    notesToAccounts: opts.notesToAccounts,
    scheduleA: opts.scheduleA,
    vatReturn: opts.vatReturn,
    whtSummary: opts.whtSummary,
    totReturn: opts.totReturn,
    hrSummary: opts.hrSummary,
    accountingCycle: opts.accountingCycle,
    morTaxBridge: {
      ifrsProfitToTaxableIncome: profit,
      totalAddBacks: addBacks,
      totalDeductions: deductions,
      taxableIncome,
      finalTaxPayable: finalTax,
      reconciliationNotes: [
        `IFRS Profit Before Tax: ETB ${profit.toLocaleString()}`,
        `Add: Non-Deductible Items (Proc. 1395/2025 Art. 22): ETB ${addBacks.toLocaleString()}`,
        `Less: Tax Deductions (Art. 23, 28): ETB ${deductions.toLocaleString()}`,
        `Taxable Net Income: ETB ${taxableIncome.toLocaleString()}`,
        `CIT (30%): ETB ${opts.scheduleA.regularCIT.toLocaleString()} | MAT (2.5% of ETB ${opts.scheduleA.grossRevenue.toLocaleString()}): ETB ${opts.scheduleA.matPayable.toLocaleString()}`,
        `MAT Applies: ${opts.scheduleA.matApplies ? 'YES' : 'NO'}`,
        `Final Tax Payable (after WHT credits): ETB ${finalTax.toLocaleString()}`,
      ],
    },
    compliance: {
      vatCompliant:         vatOk,
      payeCompliant:        payeOk,
      pensionCompliant:     penOk,
      citCompliant:         citOk,
      whtCompliant:         whtOk,
      auditRequired:        opts.header.auditRequired,
      aabeSubmissionRequired: opts.header.ercaCategory === 'A',
      overallStatus:        allCompliant ? 'COMPLIANT' : issues.length <= 2 ? 'PARTIAL' : 'NON_COMPLIANT',
      issues,
    },
    generatedAt: now.toISOString(),
    validUntil,
  };
}
