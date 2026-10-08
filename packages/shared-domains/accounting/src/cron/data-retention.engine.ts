import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@ovds/database';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DataRetentionEngine {
  private prisma = new PrismaClient();
  private readonly archiveRoot = '/mnt/cold-storage/archives';

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async enforceDataRetentionPolicy() {
    console.log('🧹 Initiating scheduled historical ledger retention cleanup pass...');
    const retentionCutoff = new Date();
    retentionCutoff.setFullYear(retentionCutoff.getFullYear() - 7);

    try {
      const targetEntries = await this.prisma.journalEntry.findMany({
        where: { postedAt: { lt: retentionCutoff } }, include: { journalLine: true },
      });
      if (targetEntries.length === 0) { console.log('✅ Zero historical records exceeded the 7-year retention limit.'); return; }

      const groupedByTenant = targetEntries.reduce((acc: Record<string, typeof targetEntries>, entry: typeof targetEntries[0]) => {
        const tenantKey = entry.tenantId ?? 'unknown';
        if (!acc[tenantKey]) acc[tenantKey] = [];
        acc[tenantKey].push(entry);
        return acc;
      }, {} as Record<string, typeof targetEntries>);

      for (const [tenantId, entries] of Object.entries(groupedByTenant)) {
        const targetDir = path.join(this.archiveRoot, tenantId);
        await fs.mkdir(targetDir, { recursive: true });
        const fileName = `retention_purge_${retentionCutoff.toISOString().split('T')[0]}_${Date.now()}.json`;
        await fs.writeFile(path.join(targetDir, fileName), JSON.stringify(entries, null, 2), 'utf-8');
        const entryIds = (entries as Array<{ id: string }>).map(e => e.id);
        await this.prisma.$transaction([
          this.prisma.journalLine.deleteMany({ where: { journalEntryId: { in: entryIds } } }),
          this.prisma.journalEntry.deleteMany({ where: { id: { in: entryIds } } }),
        ]);
        console.log(`💾 Archived and purged ${(entries as Array<{ id: string }>).length} obsolete ledger lines for Tenant [${tenantId}]`);
      }
    } catch (fault: unknown) { console.error('❌ Data retention cleanup script encountered a structural error:', (fault as Error).message); }
  }
}
