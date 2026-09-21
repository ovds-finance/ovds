/**
 * ExchangeTransformer — Ovds SaaS Multi-Currency Engine
 * ──────────────────────────────────────────────────────
 * Isolated multi-currency math engine for Ovds SaaS.
 *
 * Ovds SaaS architecture principle:
 *   "All core math calculations run through an isolated Exchange Transformer.
 *    When an invoice is created in a vendor's foreign currency, the state
 *    manager retains BOTH the base transaction value AND the calculated
 *    converted local currency simultaneously."
 *
 * This module is intentionally framework-agnostic: no NestJS decorators,
 * no Prisma, no side-effects. It is pure computation consumed by the
 * backend service layer, the frontend InvoiceFormAk, and tests alike.
 */
/** ISO-4217 currency code, e.g. "ETB", "USD", "EUR". */
export type CurrencyCode = string;
/**
 * A monetary amount that always carries both its original (foreign) value
 * and its equivalent in the tenant's functional (base) currency.
 *
 * This dual representation is the single most important invariant of the
 * ExchangeTransformer: once a value is converted, neither side is lost.
 */
export interface DualAmount {
    /** Amount in the original transaction currency */
    foreign: number;
    /** ISO-4217 code of the foreign currency, e.g. "USD" */
    foreignCurrency: CurrencyCode;
    /** Exchange rate applied: 1 unit of foreignCurrency = rate × baseCurrency */
    rate: number;
    /** Equivalent amount in the tenant's base (functional) currency */
    base: number;
    /** ISO-4217 code of the base (functional) currency, e.g. "ETB" */
    baseCurrency: CurrencyCode;
    /** Timestamp when the rate was captured — important for audit trails */
    rateAt: Date;
}
/**
 * A complete invoice monetary breakdown in both currencies.
 */
export interface DualInvoiceTotals {
    subtotal: DualAmount;
    vatAmount: DualAmount;
    drrfAmount: DualAmount;
    totalAmount: DualAmount;
    discountAmount: DualAmount;
}
/**
 * Input for a single line item, currency-agnostic.
 */
export interface LineItemInput {
    quantity: number;
    price: number;
    /** Line-level discount value */
    discountValue?: number;
    /** 'FIXED' | 'PERCENT' */
    discountType?: string;
    /** Whether VAT applies to this line (default: true) */
    taxable?: boolean;
}
declare function round(n: number): number;
export declare class ExchangeTransformer {
    /**
     * Convert a single foreign-currency amount to the base currency.
     *
     * @param foreign        Amount in the foreign currency
     * @param foreignCurrency ISO-4217 code of the foreign currency
     * @param rate           Exchange rate: 1 foreignCurrency = rate baseCurrency units
     * @param baseCurrency   ISO-4217 code of the tenant's functional currency
     * @param rateAt         Timestamp the rate was captured (defaults to now)
     */
    static convert(foreign: number, foreignCurrency: CurrencyCode, rate: number, baseCurrency: CurrencyCode, rateAt?: Date): DualAmount;
    /**
     * Compute full invoice totals, returning every monetary component as a
     * DualAmount so the caller always has both foreign and base representations.
     *
     * @param items           Line items (prices already in foreignCurrency)
     * @param vatRate         VAT rate as a percentage, e.g. 15 for 15%
     * @param drrfRate        DRRF rate as a percentage, e.g. 1 for 1%
     * @param foreignCurrency ISO-4217 code of the invoice currency
     * @param rate            Exchange rate to the tenant's base currency
     * @param baseCurrency    Tenant's functional currency (e.g. "ETB")
     * @param invoiceDiscount Invoice-level discount (applied before DRRF)
     * @param invoiceDiscountType 'FIXED' | 'PERCENT'
     * @param rateAt          When the rate was captured
     */
    static computeInvoiceTotals(items: LineItemInput[], vatRate: number, drrfRate: number, foreignCurrency: CurrencyCode, rate: number, baseCurrency: CurrencyCode, invoiceDiscount?: number, invoiceDiscountType?: 'FIXED' | 'PERCENT', rateAt?: Date): DualInvoiceTotals;
    /**
     * Re-state a historical DualAmount at a new exchange rate.
     * Useful when displaying an old invoice that was recorded in a foreign
     * currency but needs to show its current-rate equivalent in a report.
     */
    static restate(amount: DualAmount, newRate: number, newRateAt?: Date): DualAmount;
    /**
     * Check whether a transaction currency is the same as the base currency.
     * When true, rate is always 1 and no conversion is needed.
     */
    static isBaseCurrency(foreignCurrency: CurrencyCode, baseCurrency: CurrencyCode): boolean;
    /**
     * Format a DualAmount for display: returns a locale string in the
     * foreign currency, with an optional parenthetical base equivalent.
     *
     * Example: "USD 1,250.00 (ETB 72,500.00)"
     */
    static format(amount: DualAmount, locale?: string, showBase?: boolean): string;
}
export { round as roundCurrency };
//# sourceMappingURL=exchange-transformer.d.ts.map