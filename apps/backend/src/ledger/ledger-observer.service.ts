/**
 * LedgerObserverService (NestJS adapter)
 * ────────────────────────────────────────
 * Bridges the framework-agnostic @ovds/domains-accounting LedgerObserver
 * with the NestJS Prisma + EventEmitter runtime.
 *
 * On module init it registers itself on the @ovds/core EventBus so that
 * invoice domain events dispatched from SalesService are automatically
 * handled here — with zero coupling between the Sales and Ledger modules.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventBus } from '@ovds/core';
import {
  LedgerObserver,
  type LedgerPersistence,
  type JournalEntryInput,
  type JournalLineInput,
} from '@ovds/domains-accounting';
import {
  INVOICE_EVENTS,
  type InvoiceSentPayload,
  type PaymentReceivedPayload,
} from '@ovds/domains-invoice';

import { PrismaService } from '../common/prisma.service';


@Injectable()
export class LedgerObserverService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LedgerObserverService.name);
  private observer!: LedgerObserver;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    // Build the Prisma-backed persistence adapter
    const persistence = this.buildPersistence();

    // Wire the domain-agnostic LedgerObserver to the singleton EventBus
    this.observer = new LedgerObserver(EventBus.getInstance(), persistence);
    this.observer.register();

    this.logger.log('LedgerObserver registered on the domain EventBus');
  }

  onModuleDestroy(): void {
    this.observer?.unregister();
  }

  // ── NestJS EventEmitter bridge ────────────────────────────────────────────
  // The SalesService also fires NestJS platform events (for BullMQ + sockets).
  // These handlers re-dispatch them onto the @ovds/core EventBus so every
  // observer receives the same event regardless of where it was emitted.

  @OnEvent(INVOICE_EVENTS.SENT)
  async handleInvoiceSentPlatformEvent(payload: InvoiceSentPayload): Promise<void> {
    await EventBus.getInstance().dispatch({
      name: INVOICE_EVENTS.SENT,
      payload,
      timestamp: new Date(),
      source: 'nestjs-event-bridge',
      payloadVersion: '1.0',
    });
  }

  @OnEvent(INVOICE_EVENTS.PAYMENT_RECEIVED)
  async handlePaymentReceivedPlatformEvent(payload: PaymentReceivedPayload): Promise<void> {
    await EventBus.getInstance().dispatch({
      name: INVOICE_EVENTS.PAYMENT_RECEIVED,
      payload,
      timestamp: new Date(),
      source: 'nestjs-event-bridge',
      payloadVersion: '1.0',
    });
  }

  // ── Persistence adapter ───────────────────────────────────────────────────

  private buildPersistence(): LedgerPersistence {
    const prisma = this.prisma;
    const logger = this.logger;

    return {
      async findAccount(companyId: string, code: string) {
        return prisma.account.findFirst({
          where: { companyId, code, isActive: true },
          select: { id: true },
        });
      },

      async createJournalEntry(entry: JournalEntryInput) {
        return prisma.journalEntry.create({
          data: {
            companyId: entry.companyId,
            date: entry.date,
            description: entry.description,
            reference: entry.reference,
            status: entry.status,
            journalLine: {
              create: entry.lines.map((line: JournalLineInput) => ({
                accountId: line.accountId,
                companyId: line.companyId,
                debit: line.debit,
                credit: line.credit,
                description: line.description,
              })),
            },
          },
          select: { id: true },
        });
      },

      async linkJournalToInvoice(invoiceId: string, journalEntryId: string) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { journalEntryId },
        });
      },

      warn(message: string) {
        logger.warn(message);
      },
    };
  }
}
