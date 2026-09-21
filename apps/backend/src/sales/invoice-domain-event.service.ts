/**
 * InvoiceDomainEventService — Ovds SaaS
 * ──────────────────────────────────────
 * Thin adapter that converts Prisma invoice row objects into typed domain
 * event payloads and dispatches them onto both buses:
 *
 *   1. @ovds/core EventBus (singleton) — consumed by LedgerObserver and any
 *      other framework-agnostic listener registered via ModuleApp.register().
 *
 *   2. NestJS EventEmitter2 — consumed by @OnEvent() handlers (e.g.
 *      NotificationEventListener, LedgerObserverService bridge).
 *
 * Ovds SaaS architecture principle:
 *   "Action steps do not mutate cross-domain metrics directly. Finalising an
 *    invoice dispatches an InvoiceSent event. A separate LedgerObserver listens
 *    to record pending revenues in transactions without tightly coupling
 *    invoice management code to bank accounts."
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@ovds/core';
import {
  INVOICE_EVENTS,
  makeInvoiceCreatedEvent,
  makeInvoiceSentEvent,
  makePaymentReceivedEvent,
  makeInvoiceVoidedEvent,
  makeInvoiceUpdatedEvent,
  makeInvoiceOverdueEvent,
  type InvoiceSnapshot,
} from '@ovds/domains-invoice';

// ── Prisma row shapes we receive from SalesService ───────────────────────────

interface PrismaInvoiceRow {
  id: string;
  invoiceNumber: string;
  companyId?: string | null;
  customerId?: string | null;
  customerName: string;
  status: string;
  date: Date;
  dueDate?: Date | null;
  subtotal: unknown;           // Prisma Decimal
  vatAmount: unknown;
  drrfAmount: unknown;
  totalAmount: unknown;
  vatRate: unknown;
  currencyCode: string;
  currencyRate: unknown;
  [key: string]: unknown;
}

interface PrismaPaymentRow {
  id: string;
  amount: unknown;
  currencyCode: string;
  currencyRate: unknown;
  method: string;
  paidAt: Date;
  reference?: string | null;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  return parseFloat(String(v ?? 0)) || 0;
}

function toSnapshot(inv: PrismaInvoiceRow, userId?: string): InvoiceSnapshot {
  const rate = toNum(inv.currencyRate);
  const total = toNum(inv.totalAmount);
  return {
    id:            inv.id,
    invoiceNumber: inv.invoiceNumber,
    companyId:     inv.companyId ?? null,
    customerId:    inv.customerId ?? null,
    customerName:  inv.customerName,
    status:        inv.status,
    date:          inv.date,
    dueDate:       inv.dueDate ?? null,
    subtotal:      toNum(inv.subtotal),
    vatAmount:     toNum(inv.vatAmount),
    drrfAmount:    toNum(inv.drrfAmount),
    totalAmount:   total,
    vatRate:       toNum(inv.vatRate),
    currencyCode:  inv.currencyCode,
    currencyRate:  rate,
    baseAmount:    Math.round(total * rate * 100) / 100,
    userId,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class InvoiceDomainEventService {
  private readonly logger = new Logger(InvoiceDomainEventService.name);
  private readonly bus = EventBus.getInstance();

  constructor(private readonly emitter: EventEmitter2) {}

  // ── Public dispatch methods ────────────────────────────────────────────────

  /** Fired once the invoice row is persisted (including DRAFT saves). */
  async emitCreated(
    invoice: PrismaInvoiceRow,
    items: unknown[],
    userId?: string,
  ): Promise<void> {
    const payload = { invoice: toSnapshot(invoice, userId), items };
    await this.dispatch(makeInvoiceCreatedEvent(payload), payload);
  }

  /**
   * Fired when DRAFT/OVERDUE → PENDING (the invoice has been issued to the
   * customer). This is the trigger for LedgerObserver to post AR + Revenue.
   */
  async emitSent(invoice: PrismaInvoiceRow, userId?: string): Promise<void> {
    const payload = {
      invoice: toSnapshot(invoice, userId),
      channel: 'email',
      sentAt: invoice['sentAt'] instanceof Date ? invoice['sentAt'] : new Date(),
    };
    await this.dispatch(makeInvoiceSentEvent(payload), payload);
  }

  /** Fired after each InvoicePayment record is persisted. */
  async emitPaymentReceived(
    invoice: PrismaInvoiceRow,
    payment: PrismaPaymentRow,
    newStatus: string,
    totalPaid: number,
    userId?: string,
  ): Promise<void> {
    const paymentRate = toNum(payment.currencyRate);
    const paymentAmount = toNum(payment.amount);
    const payload = {
      invoice:    toSnapshot(invoice, userId),
      payment: {
        id:             payment.id,
        amount:         paymentAmount,
        currencyCode:   payment.currencyCode,
        currencyRate:   paymentRate,
        baseAmount:     Math.round(paymentAmount * paymentRate * 100) / 100,
        method:         payment.method,
        paidAt:         payment.paidAt,
        reference:      payment.reference ?? undefined,
      },
      newStatus,
      totalPaid,
    };
    await this.dispatch(makePaymentReceivedEvent(payload), payload);
  }

  /** Fired when a non-PAID invoice is cancelled / voided. */
  async emitVoided(
    invoice: PrismaInvoiceRow,
    reason: string,
    userId?: string,
  ): Promise<void> {
    const payload = {
      invoice: toSnapshot(invoice, userId),
      reason,
      voidedAt: new Date(),
    };
    await this.dispatch(makeInvoiceVoidedEvent(payload), payload);
  }

  /** Fired when any field on a non-DRAFT invoice is updated. */
  async emitUpdated(
    invoice: PrismaInvoiceRow,
    changedFields: string[],
    userId?: string,
  ): Promise<void> {
    const payload = {
      invoice:       toSnapshot(invoice, userId),
      changedFields,
    };
    await this.dispatch(makeInvoiceUpdatedEvent(payload), payload);
  }

  /** Fired by the overdue scheduler per overdue invoice. */
  async emitOverdue(invoice: PrismaInvoiceRow, daysPastDue: number): Promise<void> {
    const payload = { invoice: toSnapshot(invoice), daysPastDue };
    await this.dispatch(makeInvoiceOverdueEvent(payload), payload);
  }

  // ── Internal dual-bus dispatch ─────────────────────────────────────────────

  private async dispatch(
    coreEvent: ReturnType<typeof makeInvoiceCreatedEvent>,
    nestjsPayload: unknown,
  ): Promise<void> {
    // 1. @ovds/core EventBus — framework-agnostic observers (LedgerObserver etc.)
    try {
      await this.bus.dispatch(coreEvent);
    } catch (err) {
      this.logger.error(
        `InvoiceDomainEventService: core EventBus dispatch failed for [${coreEvent.name}]`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    // 2. NestJS EventEmitter2 — @OnEvent() handlers (notifications, BullMQ bridge)
    try {
      this.emitter.emit(coreEvent.name, nestjsPayload);
    } catch (err) {
      this.logger.error(
        `InvoiceDomainEventService: EventEmitter2 emit failed for [${coreEvent.name}]`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
