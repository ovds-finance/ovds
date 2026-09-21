/**
 * Invoice domain event constants and payload types — shared isomorphic copy.
 *
 * These are re-exported from @ovds/shared so framework-agnostic packages
 * (e.g. @ovds/domains-accounting) can import the event names and payload
 * types without creating a cross-domain compile dependency.
 *
 * The canonical source of truth for the full event infrastructure remains
 * @ovds/domains-invoice — this file is intentionally a minimal subset
 * containing only what cross-domain observers need.
 */
export declare const INVOICE_EVENTS: {
    readonly CREATED: "invoice.invoice.created";
    readonly SENT: "invoice.invoice.sent";
    readonly PAYMENT_RECEIVED: "invoice.payment.received";
    readonly VOIDED: "invoice.invoice.voided";
    readonly UPDATED: "invoice.invoice.updated";
    readonly OVERDUE: "invoice.invoice.overdue";
};
export type InvoiceEventName = typeof INVOICE_EVENTS[keyof typeof INVOICE_EVENTS];
export interface InvoiceSnapshot {
    id: string;
    invoiceNumber: string;
    companyId: string | null;
    customerId: string | null;
    customerName: string;
    status: string;
    date: Date;
    dueDate: Date | null;
    subtotal: number;
    vatAmount: number;
    drrfAmount: number;
    totalAmount: number;
    vatRate: number;
    currencyCode: string;
    currencyRate: number;
    /** totalAmount × currencyRate — base-currency equivalent */
    baseAmount: number;
    userId?: string;
}
export interface InvoiceCreatedPayload {
    invoice: InvoiceSnapshot;
    items: unknown[];
}
export interface InvoiceSentPayload {
    invoice: InvoiceSnapshot;
    channel: string;
    sentAt: Date;
}
export interface PaymentReceivedPayload {
    invoice: InvoiceSnapshot;
    payment: {
        id: string;
        amount: number;
        currencyCode: string;
        currencyRate: number;
        baseAmount: number;
        method: string;
        paidAt: Date;
        reference?: string;
    };
    newStatus: string;
    totalPaid: number;
}
export interface InvoiceVoidedPayload {
    invoice: InvoiceSnapshot;
    reason: string;
    voidedAt: Date;
}
export interface InvoiceUpdatedPayload {
    invoice: InvoiceSnapshot;
    changedFields: string[];
}
export interface InvoiceOverduePayload {
    invoice: InvoiceSnapshot;
    daysPastDue: number;
}
//# sourceMappingURL=invoice-events.d.ts.map