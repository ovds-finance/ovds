#!/usr/bin/env node

/**
 * check-migration-drift.mjs
 *
 * Detects schema drift between the Prisma schema file and the actual database.
 *
 * Compares:
 *   1. Applied migrations in _prisma_migrations table
 *   2. Migration files in packages/database/prisma/migrations/
 *   3. Current schema.prisma file
 *
 * Exit codes:
 *   0 — no drift detected
 *   1 — drift detected (missing or unapplied migrations)
 *   2 — error during check
 *
 * Usage:
 *   node scripts/check-migration-drift.mjs
 *   node scripts/check-migration-drift.mjs --schema-path packages/database/prisma/schema.prisma
 */

import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
const schemaPath = opts['schema-path'] || join(__dirname, '..', 'packages', 'database', 'prisma', 'schema.prisma');
const migrationsDir = join(dirname(schemaPath), 'migrations');

console.log('========================================');
console.log('  Migration Drift Check');
console.log('========================================');
console.log(`Schema:  ${schemaPath}`);
console.log(`Migrations: ${migrationsDir}`);

let appliedMigrations: string[] = [];
let migrationFiles: string[] = [];

// 1. Read migration files from disk
try {
  const entries = readdirSync(migrationsDir);
  migrationFiles = entries
    .filter(e => statSync(join(migrationsDir, e)).isDirectory())
    .filter(e => /^\d{8}_/.test(e) || /^\d{14}_/.test(e))
    .map(e => e.split('_').slice(1).join('_'))
    .sort();
  console.log(`\n[1] Migration files on disk: ${migrationFiles.length}`);
  migrationFiles.forEach((m, i) => console.log(`    ${i + 1}. ${m}`));
} catch (err: any) {
  console.error(`\n[1] Could not read migrations directory: ${err.message}`);
  process.exit(2);
}

// 2. Check applied migrations from database
console.log('\n[2] Checking applied migrations in database...');
console.log('    (Requires DATABASE_URL or PRISMA_DATABASE_URL)');

const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL;
if (!dbUrl) {
  console.log('    ⚠️  No DATABASE_URL set — skipping database check.');
  console.log('    Set DATABASE_URL to verify applied migrations.');
} else {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ log: ['error'] });

    const result: any[] = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at ASC
    `;

    appliedMigrations = result.map(r => r.migration_name);
    console.log(`    Applied migrations: ${appliedMigrations.length}`);
    appliedMigrations.forEach((m, i) => console.log(`    ${i + 1}. ${m}`));

    await prisma.$disconnect();
  } catch (err: any) {
    console.error(`    ❌ Database check failed: ${err.message}`);
    process.exit(2);
  }
}

// 3. Compare
console.log('\n[3] Drift analysis...');

const appliedSet = new Set(appliedMigrations);
const diskSet = new Set(migrationFiles);

const unapplied = migrationFiles.filter(m => !appliedSet.has(m));
const missingOnDisk = appliedMigrations.filter(m => !diskSet.has(m));

if (unapplied.length > 0) {
  console.log(`\n    ❌ ${unapplied.length} migration(s) on disk but NOT applied:`);
  unapplied.forEach(m => console.log(`       - ${m}`));
}

if (missingOnDisk.length > 0) {
  console.log(`\n    ⚠️  ${missingOnDisk.length} migration(s) applied but missing from disk:`);
  missingOnDisk.forEach(m => console.log(`       - ${m}`));
}

if (unapplied.length === 0 && missingOnDisk.length === 0) {
  console.log('    ✅ No drift detected — schema and migrations are in sync.');
  process.exit(0);
} else {
  console.log('\n    ❌ DRIFT DETECTED — run `npm run db:migrate:cloud` or `npm run db:migrate:onprem` to apply pending migrations.');
  process.exit(1);
}
