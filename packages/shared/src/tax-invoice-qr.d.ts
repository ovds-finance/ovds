/**
 * MoR Tax-Invoice QR + cryptographic integrity helpers.
 *
 * Implements the mandatory QR-Coded Tax Invoice requirement
 * (OVDS blueprint §7.2.1, Directive 1142/2026): every tax invoice must carry
 * a MoR-verified QR encoding { TIN, FS No., date, total, VAT, SHA-256 hash }.
 *
 * The helper is pure and lives in @ovds/shared so it is the single source of
 * truth for both the backend (finalization) and the frontend (qr-code render).
 */
export interface TaxInvoiceQrPayload {
    /** Seller TIN (9–15 digits) */
    tin: string;
    /** Fiscal Sales Register Machine Number (FS No.) */
    fsNo: string;
    /** Invoice number */
    invoiceNo: string;
    /** ISO date (YYYY-MM-DD) */
    date: string;
    /** Gross total amount in ETB */
    total: number;
    /** VAT amount in ETB */
    vat: number;
    /** Currency code (default ETB) */
    currency?: string;
}
/**
 * Canonical, stable string representation of a tax invoice used as the
 * SHA-256 hash input. Field order is fixed so the hash is reproducible
 * across tiers and replays (idempotency — OVDS blueprint §22.2).
 */
export declare function canonicalTaxInvoiceString(p: TaxInvoiceQrPayload): string;
/**
 * Synchronous SHA-256 fiscal hash (server-side). Returns lowercase hex.
 * Throws if node:crypto is unavailable (browser without shim).
 */
export declare function sha256TaxInvoiceHash(p: TaxInvoiceQrPayload): string;
/**
 * Build the MoR-verified tax-invoice QR payload string (§7.2.1).
 *
 * Layout (pipe-delimited, ETB amounts, 2 decimals):
 *   OVDS-TAX|{TIN}|{FSNo}|{invoiceNo}|{YYYY-MM-DD}|{total}|{vat}|{CUR}|{sha256}
 *
 * The trailing SHA-256 hash lets MoR / scanners verify the invoice has not
 * been tampered with after finalization.
 */
export declare function buildTaxInvoiceQr(p: TaxInvoiceQrPayload): string;
/**
 * Browser-safe async SHA-256 (SubtleCrypto). Use on the client when a
 * verifiable hash is needed without a Node runtime.
 */
export declare function sha256TaxInvoiceHashAsync(p: TaxInvoiceQrPayload): Promise<string>;
/** Parse a tax-invoice QR string back into its components (for verification UIs). */
export declare function parseTaxInvoiceQr(qr: string): TaxInvoiceQrPayload & {
    hash: string;
};
/**
 * Verify a tax-invoice QR by re-computing its SHA-256 hash.
 * Returns true when the embedded hash matches the payload.
 */
export declare function verifyTaxInvoiceQr(qr: string): boolean;
//# sourceMappingURL=tax-invoice-qr.d.ts.map