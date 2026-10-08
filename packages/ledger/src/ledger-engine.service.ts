import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';

import { EntryType, TransactionType } from './domain/ledger-engine.service';
import { PRISMA_CLIENT, type PrismaServiceLike } from './tokens';

export interface EntryInput {
  accountId: string;
  type: EntryType;
  amount: number;
  vatAmount: number;
}

export interface JournalPayload {
  tenantId: string;
  referenceNumber: string;
  type: TransactionType;
  narration: string;
  isOfflineIssued: boolean;
  entries: EntryInput[];
}

export interface JournalTransactionResult {
  transactionId: string;
  referenceNumber: string;
  entryIds: string[];
  isBalanced: boolean;
}

@Injectable()
export class LedgerEngineService {
  private readonly logger = new Logger(LedgerEngineService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaServiceLike,
    private readonly emitter: EventEmitter2,
  ) {}

  async postJournalTransaction(payload: JournalPayload): Promise<JournalTransactionResult> {
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const entry of payload.entries) {
      const entryAmt = new Decimal(entry.amount);
      if (entry.type === EntryType.DEBIT) {
        totalDebits = totalDebits.plus(entryAmt);
      } else {
        totalCredits = totalCredits.plus(entryAmt);
      }
    }

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Imbalanced Accounting Ledger Equation: Total Debits [${totalDebits.toString()}] must exactly equal Total Credits [${totalCredits.toString()}]`,
      );
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      const tenantExists = await tx.taxpayerTenant.findUnique({
        where: { id: payload.tenantId },
      });
      if (!tenantExists) {
        throw new NotFoundException(`Tenant Identity Context [${payload.tenantId}] unregistered.`);
      }

      const transaction = await tx.journalTransaction.create({
        data: {
          tenantId: payload.tenantId,
          referenceNumber: payload.referenceNumber,
          type: payload.type,
          narration: payload.narration,
          isOfflineIssued: payload.isOfflineIssued,
        },
      });

      const entryCreates = payload.entries.map((entry) => ({
        transactionId: transaction.id,
        accountId: entry.accountId,
        type: entry.type,
        amount: new Decimal(entry.amount),
        vatAmount: new Decimal(entry.vatAmount),
      }));

      const entries = await tx.ledgerEntry.createManyAndReturn({
        data: entryCreates,
        select: { id: true },
      });

      const entryIds = entries.map((e: { id: string }) => e.id);

      this.emitter.emit('journal.transaction.posted', {
        transactionId: transaction.id,
        referenceNumber: payload.referenceNumber,
        tenantId: payload.tenantId,
        entryIds,
        totalDebit: totalDebits.toString(),
        totalCredit: totalCredits.toString(),
      });

      return {
        transactionId: transaction.id,
        referenceNumber: payload.referenceNumber,
        entryIds,
        isBalanced: true,
      };
    });

    return result;
  }
}
