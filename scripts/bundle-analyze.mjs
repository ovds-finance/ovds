#!/usr/bin/env node
/**
 * bundle-analyze.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Analyses the Vite production build output and produces a structured JSON
 * report plus a human-readable markdown summary.
 *
 * Requirements:
 *   - Run AFTER a production build (apps/public must exist)
 *   - Node 20+
 *
 * Usage:
 *   node scripts/bundle-analyze.mjs [--output <dir>] [--threshold <kb>]
 *
 * Options:
 *   --output   <dir>   Directory to write reports into (default: .reports/bundle)
 *   --threshold <kb>   Warn if any single chunk exceeds this size in KB (default: 500)
 *   --fail-on-warn     Exit 1 when warnings are found (use on main/develop branches)
 *
 * Output files:
 *   <output>/bundle-stats.json   – machine-readable chunk breakdown
 *   <output>/bundle-summary.md   – human-readable markdown table
 */

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, extname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const outputDir  = argValue(args, '--output')    ?? join(ROOT, '.reports', 'bundle');
const thresholdKb = Number(argValue(args, '--threshold') ?? 500);
const failOnWarn = args.includes('--fail-on-warn');

function argValue(argv, flag) {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
}

// ── Locate build output ───────────────────────────────────────────────────────
// Vite config sets outDir = apps/public (resolved from apps/frontend)
const BUILD_DIR = join(ROOT, 'apps', 'public', 'assets');

if (!existsSync(BUILD_DIR)) {
  console.error(`❌  Build output not found at ${BUILD_DIR}`);
  console.error('    Run the frontend build first: npx nx build frontend');
  process.exit(1);
}

// ── Collect chunks ────────────────────────────────────────────────────────────
function walkDir(dir, exts = ['.js', '.css']) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full, exts));
    } else if (exts.includes(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walkDir(BUILD_DIR);

/** @type {Array<{name:string, sizeBytes:number, sizeKb:number, type:string, warn:boolean}>} */
const chunks = allFiles
  .map(f => {
    const stats = statSync(f);
    const sizeKb = stats.size / 1024;
    const name = basename(f);
    // Classify by our vite.config.ts manual chunk names
    const type = classifyChunk(name);
    return {
      name,
      path: relative(ROOT, f),
      sizeBytes: stats.size,
      sizeKb: Math.round(sizeKb * 10) / 10,
      type,
      warn: sizeKb > thresholdKb,
    };
  })
  .sort((a, b) => b.sizeBytes - a.sizeBytes);

function classifyChunk(name) {
  if (name.startsWith('vendor-react'))   return 'vendor/react';
  if (name.startsWith('vendor-icons'))   return 'vendor/icons';
  if (name.startsWith('vendor-radix'))   return 'vendor/radix';
  if (name.startsWith('vendor-dnd'))     return 'vendor/dnd';
  if (name.startsWith('vendor-i18n'))    return 'vendor/i18n';
  if (name.startsWith('vendor-charts'))  return 'vendor/charts';
  if (name.startsWith('vendor-http'))    return 'vendor/http';
  if (name.startsWith('vendor-query'))   return 'vendor/query';
  if (name.startsWith('vendor-auth'))    return 'vendor/auth';
  if (name.startsWith('vendor-dates'))   return 'vendor/dates';
  if (name.startsWith('vendor-parsers')) return 'vendor/parsers';
  if (name.startsWith('vendor-firebase'))return 'vendor/firebase';
  if (name.startsWith('vendor-refine'))  return 'vendor/refine';
  if (name.startsWith('vendor-'))        return 'vendor/other';
  if (name.endsWith('.css'))             return 'style';
  return 'app';
}

// ── Totals ───────────────────────────────────────────────────────────────────
const totalBytes  = chunks.reduce((s, c) => s + c.sizeBytes, 0);
const jsChunks    = chunks.filter(c => c.name.endsWith('.js'));
const cssChunks   = chunks.filter(c => c.name.endsWith('.css'));
const warnChunks  = chunks.filter(c => c.warn);

const stats = {
  generatedAt: new Date().toISOString(),
  buildDir: relative(ROOT, BUILD_DIR),
  thresholdKb,
  summary: {
    totalChunks: chunks.length,
    jsChunks: jsChunks.length,
    cssChunks: cssChunks.length,
    totalSizeKb: Math.round(totalBytes / 1024 * 10) / 10,
    jsSizeKb: Math.round(jsChunks.reduce((s,c)=>s+c.sizeBytes,0) / 1024 * 10) / 10,
    cssSizeKb: Math.round(cssChunks.reduce((s,c)=>s+c.sizeBytes,0) / 1024 * 10) / 10,
    warnCount: warnChunks.length,
  },
  chunks,
};

// ── Ensure output dir ─────────────────────────────────────────────────────────
mkdirSync(outputDir, { recursive: true });

// ── Write JSON ────────────────────────────────────────────────────────────────
const jsonPath = join(outputDir, 'bundle-stats.json');
writeFileSync(jsonPath, JSON.stringify(stats, null, 2));

// ── Write Markdown ────────────────────────────────────────────────────────────
const mdRows = chunks
  .slice(0, 30)   // top 30 by size
  .map(c => {
    const warn = c.warn ? ' ⚠️' : '';
    return `| ${c.name}${warn} | ${c.type} | ${c.sizeKb} KB |`;
  })
  .join('\n');

const md = `# Bundle Analysis Report
Generated: ${stats.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Total chunks | ${stats.summary.totalChunks} |
| JS total | ${stats.summary.jsSizeKb} KB |
| CSS total | ${stats.summary.cssSizeKb} KB |
| **Grand total** | **${stats.summary.totalSizeKb} KB** |
| Oversized chunks (>${thresholdKb} KB) | ${stats.summary.warnCount} |

## Top 30 Chunks by Size

| Chunk | Type | Size |
|-------|------|------|
${mdRows}

${warnChunks.length > 0 ? `## ⚠️ Oversized Chunks\n\nThe following chunks exceed the **${thresholdKb} KB** threshold:\n\n${warnChunks.map(c => `- \`${c.name}\`: **${c.sizeKb} KB**`).join('\n')}\n\nConsider splitting these further or auditing their imports with \`npx vite-bundle-visualizer\`.` : '## ✅ All chunks within threshold'}
`;

const mdPath = join(outputDir, 'bundle-summary.md');
writeFileSync(mdPath, md);

// ── Console output ────────────────────────────────────────────────────────────
console.log('\n📦  Bundle Analysis');
console.log('─'.repeat(50));
console.log(`  JS total  : ${stats.summary.jsSizeKb} KB across ${stats.summary.jsChunks} chunks`);
console.log(`  CSS total : ${stats.summary.cssSizeKb} KB`);
console.log(`  Grand total: ${stats.summary.totalSizeKb} KB`);
if (warnChunks.length > 0) {
  console.warn(`\n  ⚠️  ${warnChunks.length} chunk(s) exceed ${thresholdKb} KB threshold:`);
  for (const c of warnChunks) {
    console.warn(`     ${c.name}: ${c.sizeKb} KB`);
  }
}
console.log(`\n  Reports written to: ${outputDir}`);

if (failOnWarn && warnChunks.length > 0) {
  console.error(`\n❌  --fail-on-warn is set: ${warnChunks.length} oversized chunk(s). Fix or raise threshold.`);
  process.exit(1);
}

console.log('\n✅  Bundle analysis complete.');
