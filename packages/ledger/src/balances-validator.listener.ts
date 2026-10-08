import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';

import { PRISMA_CLIENT, type PrismaServiceLike } from './tokens';

export interface TransactionPostedPayload {
  transactionId: string;
  referenceNumber: string;
  tenantId: string;
  entryIds: string[];
  totalDebit: string;
  totalCredit: string;
}

/**
 * BalancesValidatorListener
 *
 * Listens for the 'journal.transaction.posted' domain event emitted by
 * LedgerEngineService and re-validates at the database level that the
 * total debits equal the total credits for the posted transaction.
 *
 * This is a defensive second check — the LedgerEngineService already
 * guarantees balance before committing, but this listener enforces a
 * hard invariant at read-time and logs an alert if integrity is violated.
 */
@Injectable()
export class BalancesValidatorListener {
  private readonly logger = new Logger(BalancesValidatorListener.name);

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaServiceLike) {}

  @OnEvent('journal.transaction.posted', { async: true })
  async validateTransactionBalance(payload: TransactionPostedPayload): Promise<void> {
    const { transactionId, referenceNumber, totalDebit, totalCredit } = payload;

    const entries = await this.prisma.ledgerEntry.findMany({
      where: { transactionId },
      select: { amount: true, type: true },
    });

    let debitSum  = new Decimal(0);
    let creditSum = new Decimal(0);
    for (const entry of entries) {
      if (entry.type === 'DEBIT') {
        debitSum = debitSum.plus(entry.amount ?? 0);
      } else {
        creditSum = creditSum.plus(entry.amount ?? 0);
      }
    }

    if (!debitSum.equals(creditSum)) {
      this.logger.error(
        `BALANCE VIOLATION — transaction ${transactionId} (${referenceNumber}): ` +
        `debits (${debitSum.toString()}) !== credits (${creditSum.toString()})`,
      );
      return;
    }

    this.logger.debug(
      `Transaction ${referenceNumber} validated: ${debitSum.toString()} == ${creditSum.toString()}`,
    );

    // Also verify the reported totals match the persisted entries
    const reportedDebit  = new Decimal(totalDebit);
    const reportedCredit = new Decimal(totalCredit);
    if (!reportedDebit.equals(debitSum) || !reportedCredit.equals(creditSum)) {
      this.logger.warn(
        `Reported totals mismatch persisted entries for ${referenceNumber}: ` +
        `reported=${totalDebit}/${totalCredit}, persisted=${debitSum}/${creditSum}`,
      );
    }
  }
}
