/**
 * baseline-migrations.mjs
 * Run on the Plesk server to baseline all existing migrations.
 *
 * The production DB was created via db:push (no migration history).
 * This script creates _prisma_migrations records for all 12 migrations
 * so Prisma treats them as already applied.
 *
 * Usage (from monorepo root on server):
 *   node scripts/baseline-migrations.mjs
 */
import { createConnection } from 'mariadb';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { createHash, randomUUID } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Load .env.production ──────────────────────────────────────────────────────
const envFile = resolve(root, '.env.production');
if (!existsSync(envFile)) {
  console.error('ERROR: .env.production not found at', envFile);
  process.exit(1);
}

const env = readFileSync(envFile, 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const i = line.indexOf('=');
    if (i < 0 || line.trim().startsWith('#')) return acc;
    acc[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    return acc;
  }, {});

const dbUrl = env.PRISMA_DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: PRISMA_DATABASE_URL not found in .env.production');
  process.exit(1);
}

const parsed = new URL(dbUrl);
console.log(`\n✔ Database: ${parsed.hostname}:${parsed.port}${parsed.pathname}`);

// ── Connect ───────────────────────────────────────────────────────────────────
const conn = await createConnection({
  host: parsed.hostname,
  port: parseInt(parsed.port) || 3306,
  user: parsed.username,
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace('/', ''),
});

// ── Ensure _prisma_migrations table exists ────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
    \`id\`                  VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`checksum\`            VARCHAR(64)   NOT NULL,
    \`finished_at\`         DATETIME(3)   NULL,
    \`migration_name\`      VARCHAR(255)  NOT NULL,
    \`logs\`                TEXT          NULL,
    \`rolled_back_at\`      DATETIME(3)   NULL,
    \`started_at\`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`applied_steps_count\` INT UNSIGNED  NOT NULL DEFAULT 0
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`);
console.log('✔ _prisma_migrations table ready\n');

// ── Find all migration folders ────────────────────────────────────────────────
const migrationsDir = resolve(root, 'packages/database/prisma/migrations');
const migrations = readdirSync(migrationsDir)
  .filter(f => /^\d{14}_/.test(f) && statSync(`${migrationsDir}/${f}`).isDirectory())
  .sort();

console.log(`Found ${migrations.length} migrations to baseline:\n`);

let baselined = 0;
let skipped = 0;

for (const name of migrations) {
  const sqlFile = `${migrationsDir}/${name}/migration.sql`;
  const sql = existsSync(sqlFile) ? readFileSync(sqlFile, 'utf8') : '';
  const checksum = createHash('sha256').update(sql).digest('hex');
  const id = randomUUID();

  const existing = await conn.query(
    'SELECT id FROM `_prisma_migrations` WHERE migration_name = ?',
    [name]
  );

  if (existing.length === 0) {
    await conn.query(
      `INSERT INTO \`_prisma_migrations\`
       (id, checksum, finished_at, migration_name, applied_steps_count, started_at)
       VALUES (?, ?, NOW(3), ?, 1, NOW(3))`,
      [id, checksum, name]
    );
    console.log('  ✔ Baselined:', name);
    baselined++;
  } else {
    console.log('  ─ Already exists:', name);
    skipped++;
  }
}

await conn.end();

console.log(`\n✅ Done — ${baselined} baselined, ${skipped} already present`);
console.log('\nNow run: npm run db:migrate\n');
