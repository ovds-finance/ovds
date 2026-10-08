import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class TenantOffboardingService {
  private prisma = new PrismaClient();

  async exportAndPurgeTenant(tenantId: string, outputDirectory: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant configuration context [${tenantId}] not found.`);
    }

    const customerArchive = await this.prisma.$transaction(async (tx) => {
      const accounts = await tx.account.findMany({ where: { tenantId } });
      const journalEntries = await tx.journalEntry.findMany({
        where: { tenantId },
        include: { journalLine: true },
      });
      return { metadata: tenant, exportedAt: new Date().toISOString(), chartOfAccounts: accounts, generalLedger: journalEntries };
    });

    const fileName = `tenant_archive_${tenant.subdomain}_${Date.now()}.json`;
    const targetFilePath = path.join(outputDirectory, fileName);
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(targetFilePath, JSON.stringify(customerArchive, null, 2), 'utf-8');

    await this.prisma.tenant.delete({ where: { id: tenantId } });
    return targetFilePath;
  }
}
