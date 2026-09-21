/**
 * LedgerObserver
 * ──────────────
 * The Ovds SaaS "Black Box" GL engine.
 *
 * Subscribes to invoice domain events on the EventBus and posts the
 * corresponding IFRS-compliant double-entry journal lines — WITHOUT any
 * coupling to the invoice module's internal logic.
 *
 * Ovds SaaS architecture principle:
 *   "Action steps do not mutate cross-domain metrics directly.
 *    An InvoiceSent event is dispatched; LedgerObserver listens to this event
 *    to record pending revenues in transactions without tightly coupling
 *    invoice management code to bank accounts."
 *
 * Standard Ethiopian Chart of Accounts codes:
 *   1100 — Cash / Bank
 *   1200 — Accounts Receivable
 *   2210 — VAT Payable
 *   2220 — DRRF Payable (1% — Regulation No. 570/2025)
 *   4000 — Revenue
 */

import type { EventBusInterface, Event } from '@ovds/core';
import {
  INVOICE_EVENTS,
  type InvoiceSentPayload,
  type PaymentReceivedPayload,
  type InvoiceVoidedPayload,
} from '@ovds/shared';

// ── Persistence interface (injected by the NestJS layer) ─────────────────────

export interface LedgerPersistence {
  /**
   * Resolve a Chart-of-Accounts entry by standard code for a given company.
   * Returns null if the CoA hasn't been configured yet (fresh tenant).
   */
  findAccount(companyId: string, code: string): Promise<{ id: string } | null>;

  /** Create a JournalEntry with its JournalLines in a single DB transaction. */
  createJournalEntry(entry: JournalEntryInput): Promise<{ id: string }>;

  /** Link a JournalEntry back to the source invoice. */
  linkJournalToInvoice(invoiceId: string, journalEntryId: string): Promise<void>;

  /** Log a warning (no-op implementation is fine for tests). */
  warn(message: string): void;
}

export interface JournalLineInput {
  accountId: string;
  companyId: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntryInput {
  companyId: string;
  date: Date;
  description: string;
  reference: string;
  status: 'POSTED' | 'DRAFT';
  lines: JournalLineInput[];
}

// ── LedgerObserver ───────────────────────────────────────────────────────────

export class LedgerObserver {
  private readonly listenerIds: string[] = [];

  constructor(
    private readonly eventBus: EventBusInterface,
    private readonly db: LedgerPersistence,
  ) {}

  /**
   * Subscribe to all relevant invoice events.
   * Called once during module.register(eventBus) lifecycle.
   */
  register(): void {
    // Priority 10 ensures the ledger reacts before any lower-priority listeners
    // (e.g. notification dispatchers at priority 100).

    this.listenerIds.push(
      this.eventBus.listen(
        INVOICE_EVENTS.SENT,
        (e) => this.onInvoiceSent(e),
        { priority: 10 },
      ),
    );

    this.listenerIds.push(
      this.eventBus.listen(
        INVOICE_EVENTS.PAYMENT_RECEIVED,
        (e) => this.onPaymentReceived(e),
        { priority: 10 },
      ),
    );

    this.listenerIds.push(
      this.eventBus.listen(
        INVOICE_EVENTS.VOIDED,
        (e) => this.onInvoiceVoided(e),
        { priority: 10 },
      ),
    );
  }

  /** Remove all listener registrations — called on module teardown. */
  unregister(): void {
    for (const id of this.listenerIds) {
      this.eventBus.removeListener(id);
    }
    this.listenerIds.length = 0;
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  /**
   * InvoiceSent → PENDING status.
   *
   * DR  Accounts Receivable (1200)  =  grand total (incl. VAT + DRRF)
   * CR  Revenue (4000)              =  subtotal after discount
   * CR  VAT Payable (2210)          =  vatAmount   [if > 0]
   * CR  DRRF Payable (2220)         =  drrfAmount  [if > 0]
   */
  private async onInvoiceSent(event: Event): Promise<void> {
    const { invoice } = event.payload as InvoiceSentPayload;
    if (!invoice.companyId) return;

    const [arAccount, revenueAccount, vatAccount, drrfAccount] = await Promise.all([
      this.db.findAccount(invoice.companyId, '1200'),
      this.db.findAccount(invoice.companyId, '4000'),
      this.db.findAccount(invoice.companyId, '2210'),
      this.db.findAccount(invoice.companyId, '2220'),
    ]);

    if (!arAccount || !revenueAccount) {
      this.db.warn(
        `LedgerObserver: GL posting skipped for invoice ${invoice.invoiceNumber} ` +
        `— accounts 1200 (AR) or 4000 (Revenue) not found for company ${invoice.companyId}`,
      );
      return;
    }

    const lines: JournalLineInput[] = [
      {
        accountId: arAccount.id,
        companyId: invoice.companyId,
        debit: invoice.totalAmount,
        credit: 0,
        description: `AR – Invoice ${invoice.invoiceNumber}`,
      },
      {
        accountId: revenueAccount.id,
        companyId: invoice.companyId,
        debit: 0,
        credit: invoice.subtotal,
        description: `Revenue – Invoice ${invoice.invoiceNumber}`,
      },
    ];

    if (invoice.vatAmount > 0 && vatAccount) {
      lines.push({
        accountId: vatAccount.id,
        companyId: invoice.companyId,
        debit: 0,
        credit: invoice.vatAmount,
        description: `VAT 15% – Invoice ${invoice.invoiceNumber}`,
      });
    }

    if (invoice.drrfAmount > 0 && drrfAccount) {
      lines.push({
        accountId: drrfAccount.id,
        companyId: invoice.companyId,
        debit: 0,
        credit: invoice.drrfAmount,
        description: `DRRF 1% – Invoice ${invoice.invoiceNumber}`,
      });
    }

    const entry = await this.db.createJournalEntry({
      companyId: invoice.companyId,
      date: invoice.date,
      description: `Sales Invoice ${invoice.invoiceNumber}`,
      reference: invoice.invoiceNumber,
      status: 'POSTED',
      lines,
    });

    await this.db.linkJournalToInvoice(invoice.id, entry.id);
  }

  /**
   * PaymentReceived.
   *
   * DR  Cash / Bank (1100)          =  payment amount (base currency)
   * CR  Accounts Receivable (1200)  =  payment amount
   *
   * Uses the payment's baseAmount so that foreign-currency invoices always
   * clear AR at the correct converted value.
   */
  private async onPaymentReceived(event: Event): Promise<void> {
    const { invoice, payment } = event.payload as PaymentReceivedPayload;
    if (!invoice.companyId) return;

    const [cashAccount, arAccount] = await Promise.all([
      this.db.findAccount(invoice.companyId, '1100'),
      this.db.findAccount(invoice.companyId, '1200'),
    ]);

    if (!cashAccount || !arAccount) {
      this.db.warn(
        `LedgerObserver: Payment GL posting skipped for invoice ${invoice.invoiceNumber} ` +
        `— accounts 1100 (Cash) or 1200 (AR) not found for company ${invoice.companyId}`,
      );
      return;
    }

    await this.db.createJournalEntry({
      companyId: invoice.companyId,
      date: payment.paidAt,
      description: `Payment received – Invoice ${invoice.invoiceNumber}`,
      reference: payment.reference ?? invoice.invoiceNumber,
      status: 'POSTED',
      lines: [
        {
          accountId: cashAccount.id,
          companyId: invoice.companyId,
          debit: payment.baseAmount,
          credit: 0,
          description: `Cash – Payment on ${invoice.invoiceNumber}`,
        },
        {
          accountId: arAccount.id,
          companyId: invoice.companyId,
          debit: 0,
          credit: payment.baseAmount,
          description: `AR Cleared – Invoice ${invoice.invoiceNumber}`,
        },
      ],
    });
  }

  /**
   * InvoiceVoided → reversal journal.
   *
   * DR  Revenue (4000)              =  original subtotal
   * DR  VAT Payable (2210)          =  original vatAmount
   * DR  DRRF Payable (2220)         =  original drrfAmount
   * CR  Accounts Receivable (1200)  =  original totalAmount
   *
   * This is a full reversal — amounts mirror the original SENT entry exactly.
   */
  private async onInvoiceVoided(event: Event): Promise<void> {
    const { invoice } = event.payload as InvoiceVoidedPayload;
    if (!invoice.companyId) return;

    const [arAccount, revenueAccount, vatAccount, drrfAccount] = await Promise.all([
      this.db.findAccount(invoice.companyId, '1200'),
      this.db.findAccount(invoice.companyId, '4000'),
      this.db.findAccount(invoice.companyId, '2210'),
      this.db.findAccount(invoice.companyId, '2220'),
    ]);

    if (!arAccount || !revenueAccount) {
      this.db.warn(
        `LedgerObserver: Reversal posting skipped for voided invoice ${invoice.invoiceNumber}`,
      );
      return;
    }

    const lines: JournalLineInput[] = [
      {
        accountId: revenueAccount.id,
        companyId: invoice.companyId,
        debit: invoice.subtotal,
        credit: 0,
        description: `Revenue Reversal – Void ${invoice.invoiceNumber}`,
      },
      {
        accountId: arAccount.id,
        companyId: invoice.companyId,
        debit: 0,
        credit: invoice.totalAmount,
        description: `AR Reversal – Void ${invoice.invoiceNumber}`,
      },
    ];

    if (invoice.vatAmount > 0 && vatAccount) {
      lines.push({
        accountId: vatAccount.id,
        companyId: invoice.companyId,
        debit: invoice.vatAmount,
        credit: 0,
        description: `VAT Reversal – Void ${invoice.invoiceNumber}`,
      });
    }

    if (invoice.drrfAmount > 0 && drrfAccount) {
      lines.push({
        accountId: drrfAccount.id,
        companyId: invoice.companyId,
        debit: invoice.drrfAmount,
        credit: 0,
        description: `DRRF Reversal – Void ${invoice.invoiceNumber}`,
      });
    }

    await this.db.createJournalEntry({
      companyId: invoice.companyId,
      date: new Date(),
      description: `Void Reversal – Invoice ${invoice.invoiceNumber}`,
      reference: `VOID-${invoice.invoiceNumber}`,
      status: 'POSTED',
      lines,
    });
  }
}
