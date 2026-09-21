import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * OnPremiseMigrationBootstrapper
 *
 * Runs `prisma migrate deploy` on application startup for on-premise
 * single-tenant environments. Implements OnModuleInit so migrations
 * complete before any HTTP route handler is live.
 *
 * Safe for repeated runs — Prisma's migration engine is idempotent and
 * skips already-applied migrations.
 *
 * Backup strategy:
 *   Before applying migrations, a timestamped copy of the SQLite database
 *   is created in `<db-dir>/backups/`. Use the `--rollback` CLI flag
 *   (see below) to restore the last backup if a migration breaks the schema.
 */
@Injectable()
export class OnPremiseMigrationBootstrapper implements OnModuleInit {
  private readonly logger = new Logger(OnPremiseMigrationBootstrapper.name);
  // Static logger for the runRollback() class method (called before DI is set up)
  private static readonly rollbackLogger = new Logger('OnPremiseMigrationBootstrapper:Rollback');
  private readonly backupDir: string;

  constructor() {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const filePath = dbUrl.replace('file:', '');
    const dir = filePath ? path.dirname(filePath) : path.join(process.cwd(), 'var', 'data');
    this.backupDir = path.join(dir, 'backups');
  }

  async onModuleInit(): Promise<void> {
    if (process.env.DEPLOYMENT_MODE !== 'ON_PREMISE_SINGLE') {
      return;
    }

    this.logger.log('Running embedded schema migration check...');
    try {
      this.ensureDataDirectoryExists();
      this.backupDatabase();
      this.applyMigrations();
      this.logger.log('Schema migrations verified and up to date.');
    } catch (err: any) {
      this.logger.error('FATAL: Schema migration failed on startup.', err.message);
      process.exit(1);
    }
  }

  private ensureDataDirectoryExists(): void {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const filePath = dbUrl.replace('file:', '');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created data directory: ${dir}`);
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private backupDatabase(): void {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const filePath = dbUrl.replace('file:', '');
    if (!filePath || !fs.existsSync(filePath)) {
      this.logger.log('No existing database file found — skipping backup.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(this.backupDir, `backup-${timestamp}.db`);

    try {
      fs.copyFileSync(filePath, backupPath);
      this.logger.log(`Database backup created: ${backupPath}`);

      // Keep only the 5 most recent backups
      this.pruneOldBackups(5);
    } catch (err: any) {
      this.logger.warn(`Backup failed (non-fatal): ${err.message}`);
    }
  }

  private pruneOldBackups(keep: number): void {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
        .sort()
        .reverse();

      for (let i = keep; i < files.length; i++) {
        const oldBackup = path.join(this.backupDir, files[i]);
        fs.unlinkSync(oldBackup);
        this.logger.log(`Pruned old backup: ${files[i]}`);
      }
    } catch {
      // Non-fatal — backup pruning failures should not block startup
    }
  }

  private applyMigrations(): void {
    const schemaPath = path.resolve(
      __dirname,
      '../../../../packages/database/prisma/schema.prisma',
    );
    this.logger.log(`Applying migrations from schema: ${schemaPath}`);
    execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  }

  // ── Rollback helper ──────────────────────────────────────────────────────────
  // Usage: node dist/apps/backend/main.js --rollback
  // Restores the most recent backup from <db-dir>/backups/.

  static runRollback(): void {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const filePath = dbUrl.replace('file:', '');
    const dir = filePath ? path.dirname(filePath) : path.join(process.cwd(), 'var', 'data');
    const backupDir = path.join(dir, 'backups');

    if (!fs.existsSync(backupDir)) {
      console.error(`[Rollback] Backup directory not found: ${backupDir}`);
      process.exit(1);
    }

    const backups = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
      .sort()
      .reverse();

    if (backups.length === 0) {
      OnPremiseMigrationBootstrapper.rollbackLogger.error('[Rollback] No backups found.');
      process.exit(1);
    }

    const latestBackup = path.join(backupDir, backups[0]);
    OnPremiseMigrationBootstrapper.rollbackLogger.log(`[Rollback] Restoring ${latestBackup} -> ${filePath}`);

    if (!fs.existsSync(filePath)) {
      OnPremiseMigrationBootstrapper.rollbackLogger.error(`[Rollback] Target database not found: ${filePath}`);
      process.exit(1);
    }

    fs.copyFileSync(latestBackup, filePath);
    OnPremiseMigrationBootstrapper.rollbackLogger.log('[Rollback] Database restored successfully.');
  }
}
