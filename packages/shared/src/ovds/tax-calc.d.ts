import { z } from 'zod';
import { ETH_TAX } from '../constants';
export declare enum TaxCalculationType {
    NORMAL = "NORMAL",
    INCLUSIVE = "INCLUSIVE",
    COMPOUND = "COMPOUND",
    FIXED = "FIXED",
    WITHHOLDING = "WITHHOLDING"
}
export declare const TAX_CALCULATION_TYPE_LABELS: Record<TaxCalculationType, string>;
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
export declare function computeTaxFromType(type: TaxCalculationType, input: TaxCalculationInput): TaxCalculationResult;
export declare const TaxCalculationTypeSchema: z.ZodEnum<typeof TaxCalculationType>;
/** Withholding tax types (keys mirror WHT rate map below). */
export type WhtType = 'GOODS' | 'SERVICES' | 'SERVICES_NR' | 'RENT' | 'DIVIDEND' | 'INTEREST';
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
declare const DRRF_RATES: Record<string, number>;
export declare function calcVAT(amount: number, inclusive?: boolean): VatResult;
export declare function calcWHT(amount: number, type?: WhtType): {
    whtAmount: number;
    netPayable: number;
    rate: number;
};
export declare function getWhtLabel(type: WhtType): string;
/**
 * Corporate Business Income Tax (CIT) under Proclamation No. 979/2016.
 * Flat 30% on taxable profit, with Minimum Alternative Tax (MAT) of 2.5% of
 * annual revenue applied when it exceeds the regular BIT.
 */
export declare function calculateCorporateBIT(taxableProfit: number, annualRevenue?: number): {
    regularTax: number;
    matTax: number;
    taxPayable: number;
    matApplies: boolean;
    effectiveRate: number;
};
/** Progressive BIT for sole-proprietors / individuals. */
export declare function calculateBIT(annualProfit: number): {
    tax: number;
    effectiveRate: number;
};
export declare function calcDRRF(amount: number, category?: DrrfCategory): {
    levyAmount: number;
    rate: number;
    netAmount: number;
};
export declare function calcTOT(amount: number, transactionType: 'GOODS' | 'CONSTRUCTION_GRAIN_FARM' | 'SERVICES' | 'IMPORT', isVatRegistered: boolean): {
    totAmount: number;
    rate: number;
    applicable: boolean;
};
/** Payment modes recognised by the MoR / EIMS schema. */
export type PaymentMode = 'CASH' | 'CHEQUE' | 'CPO' | 'Local Bank Transfer' | 'SWIFT' | 'Wire Transfer' | 'Letter of Credit' | 'Card';
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
    reason: null | 'CASH_ABOVE_CAP' | 'MISSING_SETTLEMENT_REFERENCE';
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
export declare function checkExpenseDeductibility(amount: number, paymentMode: PaymentMode, settlementReference?: string | null): ExpenseDeductibilityResult;
export declare function calcExcise(amount: number, category?: keyof typeof ETH_TAX.EXCISE_RATES): {
    exciseAmount: number;
    rate: number;
    applicable: boolean;
};
export declare function calcImportSurtax(cifValue: number, customsDuty?: number, exciseDuty?: number): {
    importSurtaxAmount: number;
    rate: number;
    importBase: number;
};
export declare function calcStampDuty(isContract?: boolean, contractValue?: number): {
    stampDutyAmount: number;
    rate: number;
    required: boolean;
};
export declare function calculateInvoiceTaxBreakdown(subtotal: number, isVatRegistered: boolean, transactionType?: 'GOODS' | 'CONSTRUCTION_GRAIN_FARM' | 'SERVICES' | 'IMPORT', exciseCategory?: keyof typeof ETH_TAX.EXCISE_RATES | null, isContract?: boolean, contractValue?: number, importCifValue?: number, importCustomsDuty?: number, importExciseDuty?: number, vatRateOverride?: number, applyWhtServices?: boolean, applyWhtGoods?: boolean, applyWhtDividends?: boolean): {
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
};
export declare function getEthFiscalYear(date?: Date): string;
export declare function getEthFiscalYearDates(gregorianYear: number): {
    start: Date;
    end: Date;
    label: string;
};
export declare function getBITFilingDeadline(fiscalYear: number): Date;
export declare function getNextVatDeadline(date?: Date): Date;
export declare function getNextDrrfDeadline(date?: Date): Date;
export declare function getVatPeriod(date?: Date): string;
export declare function isVatRegistered(annualTurnover: number): boolean;
export declare function classifyIfrs18(accountCategory: string): Ifrs18Category;
export declare function fmtETB(amount: number | string, decimals?: number): string;
export declare function fmtCurrencyAmount(amount: number | string, currency?: string, decimals?: number): string;
export {};
//# sourceMappingURL=tax-calc.d.ts.map