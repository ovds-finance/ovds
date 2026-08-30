/**
 * prisma-run.mjs — cross-platform Prisma runner for Plesk/Linux deployment
 *
 * 1. Reads the specified .env file
 * 2. Injects all vars into process.env (always overrides shell env)
 * 3. Writes a temporary packages/database/.env so Prisma auto-loads it
 *    before evaluating prisma.config.js
 * 4. Spawns Prisma CLI directly (bypasses broken bash shebang on Linux)
 * 5. Cleans up the temp .env after Prisma exits
 *
 * Usage:
 *   node scripts/prisma-run.mjs ../../.env generate --config=./prisma.config.js
 *   node scripts/prisma-run.mjs ../../.env.production db push --config=./prisma.config.js
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPkg   = resolve(__dirname, '..');          // packages/database/
const root    = resolve(dbPkg, '../..');           // monorepo root

// ── Parse args ────────────────────────────────────────────────────────────────
const [, , envFile, ...prismaArgs] = process.argv;

if (!envFile) {
  console.error('Usage: node scripts/prisma-run.mjs <envFile> [prismaArgs...]');
  process.exit(1);
}

// ── Resolve env file path ─────────────────────────────────────────────────────
// envFile is relative to packages/database/ (e.g. ../../.env.production)
const envPath = resolve(dbPkg, envFile);
if (!existsSync(envPath)) {
  console.error(`\nERROR: env file not found: ${envPath}`);
  console.error('Make sure .env.production exists in the monorepo root.\n');
  process.exit(1);
}

// ── Parse and inject env vars ─────────────────────────────────────────────────
const envVars = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!key) return;
  envVars[key] = val;
  process.env[key] = val; // always override shell env
});

// ── Validate critical var ─────────────────────────────────────────────────────
if (!process.env.PRISMA_DATABASE_URL) {
  // Fallback: try .env.production in the monorepo root
  const prodEnvPath = resolve(root, '.env.production');
  if (existsSync(prodEnvPath)) {
    console.warn(`\nWARN: PRISMA_DATABASE_URL not in ${envPath} — falling back to ${prodEnvPath}`);
    readFileSync(prodEnvPath, 'utf8').split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!key) return;
      envVars[key] = val;
      process.env[key] = val;
    });
  }
}

if (!process.env.PRISMA_DATABASE_URL) {
  console.error(`\nERROR: PRISMA_DATABASE_URL not found in ${envPath}`);
  console.error('The file must contain: PRISMA_DATABASE_URL=mysql://...\n');
  process.exit(1);
}

const safeUrl = process.env.PRISMA_DATABASE_URL.replace(/:([^:@/]+)@/, ':***@');
console.log(`\n✔ Loaded env: ${envPath}`);
console.log(`✔ Database  : ${safeUrl}\n`);

// ── Write temp .env to packages/database/ ────────────────────────────────────
// Prisma 7 auto-reads .env from the directory where prisma.config.js lives.
// This guarantees PRISMA_DATABASE_URL is available when prisma.config.js loads.
const localEnvPath = resolve(dbPkg, '.env');
writeFileSync(
  localEnvPath,
  Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n') + '\n',
  'utf8'
);

// ── Resolve Prisma CLI entry point ────────────────────────────────────────────
// Use the JS entry directly — avoids the bash shebang wrapper in .bin/prisma
// which fails on Linux when Node tries to execute it as a JS file.
const prismaEntry = resolve(root, 'node_modules', 'prisma', 'build', 'index.js');
if (!existsSync(prismaEntry)) {
  console.error(`\nERROR: Prisma not found at ${prismaEntry}`);
  console.error('Run: npm install from the monorepo root\n');
  try { unlinkSync(localEnvPath); } catch { /* ignore */ }
  process.exit(1);
}

// ── Spawn Prisma ──────────────────────────────────────────────────────────────
console.log(`$ prisma ${prismaArgs.join(' ')}\n`);

// Some Plesk hosts intercept HTTPS with a self-signed certificate, which breaks
// Prisma's engine download. Disabling TLS verification is a valid escape hatch
// there, but it must never be the default: it silently removes MITM protection
// for every outbound request this child process makes.
//
// The env-file parsing above writes every key into process.env and deliberately
// overrides the shell, so NODE_TLS_REJECT_UNAUTHORIZED could otherwise arrive
// from a .env file (or an inherited shell value) and reach the child through the
// `...process.env` spread below — bypassing this gate with no warning. Strip it
// unconditionally so the gate is the only thing that can ever set it.
delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

const allowInsecureTls = process.env.PRISMA_ALLOW_INSECURE_TLS === '1';
if (allowInsecureTls) {
  console.warn(
    'WARN: PRISMA_ALLOW_INSECURE_TLS=1 — TLS certificate verification is DISABLED\n' +
    '      for this Prisma invocation. Use only on hosts with a self-signed\n' +
    '      intercepting proxy, never in CI or on a developer machine.\n'
  );
}

let exitCode = 0;
try {
  execFileSync(process.execPath, [prismaEntry, ...prismaArgs], {
    stdio: 'inherit',
    cwd: dbPkg,
    env: {
      ...process.env,
      ...(allowInsecureTls ? { NODE_TLS_REJECT_UNAUTHORIZED: '0' } : {}),
    },
  });
} catch (err) {
  exitCode = err.status ?? 1;
} finally {
  // Always clean up the temp .env
  try { unlinkSync(localEnvPath); } catch { /* ignore */ }
}

process.exit(exitCode);
