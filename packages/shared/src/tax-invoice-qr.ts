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

// node:crypto is only available server-side; the browser path uses SubtleCrypto
// via the `sha256TaxInvoiceHash` async shim below. Guard the require so the
// shared bundle still loads in a browser/Vite context.
const cryptoMod: typeof import('crypto') | undefined =
  typeof require !== 'undefined' ? require('crypto') : undefined;

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
export function canonicalTaxInvoiceString(p: TaxInvoiceQrPayload): string {
  const currency = (p.currency ?? 'ETB').toUpperCase();
  const total = Number(p.total || 0).toFixed(2);
  const vat = Number(p.vat || 0).toFixed(2);
  return [
    `TIN:${p.tin ?? ''}`,
    `FS:${p.fsNo ?? ''}`,
    `INV:${p.invoiceNo ?? ''}`,
    `DATE:${p.date ?? ''}`,
    `TOTAL:${total}`,
    `VAT:${vat}`,
    `CUR:${currency}`,
  ].join('|');
}

/**
 * Synchronous SHA-256 fiscal hash (server-side). Returns lowercase hex.
 * Throws if node:crypto is unavailable (browser without shim).
 */
export function sha256TaxInvoiceHash(p: TaxInvoiceQrPayload): string {
  if (!cryptoMod) {
    throw new Error('sha256TaxInvoiceHash requires a Node.js runtime (crypto)');
  }
  const canonical = canonicalTaxInvoiceString(p);
  return cryptoMod.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Build the MoR-verified tax-invoice QR payload string (§7.2.1).
 *
 * Layout (pipe-delimited, ETB amounts, 2 decimals):
 *   OVDS-TAX|{TIN}|{FSNo}|{invoiceNo}|{YYYY-MM-DD}|{total}|{vat}|{CUR}|{sha256}
 *
 * The trailing SHA-256 hash lets MoR / scanners verify the invoice has not
 * been tampered with after finalization.
 */
export function buildTaxInvoiceQr(p: TaxInvoiceQrPayload): string {
  const hash = sha256TaxInvoiceHash(p);
  const parts = [
    'OVDS-TAX',
    p.tin ?? '',
    p.fsNo ?? '',
    p.invoiceNo ?? '',
    p.date ?? '',
    Number(p.total || 0).toFixed(2),
    Number(p.vat || 0).toFixed(2),
    (p.currency ?? 'ETB').toUpperCase(),
    hash,
  ];
  return parts.join('|');
}

/**
 * Browser-safe async SHA-256 (SubtleCrypto). Use on the client when a
 * verifiable hash is needed without a Node runtime.
 */
export async function sha256TaxInvoiceHashAsync(
  p: TaxInvoiceQrPayload,
): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(canonicalTaxInvoiceString(p));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  if (cryptoMod) return sha256TaxInvoiceHash(p);
  throw new Error('No SHA-256 implementation available in this environment');
}

/** Parse a tax-invoice QR string back into its components (for verification UIs). */
export function parseTaxInvoiceQr(qr: string): TaxInvoiceQrPayload & { hash: string } {
  const parts = qr.split('|');
  if (parts[0] !== 'OVDS-TAX') {
    throw new Error('Not an OVDS tax-invoice QR string');
  }
  return {
    tin: parts[1] ?? '',
    fsNo: parts[2] ?? '',
    invoiceNo: parts[3] ?? '',
    date: parts[4] ?? '',
    total: Number(parts[5] ?? 0),
    vat: Number(parts[6] ?? 0),
    currency: parts[7] ?? 'ETB',
    hash: parts[8] ?? '',
  };
}

/**
 * Verify a tax-invoice QR by re-computing its SHA-256 hash.
 * Returns true when the embedded hash matches the payload.
 */
export function verifyTaxInvoiceQr(qr: string): boolean {
  try {
    const parsed = parseTaxInvoiceQr(qr);
    const recomputed = sha256TaxInvoiceHash({
      tin: parsed.tin,
      fsNo: parsed.fsNo,
      invoiceNo: parsed.invoiceNo,
      date: parsed.date,
      total: parsed.total,
      vat: parsed.vat,
      currency: parsed.currency,
    });
    return recomputed === parsed.hash;
  } catch {
    return false;
  }
}
