#!/usr/bin/env node
/**
 * docs-ci.mjs — OVDS Documentation CI Orchestration Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs the full documentation pipeline in sequence:
 *   1. Classify + seed static markdown from docs/
 *   2. Extract + seed live module docs from controllers + pages
 *   3. (Optional) flush the backend in-memory cache
 *
 * This script is the single entry point used by CI/CD, cron jobs, and
 * the Plesk post-deploy hook. It delegates to the two existing scripts
 * and adds environment validation, error recovery, and structured output.
 *
 * USAGE
 *   node scripts/docs-ci.mjs                  # full pipeline
 *   node scripts/docs-ci.mjs --dry-run        # classify + print, no DB writes
 *   node scripts/docs-ci.mjs --json           # export JSON only, no DB writes
 *   node scripts/docs-ci.mjs --skip-extract   # seed markdown only
 *   node scripts/docs-ci.mjs --skip-seed      # extract module docs only
 *   node scripts/docs-ci.mjs --flush-cache    # also POST to flush endpoint
 *
 * ENVIRONMENT
 *   PRISMA_DATABASE_URL   — required for DB writes
 *   DOCS_CACHE_FLUSH_URL  — optional: POST target to flush backend cache
 *   DOCS_CACHE_FLUSH_TOKEN— optional: Bearer token for flush endpoint
 *
 * EXIT CODES
 *   0  success
 *   1  seed-docs.mjs failed
 *   2  extract-module-docs.mjs failed
 *   3  cache flush failed (only when --flush-cache passed; pipeline still ran)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const DRY_RUN      = process.argv.includes('--dry-run');
const JSON_OUT     = process.argv.includes('--json');
const SKIP_EXTRACT = process.argv.includes('--skip-extract');
const SKIP_SEED    = process.argv.includes('--skip-seed');
const FLUSH_CACHE  = process.argv.includes('--flush-cache');
const HELP         = process.argv.includes('--help') || process.argv.includes('-h');

if (HELP) {
  console.log(`
  OVDS Docs CI Orchestrator
  ─────────────────────────
  node scripts/docs-ci.mjs               Full pipeline (seed + extract)
  node scripts/docs-ci.mjs --dry-run     Classify + print, no DB writes
  node scripts/docs-ci.mjs --json        Export JSON only
  node scripts/docs-ci.mjs --skip-extract  Static docs only (no module extract)
  node scripts/docs-ci.mjs --skip-seed     Module extraction only
  node scripts/docs-ci.mjs --flush-cache   Flush backend cache after seeding
  `);
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

function log(msg)    { console.log(`${CYAN}[docs-ci]${RESET} ${msg}`); }
function ok(msg)     { console.log(`${GREEN}✔${RESET}  ${msg}`); }
function warn(msg)   { console.warn(`${YELLOW}⚠${RESET}  ${msg}`); }
function fail(msg)   { console.error(`${RED}✖${RESET}  ${msg}`); }
function header(msg) { console.log(`\n${BOLD}${CYAN}═══ ${msg} ═══${RESET}\n`); }

function run(script, extraArgs = []) {
  const flags = [];
  if (DRY_RUN)  flags.push('--dry-run');
  if (JSON_OUT) flags.push('--json');
  const args = [...flags, ...extraArgs].join(' ');
  const cmd  = `node scripts/${script}${args ? ' ' + args : ''}`;
  log(`Running: ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// ── Environment validation ────────────────────────────────────────────────────
// Synchronous: reads .env directly with readFileSync (already imported above).

function validateEnv() {
  if (DRY_RUN || JSON_OUT) {
    log('Dry-run / JSON mode — skipping DB environment check');
    return;
  }

  // Already set in process.env (CI injects it as a secret)
  if (process.env.PRISMA_DATABASE_URL) {
    ok(`PRISMA_DATABASE_URL present (${process.env.PRISMA_DATABASE_URL.replace(/:[^:@]+@/, ':***@')})`);
    return;
  }

  // Fall back: try loading from .env file (local dev / Plesk server)
  for (const envFile of [resolve(ROOT, '.env'), resolve(ROOT, '.env.production')]) {
    if (!existsSync(envFile)) continue;
    try {
      const content = readFileSync(envFile, 'utf-8');
      const match   = content.match(/^PRISMA_DATABASE_URL=(.+)$/m);
      if (match) {
        process.env.PRISMA_DATABASE_URL = match[1].trim().replace(/^['"]|['"]$/g, '');
        ok(`PRISMA_DATABASE_URL loaded from ${envFile}`);
        return;
      }
    } catch { /* skip unreadable */ }
  }

  fail('PRISMA_DATABASE_URL is not set. Set it in your environment or .env file.');
  fail('  For JSON-only export (no DB), use --json flag.');
  process.exit(1);
}

// ── Cache flush ───────────────────────────────────────────────────────────────

async function flushCache() {
  const url   = process.env.DOCS_CACHE_FLUSH_URL;
  const token = process.env.DOCS_CACHE_FLUSH_TOKEN;

  if (!url) {
    warn('DOCS_CACHE_FLUSH_URL not set — skipping cache flush');
    return;
  }

  log(`Flushing docs cache at ${url} …`);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const { default: https } = await import('https');
    const { default: http  } = await import('http');
    const client = url.startsWith('https') ? https : http;

    await new Promise((resolve, reject) => {
      const req = client.request(url, { method: 'POST', headers }, (res) => {
        // Drain the response body to free the socket
        res.resume();
        if (res.statusCode && res.statusCode < 400) {
          ok(`Cache flush responded ${res.statusCode}`);
          resolve(res.statusCode);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });
  } catch (err) {
    warn(`Cache flush failed: ${err.message} — docs are still seeded, cache expires in 60 s`);
    if (FLUSH_CACHE) process.exitCode = 3;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  header('OVDS Documentation Pipeline');

  const mode = DRY_RUN ? 'DRY-RUN' : JSON_OUT ? 'JSON-EXPORT' : 'FULL-SEED';
  log(`Mode:          ${mode}`);
  log(`Skip seed:     ${SKIP_SEED}`);
  log(`Skip extract:  ${SKIP_EXTRACT}`);
  log(`Flush cache:   ${FLUSH_CACHE}`);
  console.log();

  // Validate DB env before any writes (synchronous — exits on missing URL)
  validateEnv();

  let seedFailed    = false;
  let extractFailed = false;

  // ── Phase 1: Static markdown classification ────────────────────────────────
  if (!SKIP_SEED) {
    header('Phase 1 — Static Markdown Seed');
    try {
      run('seed-docs.mjs');
      ok('Static markdown seeded');
    } catch (err) {
      fail(`seed-docs.mjs failed: ${err.message}`);
      seedFailed = true;
      // Continue to phase 2 — partial updates are better than a full abort
    }
  } else {
    warn('Phase 1 skipped (--skip-seed)');
  }

  // ── Phase 2: Live module extraction ───────────────────────────────────────
  if (!SKIP_EXTRACT) {
    header('Phase 2 — Live Module Extraction');
    try {
      run('extract-module-docs.mjs');
      ok('Module docs extracted');
    } catch (err) {
      fail(`extract-module-docs.mjs failed: ${err.message}`);
      extractFailed = true;
    }
  } else {
    warn('Phase 2 skipped (--skip-extract)');
  }

  // ── Phase 3: Cache flush ───────────────────────────────────────────────────
  if (FLUSH_CACHE && !DRY_RUN && !JSON_OUT) {
    header('Phase 3 — Cache Flush');
    await flushCache();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  header(`Pipeline Complete (${elapsed}s)`);

  if (seedFailed)    { fail('Phase 1 (seed) had errors — check output above'); process.exitCode = 1; }
  if (extractFailed) { fail('Phase 2 (extract) had errors — check output above'); if (!process.exitCode) process.exitCode = 2; }
  if (!seedFailed && !extractFailed) { ok('All phases completed successfully'); }
}

main().catch(err => {
  fail(`Unhandled error: ${err.message}`);
  process.exit(1);
});