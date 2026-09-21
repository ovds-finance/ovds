/**
 * fix-fk-collisions.mjs
 *
 * MySQL InnoDB requires FK constraint names to be globally unique across ALL
 * databases on the same server. When Prisma tries to add new FKs to the target
 * database it fails with errno 121 if the same name already exists in another DB.
 *
 * This script:
 *   1. Drops any leftover Prisma shadow databases
 *   2. Builds the full list of FK names Prisma will create (explicit map: names
 *      + auto-generated ModelName_fieldName_fkey names from schema.prisma)
 *   3. Finds which of those names are missing from the target DB (Prisma will ADD them)
 *   4. Renames any same-named FK in other databases so the names are free to use
 *
 * Usage (called automatically by db:push / db:push:prod):
 *   node scripts/fix-fk-collisions.mjs ../../.env
 *   node scripts/fix-fk-collisions.mjs ../../.env.production
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mariadb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPkg     = resolve(__dirname, '..');

// ── Parse env file ─────────────────────────────────────────────────────────
const [, , envFile = '../../.env'] = process.argv;
const envPath = resolve(dbPkg, envFile);

if (!existsSync(envPath)) {
  console.error(`fix-fk-collisions: env file not found: ${envPath}`);
  process.exit(1);
}

const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq === -1) return;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (k) env[k] = v;
});

const dbUrl = env.PRISMA_DATABASE_URL;
if (!dbUrl) {
  console.error('fix-fk-collisions: PRISMA_DATABASE_URL not found in', envPath);
  process.exit(1);
}

// Extract target database name from URL
const dbNameMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
if (!dbNameMatch) {
  console.error('fix-fk-collisions: could not parse database name from URL');
  process.exit(1);
}
const targetDb = dbNameMatch[1];

// Parse the DATABASE_URL into mariadb connection options.
// mariadb's createConnection() accepts an object; URL string support is unreliable.
function parseDbUrl(url) {
  const parsed = new URL(url);
  const opts = {
    host:     parsed.hostname || '127.0.0.1',
    port:     parsed.port ? Number(parsed.port) : 3306,
    user:     parsed.username || 'root',
    password: parsed.password || '',
    // strip leading slash
    database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
    // Needed so mariadb does not reject bigint results as strings
    bigNumberStrings: false,
  };
  return opts;
}

// Connect via information_schema for cross-db access
const baseOpts = parseDbUrl(dbUrl);
const connOpts = { ...baseOpts, database: 'information_schema' };
const conn = await mysql.createConnection(connOpts).catch(() =>
  mysql.createConnection(baseOpts)
);

// mariadb returns rows directly from query(), unlike mysql2 which returns [rows, fields].
// Wrap to normalise so the rest of the script works the same way.
async function dbQuery(sql, params) {
  const rows = await conn.query(sql, params);
  return [rows];
}

console.log(`fix-fk-collisions: target DB = ${targetDb}`);

// ── 1. Drop leftover Prisma shadow databases ────────────────────────────────
const [allDbs] = await dbQuery(`SHOW DATABASES`);
const shadowDbs = allDbs
  .map(r => Object.values(r)[0])
  .filter(n => n.startsWith('prisma_migrate_shadow_db_'));

for (const db of shadowDbs) {
  await conn.query(`DROP DATABASE \`${db}\``);
  console.log(`  Dropped shadow DB: ${db}`);
}

// ── 2. Build all FK names Prisma will create ───────────────────────────────
const schemaPath = resolve(dbPkg, 'prisma', 'schema.prisma');
const schema     = readFileSync(schemaPath, 'utf8');

// Parse model blocks (sorted alphabetically = Prisma's processing order)
const modelBlocks = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^}/gm)];

const allSchemaFkNames = new Set();

for (const [, modelName, body] of modelBlocks) {
  // Find all @relation(...) entries that have fields: (i.e. the owning side)
  const relRegex = /@relation\(([^)]+)\)/g;
  let rm;
  while ((rm = relRegex.exec(body)) !== null) {
    const relBody = rm[1];
    const fieldsMatch = relBody.match(/fields:\s*\[([^\]]+)\]/);
    if (!fieldsMatch) continue; // back-relation, no FK

    const fields = fieldsMatch[1].trim();
    const mapMatch = relBody.match(/map:\s*"([^"]+)"/);

    const fkName = mapMatch
      ? mapMatch[1]
      : `${modelName}_${fields}_fkey`; // Prisma auto-generated name

    allSchemaFkNames.add(fkName);
  }
}

// ── 3. Get FK names already in the target DB (with full details for renaming) ─
const [targetFkRows] = await dbQuery(`
  SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME,
         kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME,
         rc.UPDATE_RULE, rc.DELETE_RULE
  FROM information_schema.TABLE_CONSTRAINTS tc
  JOIN information_schema.KEY_COLUMN_USAGE kcu
    ON  kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
    AND kcu.CONSTRAINT_NAME   = tc.CONSTRAINT_NAME
    AND kcu.TABLE_NAME        = tc.TABLE_NAME
    AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
  JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
    ON  rc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
    AND rc.CONSTRAINT_NAME   = tc.CONSTRAINT_NAME
  WHERE tc.CONSTRAINT_SCHEMA = ? AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
`, [targetDb]);

// Build a map: lowercase FK name -> full FK info (for detecting case variants)
const targetFkByLower = new Map();
for (const r of targetFkRows) {
  targetFkByLower.set(r.CONSTRAINT_NAME.toLowerCase(), r);
}

// ── 3b. Rename case-variant FKs in target DB so Prisma can push cleanly ────
// If the target DB has 'notification_employeeId_fkey' but schema expects
// 'Notification_employeeId_fkey', MySQL treats them the same — rename to exact case.
let caseFixed = 0;
for (const schemaFkName of allSchemaFkNames) {
  const existing = targetFkByLower.get(schemaFkName.toLowerCase());
  if (!existing) continue; // Not in target DB at all — will be added by Prisma
  if (existing.CONSTRAINT_NAME === schemaFkName) continue; // Already correct case

  // Rename the existing FK to match the schema's expected name exactly
  try {
    await conn.query(
      `ALTER TABLE \`${targetDb}\`.\`${existing.TABLE_NAME}\` DROP FOREIGN KEY \`${existing.CONSTRAINT_NAME}\``
    );
    await conn.query(`
      ALTER TABLE \`${targetDb}\`.\`${existing.TABLE_NAME}\`
      ADD CONSTRAINT \`${schemaFkName}\`
      FOREIGN KEY (\`${existing.COLUMN_NAME}\`)
      REFERENCES \`${targetDb}\`.\`${existing.REFERENCED_TABLE_NAME}\` (\`${existing.REFERENCED_COLUMN_NAME}\`)
      ON DELETE ${existing.DELETE_RULE} ON UPDATE ${existing.UPDATE_RULE}
    `);
    console.log(`  Renamed case variant: ${existing.CONSTRAINT_NAME} -> ${schemaFkName}`);
    caseFixed++;
    // Update the map so pendingFks filtering below sees the corrected name
    targetFkByLower.set(schemaFkName.toLowerCase(), { ...existing, CONSTRAINT_NAME: schemaFkName });
  } catch (err) {
    console.warn(`  WARNING renaming ${existing.CONSTRAINT_NAME}: ${err.message}`);
  }
}
if (caseFixed > 0) console.log(`  Fixed ${caseFixed} case-variant FK name(s) in ${targetDb}.`);

// FKs Prisma will try to ADD (schema defines them but they're not in target DB yet,
// compared case-insensitively to avoid false "not found" for case-variant names)
const pendingFks = [...allSchemaFkNames].filter(n => !targetFkByLower.has(n.toLowerCase()));

if (pendingFks.length === 0) {
  console.log('  DB is already in sync — no new FKs to add.');
  await conn.end();
  process.exit(0);
}

console.log(`  Prisma will add ${pendingFks.length} new FK(s)`);

// ── 4. Find collisions in other databases ──────────────────────────────────
const skipSchemas = new Set([
  'information_schema', 'mysql', 'performance_schema', 'sys', targetDb,
]);

// Query in batches to avoid hitting MySQL's max_allowed_packet
const BATCH = 50;
const collisionRows = [];
for (let i = 0; i < pendingFks.length; i += BATCH) {
  const batch = pendingFks.slice(i, i + BATCH);
  const ph = batch.map(() => '?').join(',');
  const skipPh = [...skipSchemas].map(() => '?').join(',');
  const [rows] = await dbQuery(`
    SELECT tc.CONSTRAINT_SCHEMA, tc.TABLE_NAME, tc.CONSTRAINT_NAME,
           kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME,
           rc.UPDATE_RULE, rc.DELETE_RULE
    FROM information_schema.TABLE_CONSTRAINTS tc
    JOIN information_schema.KEY_COLUMN_USAGE kcu
      ON  kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
      AND kcu.CONSTRAINT_NAME   = tc.CONSTRAINT_NAME
      AND kcu.TABLE_NAME        = tc.TABLE_NAME
      AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON  rc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
      AND rc.CONSTRAINT_NAME   = tc.CONSTRAINT_NAME
    WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND tc.CONSTRAINT_SCHEMA NOT IN (${skipPh})
      AND tc.CONSTRAINT_NAME IN (${ph})
  `, [...skipSchemas, ...batch]);
  collisionRows.push(...rows);
}

if (collisionRows.length === 0) {
  console.log('  No collisions found in other databases.');
  await conn.end();
  process.exit(0);
}

console.log(`  Found ${collisionRows.length} collision(s) — renaming...`);

// ── 5. Rename colliding FKs in other databases ─────────────────────────────
let renamed = 0;
let warned  = 0;
for (const r of collisionRows) {
  const prefix  = r.CONSTRAINT_SCHEMA.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
  const newName = `${prefix}_${r.CONSTRAINT_NAME}`.slice(0, 64);

  try {
    await conn.query(
      `ALTER TABLE \`${r.CONSTRAINT_SCHEMA}\`.\`${r.TABLE_NAME}\` DROP FOREIGN KEY \`${r.CONSTRAINT_NAME}\``
    );
    await conn.query(`
      ALTER TABLE \`${r.CONSTRAINT_SCHEMA}\`.\`${r.TABLE_NAME}\`
      ADD CONSTRAINT \`${newName}\`
      FOREIGN KEY (\`${r.COLUMN_NAME}\`)
      REFERENCES \`${r.CONSTRAINT_SCHEMA}\`.\`${r.REFERENCED_TABLE_NAME}\` (\`${r.REFERENCED_COLUMN_NAME}\`)
      ON DELETE ${r.DELETE_RULE} ON UPDATE ${r.UPDATE_RULE}
    `);
    renamed++;
  } catch (err) {
    console.warn(`    WARNING [${r.CONSTRAINT_SCHEMA}] ${r.CONSTRAINT_NAME}: ${err.message}`);
    warned++;
  }
}

console.log(`  Renamed ${renamed} FK(s)${warned ? `, ${warned} warning(s)` : ''}.`);

await conn.end();
console.log('fix-fk-collisions: done.\n');
