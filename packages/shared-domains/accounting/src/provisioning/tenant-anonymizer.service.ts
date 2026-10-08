import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { createTenantClient } from '@ovds/shared-domains-infra';
import * as crypto from 'crypto';

@Injectable()
export class TenantAnonymizerService {
  private readonly basePrisma = new PrismaClient();

  async scrubTenantPII(tenantId: string): Promise<{ affectedEntries: number }> {
    const tenant = await this.basePrisma.tenant.findUnique({ where: { id: tenantId }, select: { subdomain: true, name: true } });
    if (!tenant) {
      throw new NotFoundException(`Target tenant space [${tenantId}] not found.`);
    }

    const prisma = createTenantClient(new PrismaClient(), { tenantId, subdomain: tenant.subdomain });
    return await (prisma as any).$transaction(async (tx: any) => {
      const saltedHash = crypto.createHash('sha256').update(tenant.name + Date.now()).digest('hex').substring(0, 12);
      await tx.tenant.update({ where: { id: tenantId }, data: { name: `Anonymized Client Profile ${saltedHash}` } });

      const entries = await tx.journalEntry.findMany();
      for (const entry of entries) {
        if (entry.description) {
          const obfuscatedNarrative = crypto.createHash('sha256').update(entry.description).digest('hex').substring(0, 16);
          await tx.journalEntry.update({
            where: { id: entry.id },
            data: { description: `ARCHIVE-REF-${obfuscatedNarrative.toUpperCase()}`, reference: `ANON-REF-${entry.id.substring(0, 8).toUpperCase() }` },
          });
        }
      }

      const updateLinesResult = await tx.journalLine.updateMany({
        where: { memo: { not: null } }, data: { memo: 'MASKED_FINANCIAL_LINE_ITEM' },
      });

      return { affectedEntries: entries.length };
    });
  }
}
