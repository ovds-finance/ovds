#!/usr/bin/env node
/**
 * optimize-pipeline.test.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Preservation property tests for the optimization-pipeline scripts.
 *
 * Property 2 (from task 2): for any valid --output path, each script writes its
 * expected output file(s) and does NOT modify files outside --output.
 *
 * Uses Node's built-in test runner (node:test) + node:assert — no external deps.
 *
 * Run:
 *   node --test scripts/__tests__/optimize-pipeline.test.mjs
 *
 * Validates: Requirements 3.1, 3.2
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, readdirSync, existsSync,
  readFileSync, copyFileSync, statSync, writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { rm } from 'node:fs/promises';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..', '..');

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a fresh isolated temp directory for this test run.
 * All scripts write their output here — isolation prevents cross-test pollution.
 */
function makeTempDir(prefix) {
  return mkdtempSync(join(tmpdir(), `ovds-test-${prefix}-`));
}

/**
 * Run a script synchronously and return { status, stdout, stderr }.
 */
function runScript(scriptName, args = []) {
  const scriptPath = join(ROOT, 'scripts', scriptName);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120_000,
  });
  return {
    status:  result.status ?? 1,
    stdout:  result.stdout ?? '',
    stderr:  result.stderr ?? '',
    signal:  result.signal,
  };
}

/**
 * Recursively collect all file paths under a directory.
 */
function collectFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, files);
    else files.push(full);
  }
  return files;
}

/**
 * Parse a JSON file; throw with a clear message if it fails.
 */
function parseJson(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON parse error in ${filePath}: ${e.message}`);
  }
}

/**
 * Assert that no files exist outside the allowed base directory.
 * We snapshot before + after and diff the new files.
 *
 * @param {string[]} filesBefore  - file paths captured before the script ran
 * @param {string[]} filesAfter   - file paths captured after the script ran
 * @param {string}   allowedDir   - the --output directory (absolute)
 */
function assertNoSideEffects(filesBefore, filesAfter, allowedDir) {
  const beforeSet = new Set(filesBefore);
  const newFiles  = filesAfter.filter(f => !beforeSet.has(f));
  const outside   = newFiles.filter(f => !f.startsWith(allowedDir));
  assert.equal(
    outside.length,
    0,
    `Script wrote files outside --output dir:\n  ${outside.join('\n  ')}`,
  );
}

// ── shared fixture data ───────────────────────────────────────────────────────

// Paths to the already-generated reference reports (written by task 1).
const REF_BUNDLE_STATS  = join(ROOT, '.reports', 'bundle', 'bundle-stats.json');
const REF_SIZE_CHECK    = join(ROOT, '.reports', 'bundle', 'size-check.json');
const REF_DEP_CHECK     = join(ROOT, '.reports', 'deps',   'dep-check.json');
const REF_OPT_REPORT    = join(ROOT, '.reports', 'optimize-report.json');

// ═════════════════════════════════════════════════════════════════════════════
// Suite 1 — dep-check.mjs
// ═════════════════════════════════════════════════════════════════════════════

describe('dep-check.mjs — preservation properties', () => {
  /** @type {string} */
  let outDir;
  /** @type {string[]} */
  let filesBefore;
  /** @type {object} */
  let report;

  before(() => {
    outDir = makeTempDir('dep');
    // Snapshot workspace files before running the script (excluding node_modules, .git, dist)
    filesBefore = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );

    const result = runScript('dep-check.mjs', [
      '--output', outDir,
      '--skip-knip',
    ]);

    // Store for diagnostics — tests may still pass even if exit ≠ 0 (e.g. --fail-on-warn not set)
    if (result.status !== 0) {
      console.warn('[dep-check] exited with code', result.status);
      console.warn(result.stderr.slice(0, 500));
    }

    const jsonPath = join(outDir, 'dep-check.json');
    report = existsSync(jsonPath) ? parseJson(jsonPath) : null;
  });

  after(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it('writes dep-check.json to the --output directory', () => {
    assert.ok(existsSync(join(outDir, 'dep-check.json')), 'dep-check.json missing');
  });

  it('dep-check.json has a numeric warnCount field (even when 0)', () => {
    assert.ok(report !== null, 'dep-check.json could not be parsed');
    assert.ok(
      Object.prototype.hasOwnProperty.call(report, 'warnCount'),
      'warnCount key missing',
    );
    assert.equal(typeof report.warnCount, 'number', 'warnCount is not a number');
  });

  it('dep-check.json has knip, dedupe, looseRanges, duplicateVersions keys', () => {
    assert.ok(report !== null);
    for (const key of ['knip', 'dedupe', 'looseRanges', 'duplicateVersions']) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(report, key),
        `dep-check.json missing key: ${key}`,
      );
    }
  });

  it('dep-check.json looseRanges has a numeric count', () => {
    assert.ok(report !== null);
    assert.ok(report.looseRanges !== null && typeof report.looseRanges === 'object');
    assert.equal(typeof report.looseRanges.count, 'number');
  });

  it('dep-check.json knip.skipped is true when --skip-knip is passed', () => {
    assert.ok(report !== null);
    assert.ok(report.knip !== null && typeof report.knip === 'object');
    assert.equal(report.knip.skipped, true, 'knip.skipped should be true with --skip-knip');
  });

  it('also writes dep-check.md to the --output directory', () => {
    assert.ok(existsSync(join(outDir, 'dep-check.md')), 'dep-check.md missing');
    const size = statSync(join(outDir, 'dep-check.md')).size;
    assert.ok(size > 0, 'dep-check.md is empty');
  });

  it('does not write any files outside the --output directory', () => {
    const filesAfter = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );
    assertNoSideEffects(filesBefore, filesAfter, outDir);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 2 — bundle-analyze.mjs
// ═════════════════════════════════════════════════════════════════════════════

describe('bundle-analyze.mjs — preservation properties', () => {
  /** @type {string} */
  let outDir;
  /** @type {string[]} */
  let filesBefore;
  /** @type {object} */
  let report;
  /** @type {number} */
  let scriptStatus;

  before(() => {
    outDir = makeTempDir('bundle');
    filesBefore = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );

    const result = runScript('bundle-analyze.mjs', ['--output', outDir]);
    scriptStatus = result.status ?? 1;

    if (scriptStatus !== 0) {
      console.warn('[bundle-analyze] exited with code', scriptStatus);
      console.warn(result.stderr.slice(0, 500));
    }

    const jsonPath = join(outDir, 'bundle-stats.json');
    report = existsSync(jsonPath) ? parseJson(jsonPath) : null;
  });

  after(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it('exits 0 when build artefacts are present', () => {
    assert.equal(scriptStatus, 0, 'bundle-analyze.mjs exited non-zero; is apps/public/assets/ present?');
  });

  it('writes bundle-stats.json to the --output directory', () => {
    assert.ok(existsSync(join(outDir, 'bundle-stats.json')), 'bundle-stats.json missing');
  });

  it('bundle-stats.json has summary.totalSizeKb (number)', () => {
    assert.ok(report !== null, 'bundle-stats.json could not be parsed');
    assert.ok(report.summary !== null && typeof report.summary === 'object');
    assert.equal(typeof report.summary.totalSizeKb, 'number');
    assert.ok(report.summary.totalSizeKb > 0, 'totalSizeKb should be > 0');
  });

  it('bundle-stats.json has a chunks array', () => {
    assert.ok(report !== null);
    assert.ok(Array.isArray(report.chunks), 'chunks is not an array');
    assert.ok(report.chunks.length > 0, 'chunks array is empty');
  });

  it('each chunk has name, sizeKb (number), and type fields', () => {
    assert.ok(report !== null);
    for (const chunk of report.chunks.slice(0, 10)) {
      assert.equal(typeof chunk.name,   'string', `chunk.name not a string: ${JSON.stringify(chunk)}`);
      assert.equal(typeof chunk.sizeKb, 'number', `chunk.sizeKb not a number: ${JSON.stringify(chunk)}`);
      assert.equal(typeof chunk.type,   'string', `chunk.type not a string: ${JSON.stringify(chunk)}`);
    }
  });

  it('also writes bundle-summary.md to the --output directory', () => {
    assert.ok(existsSync(join(outDir, 'bundle-summary.md')), 'bundle-summary.md missing');
    const size = statSync(join(outDir, 'bundle-summary.md')).size;
    assert.ok(size > 0, 'bundle-summary.md is empty');
  });

  it('does not write any files outside the --output directory', () => {
    const filesAfter = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );
    assertNoSideEffects(filesBefore, filesAfter, outDir);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 3 — size-check.mjs
// ═════════════════════════════════════════════════════════════════════════════

describe('size-check.mjs — preservation properties', () => {
  /** @type {string} */
  let outDir;
  /** @type {string[]} */
  let filesBefore;
  /** @type {number} */
  let scriptStatus;

  before(() => {
    outDir = makeTempDir('size');

    // size-check.mjs reads --stats from the output dir.
    // We copy the reference bundle-stats.json into the temp dir so it acts as
    // the current build stats, without needing to re-run the full build.
    mkdirSync(outDir, { recursive: true });
    copyFileSync(REF_BUNDLE_STATS, join(outDir, 'bundle-stats.json'));

    filesBefore = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );

    // First-run mode: no baseline.json in outDir yet → script should create one
    const result = runScript('size-check.mjs', [
      '--stats',    join(outDir, 'bundle-stats.json'),
      '--baseline', join(outDir, 'baseline.json'),
      '--output',   outDir,
    ]);
    scriptStatus = result.status ?? 1;

    if (scriptStatus !== 0) {
      console.warn('[size-check] exited with code', scriptStatus);
      console.warn(result.stderr.slice(0, 500));
    }
  });

  after(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it('exits 0 on first run (baseline creation mode)', () => {
    assert.equal(scriptStatus, 0, 'size-check.mjs exited non-zero on first run');
  });

  it('creates baseline.json in --output on first run', () => {
    assert.ok(existsSync(join(outDir, 'baseline.json')), 'baseline.json not created on first run');
  });

  it('baseline.json has summary.totalSizeKb (number)', () => {
    const baseline = parseJson(join(outDir, 'baseline.json'));
    assert.ok(baseline.summary !== null && typeof baseline.summary === 'object');
    assert.equal(typeof baseline.summary.totalSizeKb, 'number');
    assert.ok(baseline.summary.totalSizeKb > 0);
  });

  it('second run (comparing against baseline) creates size-check.json', () => {
    // Run again — baseline now exists so a comparison report is written
    const result = runScript('size-check.mjs', [
      '--stats',    join(outDir, 'bundle-stats.json'),
      '--baseline', join(outDir, 'baseline.json'),
      '--output',   outDir,
    ]);
    assert.equal(result.status, 0, 'size-check.mjs exited non-zero on second run');
    assert.ok(existsSync(join(outDir, 'size-check.json')), 'size-check.json not written on second run');
  });

  it('size-check.json has summary.regressionCount (number)', () => {
    const sizeCheck = parseJson(join(outDir, 'size-check.json'));
    assert.ok(sizeCheck.summary !== null && typeof sizeCheck.summary === 'object');
    assert.equal(typeof sizeCheck.summary.regressionCount, 'number');
  });

  it('at least one of baseline.json or size-check.json exists after script runs', () => {
    const hasBaseline  = existsSync(join(outDir, 'baseline.json'));
    const hasSizeCheck = existsSync(join(outDir, 'size-check.json'));
    assert.ok(hasBaseline || hasSizeCheck, 'Neither baseline.json nor size-check.json was written');
  });

  it('does not write any files outside the --output directory', () => {
    const filesAfter = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );
    assertNoSideEffects(filesBefore, filesAfter, outDir);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 4 — optimize-report.mjs
// ═════════════════════════════════════════════════════════════════════════════

describe('optimize-report.mjs — preservation properties', () => {
  /** @type {string} */
  let outDir;
  /** @type {string} */
  let bundleDir;
  /** @type {string} */
  let depsDir;
  /** @type {string[]} */
  let filesBefore;
  /** @type {object} */
  let report;
  /** @type {number} */
  let scriptStatus;

  before(() => {
    outDir    = makeTempDir('optreport');
    bundleDir = join(outDir, 'bundle');
    depsDir   = join(outDir, 'deps');
    mkdirSync(bundleDir, { recursive: true });
    mkdirSync(depsDir,   { recursive: true });

    // Populate sub-report files so optimize-report.mjs can merge them
    copyFileSync(REF_BUNDLE_STATS, join(bundleDir, 'bundle-stats.json'));
    copyFileSync(REF_SIZE_CHECK,   join(bundleDir, 'size-check.json'));
    copyFileSync(REF_DEP_CHECK,    join(depsDir,   'dep-check.json'));

    filesBefore = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );

    // optimize-report.mjs reads sub-reports relative to ROOT/.reports/
    // We need to pass it a custom output dir.
    // The script reads from hard-coded paths (join(ROOT, '.reports', ...)) but
    // writes to --output. To make it use our temp copies we temporarily override
    // the real .reports with symlinks — that's fragile. Instead we pass --output
    // pointing to our temp dir and accept that the script will read from the real
    // .reports/ for sub-reports (they already exist from task 1). The test only
    // asserts the *output* files land in --output and have correct structure.
    const result = runScript('optimize-report.mjs', ['--output', outDir]);
    scriptStatus = result.status ?? 1;

    if (scriptStatus !== 0) {
      console.warn('[optimize-report] exited with code', scriptStatus);
      console.warn(result.stderr.slice(0, 500));
    }

    const jsonPath = join(outDir, 'optimize-report.json');
    report = existsSync(jsonPath) ? parseJson(jsonPath) : null;
  });

  after(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it('exits 0', () => {
    assert.equal(scriptStatus, 0, 'optimize-report.mjs exited non-zero');
  });

  it('writes optimize-report.json to the --output directory', () => {
    assert.ok(existsSync(join(outDir, 'optimize-report.json')), 'optimize-report.json missing');
  });

  it('optimize-report.json has totalWarnCount (number)', () => {
    assert.ok(report !== null, 'optimize-report.json could not be parsed');
    assert.ok(
      Object.prototype.hasOwnProperty.call(report, 'totalWarnCount'),
      'totalWarnCount key missing',
    );
    assert.equal(typeof report.totalWarnCount, 'number');
  });

  it('optimize-report.json has bundle key (may be null but must exist)', () => {
    assert.ok(report !== null);
    assert.ok(
      Object.prototype.hasOwnProperty.call(report, 'bundle'),
      'bundle key missing from optimize-report.json',
    );
  });

  it('optimize-report.json has deps key (may be null but must exist)', () => {
    assert.ok(report !== null);
    assert.ok(
      Object.prototype.hasOwnProperty.call(report, 'deps'),
      'deps key missing from optimize-report.json',
    );
  });

  it('optimize-report.json has generatedAt (ISO string)', () => {
    assert.ok(report !== null);
    assert.equal(typeof report.generatedAt, 'string');
    // Rough ISO date check
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(report.generatedAt), 'generatedAt is not an ISO timestamp');
  });

  it('writes optimize-summary.md to the --output directory', () => {
    assert.ok(existsSync(join(outDir, 'optimize-summary.md')), 'optimize-summary.md missing');
    const size = statSync(join(outDir, 'optimize-summary.md')).size;
    assert.ok(size > 0, 'optimize-summary.md is empty');
  });

  it('does not write any files outside the --output directory', () => {
    const filesAfter = collectFiles(ROOT).filter(f =>
      !f.includes('node_modules') &&
      !f.includes('\\.git\\') &&
      !f.includes('\\dist\\') &&
      !f.includes('\\.nx\\') &&
      !f.includes('\\.kilo\\')
    );
    assertNoSideEffects(filesBefore, filesAfter, outDir);
  });
});
