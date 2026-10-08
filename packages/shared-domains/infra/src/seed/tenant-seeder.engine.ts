import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

@Injectable()
export class TenantSeederEngine {
  private prisma = new PrismaClient();

  async seedMockTenantEnvironment(subdomain: string, enterpriseName: string): Promise<void> {
    console.log(`🌱 Seeding demo framework for tenant subdomain context: [${subdomain}]`);
    await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.upsert({ where: { subdomain }, update: {}, create: { subdomain, name: enterpriseName } });
      const tId = tenant.id;

      const cashAccount = await tx.account.upsert({
        where: { tenantId_code: { tenantId: tId, code: '10100' } }, update: {},
        create: { tenantId: tId, code: '10100', name: 'Primary Operational Cash', type: 'ASSET', category: 'CASH', isActive: true },
      });
      const equityAccount = await tx.account.upsert({
        where: { tenantId_code: { tenantId: tId, code: '30000' } }, update: {},
        create: { tenantId: tId, code: '30000', name: 'Paid-in Capital Equity', type: 'EQUITY', category: 'EQUITY', isActive: true },
      });

      const entry = await tx.journalEntry.create({
        data: { tenantId: tId, reference: 'INIT-CAPITAL-001', description: 'Initial seed venture funding execution deposit', postedAt: new Date() },
      });

      await tx.journalLine.create({ data: { journalEntryId: entry.id, accountId: cashAccount.id, debit: 500000.00, credit: 0.00, memo: 'Venture funding cash placement' } });
      await tx.journalLine.create({ data: { journalEntryId: entry.id, accountId: equityAccount.id, debit: 0.00, credit: 500000.00, memo: 'Equity issuance tracking' } });
    });
    console.log(`✅ Structural ledger seed sequence complete for ${subdomain}.`);
  }
}
