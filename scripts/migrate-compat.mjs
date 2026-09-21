#!/usr/bin/env node

/**
 * Migration compatibility helper for multi-provider Prisma deployments.
 *
 * Usage:
 *   node scripts/migrate-compat.mjs --provider sqlite --direction up
 *   node scripts/migrate-compat.mjs --provider postgresql --direction deploy
 *   node scripts/migrate-compat.mjs --provider mysql --direction push --validate
 *   node scripts/migrate-compat.mjs --provider sqlite --direction deploy --backup
 *
 * Features:
 *   - Temporary datasource provider patching for cross-provider migrations
 *   - Schema validation before and after migration
 *   - SQLite backup before destructive operations
 *   - Automatic rollback on failure
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { execSync, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(__dirname, '..', 'packages', 'database', 'prisma', 'schema.prisma');
const DATABASE_DIR = path.resolve(__dirname, '..', 'packages', 'database', 'prisma');

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || 'true';
    }
  }
  return result;
}

const opts = parseArgs();
const provider = opts.provider || process.env.DATABASE_PROVIDER || 'mysql';
const direction = opts.direction || 'deploy';
const validate = opts.validate === 'true';
const backup = opts.backup === 'true';
const dryRun = opts['dry-run'] === 'true';

const VALID_PROVIDERS = ['postgresql', 'mysql', 'sqlite', 'mariadb'];
if (!VALID_PROVIDERS.includes(provider)) {
  console.error(`Invalid provider: ${provider}. Valid: ${VALID_PROVIDERS.join(', ')}`);
  process.exit(1);
}

const VALID_DIRECTIONS = ['up', 'deploy', 'push', 'studio'];
if (!VALID_DIRECTIONS.includes(direction)) {
  console.error(`Invalid direction: ${direction}. Valid: ${VALID_DIRECTIONS.join(', ')}`);
  process.exit(1);
}

console.log(`[migrate-compat] Provider: ${provider}, Direction: ${direction}`);
if (validate) console.log('[migrate-compat] Schema validation: ENABLED');
if (backup) console.log('[migrate-compat] Backup: ENABLED');
if (dryRun) console.log('[migrate-compat] Dry-run mode: ENABLED');

const originalSchema = readFileSync(SCHEMA_PATH, 'utf-8');
const originalProviderMatch = originalSchema.match(/datasource db\s*\{[^}]*provider\s*=\s*"([^"]+)"/);

if (!originalProviderMatch) {
  console.error('Could not locate datasource provider in schema.prisma');
  process.exit(1);
}

const originalProvider = originalProviderMatch[1];
console.log(`[migrate-compat] Original provider: ${originalProvider}`);

function runCommand(command: string, cwd: string) {
  if (dryRun) {
    console.log(`[migrate-compat] [DRY-RUN] Would run: ${command}`);
    return;
  }
  console.log(`[migrate-compat] Running: ${command}`);
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_PROVIDER: provider },
  });
}

async function validateSchema() {
  if (!validate) return;
  
  console.log('[migrate-compat] Validating schema...');
  try {
    runCommand('npx prisma validate', DATABASE_DIR);
    console.log('[migrate-compat] Schema validation: PASSED');
  } catch (error) {
    console.error('[migrate-compat] Schema validation: FAILED');
    throw error;
  }
}

function createBackup() {
  if (!backup || provider !== 'sqlite') return null;

  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';
  const dbFile = dbUrl.replace('file:', '').replace(/^\//, '');
  
  if (!dbFile || !existsSync(dbFile)) {
    console.log('[migrate-compat] No SQLite database file found for backup');
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dbFile}.backup-${timestamp}`;
  
  try {
    copyFileSync(dbFile, backupPath);
    console.log(`[migrate-compat] SQLite backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('[migrate-compat] Failed to create backup:', error);
    return null;
  }
}

function restoreBackup(backupPath: string | null) {
  if (!backupPath || !existsSync(backupPath)) return;

  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';
  const dbFile = dbUrl.replace('file:', '').replace(/^\//, '');
  
  try {
    copyFileSync(backupPath, dbFile);
    console.log(`[migrate-compat] Database restored from backup: ${backupPath}`);
  } catch (error) {
    console.error('[migrate-compat] Failed to restore backup:', error);
  }
}

try {
  await validateSchema();
  
  const backupPath = createBackup();

  const patchedSchema = originalSchema.replace(
    /provider\s*=\s*"[^"]+"/,
    `provider = "${provider}"`
  );
  writeFileSync(SCHEMA_PATH, patchedSchema);

  try {
    let command = '';

    switch (direction) {
      case 'up':
        command = `npx prisma migrate dev --name compat-${provider}`;
        break;
      case 'deploy':
        command = 'npx prisma migrate deploy';
        break;
      case 'push':
        command = 'npx prisma db push';
        break;
      case 'studio':
        command = 'npx prisma studio';
        break;
    }

    runCommand(command, path.resolve(__dirname, '..', 'packages', 'database'));
    
    if (validate) {
      await validateSchema();
    }
  } catch (error) {
    console.error('[migrate-compat] Migration failed, restoring original schema...');
    restoreBackup(backupPath);
    throw error;
  } finally {
    writeFileSync(SCHEMA_PATH, originalSchema);
    console.log(`[migrate-compat] Restored original provider: ${originalProvider}`);
  }
} catch (error) {
  console.error('[migrate-compat] Fatal error:', error);
  process.exit(1);
}
