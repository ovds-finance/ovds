import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import Decimal from 'decimal.js';

import { PRISMA_CLIENT, type PrismaServiceLike } from '../tokens';

/** Journal transaction type — mirrors Prisma TransactionType enum */
export const TransactionType = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  PAYMENT: 'PAYMENT',
  RECEIPT: 'RECEIPT',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
  OPENING_BALANCE: 'OPENING_BALANCE',
  CLOSING_BALANCE: 'CLOSING_BALANCE',
  DEPRECIATION: 'DEPRECIATION',
  ACCRUAL: 'ACCRUAL',
  PREPAYMENT: 'PREPAYMENT',
  TAX: 'TAX',
  PAYROLL: 'PAYROLL',
  EXPENSE: 'EXPENSE',
  REVENUE: 'REVENUE',
  OTHER: 'OTHER',
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

/** Ledger entry type — mirrors Prisma EntryType enum */
export const EntryType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;

export type EntryType = typeof EntryType[keyof typeof EntryType];

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

@Injectable()
export class LedgerEngineService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaServiceLike) {}

  async postJournalTransaction(payload: JournalPayload) {
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
        `Imbalanced Accounting Ledger Equation: Total Debits [${totalDebits.toString()}] must exactly equal Total Credits [${totalCredits.toString()}]`
      );
    }

    return this.prisma.$transaction(async (tx: any) => {
      const tenantExists = await tx.taxpayerTenant.findUnique({
        where: { id: payload.tenantId },
      });
      if (!tenantExists) {
        throw new BadRequestException(`Tenant Identity Context [${payload.tenantId}] unregistered.`);
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

      const entryPromises = payload.entries.map((entry) =>
        tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: entry.accountId,
            type: entry.type,
            amount: new Decimal(entry.amount),
            vatAmount: new Decimal(entry.vatAmount),
          },
        })
      );

      await Promise.all(entryPromises);
      return transaction;
    });
  }
}