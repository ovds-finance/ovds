/**
 * tsx-run.mjs — cross-platform tsx runner for Plesk/Linux deployment
 *
 * Handles --env-file=<path> argument by manually loading the env file
 * and injecting vars into process.env BEFORE spawning tsx.
 * This is more reliable than Node's --env-file flag (requires Node 20.6+)
 * and avoids shell permission issues with .bin/tsx on Linux.
 *
 * Usage:
 *   node scripts/tsx-run.mjs --env-file=../../.env.production prisma/seed.ts -- --environment=production
 */
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPkg = resolve(__dirname, '..');
const root  = resolve(dbPkg, '../..');

// ── Parse args — extract --env-file= before passing rest to tsx ──────────────
const rawArgs = process.argv.slice(2);
let envFilePath = null;
const tsxArgs = [];

for (const arg of rawArgs) {
  if (arg.startsWith('--env-file=')) {
    envFilePath = arg.slice('--env-file='.length);
  } else if (arg === '--') {
    // Drop the bare '--' separator — it signals end-of-options for npm/shell
    // but Node's parseArgs treats everything after it as positional args,
    // which causes ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL for --key=value args.
    // The args that follow (e.g. --environment=production) are passed directly.
  } else {
    tsxArgs.push(arg);
  }
}

// ── Load env file if specified ────────────────────────────────────────────────
if (envFilePath) {
  const envPath = resolve(dbPkg, envFilePath);
  if (!existsSync(envPath)) {
    console.error(`\nERROR: env file not found: ${envPath}\n`);
    process.exit(1);
  }

  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) process.env[key] = val; // always override
  });

  if (!process.env.PRISMA_DATABASE_URL) {
    console.error(`\nERROR: PRISMA_DATABASE_URL not found in ${envPath}\n`);
    process.exit(1);
  }

  const safeUrl = process.env.PRISMA_DATABASE_URL.replace(/:([^:@/]+)@/, ':***@');
  console.log(`\n✔ Loaded env: ${envPath}`);
  console.log(`✔ Database  : ${safeUrl}\n`);
}

// ── Resolve tsx CLI entry point ───────────────────────────────────────────────
// Use the JS entry directly — avoids bash shebang issues on Linux/Plesk.
// Check the monorepo root first, then fall back to the local package node_modules.
const tsxCandidates = [
  resolve(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  resolve(dbPkg, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
];
const tsxCli = tsxCandidates.find(p => existsSync(p));
if (!tsxCli) {
  console.error(`\nERROR: tsx not found. Searched:\n${tsxCandidates.map(p => '  ' + p).join('\n')}`);
  console.error('Run: npm install from the monorepo root\n');
  process.exit(1);
}

// ── Spawn tsx ─────────────────────────────────────────────────────────────────
console.log(`$ tsx ${tsxArgs.join(' ')}\n`);
try {
  execFileSync(process.execPath, [tsxCli, ...tsxArgs], {
    stdio: 'inherit',
    cwd: dbPkg,
    env: { ...process.env },
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
