/**
 * deploy.mjs — OVDS server-side deploy script (runs ON the Plesk server)
 *
 * Triggered by: bash scripts/deploy-plesk.sh  OR  npm run deploy
 * Do NOT run this locally on Windows — use scripts/deploy-ftp.ps1 instead.
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dbPkg = resolve(root, 'packages/database');

// On Linux the binary has no extension; on Windows it needs .cmd
// (deploy.mjs is intended for Linux/Plesk, but guard anyway)
const isWindows = process.platform === 'win32';
const prismaBin = isWindows
  ? resolve(root, 'node_modules', '.bin', 'prisma.cmd')
  : resolve(root, 'node_modules', '.bin', 'prisma');

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

function del(p) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`  Deleted: ${p}`);
  }
}

// ── Verify .env ───────────────────────────────────────────────────────────────
const envPath = resolve(root, '.env');
const prodEnvPath = resolve(root, '.env.production');

// If .env missing or doesn't have PRISMA_DATABASE_URL, copy from .env.production
if (!existsSync(envPath) || !readFileSync(envPath, 'utf8').includes('PRISMA_DATABASE_URL=mysql')) {
  if (existsSync(prodEnvPath)) {
    const content = readFileSync(prodEnvPath, 'utf8');
    writeFileSync(envPath, content);
    console.log('Copied .env.production → .env');
  } else {
    console.error('ERROR: .env not found and .env.production missing too.');
    process.exit(1);
  }
}

// Load env vars into process.env
const envVars = readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
  .reduce((acc, l) => {
    const [k, ...v] = l.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});
Object.assign(process.env, envVars);

if (!process.env.PRISMA_DATABASE_URL) {
  console.error('ERROR: PRISMA_DATABASE_URL not set in .env');
  process.exit(1);
}
console.log('✔ PRISMA_DATABASE_URL loaded');

console.log('\n=== OVDS Plesk Deployment ===\n');

// ── Step 1: Remove ALL stale files that cause Prisma version conflicts ────────
console.log('[1/7] Cleaning stale Prisma files...');

// Remove prisma.config.ts — Prisma auto-discovers it alongside .js and loads both
del(resolve(dbPkg, 'prisma.config.ts'));

// Remove local node_modules in database package — may contain Prisma v6
del(resolve(dbPkg, 'node_modules'));

// ── Step 2: Write correct prisma.config.js ────────────────────────────────────
console.log('[2/7] Writing prisma.config.js...');
// datasource.url is correct for CLI commands (generate, db push, migrate).
// The adapter (PrismaMariaDb) belongs only in the runtime PrismaClient
// constructor — see apps/backend/src/prisma/prisma.service.ts.
writeFileSync(resolve(dbPkg, 'prisma.config.js'), `// @ts-check
// Prisma 7 CLI config — used by: generate, db push, migrate, studio
//
// IMPORTANT: prisma-run.mjs writes a temporary .env to this directory
// before running Prisma, so PRISMA_DATABASE_URL is always available here.
// The adapter (PrismaMariaDb) is NOT configured here — it belongs only in
// the PrismaClient constructor at runtime (apps/backend/src/prisma/prisma.service.ts).

const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.PRISMA_DATABASE_URL || 'mysql://root:@127.0.0.1:3306/usc',
  },
});
`);
console.log('  Written packages/database/prisma.config.js');

// ── Step 3: Wipe node_modules and reinstall natively on Linux ────────────────
// CRITICAL: node_modules uploaded from Windows contains platform-specific
// binaries (esbuild win32, rolldown win32) that will NOT work on Linux.
// Always wipe and reinstall — never copy node_modules from Windows.
console.log('[3/7] Wiping node_modules and reinstalling for Linux...');
del(resolve(root, 'node_modules'));
run('npm install --legacy-peer-deps');

// Fix execute permissions immediately after install — Plesk file uploads
// often strip +x, causing exit code 126 ("Permission denied") on any binary.
if (!isWindows) {
  try { run('chmod -R +x node_modules/.bin/'); } catch {}
}

// Force Prisma 7 at root level
run('npm install prisma@7.8.0 @prisma/client@7.8.0 @prisma/adapter-mariadb@7.8.0 --save-exact --legacy-peer-deps');

// Re-fix permissions after second install (new packages may lack +x too)
if (!isWindows) {
  try { run('chmod -R +x node_modules/.bin/'); } catch {}
}

// ── Step 4: Generate Prisma client ───────────────────────────────────────────
console.log('[4/7] Generating Prisma client...');
// Use the workspace script — it calls prisma via its JS entry point (not the
// bash wrapper in .bin/prisma) so it works on both Linux and Windows.
run('npm run generate:plesk -w @ovds/database', {
  env: { ...process.env, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1' }
});

// ── Step 5: Push schema to DB ─────────────────────────────────────────────────
console.log('[5/7] Pushing schema to MySQL...');
run('npm run db:push:prod -w @ovds/database');

// ── Step 6: Build libraries ───────────────────────────────────────────────────
console.log('[6/7] Building shared libraries...');
run('npm run build:libs');

// ── Step 7: Build apps ────────────────────────────────────────────────────────
console.log('[7/7] Building backend + frontend...');
run('npm run build -w @ovds/backend');
run('npm run build -w ovds-frontend');

console.log('\n=== Done! Go to Plesk → Node.js → Restart ===\n');
