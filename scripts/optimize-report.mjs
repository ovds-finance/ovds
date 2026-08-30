#!/usr/bin/env node
/**
 * optimize-report.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Master optimization report orchestrator.
 *
 * Reads the individual sub-reports produced by:
 *   - scripts/bundle-analyze.mjs  → .reports/bundle/bundle-stats.json
 *   - scripts/dep-check.mjs       → .reports/deps/dep-check.json
 *   - scripts/size-check.mjs      → .reports/bundle/size-check.json
 *
 * Merges them into:
 *   - .reports/optimize-report.json   machine-readable consolidated report
 *   - .reports/optimize-summary.md    human-readable CI artifact
 *
 * Also surfaces Prisma-specific recommendations from the schema and
 * build output (query engine, binaryTargets, sideEffects: false status).
 *
 * Usage:
 *   node scripts/optimize-report.mjs [--output <dir>] [--fail-on-warn]
 *
 * Exit codes:
 *   0 — no blocking issues (warnings may exist)
 *   1 — blocking issues found (--fail-on-warn and at least one warning)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
function argValue(argv, flag) {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
}

const outputDir  = argValue(args, '--output') ?? join(ROOT, '.reports');
const failOnWarn = args.includes('--fail-on-warn');

mkdirSync(outputDir, { recursive: true });

// ── Safe loader ───────────────────────────────────────────────────────────────
function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

// ── Load sub-reports ──────────────────────────────────────────────────────────
const bundleStats  = loadJson(join(ROOT, '.reports', 'bundle', 'bundle-stats.json'));
const sizeCheck    = loadJson(join(ROOT, '.reports', 'bundle', 'size-check.json'));
const depCheck     = loadJson(join(ROOT, '.reports', 'deps',   'dep-check.json'));

// ── Prisma introspection ──────────────────────────────────────────────────────
function checkPrisma() {
  const schemaPath = join(ROOT, 'packages', 'database', 'prisma', 'schema.prisma');
  if (!existsSync(schemaPath)) return { available: false };

  const schema = readFileSync(schemaPath, 'utf8');
  const recommendations = [];

  // Check for explicit output path in generator
  if (!/output\s*=/.test(schema)) {
    recommendations.push({
      severity: 'info',
      message: 'Consider adding `output` to the prisma-client-js generator to control the client location and reduce accidental imports.',
      ref: 'https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client#using-a-custom-output-path',
    });
  }

  // Prisma 7 uses WASM engine by default — binaryTargets not needed
  if (/binaryTargets/.test(schema)) {
    recommendations.push({
      severity: 'info',
      message: 'Prisma 7 uses the WASM client engine by default — `binaryTargets` is unnecessary and can be removed from the generator block.',
      ref: 'https://www.prisma.io/docs/orm/prisma-client/deployment/overview',
    });
  }

  // Check database package has sideEffects: false
  const dbPkgPath = join(ROOT, 'packages', 'database', 'package.json');
  let sideEffectsOk = false;
  if (existsSync(dbPkgPath)) {
    try {
      const dbPkg = JSON.parse(readFileSync(dbPkgPath, 'utf8'));
      sideEffectsOk = dbPkg.sideEffects === false;
    } catch { /* ignore */ }
  }
  if (!sideEffectsOk) {
    recommendations.push({
      severity: 'warn',
      message: '`packages/database/package.json` is missing `"sideEffects": false`. Add it so bundlers can tree-shake unused Prisma client code.',
    });
  }

  // Check contracts package
  const contractsPkgPath = join(ROOT, 'packages', 'contracts', 'package.json');
  if (existsSync(contractsPkgPath)) {
    try {
      const cp = JSON.parse(readFileSync(contractsPkgPath, 'utf8'));
      if (cp.sideEffects !== false) {
        recommendations.push({
          severity: 'warn',
          message: '`packages/contracts/package.json` is missing `"sideEffects": false`. Add it to improve frontend tree-shaking of Prisma-generated Zod schemas.',
        });
      }
    } catch { /* ignore */ }
  }

  return { available: true, recommendations };
}

const prismaInfo = checkPrisma();

// ── Node module dedup hint ────────────────────────────────────────────────────
function checkNodeModuleDedup() {
  const hints = [];
  // Check if root package.json uses `overrides` for key deps — already done
  try {
    const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    const hasOverrides = !!rootPkg.overrides;
    if (!hasOverrides) {
      hints.push('Add an `overrides` section to root package.json to enforce single versions of react, typescript, zod, etc.');
    }
    // Check pnpm catalog/workspace protocol usage
    const workspacePkgs = ['@ovds/shared', '@ovds/database', '@ovds/contracts', '@ovds/core', '@ovds/ui'];
    const depFields = ['dependencies', 'devDependencies'];
    let allWorkspace = true;
    for (const field of depFields) {
      for (const wp of workspacePkgs) {
        const v = rootPkg[field]?.[wp];
        if (v && v !== '*' && !v.startsWith('workspace:')) {
          hints.push(`Root package.json references \`${wp}\` with version \`${v}\` — use \`workspace:*\` or \`*\` for internal packages.`);
          allWorkspace = false;
        }
      }
    }
  } catch { /* ignore */ }
  return hints;
}

const dedupeHints = checkNodeModuleDedup();

// ── SWC / esbuild verification ────────────────────────────────────────────────
function checkToolchain() {
  const checks = [];

  // Verify SWC in use for backend
  const backendPkg = loadJson(join(ROOT, 'apps', 'backend', 'package.json'));
  if (backendPkg && !backendPkg.devDependencies?.['@swc/core']) {
    checks.push({ ok: false, msg: 'backend @swc/core not found in devDependencies — SWC builder may not be active' });
  } else {
    checks.push({ ok: true, msg: 'Backend: @swc/core present ✅' });
  }

  // Verify @vitejs/plugin-react-swc for frontend
  const frontendPkg = loadJson(join(ROOT, 'apps', 'frontend', 'package.json'));
  if (frontendPkg && !frontendPkg.devDependencies?.['@vitejs/plugin-react-swc']) {
    checks.push({ ok: false, msg: 'frontend @vitejs/plugin-react-swc not found — JSX may be transpiled by Babel' });
  } else {
    checks.push({ ok: true, msg: 'Frontend: @vitejs/plugin-react-swc present ✅' });
  }

  return checks;
}

const toolchainChecks = checkToolchain();

// ── Nx cache health ───────────────────────────────────────────────────────────
function checkNxCache() {
  const cacheDir = join(ROOT, '.nx', 'cache');
  const hints = [];
  if (!existsSync(cacheDir)) {
    hints.push('No Nx cache directory found — run a build to warm the cache.');
    return { entries: 0, hints };
  }
  try {
    const entries = readdirSync(cacheDir).filter(e => !e.endsWith('.json'));
    if (entries.length === 0) {
      hints.push('Nx cache is empty — first build will be slow. Consider enabling remote caching (Nx Cloud).');
    }
    return { entries: entries.length, hints };
  } catch {
    return { entries: 0, hints };
  }
}

const nxCache = checkNxCache();

// ── Aggregate ─────────────────────────────────────────────────────────────────
const totalWarnCount =
  (bundleStats?.summary?.warnCount ?? 0) +
  (sizeCheck?.summary?.regressionCount ?? 0) +
  (depCheck?.warnCount ?? 0) +
  prismaInfo.recommendations?.filter(r => r.severity === 'warn').length ?? 0 +
  toolchainChecks.filter(c => !c.ok).length;

const report = {
  generatedAt: new Date().toISOString(),
  totalWarnCount,
  bundle: bundleStats
    ? {
        totalKb: bundleStats.summary.totalSizeKb,
        jsKb: bundleStats.summary.jsSizeKb,
        cssKb: bundleStats.summary.cssSizeKb,
        warnCount: bundleStats.summary.warnCount,
        thresholdKb: bundleStats.thresholdKb,
      }
    : null,
  sizeRegression: sizeCheck
    ? {
        baselineKb: sizeCheck.summary.baselineTotalKb,
        currentKb: sizeCheck.summary.currentTotalKb,
        deltaKb: sizeCheck.summary.deltaKb,
        regressionCount: sizeCheck.summary.regressionCount,
      }
    : null,
  deps: depCheck
    ? {
        knipIssues: depCheck.knip?.issueCount ?? 0,
        dedupeOpportunities: depCheck.dedupe?.opportunityCount ?? 0,
        looseRanges: depCheck.looseRanges?.count ?? 0,
        duplicateVersions: depCheck.duplicateVersions?.count ?? 0,
        circularDependencies: depCheck.circularDependencies?.count ?? 0,
      }
    : null,
  prisma: prismaInfo,
  toolchain: toolchainChecks,
  nxCache,
  dedupeHints,
};

writeFileSync(join(outputDir, 'optimize-report.json'), JSON.stringify(report, null, 2));

// ── Markdown ──────────────────────────────────────────────────────────────────
const overallStatus = totalWarnCount === 0 ? '✅ All checks passed' : `⚠️ ${totalWarnCount} issue(s) found`;

const md = `# Optimization Pipeline Report
Generated: ${report.generatedAt}

## Overall Status: ${overallStatus}

---

## 📦 Bundle Size
${bundleStats ? `
| Metric | Value |
|--------|-------|
| JS total | ${report.bundle.jsKb} KB |
| CSS total | ${report.bundle.cssKb} KB |
| Grand total | **${report.bundle.totalKb} KB** |
| Oversized chunks | ${report.bundle.warnCount} (threshold: ${report.bundle.thresholdKb} KB) |
` : '_Bundle stats not available — run `node scripts/bundle-analyze.mjs` after a production build._'}

${sizeCheck ? `## 📐 Size Regression
| Metric | Value |
|--------|-------|
| Baseline | ${report.sizeRegression.baselineKb} KB |
| Current | ${report.sizeRegression.currentKb} KB |
| Delta | ${report.sizeRegression.deltaKb > 0 ? '+' : ''}${report.sizeRegression.deltaKb} KB |
| Regressions | ${report.sizeRegression.regressionCount} |
` : '_Size regression data not available._'}

---

## 🔍 Dependency Health
${depCheck ? `
| Check | Issues |
|-------|--------|
| Knip unused deps/exports | ${report.deps.knipIssues} |
| pnpm dedupe opportunities | ${report.deps.dedupeOpportunities} |
| Loose version ranges | ${report.deps.looseRanges} |
| Duplicate package versions | ${report.deps.duplicateVersions} |
| Circular workspace deps | ${report.deps.circularDependencies} |
` : '_Dependency check data not available — run `node scripts/dep-check.mjs`._'}

---

## 🗄️ Prisma Optimization
${prismaInfo.available ? (prismaInfo.recommendations?.length === 0 ? '✅ No Prisma optimization recommendations.' : prismaInfo.recommendations.map(r => `- **[${r.severity.toUpperCase()}]** ${r.message}${r.ref ? `\n  → [Docs](${r.ref})` : ''}`).join('\n')) : '_Prisma schema not found._'}

---

## ⚙️ Toolchain
${toolchainChecks.map(c => `- ${c.ok ? '✅' : '❌'} ${c.msg}`).join('\n')}

---

## 🗂️ Nx Cache
- Cache entries: ${nxCache.entries}
${nxCache.hints.map(h => `- ⚠️ ${h}`).join('\n')}

---

## 💡 Deduplication Hints
${dedupeHints.length === 0 ? '✅ No deduplication hints.' : dedupeHints.map(h => `- ${h}`).join('\n')}

---

> **Sub-reports:** See \`.reports/bundle/\` and \`.reports/deps/\` for detailed breakdowns.
`;

writeFileSync(join(outputDir, 'optimize-summary.md'), md);

// ── Console ───────────────────────────────────────────────────────────────────
console.log('\n📊  Optimization Report');
console.log('─'.repeat(50));
if (bundleStats) {
  console.log(`  Bundle: ${report.bundle.totalKb} KB (JS: ${report.bundle.jsKb} KB, CSS: ${report.bundle.cssKb} KB)`);
}
if (depCheck) {
  console.log(`  Deps: ${report.deps.knipIssues} knip issues, ${report.deps.looseRanges} loose ranges, ${report.deps.duplicateVersions} dup versions, ${report.deps.circularDependencies} circular cycles`);
}
console.log(`  Prisma recommendations: ${prismaInfo.recommendations?.length ?? 0}`);
console.log(`  Total issues: ${totalWarnCount}`);
console.log(`\n  Reports written to: ${outputDir}`);

if (failOnWarn && totalWarnCount > 0) {
  console.error(`\n❌  --fail-on-warn is set and ${totalWarnCount} issue(s) were found.`);
  process.exit(1);
}
console.log('\n✅  Optimization report complete.');
