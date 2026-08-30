#!/bin/bash
# baseline-plesk.sh — Baselines Prisma migrations on the Plesk server
# Run: bash scripts/baseline-plesk.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
ROOT="/data/var/www/vhosts/ovds.com.et/httpdocs"
cd "$ROOT"

echo "=== Baselining Prisma migrations on production DB ==="
echo ""

node --input-type=module << 'JSEOF'
import { createConnection } from 'mariadb';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { createHash, randomUUID } from 'crypto';

// Read .env.production
const env = readFileSync('.env.production', 'utf8')
  .split('\n')
  .reduce((a, l) => {
    const i = l.indexOf('=');
    if (i < 0 || l.trim().startsWith('#')) return a;
    a[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    return a;
  }, {});

const u = new URL(env.PRISMA_DATABASE_URL);
console.log(`Connecting to ${u.hostname}:${u.port}${u.pathname}...`);

const conn = await createConnection({
  host: u.hostname,
  port: parseInt(u.port) || 3306,
  user: u.username,
  password: decodeURIComponent(u.password),
  database: u.pathname.replace('/', ''),
});

// Create _prisma_migrations if missing
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
console.log('✔ _prisma_migrations table ready');

// Find all migration folders
const dir = 'packages/database/prisma/migrations';
const migs = readdirSync(dir)
  .filter(f => /^\d{14}_/.test(f) && statSync(`${dir}/${f}`).isDirectory())
  .sort();

console.log(`Found ${migs.length} migrations\n`);

let baselined = 0;
for (const name of migs) {
  const sqlPath = `${dir}/${name}/migration.sql`;
  const sql = existsSync(sqlPath) ? readFileSync(sqlPath, 'utf8') : '';
  const checksum = createHash('sha256').update(sql).digest('hex');
  const existing = await conn.query(
    'SELECT id FROM `_prisma_migrations` WHERE migration_name = ?', [name]
  );
  if (!existing.length) {
    await conn.query(
      `INSERT INTO \`_prisma_migrations\`
       (id, checksum, finished_at, migration_name, applied_steps_count, started_at)
       VALUES (?, ?, NOW(3), ?, 1, NOW(3))`,
      [randomUUID(), checksum, name]
    );
    console.log('  ✔ Baselined:', name);
    baselined++;
  } else {
    console.log('  ─ Already exists:', name);
  }
}

await conn.end();
console.log(`\n✅ ${baselined} migrations baselined.`);
JSEOF

echo ""
echo "Now running db:migrate..."
npm run db:migrate
