import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@ovds/database';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class SqliteBackupEngine {
  private prisma = new PrismaClient();
  private readonly backupLocation = '/data/backups/sqlite';

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async executeBackupCycle() {
    try {
      if (process.env.DATABASE_PROVIDER !== 'sqlite') return;
      await fs.mkdir(this.backupLocation, { recursive: true });
      const formatTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `snapshot_ledger_${formatTimestamp}.db`;
      const finalBackupPath = path.join(this.backupLocation, backupFileName);
      await this.prisma.$executeRawUnsafe(`VACUUM INTO '${finalBackupPath}';`);
      await this.pruneOldBackups();
    } catch (criticalFault) {
      console.error('Backup error:', criticalFault);
    }
  }

  private async pruneOldBackups() {
    const historicalLimitDays = 14;
    const thresholdMs = Date.now() - historicalLimitDays * 24 * 60 * 60 * 1000;
    const files = await fs.readdir(this.backupLocation);
    for (const file of files) {
      const filePath = path.join(this.backupLocation, file);
      const stat = await fs.stat(filePath);
      if (stat.mtimeMs < thresholdMs) {
        await fs.unlink(filePath);
      }
    }
  }
}
