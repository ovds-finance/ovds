/**
 * Invoice Domain Events
 * ---------------------
 * Strongly-typed payloads for every transition in the invoice lifecycle.
 * Canonical definitions live here; @ovds/shared re-exports a minimal subset
 * of constants and snapshots for cross-domain observers.
 */

// ── Shared invoice snapshot carried in every payload ─────────────────────────

export interface InvoiceSnapshot {
  id: string;
  invoiceNumber: string;
  companyId: string | null;
  customerId: string | null;
  customerName: string;
  status: string;
  date: Date;
  dueDate: Date | null;
  /** Post-discount, pre-tax net amount */
  subtotal: number;
  vatAmount: number;
  drrfAmount: number;
  totalAmount: number;
  vatRate: number;
  currencyCode: string;
  currencyRate: number;
  /** totalAmount × currencyRate */
  baseAmount: number;
  userId?: string;
}

// ── Typed event payloads ─────────────────────────────────────────────────────

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

// ── Event name constants ─────────────────────────────────────────────────────

export const INVOICE_EVENTS = {
  CREATED:          'invoice.invoice.created',
  SENT:             'invoice.invoice.sent',
  PAYMENT_RECEIVED: 'invoice.payment.received',
  VOIDED:           'invoice.invoice.voided',
  UPDATED:          'invoice.invoice.updated',
  OVERDUE:          'invoice.invoice.overdue',
} as const;

export type InvoiceEventName = typeof INVOICE_EVENTS[keyof typeof INVOICE_EVENTS];

// ── Typed factory helpers ────────────────────────────────────────────────────

import type { Event } from '@ovds/core';

/**
 * Build a strongly-typed core `Event` object for InvoiceCreated.
 */
export function makeInvoiceCreatedEvent(
  payload: InvoiceCreatedPayload,
  source = 'sales-module',
): Event {
  return {
    name: INVOICE_EVENTS.CREATED,
    payload,
    timestamp: new Date(),
    source,
    payloadVersion: '1.0',
  };
}

export function makeInvoiceSentEvent(
  payload: InvoiceSentPayload,
  source = 'sales-module',
): Event {
  return {
    name: INVOICE_EVENTS.SENT,
    payload,
    timestamp: new Date(),
    source,
    payloadVersion: '1.0',
  };
}

export function makePaymentReceivedEvent(
  payload: PaymentReceivedPayload,
  source = 'sales-module',
): Event {
  return {
    name: INVOICE_EVENTS.PAYMENT_RECEIVED,
    payload,
    timestamp: new Date(),
    source,
    payloadVersion: '1.0',
  };
}

export function makeInvoiceVoidedEvent(
  payload: InvoiceVoidedPayload,
  source = 'sales-module',
): Event {
  return {
    name: INVOICE_EVENTS.VOIDED,
    payload,
    timestamp: new Date(),
    source,
    payloadVersion: '1.0',
  };
}

export function makeInvoiceUpdatedEvent(
  payload: InvoiceUpdatedPayload,
  source = 'sales-module',
): Event {
  return {
    name: INVOICE_EVENTS.UPDATED,
    payload,
    timestamp: new Date(),
    source,
    payloadVersion: '1.0',
  };
}

export function makeInvoiceOverdueEvent(
  payload: InvoiceOverduePayload,
  source = 'overdue-scheduler',
): Event {
  return {
    name: INVOICE_EVENTS.OVERDUE,
    payload,
    timestamp: new Date(),
    source,
    payloadVersion: '1.0',
  };
}
