import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { createTenantClient } from '../createTenantClient';
import { DeadlockResilienceRunner } from '../utils/deadlock-handler';

@Injectable()
export class StressTestSeeder {
  private readonly logger = new Logger(StressTestSeeder.name);

  async generateMassiveLedgerLoad(tenantId: string, recordCount = 5000): Promise<void> {
    this.logger.log(`🏋️ Generating stress-test bulk dataset (${recordCount} items) for Tenant: [${tenantId}]`);
    const tenant = await new PrismaClient().tenant.findUnique({ where: { id: tenantId }, select: { subdomain: true } });
    if (!tenant) throw new Error('Tenant not found');
    const prisma = createTenantClient(new PrismaClient(), { tenantId, subdomain: tenant.subdomain });
    const accounts = await (prisma as any).account.findMany({ where: { tenantId } });
    if (accounts.length < 2) { throw new Error('Stress testing requires minimum 2 account codes.'); }

    const cashAccount = accounts.find(a => a.type === 'ASSET') || accounts[0];
    const offsetAccount = accounts.find(a => a.type !== 'ASSET') || accounts[1];
    const chunkSize = 500; let recordsCreated = 0;

    while (recordsCreated < recordCount) {
      const activeChunkLimit = Math.min(chunkSize, recordCount - recordsCreated);
      await DeadlockResilienceRunner.executeWithLockRetry(async () => {
        await (prisma as any).$transaction(async (tx: any) => {
          for (let i = 0; i < activeChunkLimit; i++) {
            const uniqueIndex = recordsCreated + i;
            const targetValue = Math.floor(Math.random() * 10000) / 100 + 1;
            const entry = await tx.journalEntry.create({ data: { tenantId, reference: `STRESS-TX-${uniqueIndex}`, description: `Stress test entry ${uniqueIndex}`, postedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) } });
            await tx.journalLine.createMany({ data: [
              { journalEntryId: entry.id, accountId: cashAccount.id, debit: targetValue, credit: 0.00, memo: 'Stress test debit' },
              { journalEntryId: entry.id, accountId: offsetAccount.id, debit: 0.00, credit: targetValue, memo: 'Stress test credit' },
            ]});
          }
        });
      });
      recordsCreated += activeChunkLimit;
      this.logger.log(`📦 Progress: [${recordsCreated}/${recordCount}]`);
    }
    this.logger.log('✅ Stress test dataset provisioned.');
  }
}
