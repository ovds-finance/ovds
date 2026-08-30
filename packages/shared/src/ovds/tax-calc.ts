import { z } from 'zod';
import { ETH_TAX } from '../constants';

// Orthogonal to TaxRate.type (the tax *category*: VAT / WITHHOLDING / ...).
// Describes HOW the tax is computed/applied, per the OVDS tax-type model:
//   NORMAL      — exclusive sales tax added on top at point of sale
//   INCLUSIVE   — tax embedded in the quoted price (back-calculated)
//   COMPOUND    — applied on top of a primary tax (tax-on-tax)
//   FIXED       — fixed monetary amount, not a percentage
//   WITHHOLDING — withheld by the payer and remitted to the tax authority
export enum TaxCalculationType {
  NORMAL = 'NORMAL',
  INCLUSIVE = 'INCLUSIVE',
  COMPOUND = 'COMPOUND',
  FIXED = 'FIXED',
  WITHHOLDING = 'WITHHOLDING',
}

export const TAX_CALCULATION_TYPE_LABELS: Record<TaxCalculationType, string> = {
  [TaxCalculationType.NORMAL]: 'Normal',
  [TaxCalculationType.INCLUSIVE]: 'Inclusive',
  [TaxCalculationType.COMPOUND]: 'Compound',
  [TaxCalculationType.FIXED]: 'Fixed',
  [TaxCalculationType.WITHHOLDING]: 'Withholding',
};

export interface TaxCalculationInput {
  amount: number;
  rate?: number;
  fixedAmount?: number;
  baseTax?: number;
}

export interface TaxCalculationResult {
  net: number;
  tax: number;
  total: number;
  effectiveRate: number;
}

export function computeTaxFromType(
  type: TaxCalculationType,
  input: TaxCalculationInput,
): TaxCalculationResult {
  const { amount, rate = 0, fixedAmount = 0, baseTax = 0 } = input;

  if (type === TaxCalculationType.INCLUSIVE) {
    const tax = rate > 0 ? (amount * rate) / (1 + rate) : 0;
    const net = amount - tax;
    return { net, tax, total: amount, effectiveRate: net > 0 ? tax / net : 0 };
  }

  if (type === TaxCalculationType.FIXED) {
    return { net: amount, tax: fixedAmount, total: amount + fixedAmount, effectiveRate: amount > 0 ? fixedAmount / amount : 0 };
  }

  if (type === TaxCalculationType.COMPOUND) {
    const primaryTax = baseTax > 0 ? baseTax : amount * rate;
    const compoundTax = (amount + primaryTax) * rate;
    const tax = primaryTax + compoundTax;
    return { net: amount, tax, total: amount + tax, effectiveRate: amount > 0 ? tax / amount : 0 };
  }

  // NORMAL and WITHHOLDING share the exclusive calculation; WITHHOLDING is
  // withheld by the payer and remitted to the authority rather than added to AR.
  const tax = amount * rate;
  return { net: amount, tax, total: amount + tax, effectiveRate: rate };
}

export const TaxCalculationTypeSchema = z.nativeEnum(TaxCalculationType);

// =============================================================================
// Ethiopian Tax Calculation Utilities (Proclamation No. 1395/2025, 979/2016, ...)
// Single source of truth — re-exported by frontend/utils/ethiopianTax.ts and
// the @ovds/ui package.
// =============================================================================

/** Withholding tax types (keys mirror WHT rate map below). */
export type WhtType =
  | 'GOODS'
  | 'SERVICES'
  | 'SERVICES_NR'
  | 'RENT'
  | 'DIVIDEND'
  | 'INTEREST';

/** Result of an exclusive / inclusive VAT computation. */
export interface VatResult {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
}

/** DRRF levy categories. */
export type DrrfCategory = keyof typeof DRRF_RATES;

/** IFRS 18 primary statement of performance categories. */
export type Ifrs18Category = 'OPERATING' | 'INVESTING' | 'FINANCING' | 'INCOME_TAX';

/** IFRS 18 line-item classification pairing an account category with its class. */
export interface Ifrs18LineItem {
  category: string;
  classification: Ifrs18Category;
}

// -- BIT (Business Income Tax) progressive brackets ---------------------------
// For sole-proprietors / individuals. Corporate entities use the flat 30% CIT
// computed by calculateCorporateBIT().
const BIT_BRACKETS = [
  { min: 0,      max: 7_200,   rate: 0,     deduction: 0 },
  { min: 7_201,  max: 19_800,  rate: 0.1,   deduction: 720 },
  { min: 19_801, max: 38_400,  rate: 0.15,  deduction: 1_710 },
  { min: 38_401, max: 63_000,  rate: 0.2,   deduction: 3_630 },
  { min: 63_001, max: 93_600,  rate: 0.25,  deduction: 6_780 },
  { min: 93_601, max: 130_800, rate: 0.3,   deduction: 11_460 },
  { min: 130_801, max: Infinity, rate: 0.35, deduction: 18_000 },
];

// -- DRRF (Disaster Risk Response Fund) levy rates ---------------------------
const DRRF_RATES: Record<string, number> = {
  LOAN_VALUE: 0.01,
  INSURANCE_PREMIUM: 0.01,
  SERVICE_FEES: 0.05,
  AIRTIME_SALES: 0.05,
  TICKET_SALES: 0.05,
  ANNUAL_SALES_REVENUE: 0.05,
  FUEL_SALES: 0.05,
  TOBACCO_ALCOHOL: 0.05,
  GOVERNMENT_SERVICES: 0.05,
  SALARY_CONTRIBUTION: 0.01,
  TELECOM_DIGITAL: 0.05,
  DIVIDEND: 0.01,
  OTHER: 0.01,
};

export function calcVAT(amount: number, inclusive = false): VatResult {
  if (inclusive) {
    const netAmount = amount / (1 + ETH_TAX.VAT_RATE);
    const vatAmount = amount - netAmount;
    return { netAmount, vatAmount, grossAmount: amount, vatRate: ETH_TAX.VAT_RATE };
  }
  const vatAmount = amount * ETH_TAX.VAT_RATE;
  return { netAmount: amount, vatAmount, grossAmount: amount + vatAmount, vatRate: ETH_TAX.VAT_RATE };
}

export function calcWHT(amount: number, type: WhtType = 'GOODS'): {
  whtAmount: number;
  netPayable: number;
  rate: number;
} {
  const rateMap: Record<WhtType, number> = {
    GOODS: ETH_TAX.WHT_GOODS_RATE,
    SERVICES: ETH_TAX.WHT_SERVICE_RATE,
    SERVICES_NR: ETH_TAX.WHT_SERVICE_NR_RATE,
    RENT: 0.3,
    DIVIDEND: ETH_TAX.WHT_DIVIDEND_RATE,
    INTEREST: ETH_TAX.WHT_INTEREST_RATE,
  };
  const rate = rateMap[type];
  const whtAmount = amount * rate;
  return { whtAmount, netPayable: amount - whtAmount, rate };
}

export function getWhtLabel(type: WhtType): string {
  const labels: Record<WhtType, string> = {
    GOODS: 'Goods ≥ ETB 10K (3%)',
    SERVICES: 'Services ≥ ETB 500 (3%)',
    SERVICES_NR: 'Non-Resident Services (15%)',
    RENT: 'Rent (30%)',
    DIVIDEND: 'Dividend (15%) — Proc. 1395/2025',
    INTEREST: 'Interest (10%) — Proc. 1395/2025',
  };
  return labels[type];
}

/**
 * Corporate Business Income Tax (CIT) under Proclamation No. 979/2016.
 * Flat 30% on taxable profit, with Minimum Alternative Tax (MAT) of 2.5% of
 * annual revenue applied when it exceeds the regular BIT.
 */
export function calculateCorporateBIT(
  taxableProfit: number,
  annualRevenue = 0,
): {
  regularTax: number;
  matTax: number;
  taxPayable: number;
  matApplies: boolean;
  effectiveRate: number;
} {
  const regularTax = Math.max(0, taxableProfit * ETH_TAX.BIT_MAX_RATE);
  const matTax = annualRevenue ? annualRevenue * ETH_TAX.MAT_RATE : 0;
  const matApplies = matTax > regularTax;
  const taxPayable = matApplies ? matTax : regularTax;
  return {
    regularTax,
    matTax,
    taxPayable,
    matApplies,
    effectiveRate: taxableProfit > 0 ? taxPayable / taxableProfit : 0,
  };
}

/** Progressive BIT for sole-proprietors / individuals. */
export function calculateBIT(annualProfit: number): {
  tax: number;
  effectiveRate: number;
} {
  let tax = 0;
  for (let i = BIT_BRACKETS.length - 1; i >= 0; i--) {
    const b = BIT_BRACKETS[i];
    if (annualProfit >= b.min) {
      tax = Math.max(0, annualProfit * b.rate - b.deduction);
      break;
    }
  }
  return { tax, effectiveRate: annualProfit > 0 ? tax / annualProfit : 0 };
}

export function calcDRRF(
  amount: number,
  category: DrrfCategory = 'OTHER',
): { levyAmount: number; rate: number; netAmount: number } {
  const rate = DRRF_RATES[category];
  const levyAmount = amount * rate;
  return { levyAmount, rate, netAmount: amount - levyAmount };
}

export function calcTOT(
  amount: number,
  transactionType: 'GOODS' | 'CONSTRUCTION_GRAIN_FARM' | 'SERVICES' | 'IMPORT',
  isVatRegistered: boolean,
): { totAmount: number; rate: number; applicable: boolean } {
  if (isVatRegistered) {
    return { totAmount: 0, rate: 0, applicable: false };
  }
  let rate: number;
  if (transactionType === 'GOODS') {
    rate = ETH_TAX.TOT_GOODS_RATE;
  } else if (transactionType === 'CONSTRUCTION_GRAIN_FARM') {
    rate = ETH_TAX.TOT_CONSTRUCTION_RATE;
  } else {
    rate = ETH_TAX.TOT_SERVICES_RATE;
  }
  const totAmount = amount * rate;
  return { totAmount, rate, applicable: true };
}

/** Payment modes recognised by the MoR / EIMS schema. */
export type PaymentMode =
  | 'CASH'
  | 'CHEQUE'
  | 'CPO'
  | 'Local Bank Transfer'
  | 'SWIFT'
  | 'Wire Transfer'
  | 'Letter of Credit'
  | 'Card';

export interface ExpenseDeductibilityResult {
  /** True when the expense may be claimed as a deductible business expense. */
  deductible: boolean;
  /** True when the amount exceeds the electronic-settlement cap. */
  capExceeded: boolean;
  /** True when a payment/cheque reference must be supplied to prove settlement. */
  referenceRequired: boolean;
  /** The cap that was applied (ETB). */
  cap: number;
  /** Machine-readable reason when not deductible. */
  reason:
    | null
    | 'CASH_ABOVE_CAP'
    | 'MISSING_SETTLEMENT_REFERENCE';
  /** Human-readable explanation for the UI / audit trail. */
  message: string | null;
}

/**
 * Enforce the ETB 50,000 electronic-settlement rule for deductible expenses.
 *
 * Any single business-to-business payment above
 * `ETH_TAX.CASH_PAYMENT_DEDUCTION_CAP` must be settled electronically or by
 * cheque AND carry a payment reference, otherwise the MoR disallows the
 * deduction on audit.
 *
 * Amounts at or below the cap are deductible regardless of payment mode.
 */
export function checkExpenseDeductibility(
  amount: number,
  paymentMode: PaymentMode,
  settlementReference?: string | null,
): ExpenseDeductibilityResult {
  const cap = ETH_TAX.CASH_PAYMENT_DEDUCTION_CAP;
  const capExceeded = amount > cap;

  if (!capExceeded) {
    return {
      deductible: true,
      capExceeded: false,
      referenceRequired: false,
      cap,
      reason: null,
      message: null,
    };
  }

  const isElectronic = (
    ETH_TAX.ELECTRONIC_SETTLEMENT_MODES as readonly string[]
  ).includes(paymentMode);

  if (!isElectronic) {
    return {
      deductible: false,
      capExceeded: true,
      referenceRequired: true,
      cap,
      reason: 'CASH_ABOVE_CAP',
      message:
        `Payments above ETB ${cap.toLocaleString()} must be settled electronically or by cheque. ` +
        `A cash-settled payment of ETB ${amount.toLocaleString()} is not a deductible expense.`,
    };
  }

  if (!settlementReference || settlementReference.trim() === '') {
    return {
      deductible: false,
      capExceeded: true,
      referenceRequired: true,
      cap,
      reason: 'MISSING_SETTLEMENT_REFERENCE',
      message:
        `A payment reference or cheque number is required to prove electronic settlement ` +
        `for amounts above ETB ${cap.toLocaleString()}.`,
    };
  }

  return {
    deductible: true,
    capExceeded: true,
    referenceRequired: true,
    cap,
    reason: null,
    message: null,
  };
}

export function calcExcise(
  amount: number,
  category: keyof typeof ETH_TAX.EXCISE_RATES = 'ALCOHOL',
): { exciseAmount: number; rate: number; applicable: boolean } {
  const rate = ETH_TAX.EXCISE_RATES[category] ?? 0;
  const exciseAmount = amount * Math.min(rate, ETH_TAX.EXCISE_RATE_MAX);
  return {
    exciseAmount,
    rate,
    applicable: rate > 0 && amount > 0,
  };
}

export function calcImportSurtax(
  cifValue: number,
  customsDuty = 0,
  exciseDuty = 0,
): { importSurtaxAmount: number; rate: number; importBase: number } {
  const importBase = cifValue + customsDuty + exciseDuty;
  const importSurtaxAmount = importBase * ETH_TAX.IMPORT_SURTAX_RATE;
  return {
    importSurtaxAmount,
    rate: ETH_TAX.IMPORT_SURTAX_RATE,
    importBase,
  };
}

export function calcStampDuty(
  isContract = false,
  contractValue = 0,
): { stampDutyAmount: number; rate: number; required: boolean } {
  const required = isContract && contractValue > 0;
  if (!required) {
    return { stampDutyAmount: 0, rate: 0, required: false };
  }
  const rate = 0.01;
  const computedStamp = contractValue * rate;
  const stampDutyAmount = Math.max(computedStamp, ETH_TAX.STAMP_DUTY_MIN);
  return { stampDutyAmount, rate, required: true };
}

export function calculateInvoiceTaxBreakdown(
  subtotal: number,
  isVatRegistered: boolean,
  transactionType: 'GOODS' | 'CONSTRUCTION_GRAIN_FARM' | 'SERVICES' | 'IMPORT' = 'GOODS',
  exciseCategory: keyof typeof ETH_TAX.EXCISE_RATES | null = null,
  isContract = false,
  contractValue = 0,
  importCifValue = 0,
  importCustomsDuty = 0,
  importExciseDuty = 0,
  vatRateOverride?: number,
  applyWhtServices = false,
  applyWhtGoods = false,
  applyWhtDividends = false,
): {
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  isVatRegistered: boolean;
  totAmount: number;
  totRate: number;
  exciseAmount: number;
  exciseRate: number;
  exciseCategory: keyof typeof ETH_TAX.EXCISE_RATES | null;
  importSurtaxAmount: number;
  importSurtaxRate: number;
  importBase: number;
  whtOnServicesAmount: number;
  whtOnGoodsAmount: number;
  whtOnDividendsAmount: number;
  whtRate: number;
  whtType: 'SERVICES' | 'GOODS' | 'DIVIDEND' | null;
  drrfAmount: number;
  drrfRate: number;
  stampDutyAmount: number;
  stampDutyRate: number;
  stampDutyRequired: boolean;
  taxFreeTotal: number;
  totalTaxAdded: number;
  totalDeductions: number;
  netPayable: number;
  grossAmount: number;
} {
  const vatRate = vatRateOverride ?? ETH_TAX.VAT_RATE;
  const vatAmount = isVatRegistered ? subtotal * vatRate : 0;
  const totTxType =
    transactionType === 'IMPORT'
      ? 'SERVICES'
      : transactionType === 'CONSTRUCTION_GRAIN_FARM'
        ? 'CONSTRUCTION_GRAIN_FARM'
        : transactionType;
  const totResult = calcTOT(subtotal, totTxType, isVatRegistered);
  const exciseResult = exciseCategory
    ? calcExcise(subtotal, exciseCategory)
    : { exciseAmount: 0, rate: 0, applicable: false };
  const importResult = calcImportSurtax(importCifValue, importCustomsDuty, importExciseDuty);
  const stampResult = calcStampDuty(isContract, contractValue);
  const whtServices =
    applyWhtServices && subtotal >= ETH_TAX.WHT_SERVICE_THRESHOLD ? subtotal * ETH_TAX.WHT_SERVICE_RATE : 0;
  const whtGoods =
    applyWhtGoods && subtotal >= ETH_TAX.WHT_GOODS_THRESHOLD ? subtotal * ETH_TAX.WHT_GOODS_RATE : 0;
  const whtDividends = applyWhtDividends ? subtotal * ETH_TAX.WHT_DIVIDEND_RATE : 0;
  const drrfAmount = subtotal * ETH_TAX.DRRF_RATE;
  const totalAdded =
    vatAmount +
    totResult.totAmount +
    exciseResult.exciseAmount +
    importResult.importSurtaxAmount +
    stampResult.stampDutyAmount;
  const totalDeductions = whtServices + whtGoods + whtDividends;
  const grossAmount = subtotal + totalAdded;
  const netPayable = grossAmount - totalDeductions;
  return {
    subtotal,
    vatAmount,
    vatRate,
    isVatRegistered,
    totAmount: totResult.totAmount,
    totRate: totResult.rate,
    exciseAmount: exciseResult.exciseAmount,
    exciseRate: exciseResult.rate,
    exciseCategory,
    importSurtaxAmount: importResult.importSurtaxAmount,
    importSurtaxRate: importResult.rate,
    importBase: importResult.importBase,
    whtOnServicesAmount: whtServices,
    whtOnGoodsAmount: whtGoods,
    whtOnDividendsAmount: whtDividends,
    whtRate: whtServices > 0
      ? ETH_TAX.WHT_SERVICE_RATE
      : whtGoods > 0
        ? ETH_TAX.WHT_GOODS_RATE
        : whtDividends > 0
          ? ETH_TAX.WHT_DIVIDEND_RATE
          : 0,
    whtType: whtServices > 0 ? 'SERVICES' : whtGoods > 0 ? 'GOODS' : whtDividends > 0 ? 'DIVIDEND' : null,
    drrfAmount: Math.round(drrfAmount * 100) / 100,
    drrfRate: ETH_TAX.DRRF_RATE,
    stampDutyAmount: stampResult.stampDutyAmount,
    stampDutyRate: stampResult.rate,
    stampDutyRequired: stampResult.required,
    taxFreeTotal: 0,
    totalTaxAdded: Math.round(totalAdded * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPayable: Math.round(netPayable * 100) / 100,
    grossAmount: Math.round(grossAmount * 100) / 100,
  };
}

export function getEthFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 7 ? `EFY ${year}/${year + 1}` : `EFY ${year - 1}/${year}`;
}

export function getEthFiscalYearDates(gregorianYear: number): {
  start: Date;
  end: Date;
  label: string;
} {
  const start = new Date(gregorianYear, 6, 8);
  const end = new Date(gregorianYear + 1, 6, 7);
  return { start, end, label: `EFY ${gregorianYear}/${gregorianYear + 1}` };
}

export function getBITFilingDeadline(fiscalYear: number): Date {
  return new Date(fiscalYear + 1, 10, 7);
}

export function getNextVatDeadline(date: Date = new Date()): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  return new Date(y, m + 1, 30);
}

export function getNextDrrfDeadline(date: Date = new Date()): Date {
  const m = date.getMonth();
  const y = date.getFullYear();
  const quarterEnds = [2, 5, 8, 11];
  const nextQEnd = quarterEnds.find((qm) => qm >= m) ?? 11;
  const nextYear = nextQEnd < m ? y + 1 : y;
  return new Date(nextYear, nextQEnd, 15);
}

export function getVatPeriod(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${m}`;
}

export function isVatRegistered(annualTurnover: number): boolean {
  return annualTurnover >= ETH_TAX.VAT_REGISTRATION_THRESHOLD;
}

export function classifyIfrs18(accountCategory: string): Ifrs18Category {
  const operating = [
    'REVENUE',
    'COST_OF_GOODS_SOLD',
    'OPERATING_EXPENSE',
    'SELLING_EXPENSE',
    'ADMIN_EXPENSE',
    'DEPRECIATION',
    'AMORTISATION',
    'EMPLOYEE_BENEFIT',
    'PENSION_EXPENSE',
    'DRRF_EXPENSE',
    'VAT_EXPENSE',
    'OTHER_INCOME',
    'OTHER_EXPENSE',
    'PROVISION',
    'IMPAIRMENT',
  ];
  const investing = [
    'INVESTMENT_INCOME',
    'GAIN_ON_DISPOSAL',
    'LOSS_ON_DISPOSAL',
    'DIVIDEND_INCOME',
    'INTEREST_INCOME_INVEST',
    'FAIR_VALUE_GAIN',
    'FAIR_VALUE_LOSS',
    'EQUITY_METHOD_INCOME',
  ];
  const financing = [
    'INTEREST_EXPENSE',
    'ovds_COST',
    'LEASE_INTEREST',
    'BORROWING_COST',
    'DIVIDEND_EXPENSE',
    'FOREIGN_EXCHANGE_GAIN',
    'FOREIGN_EXCHANGE_LOSS',
  ];
  const taxExpense = ['TAX_EXPENSE', 'DEFERRED_TAX', 'CURRENT_TAX'];
  if (taxExpense.includes(accountCategory)) return 'INCOME_TAX';
  if (financing.includes(accountCategory)) return 'FINANCING';
  if (investing.includes(accountCategory)) return 'INVESTING';
  return 'OPERATING';
}

export function fmtETB(amount: number | string, decimals = 2): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return 'ETB 0.00';
  return `ETB ${new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)}`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ETB: 'ETB', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  CNY: '¥', AED: 'AED', SAR: 'SAR', KES: 'KES', UGX: 'UGX',
};

export function fmtCurrencyAmount(amount: number | string, currency = 'ETB', decimals = 2): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return `${currency} 0.00`;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
  return `${symbol} ${formatted}`;
}
