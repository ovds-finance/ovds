#!/usr/bin/env node
/**
 * size-check.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Bundle size regression guard.
 *
 * Compares the current bundle (from bundle-analyze output) against a stored
 * baseline and fails if any chunk has grown beyond the allowed delta.
 *
 * Workflow:
 *   1. First run:  creates `.reports/bundle/baseline.json` and exits 0.
 *   2. Later runs: compares current `bundle-stats.json` against `baseline.json`.
 *      - Regressions above `--delta` percentage → warnings or failures.
 *   3. Update baseline: `node scripts/size-check.mjs --update-baseline`
 *
 * Usage:
 *   node scripts/size-check.mjs [options]
 *
 * Options:
 *   --stats   <file>   Path to bundle-stats.json (default: .reports/bundle/bundle-stats.json)
 *   --baseline <file>  Path to baseline JSON      (default: .reports/bundle/baseline.json)
 *   --delta    <pct>   Allowed growth percentage  (default: 10)
 *   --fail-on-warn     Exit 1 when regressions are found
 *   --update-baseline  Overwrite baseline with current stats and exit 0
 *   --output   <dir>   Where to write size-check.json/.md (default: .reports/bundle)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_REPORT_DIR = join(ROOT, '.reports', 'bundle');

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argValue(argv, flag) {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
}

const statsPath    = argValue(args, '--stats')    ?? join(DEFAULT_REPORT_DIR, 'bundle-stats.json');
const baselinePath = argValue(args, '--baseline') ?? join(DEFAULT_REPORT_DIR, 'baseline.json');
const outputDir    = argValue(args, '--output')   ?? DEFAULT_REPORT_DIR;
const allowedDelta = Number(argValue(args, '--delta') ?? 10);
const failOnWarn   = args.includes('--fail-on-warn');
const updateMode   = args.includes('--update-baseline');

mkdirSync(outputDir, { recursive: true });

// ── Load current stats ────────────────────────────────────────────────────────
if (!existsSync(statsPath)) {
  console.error(`❌  bundle-stats.json not found at ${statsPath}`);
  console.error('    Run bundle analysis first: node scripts/bundle-analyze.mjs');
  process.exit(1);
}

const current = JSON.parse(readFileSync(statsPath, 'utf8'));

// ── Update baseline mode ──────────────────────────────────────────────────────
if (updateMode) {
  writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log(`✅  Baseline updated at ${baselinePath}`);
  console.log(`    Total: ${current.summary.totalSizeKb} KB across ${current.summary.totalChunks} chunks`);
  process.exit(0);
}

// ── First run: create baseline ────────────────────────────────────────────────
if (!existsSync(baselinePath)) {
  writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log(`📐  No baseline found — created new baseline at ${baselinePath}`);
  console.log(`    Total: ${current.summary.totalSizeKb} KB`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

// ── Build lookup maps ─────────────────────────────────────────────────────────
// Key by chunk name (without hash) to make comparisons hash-stable
function stripHash(name) {
  // vendor-react-abc123.js → vendor-react.js
  // index-xyz.js → index.js
  return name.replace(/-[a-f0-9]{8,}(\.[^.]+)$/, '$1');
}

const baselineMap = new Map(
  (baseline.chunks ?? []).map(c => [stripHash(c.name), c])
);
const currentMap = new Map(
  (current.chunks ?? []).map(c => [stripHash(c.name), c])
);

// ── Compare ───────────────────────────────────────────────────────────────────
/** @type {Array<{name:string, baseKb:number, nowKb:number, deltaPct:number}>} */
const regressions = [];
/** @type {Array<{name:string, baseKb:number, nowKb:number, deltaPct:number}>} */
const improvements = [];
/** @type {string[]} */
const newChunks = [];
/** @type {string[]} */
const removedChunks = [];

for (const [key, curr] of currentMap.entries()) {
  const base = baselineMap.get(key);
  if (!base) {
    newChunks.push(key);
    continue;
  }
  if (base.sizeKb === 0) continue;
  const deltaPct = ((curr.sizeKb - base.sizeKb) / base.sizeKb) * 100;
  const entry = { name: key, baseKb: base.sizeKb, nowKb: curr.sizeKb, deltaPct: Math.round(deltaPct * 10) / 10 };
  if (deltaPct > allowedDelta) regressions.push(entry);
  else if (deltaPct < -5) improvements.push(entry);
}

for (const key of baselineMap.keys()) {
  if (!currentMap.has(key)) removedChunks.push(key);
}

// Total size comparison
const totalDeltaKb = current.summary.totalSizeKb - baseline.summary.totalSizeKb;
const totalDeltaPct = baseline.summary.totalSizeKb > 0
  ? (totalDeltaKb / baseline.summary.totalSizeKb) * 100
  : 0;

// ── Assemble report ───────────────────────────────────────────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  baselineDate: baseline.generatedAt,
  allowedDeltaPct: allowedDelta,
  summary: {
    baselineTotalKb: baseline.summary.totalSizeKb,
    currentTotalKb: current.summary.totalSizeKb,
    deltaKb: Math.round(totalDeltaKb * 10) / 10,
    deltaPct: Math.round(totalDeltaPct * 10) / 10,
    regressionCount: regressions.length,
    improvementCount: improvements.length,
    newChunkCount: newChunks.length,
    removedChunkCount: removedChunks.length,
  },
  regressions,
  improvements,
  newChunks,
  removedChunks,
};

writeFileSync(join(outputDir, 'size-check.json'), JSON.stringify(report, null, 2));

// ── Markdown ──────────────────────────────────────────────────────────────────
const statusIcon = regressions.length === 0 ? '✅' : '⚠️';

const md = `# Bundle Size Regression Check
Generated: ${report.generatedAt}
Baseline:  ${report.baselineDate ?? 'unknown'}

## Overall

| Metric | Value |
|--------|-------|
| Baseline total | ${report.summary.baselineTotalKb} KB |
| Current total  | ${report.summary.currentTotalKb} KB |
| Delta | ${report.summary.deltaKb > 0 ? '+' : ''}${report.summary.deltaKb} KB (${report.summary.deltaPct > 0 ? '+' : ''}${report.summary.deltaPct}%) |
| Allowed growth | ${allowedDelta}% per chunk |
| Regressions | ${regressions.length} |
| Improvements | ${improvements.length} |
| New chunks | ${newChunks.length} |
| Removed chunks | ${removedChunks.length} |

${regressions.length > 0 ? `## ⚠️ Regressions (grew >${allowedDelta}%)

| Chunk | Before | After | Δ |
|-------|--------|-------|---|
${regressions.map(r => `| \`${r.name}\` | ${r.baseKb} KB | ${r.nowKb} KB | +${r.deltaPct}% |`).join('\n')}
` : `## ${statusIcon} No regressions detected\n`}
${improvements.length > 0 ? `## 🎉 Improvements (shrank >5%)

| Chunk | Before | After | Δ |
|-------|--------|-------|---|
${improvements.map(r => `| \`${r.name}\` | ${r.baseKb} KB | ${r.nowKb} KB | ${r.deltaPct}% |`).join('\n')}
` : ''}
${newChunks.length > 0 ? `## New Chunks\n\n${newChunks.map(c => `- \`${c}\``).join('\n')}\n` : ''}
${removedChunks.length > 0 ? `## Removed Chunks\n\n${removedChunks.map(c => `- \`${c}\``).join('\n')}\n` : ''}

---
> To update the baseline run: \`node scripts/size-check.mjs --update-baseline\`
`;

writeFileSync(join(outputDir, 'size-check.md'), md);

// ── Console output ────────────────────────────────────────────────────────────
const arrow = totalDeltaKb > 0 ? '↑' : totalDeltaKb < 0 ? '↓' : '→';
console.log('\n📐  Bundle Size Check');
console.log('─'.repeat(50));
console.log(`  Baseline : ${report.summary.baselineTotalKb} KB`);
console.log(`  Current  : ${report.summary.currentTotalKb} KB  ${arrow} ${report.summary.deltaKb > 0 ? '+' : ''}${report.summary.deltaKb} KB (${report.summary.deltaPct > 0 ? '+' : ''}${report.summary.deltaPct}%)`);

if (regressions.length > 0) {
  console.warn(`\n  ⚠️  ${regressions.length} chunk(s) regressed beyond ${allowedDelta}% threshold:`);
  for (const r of regressions) {
    console.warn(`     ${r.name}: ${r.baseKb} → ${r.nowKb} KB (+${r.deltaPct}%)`);
  }
}
if (improvements.length > 0) {
  console.log(`\n  🎉  ${improvements.length} chunk(s) improved:`);
  for (const r of improvements) {
    console.log(`     ${r.name}: ${r.baseKb} → ${r.nowKb} KB (${r.deltaPct}%)`);
  }
}
console.log(`\n  Reports written to: ${outputDir}`);

if (failOnWarn && regressions.length > 0) {
  console.error(`\n❌  --fail-on-warn is set: ${regressions.length} bundle regression(s). Fix or update baseline.`);
  process.exit(1);
}

console.log('\n✅  Size check complete.');
