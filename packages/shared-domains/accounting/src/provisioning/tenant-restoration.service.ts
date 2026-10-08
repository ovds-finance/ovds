import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { createTenantClient } from '@ovds/shared-domains-infra';

interface RestoredDataPayload { metadata: { id: string; subdomain: string; name: string }; chartOfAccounts: any[]; generalLedger: any[]; }

@Injectable()
export class TenantRestorationService {
  private basePrisma = new PrismaClient();

  async restoreTenantFromArchive(archiveFilePath: string): Promise<string> {
    const fs = require('fs/promises');
    const rawArchiveContent = await fs.readFile(archiveFilePath, 'utf-8');
    const payload: RestoredDataPayload = JSON.parse(rawArchiveContent);
    const { id: tenantId, subdomain, name } = payload.metadata;

    await this.basePrisma.$transaction(async (tx) => {
      await tx.tenant.upsert({ where: { id: tenantId }, update: { subdomain, name }, create: { id: tenantId, subdomain, name } });
    });

    const tenantPrisma = createTenantClient(new PrismaClient(), { tenantId, subdomain });
    try {
      await (tenantPrisma as any).$transaction(async (tx: any) => {
        await tx.journalLine.deleteMany();
        await tx.journalEntry.deleteMany();
        await tx.account.deleteMany();
        await tx.account.createMany({ data: payload.chartOfAccounts.map((coa: any) => ({ ...coa, tenantId })) });
        for (const entry of payload.generalLedger) {
          await tx.journalEntry.create({ data: { id: entry.id, tenantId, reference: entry.reference, description: entry.description, postedAt: new Date(entry.postedAt) } });
          await tx.journalLine.createMany({ data: entry.journalLine.map((line: any) => ({ ...line, journalEntryId: entry.id, tenantId })) });
        }
      });
      return tenantId;
    } catch (restorationFault) { throw new Error(`Critical state rehydration routine rejected: ${(restorationFault as Error).message}`); }
  }
}
