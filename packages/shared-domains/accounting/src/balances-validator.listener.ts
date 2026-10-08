import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaClient, Decimal } from '@ovds/database';

export interface JournalEntryPostedEvent {
  entryId: string;
  tenantId: string;
}

@Injectable()
export class BalancesValidatorListener {
  private prisma = new PrismaClient();

  @OnEvent('journal.entry.posted')
  async handleJournalEntryVerification(payload: JournalEntryPostedEvent) {
    const { entryId, tenantId } = payload;
    try {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          journalEntryId: entryId,
          journalEntry: { tenantId },
        },
        select: { debit: true, credit: true },
      });

      const totalDebits = lines.reduce((acc: number, line: { debit: Decimal; credit: Decimal }) => acc + Number(line.debit), 0);
      const totalCredits = lines.reduce((acc: number, line: { debit: Decimal; credit: Decimal }) => acc + Number(line.credit), 0);
      const imbalanceDifference = Math.abs(totalDebits - totalCredits);
      const EPSILON = 0.0001;

      if (imbalanceDifference > EPSILON) {
        await this.handleImbalancedLedgerBreach(entryId, tenantId, totalDebits, totalCredits);
      }
    } catch (criticalFaultError: unknown) {
      console.error(`🚨 System Validation Fault for Tenant Context [${tenantId}]:`, (criticalFaultError as Error).message);
    }
  }

  private async handleImbalancedLedgerBreach(entryId: string, tenantId: string, debits: number, credits: number) {
    console.error(
      `❌ LEDGER ARITHMETIC BREACH DETECTED: ` +
      `Journal Entry [${entryId}] under Tenant [${tenantId}] is structurally out of balance! ` +
      `Total Debits: ${debits}, Total Credits: ${credits}`
    );
  }
}
