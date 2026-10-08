import { Injectable, Logger } from '@nestjs/common';
import { createTenantClient } from '../createTenantClient';

@Injectable()
export class HistoricalTransactionSeederService {
  private readonly logger = new Logger(HistoricalTransactionSeederService.name);

  /**
   * Populates a tenant's database with structurally valid historical ledger entries
   */
  async generateBalancedHistory(tenantId: string, batchesCount = 50): Promise<{ linesGenerated: number }> {
    this.logger.log(`🏋️ Seeding historical double-entry transaction matrix for Tenant: [${tenantId}]`);
    const prisma = createTenantClient(tenantId);

    const accounts = await (prisma as any).accountType.findMany({ where: { tenantId } });
    if (accounts.length < 4) {
      throw new Error('Historical seeder requires a minimum of 4 account codes registered inside the target COA.');
    }

    const cashAcc = accounts.find(a => a.code === '10100');
    const revenueAcc = accounts.find(a => a.code === '40100');
    const expenseAcc = accounts.find(a => a.code === '50100');
    const liabilityAcc = accounts.find(a => a.code === '20100');

    let totalLinesCreated = 0;

    for (let i = 0; i < batchesCount; i++) {
      const simulatedDate = new Date();
      simulatedDate.setHours(simulatedDate.getHours() - (i * 12) - Math.floor(Math.random() * 6));

      const isRevenueCycle = i % 2 === 0;
      const transactionAmount = parseFloat((Math.random() * 2500 + 50).toFixed(2));

      await (prisma as any).$transaction(async (tx: any) => {
        const entry = await tx.journalEntry.create({
          data: {
            tenantId,
            reference: `SEED-HIST-${1000 + i}`,
            description: isRevenueCycle ? 'Automated subscriber billing settlement cycle' : 'Cloud platform operation utility dispatch fee',
            postedAt: simulatedDate
          }
        });

        if (isRevenueCycle) {
          await tx.journalLine.createMany({
            data: [
              { journalEntryId: entry.id, accountId: cashAcc.id, debit: transactionAmount, credit: 0.00, memo: 'SaaS fee capture allocation' },
              { journalEntryId: entry.id, accountId: revenueAcc.id, debit: 0.00, credit: transactionAmount, memo: 'SaaS dynamic revenue entry' }
            ]
          });
        } else {
          await tx.journalLine.createMany({
            data: [
              { journalEntryId: entry.id, accountId: expenseAcc.id, debit: transactionAmount, credit: 0.00, memo: 'Compute cluster utilization row' },
              { journalEntryId: entry.id, accountId: liabilityAcc.id, debit: 0.00, credit: transactionAmount, memo: 'Accrued network platform trade debt' }
            ]
          });
        }
        totalLinesCreated += 2;
      });
    }

    this.logger.log(`✅ Balanced historical seeder loop complete. Generated ${totalLinesCreated} lines.`);
    return { linesGenerated: totalLinesCreated };
  }
}
