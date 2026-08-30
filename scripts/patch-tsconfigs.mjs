/**
 * scripts/patch-tsconfigs.mjs
 *
 * Patches all domain and feature tsconfig.json files to add:
 *   - domains: incremental, composite, tsBuildInfoFile (they emit to dist/)
 *   - features: incremental, tsBuildInfoFile (noEmit:true packages — typecheck-only)
 *               NOTE: composite requires emit so we skip it for noEmit features.
 *
 * Safe to re-run: uses a marker comment-free JSON approach, only adds keys
 * that are missing, never removes existing keys.
 *
 * Usage:
 *   node scripts/patch-tsconfigs.mjs
 *   node scripts/patch-tsconfigs.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

// tsconfig.json files that have inline // comments need comment-stripping
// before JSON.parse. We do a minimal strip of line-comments only.
function stripJsonComments(src) {
  // Remove // … comments that are not inside strings
  return src.replace(/\/\/[^\n]*/g, '');
}

function readTsconfig(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return { parsed: JSON.parse(stripJsonComments(raw)), raw };
  } catch (e) {
    console.error(`  ✗ Failed to parse ${filePath}: ${e.message}`);
    return null;
  }
}

function patchDomain(filePath) {
  const result = readTsconfig(filePath);
  if (!result) return false;
  const { parsed } = result;

  const co = parsed.compilerOptions ?? {};
  let changed = false;

  // Domains emit to dist/ — safe to enable composite + incremental
  if (!co.composite) { co.composite = true; changed = true; }
  if (!co.incremental) { co.incremental = true; changed = true; }
  if (!co.tsBuildInfoFile) { co.tsBuildInfoFile = './dist/.tsbuildinfo'; changed = true; }

  if (!changed) {
    console.log(`  – ${path.relative(root, filePath)} already patched`);
    return false;
  }

  parsed.compilerOptions = co;

  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
  }
  console.log(`  ✓ ${dryRun ? '[dry-run] would patch' : 'patched'} ${path.relative(root, filePath)}`);
  return true;
}

function patchFeature(filePath) {
  const result = readTsconfig(filePath);
  if (!result) return false;
  const { parsed } = result;

  const co = parsed.compilerOptions ?? {};
  let changed = false;

  const isNoEmit = co.noEmit === true;

  if (isNoEmit) {
    // noEmit features: incremental + tsBuildInfoFile only (no composite — composite requires emit)
    if (!co.incremental) { co.incremental = true; changed = true; }
    if (!co.tsBuildInfoFile) { co.tsBuildInfoFile = './node_modules/.cache/.tsbuildinfo'; changed = true; }
  } else {
    // Features that do emit: full composite treatment same as domains
    if (!co.composite) { co.composite = true; changed = true; }
    if (!co.incremental) { co.incremental = true; changed = true; }
    if (!co.tsBuildInfoFile) { co.tsBuildInfoFile = './dist/.tsbuildinfo'; changed = true; }
  }

  if (!changed) {
    console.log(`  – ${path.relative(root, filePath)} already patched`);
    return false;
  }

  parsed.compilerOptions = co;

  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
  }
  console.log(`  ✓ ${dryRun ? '[dry-run] would patch' : 'patched'} ${path.relative(root, filePath)} (${isNoEmit ? 'noEmit/typecheck' : 'emitting'})`);
  return true;
}

function walkPackages(baseDir, patchFn) {
  if (!fs.existsSync(baseDir)) {
    console.log(`  ⚠ Directory not found, skipping: ${baseDir}`);
    return { patched: 0, skipped: 0, failed: 0 };
  }

  let patched = 0, skipped = 0, failed = 0;

  for (const name of fs.readdirSync(baseDir)) {
    // Skip non-directories and meta files
    const pkgDir = path.join(baseDir, name);
    if (!fs.statSync(pkgDir).isDirectory()) continue;

    const tsconfigPath = path.join(pkgDir, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      console.log(`  ⚠ No tsconfig.json in ${path.relative(root, pkgDir)}`);
      skipped++;
      continue;
    }

    const didPatch = patchFn(tsconfigPath);
    if (didPatch) patched++;
    else skipped++;
  }

  return { patched, skipped, failed };
}

console.log(`\n🔧 Patching domain tsconfigs${dryRun ? ' (DRY RUN)' : ''}...\n`);
const domainResults = walkPackages(path.join(root, 'packages/domains'), patchDomain);

console.log(`\n🔧 Patching feature tsconfigs${dryRun ? ' (DRY RUN)' : ''}...\n`);
const featureResults = walkPackages(path.join(root, 'packages/features'), patchFeature);

const total = {
  patched: domainResults.patched + featureResults.patched,
  skipped: domainResults.skipped + featureResults.skipped,
};

console.log(`\n✅ Done. Patched: ${total.patched}  Already up-to-date: ${total.skipped}\n`);
