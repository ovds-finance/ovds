import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SqliteBackupEngine {
  private prisma = new PrismaClient();
  private readonly backupLocation = '/data/backups/sqlite';

  @Cron('0 0 * * *')
  async executeBackupCycle() {
    console.log('💾 Initializing local embedded database vacuum backup sequence...');
    try {
      if (process.env.DATABASE_PROVIDER !== 'sqlite') { console.log('⏭️ Skipping backup: Runtime provider is not SQLite.'); return; }
      await fs.mkdir(this.backupLocation, { recursive: true });
      const formatTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `snapshot_ledger_${formatTimestamp}.db`;
      const finalBackupPath = path.join(this.backupLocation, backupFileName);
      await this.prisma.$executeRawUnsafe(`VACUUM INTO '${finalBackupPath}';`);
      console.log(`✅ System state safely archived to disk volume: ${finalBackupPath}`);
      await this.pruneOldBackups();
    } catch (criticalFault: unknown) { console.error('❌ Local storage backup sequence encountered an exception:', (criticalFault as Error).message); }
  }

  private async pruneOldBackups() {
    const historicalLimitDays = 14;
    const thresholdMs = Date.now() - historicalLimitDays * 24 * 60 * 60 * 1000;
    const files = await fs.readdir(this.backupLocation);
    for (const file of files) {
      const filePath = path.join(this.backupLocation, file);
      const stat = await fs.stat(filePath);
      if (stat.mtimeMs < thresholdMs) { await fs.unlink(filePath); console.log(`🗑️ Pruned obsolete local snapshot file: ${file}`); }
    }
  }
}