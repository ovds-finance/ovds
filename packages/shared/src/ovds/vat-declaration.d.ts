/** How a supply is treated for VAT. */
export type VatTreatment = 
/** 15% standard rate. */
'STANDARD'
/** 0% but still a taxable supply — exports, and input VAT IS recoverable. */
 | 'ZERO_RATED'
/** Outside VAT — input VAT is NOT recoverable. */
 | 'EXEMPT';
/** Whether a line is an output (sale) or input (purchase). */
export type VatDirection = 'OUTPUT' | 'INPUT';
/**
 * What an input purchase is used for, which decides recoverability.
 *
 * Input VAT is recoverable when the purchase is attributable to taxable
 * supplies — including ZERO-RATED exports, which are taxable at 0% and so keep
 * full recovery. It is NOT recoverable when attributable to exempt supplies.
 * Mixed use is apportioned by the caller (see allocateCents in money.ts).
 */
export type InputAttribution = 'TAXABLE' | 'EXEMPT';
export interface VatDeclarationLineInput {
    /** Stable reference — invoice number or IRN. */
    invoiceReference: string;
    direction: VatDirection;
    /**
     * The VAT treatment actually applied to this line.
     *
     * For OUTPUT lines this is how the sale was taxed.
     * For INPUT lines this is the rate the SUPPLIER charged — an exporter buys
     * at STANDARD 15% even though it sells ZERO_RATED.
     */
    treatment: VatTreatment;
    /**
     * INPUT lines only: what the purchase is used for. Defaults to 'TAXABLE'.
     * Set to 'EXEMPT' to block recovery.
     */
    attributableTo?: InputAttribution;
    /**
     * Line amount in ETB. A decimal string is preferred (lossless); numbers are
     * accepted and converted half-up.
     */
    amount: number | string;
    /** True when `amount` already includes VAT. */
    amountIsVatInclusive?: boolean;
    /**
     * Override the statutory rate as a decimal fraction (e.g. 0.15).
     * Only for historic periods filed under a superseded rate.
     */
    rateOverride?: number;
}
export interface VatDeclarationLineResult {
    invoiceReference: string;
    direction: VatDirection;
    treatment: VatTreatment;
    /** INPUT lines only — what the purchase is attributable to. */
    attributableTo?: InputAttribution;
    /** Rate applied, as a decimal fraction. */
    rate: number;
    /** Net (VAT-exclusive) amount, santim. */
    netCents: number;
    /** VAT amount, santim. */
    vatCents: number;
    /** net + vat, santim. */
    grossCents: number;
    /** True when this line's VAT counts toward recoverable input VAT. */
    recoverable: boolean;
}
export interface VatDeclarationTotals {
    /** Net standard-rated + zero-rated + exempt sales, santim. */
    totalSalesCents: number;
    /** Net purchases, santim. */
    totalPurchasesCents: number;
    /** VAT charged on sales, santim. */
    outputVatCents: number;
    /** VAT paid on purchases that is recoverable, santim. */
    inputVatCents: number;
    /** VAT paid on purchases that is NOT recoverable (exempt supplies), santim. */
    nonRecoverableInputVatCents: number;
    /**
     * output - recoverable input, santim.
     * Positive = payable to the MoR. Negative = credit carried forward / refundable.
     */
    netVatPayableCents: number;
    /** Net standard-rated sales only, santim. */
    standardRatedSalesCents: number;
    zeroRatedSalesCents: number;
    exemptSalesCents: number;
}
export interface VatDeclarationComputation extends VatDeclarationTotals {
    lines: VatDeclarationLineResult[];
    /** Rate used for STANDARD lines without an override. */
    standardRate: number;
}
/**
 * Compute a full monthly VAT declaration in exact santim.
 *
 * Each line's VAT is rounded half-up exactly once; the totals are then integer
 * sums of already-rounded line values, so `outputVatCents` always equals the
 * sum of the output line `vatCents` with no residual santim.
 */
export declare function computeVatDeclaration(lines: readonly VatDeclarationLineInput[]): VatDeclarationComputation;
/**
 * Verify a computation is internally consistent before it is filed.
 *
 * Cheap integer assertions that catch a corrupted payload or a bad manual
 * override before the MoR rejects the whole return.
 */
export declare function validateVatDeclaration(computation: VatDeclarationComputation): string[];
/** Minimum Alternative Tax: 2.5% of annual turnover, in santim. */
export declare function computeMatCents(annualTurnoverCents: number): number;
/** True when annual turnover reaches the mandatory VAT registration threshold. */
export declare function requiresVatRegistration(annualTurnoverCents: number): boolean;
//# sourceMappingURL=vat-declaration.d.ts.map