// Consolidation / cleanup helper for the OVDS DDD module restructure.
//
// The canonical home for every bounded context is now `packages/modules/<domain>`
// (see MODULE-RESTRUCTURE.md). The old `packages/features/*` and `packages/domains/*`
// packages remain as backward-compatible shims so the frontend keeps working.
//
// This script helps finish the move:
//   report              — count every import site of an old package and the module
//                         that should own it (the cutover work list).
//   delete --force      — remove ONLY the curated list of pure-duplicate packages
//                         below. Safe ONLY after those packages' importers have been
//                         migrated to `@ovds/modules/<domain>` and `npx nx typecheck`
//                         is green.
//
// NOTE: We do NOT blindly overwrite real packages with re-exports — that would lose
// the actual implementation. Migration is import-by-import (see `report`), then delete.
import { readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// canonical module -> the old packages it absorbs (informational / for `report`)
// keys use the import specifier form actually used in code: @ovds/features/<x>
const MAP = {
  auth: ['@ovds/features/auth'],
  settings: ['@ovds/features/settings', '@ovds/features/currency', '@ovds/features/fiscal', '@ovds/features/cost-centers', '@ovds/features/custom-fields', '@ovds/features/onboarding'],
  ledger: ['@ovds/domains/accounting', '@ovds/features/accounting', '@ovds/domains/chart-of-accounts', '@ovds/features/chart-of-accounts', '@ovds/domains/double-entry', '@ovds/features/double-entry', '@ovds/domains/journal', '@ovds/features/journal', '@ovds/domains/sub-ledger', '@ovds/features/sub-ledger', '@ovds/domains/ifrs', '@ovds/features/ifrs', '@ovds/domains/treasury', '@ovds/features/treasury', '@ovds/domains/general-ledger-compliance', '@ovds/features/general-ledger-compliance'],
  tax: ['@ovds/domains/tax', '@ovds/features/tax'],
  sales: ['@ovds/domains/sales', '@ovds/features/sales', '@ovds/domains/invoice', '@ovds/features/invoice', '@ovds/domains/crm', '@ovds/features/crm', '@ovds/features/customers', '@ovds/features/loyalty', '@ovds/domains/receipts', '@ovds/features/receipts'],
  purchases: ['@ovds/domains/purchases', '@ovds/features/purchases', '@ovds/domains/procurement', '@ovds/features/procurement', '@ovds/domains/expenses', '@ovds/features/expenses', '@ovds/domains/expense-claims', '@ovds/features/expense-claims', '@ovds/features/vendors', '@ovds/domains/payments', '@ovds/features/payments'],
  banking: ['@ovds/domains/banking', '@ovds/features/banking'],
  items: ['@ovds/domains/items', '@ovds/features/items', '@ovds/domains/inventory', '@ovds/features/inventory', '@ovds/domains/manufacturing', '@ovds/features/manufacturing'],
  hr: ['@ovds/domains/hr', '@ovds/features/hr', '@ovds/domains/payroll', '@ovds/features/payroll', '@ovds/domains/disaster-fund', '@ovds/features/disaster-fund'],
  projects: ['@ovds/domains/projects', '@ovds/features/projects'],
  compliance: ['@ovds/domains/compliance', '@ovds/features/compliance', '@ovds/domains/audit-outsourcing', '@ovds/features/audit-outsourcing', '@ovds/features/security-assessment', '@ovds/features/security-evaluator', '@ovds/features/security'],
  security: ['@ovds/domains/device-control', '@ovds/features/device-control', '@ovds/domains/iot', '@ovds/features/iot'],
  platform: ['@ovds/domains/platform', '@ovds/features/platform', '@ovds/features/appstore', '@ovds/features/helpdesk', '@ovds/features/release', '@ovds/features/notifications', '@ovds/features/offline-sync', '@ovds/features/workflow', '@ovds/features/monetization', '@ovds/features/dashboard'],
  reports: ['@ovds/domains/reporting', '@ovds/features/reporting'],
};

// Pure-duplicate packages that already contain only backward-compatible re-exports
// (no unique logic). Safe to delete once their importers are migrated.
const REDUNDANT = [];

const OLD_TO_MODULE = {};
for (const [mod, pkgs] of Object.entries(MAP)) for (const p of pkgs) OLD_TO_MODULE[p] = mod;

const SCAN_DIRS = ['apps', 'packages'];
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', 'dist', '.nx', '.git'].includes(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) acc.push(full);
  }
  return acc;
}

function findImports() {
  const files = [];
  for (const d of SCAN_DIRS) {
    const p = join(root, d);
    if (existsSync(p)) files.push(...walk(p));
  }
  const hits = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const old of Object.keys(OLD_TO_MODULE)) {
      const re = new RegExp(`(['"])${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/[\\w-]*)?\\1`, 'g');
      if (re.test(text)) hits.push({ file: relative(root, f), old, module: OLD_TO_MODULE[old] });
    }
  }
  return hits;
}

function pkgDirFor(spec) {
  const m = spec.match(/^@ovds\/(features|domains)\/(.*)$/);
  if (!m) return null;
  return join(root, 'packages', m[1], m[2]);
}

function cmdReport() {
  const hits = findImports();
  const byOld = {};
  for (const h of hits) (byOld[h.old] ||= { count: 0, module: h.module }), byOld[h.old].count++;
  console.log(`Total import sites referencing old packages: ${hits.length}\n`);
  for (const [old, info] of Object.entries(byOld)) {
    console.log(`${old.padEnd(34)} -> modules/${info.module.padEnd(12)} (${info.count})`);
  }
  return hits.length;
}

function cmdDelete(force) {
  if (!force) {
    console.error('Refusing to delete. Migrate importers to @ovds/modules/<domain>, run `npx nx typecheck`, then pass --force.');
    process.exit(1);
  }
  let n = 0;
  for (const spec of REDUNDANT) {
    const dir = pkgDirFor(spec);
    if (!dir || !existsSync(dir)) continue;
    rmSync(dir, { recursive: true, force: true });
    console.log(`deleted: ${relative(root, dir)}`);
    n++;
  }
  console.log(`\nDeleted ${n} pure-duplicate package directories.`);
}

const cmd = process.argv[2] || 'report';
if (cmd === 'report') cmdReport();
else if (cmd === 'delete') cmdDelete(process.argv.includes('--force'));
else { console.error('Unknown command. Use: report | delete --force'); process.exit(1); }
