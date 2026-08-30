/**
 * @ovds/features/invoice — frontend utilities.
 */

/** Format a monetary amount in ETB (or given currency). */
export function fmtInvoiceAmount(
  amount?: number | null,
  currency = 'ETB',
): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Calculate VAT (15%) and DRRF (1%) on a subtotal — pure client-side preview. */
export function calcVatPreview(subtotal: number, vatRate = 15) {
  const vatAmount  = Math.round((subtotal * vatRate) / 100 * 100) / 100;
  const drrfAmount = Math.round(subtotal * 0.01 * 100) / 100;
  const total      = subtotal + vatAmount + drrfAmount;
  return { subtotal, vatRate, vatAmount, drrfAmount, total };
}

/** Check whether a date string is past due. */
export function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/** Returns true if an invoice status is editable (only DRAFT). */
export function isDraftStatus(status: string): boolean {
  return status === 'DRAFT';
}

/** Returns true if an invoice can be sent. */
export function isSendableStatus(status: string): boolean {
  return status === 'DRAFT';
}

/** Returns true if an invoice can be voided. */
export function isVoidableStatus(status: string): boolean {
  return ['SENT', 'VIEWED', 'PARTIAL'].includes(status);
}

/** Returns true if an invoice can be archived. */
export function isArchivableStatus(status: string): boolean {
  return ['PAID', 'CANCELLED', 'VOID'].includes(status);
}

/**
 * Build a line-item total with VAT applied per line.
 * Mirrors the backend calculation for client-side preview.
 */
export function calcLineTotal(
  qty: number,
  unitPrice: number,
  vatRate: number,
): { lineSubtotal: number; vatAmount: number; lineTotal: number } {
  const lineSubtotal = Math.round(qty * unitPrice * 100) / 100;
  const vatAmount    = Math.round(lineSubtotal * (vatRate / 100) * 100) / 100;
  const lineTotal    = lineSubtotal + vatAmount;
  return { lineSubtotal, vatAmount, lineTotal };
}

/** Generate a temporary client-side ID for new line items before they are saved. */
export function tempLineId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
