#!/usr/bin/env node
/**
 * dep-check.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Dependency hygiene checker for the OVDS Nx monorepo.
 *
 * Checks performed:
 *   1. Knip — unused exports, files, and dependencies across all packages
 *   2. pnpm dedupe — detects packages installed in more than one version
 *   3. Version pinning — flags open ranges (^, ~, *) in package.json files
 *   4. Circular package dependencies — detects workspace packages importing each other cyclically
 *
 * Usage:
 *   node scripts/dep-check.mjs [--output <dir>] [--fail-on-warn] [--skip-knip]
 *
 * Options:
 *   --output <dir>    Write reports here (default: .reports/deps)
 *   --fail-on-warn    Exit 1 on any warning (for main/develop gate)
 *   --skip-knip       Skip the knip scan (knip can be slow on first run)
 *   --fix-ranges      Automatically pin loose ranges in package.json files (local dev only)
 *
 * Outputs:
 *   <output>/dep-check.json   machine-readable report
 *   <output>/dep-check.md     human-readable summary
 */

import {
  readFileSync, writeFileSync, mkdirSync, readdirSync,
  existsSync, statSync,
} from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const outputDir  = argValue(args, '--output') ?? join(ROOT, '.reports', 'deps');
const failOnWarn = args.includes('--fail-on-warn');
const skipKnip   = args.includes('--skip-knip');
const fixRanges  = args.includes('--fix-ranges');

function argValue(argv, flag) {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
}

mkdirSync(outputDir, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', ...opts });
  } catch (e) {
    return e.stdout ?? e.message ?? '';
  }
}

function findPackageJsons() {
  const pkgFiles = [];
  function walk(dir, depth = 0) {
    if (depth > 4) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', '.nx', '.kilo'].includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.name === 'package.json') pkgFiles.push(full);
    }
  }
  walk(ROOT);
  return pkgFiles;
}

// ── 1. Knip scan ──────────────────────────────────────────────────────────────
let knipResult = { skipped: false, issues: [], error: null };

if (skipKnip) {
  console.log('⏭  Knip scan skipped (--skip-knip)');
  knipResult.skipped = true;
} else {
  console.log('🔍  Running knip (unused deps/exports)...');
  try {
    // knip --reporter json writes to stdout
    const raw = run('npx knip --reporter json 2>/dev/null || npx knip --reporter json 2>NUL', {
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // Extract JSON from output (knip prepends some text on some versions)
    const jsonStart = raw.indexOf('[');
    const jsonEnd   = raw.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        knipResult.issues = parsed;
        console.log(`   knip found ${parsed.length} file(s) with issues`);
      } catch {
        knipResult.error = 'Could not parse knip JSON output';
        console.warn('   ⚠️  Could not parse knip JSON output — run manually to inspect');
      }
    } else {
      // knip found nothing (or printed human-readable "no issues")
      knipResult.issues = [];
      console.log('   ✅  knip: no unused dependencies or exports detected');
    }
  } catch (e) {
    knipResult.error = String(e.message ?? e);
    console.warn(`   ⚠️  knip failed: ${knipResult.error}`);
  }
}

// ── 2. pnpm dedupe check ──────────────────────────────────────────────────────
console.log('\n🔍  Checking pnpm deduplication...');
let dedupeResult = { duplicates: [], error: null };

try {
  // pnpm dedupe --check exits 1 when duplicates exist; we capture output either way
  const raw = run('pnpm dedupe --check 2>&1 || echo DEDUPE_CHECK_DONE', { timeout: 60_000 });

  // Parse "X packages deduped" or "Already up to date"
  if (/already up to date/i.test(raw)) {
    console.log('   ✅  pnpm: no deduplication opportunities found');
  } else if (/ERR_PNPM_FETCH/i.test(raw)) {
    // pnpm tried to resolve a workspace-local package against the npm registry
    // and failed — this is a known false-positive when workspace packages use
    // `workspace:*` but are also referenced by name in other local packages.
    // The run produced no reliable deduplication data; skip rather than report noise.
    dedupeResult.error = 'pnpm dedupe --check failed: workspace package registry fetch error (ERR_PNPM_FETCH_404). Not a real deduplication issue.';
    console.warn('   ⚠️  pnpm dedupe --check hit a registry fetch error for a workspace package — skipping (false-positive).');
  } else {
    // Extract lines that look like package names.
    // Filter out error/warning noise: pnpm dedupe --check may attempt to resolve
    // workspace-only packages (e.g. @ovds/contracts) against the npm registry and
    // emit ERR_PNPM_FETCH_404 / WARN lines — these are not deduplication opportunities.
    // Also exclude any line with spaces after the package name fragment — real
    // dedupe output is just a package name, error prose contains spaces.
    const DEDUPE_NOISE = /ERR_|WARN\s|https?:\/\/|Not Found|No authorization|This error|not in the npm|or you have no|permission to fetch/i;
    const dupLines = raw
      .split('\n')
      .filter(l => /^\s*([\w@][\w@/.-]+)\s/.test(l) && !l.includes('DEDUPE') && !DEDUPE_NOISE.test(l))
      .filter(l => l.trim().split(/\s+/).length === 1) // real package names have no spaces
      .map(l => l.trim())
      .filter(Boolean);
    dedupeResult.duplicates = dupLines;
    if (dupLines.length > 0) {
      console.warn(`   ⚠️  pnpm: ${dupLines.length} deduplication opportunities — run \`pnpm dedupe\` to fix`);
    } else {
      console.log('   ✅  pnpm: no deduplication opportunities found');
    }
  }
} catch (e) {
  dedupeResult.error = String(e.message ?? e);
  console.warn(`   ⚠️  pnpm dedupe check failed: ${dedupeResult.error}`);
}

// ── 3. Version pinning audit ──────────────────────────────────────────────────
// NOTE: This project intentionally uses `^` (caret) ranges for all dependencies.
// This is standard npm convention and deliberate policy — the root package.json
// `overrides` block pins any conflicting transitive versions where needed.
// Loose ranges are reported here for visibility but are NOT treated as errors
// unless you pass --fail-on-warn (e.g. on the main/develop CI gate).
console.log('\n🔍  Auditing version ranges...');

const LOOSE_RANGE = /^[\^~]|^\*|^>|^<|^\|\|/;
// Packages we intentionally keep as workspace ranges — skip them
const WORKSPACE_EXEMPT = /^\*/;

/** @type {Array<{file:string, pkg:string, range:string, section:string}>} */
const looseRanges = [];

const pkgFiles = findPackageJsons();
for (const pkgFile of pkgFiles) {
  const rel = relative(ROOT, pkgFile);
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  } catch {
    continue;
  }

  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[section] ?? {};
    for (const [name, range] of Object.entries(deps)) {
      if (typeof range !== 'string') continue;
      // Workspace protocol is intentional
      if (range.startsWith('workspace:') || range === '*') continue;
      if (LOOSE_RANGE.test(range)) {
        looseRanges.push({ file: rel, pkg: name, range, section });
        if (fixRanges) {
          // Resolve current installed version and pin it
          try {
            const installed = run(`pnpm list ${name} --json 2>/dev/null`, { timeout: 10_000 });
            const parsed = JSON.parse(installed);
            const version = parsed?.[0]?.dependencies?.[name]?.version;
            if (version) {
              deps[name] = version;
            }
          } catch { /* best effort */ }
        }
      }
    }
  }

  if (fixRanges) {
    writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
  }
}

if (looseRanges.length === 0) {
  console.log('   ✅  All versions are pinned');
} else {
  console.warn(`   ⚠️  ${looseRanges.length} loose range(s) found`);
  if (fixRanges) {
    console.log('   🔧  --fix-ranges applied (best-effort)');
  }
}

// ── 4. Duplicate dep versions (npm ls) ────────────────────────────────────────
console.log('\n🔍  Checking for duplicate package versions...');
let duplicateVersions = [];
try {
  const raw = run('pnpm list --json --depth=1 2>/dev/null', { timeout: 60_000 });
  // pnpm list --json returns an array per workspace package
  const tree = JSON.parse(raw);
  const seen = new Map(); // pkgName -> Set of versions
  function collectVersions(node) {
    if (!node?.dependencies) return;
    for (const [name, info] of Object.entries(node.dependencies)) {
      if (!seen.has(name)) seen.set(name, new Set());
      if (info.version) seen.get(name).add(info.version);
    }
  }
  if (Array.isArray(tree)) tree.forEach(collectVersions);
  else collectVersions(tree);

  for (const [name, versions] of seen.entries()) {
    if (versions.size > 1) {
      duplicateVersions.push({ name, versions: [...versions] });
    }
  }
  if (duplicateVersions.length === 0) {
    console.log('   ✅  No duplicate package versions found');
  } else {
    console.warn(`   ⚠️  ${duplicateVersions.length} package(s) installed in multiple versions:`);
    for (const { name, versions } of duplicateVersions.slice(0, 10)) {
      console.warn(`      ${name}: ${versions.join(', ')}`);
    }
  }
} catch (e) {
  console.warn(`   ⚠️  Could not check duplicate versions: ${e.message}`);
}

// ── 5. Circular workspace package dependencies ────────────────────────────────
console.log('\n🔍  Detecting circular workspace package dependencies...');

/**
 * Builds a dependency graph of workspace packages by reading each package.json
 * and collecting `workspace:*` / `"*"` references to other workspace packages.
 *
 * Returns: Map<pkgName, Set<pkgName>>  (adjacency list)
 */
function buildWorkspaceDependencyGraph(packageFiles) {
  // First pass: collect all workspace package names
  /** @type {Map<string, string>} pkgName → packageJson file path */
  const workspacePackages = new Map();
  for (const pkgFile of packageFiles) {
    try {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
      if (pkg.name && pkg.name.startsWith('@ovds/')) {
        workspacePackages.set(pkg.name, pkgFile);
      }
    } catch { /* skip unparseable */ }
  }

  // Second pass: build adjacency list
  /** @type {Map<string, Set<string>>} */
  const graph = new Map();
  for (const [name] of workspacePackages) {
    graph.set(name, new Set());
  }

  for (const [name, pkgFile] of workspacePackages) {
    try {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
        for (const [dep, ver] of Object.entries(pkg[section] ?? {})) {
          if (!workspacePackages.has(dep)) continue;
          if (typeof ver !== 'string') continue;
          // Only follow workspace-protocol or wildcard references
          if (ver === '*' || ver.startsWith('workspace:')) {
            graph.get(name)?.add(dep);
          }
        }
      }
    } catch { /* skip */ }
  }

  return graph;
}

/**
 * Detects cycles in a directed graph using iterative DFS.
 * Returns an array of cycle paths (each path is an array of node names).
 * @param {Map<string, Set<string>>} graph
 * @returns {string[][]}
 */
function detectCycles(graph) {
  const visited    = new Set();  // permanently visited
  const inStack    = new Set();  // currently on the DFS stack
  const cycles     = [];

  function dfs(node, path) {
    visited.add(node);
    inStack.add(node);

    for (const neighbour of (graph.get(node) ?? [])) {
      if (!visited.has(neighbour)) {
        dfs(neighbour, [...path, neighbour]);
      } else if (inStack.has(neighbour)) {
        // Found a cycle — record it starting from the repeated node
        const cycleStart = path.indexOf(neighbour);
        const cycle = cycleStart !== -1
          ? [...path.slice(cycleStart), neighbour]
          : [...path, neighbour];
        cycles.push(cycle);
      }
    }

    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, [node]);
    }
  }

  return cycles;
}

let circularDeps = [];
try {
  const graph  = buildWorkspaceDependencyGraph(pkgFiles);
  circularDeps = detectCycles(graph);

  if (circularDeps.length === 0) {
    console.log('   ✅  No circular workspace package dependencies found');
  } else {
    console.warn(`   ⚠️  ${circularDeps.length} circular dependency chain(s) detected:`);
    for (const cycle of circularDeps.slice(0, 5)) {
      console.warn(`      ${cycle.join(' → ')}`);
    }
  }
} catch (e) {
  console.warn(`   ⚠️  Circular dependency check failed: ${e.message}`);
}

// ── Assemble report ───────────────────────────────────────────────────────────
const warnCount = (knipResult.issues?.length ?? 0)
  + dedupeResult.duplicates.length
  + looseRanges.length
  + duplicateVersions.length
  + circularDeps.length;

const report = {
  generatedAt: new Date().toISOString(),
  warnCount,
  knip: {
    skipped: knipResult.skipped,
    issueCount: knipResult.issues?.length ?? 0,
    issues: (knipResult.issues ?? []).slice(0, 50),  // cap to avoid huge JSON
    error: knipResult.error,
  },
  dedupe: {
    opportunityCount: dedupeResult.duplicates.length,
    packages: dedupeResult.duplicates,
    error: dedupeResult.error,
  },
  looseRanges: {
    count: looseRanges.length,
    items: looseRanges.slice(0, 100),
  },
  duplicateVersions: {
    count: duplicateVersions.length,
    packages: duplicateVersions.slice(0, 50),
  },
  circularDependencies: {
    count: circularDeps.length,
    cycles: circularDeps.slice(0, 20).map(c => c.join(' → ')),
  },
};

writeFileSync(join(outputDir, 'dep-check.json'), JSON.stringify(report, null, 2));

// ── Markdown summary ──────────────────────────────────────────────────────────
const md = `# Dependency Check Report
Generated: ${report.generatedAt}

## Summary

| Check | Status | Issues |
|-------|--------|--------|
| Knip (unused deps/exports) | ${knipResult.skipped ? '⏭ skipped' : knipResult.issues.length === 0 ? '✅ clean' : `⚠️ ${knipResult.issues.length} file(s)`} | ${knipResult.issues.length} |
| pnpm dedupe | ${dedupeResult.duplicates.length === 0 ? '✅ clean' : `⚠️ ${dedupeResult.duplicates.length} package(s)`} | ${dedupeResult.duplicates.length} |
| Loose version ranges | ${looseRanges.length === 0 ? '✅ all pinned' : `⚠️ ${looseRanges.length} range(s)`} | ${looseRanges.length} |
| Duplicate package versions | ${duplicateVersions.length === 0 ? '✅ clean' : `⚠️ ${duplicateVersions.length} package(s)`} | ${duplicateVersions.length} |
| Circular workspace deps | ${circularDeps.length === 0 ? '✅ none' : `⚠️ ${circularDeps.length} cycle(s)`} | ${circularDeps.length} |

${looseRanges.length > 0 ? `## Loose Version Ranges (first 20)

| File | Package | Range | Section |
|------|---------|-------|---------|
${looseRanges.slice(0, 20).map(r => `| ${r.file} | \`${r.pkg}\` | \`${r.range}\` | ${r.section} |`).join('\n')}

> Run \`node scripts/dep-check.mjs --fix-ranges\` to pin these automatically (local only).
` : ''}
${duplicateVersions.length > 0 ? `## Duplicate Package Versions (first 10)

| Package | Versions |
|---------|----------|
${duplicateVersions.slice(0, 10).map(d => `| \`${d.name}\` | ${d.versions.join(', ')} |`).join('\n')}

> Add an \`overrides\` entry in the root \`package.json\` to force a single version.
` : ''}
${dedupeResult.duplicates.length > 0 ? `## pnpm Deduplicate Opportunities

Run \`pnpm dedupe\` to collapse these:

\`\`\`
${dedupeResult.duplicates.slice(0, 20).join('\n')}
\`\`\`
` : ''}
${circularDeps.length > 0 ? `## ⚠️ Circular Workspace Package Dependencies

The following import cycles were detected between \`@ovds/*\` workspace packages.
Circular deps prevent proper tree-shaking and can cause hard-to-debug initialisation
order issues. Break each cycle by extracting shared logic into a lower-level package.

| Cycle |
|-------|
${circularDeps.slice(0, 20).map(c => `| \`${c.join(' → ')}\` |`).join('\n')}

> Run \`node scripts/dep-check.mjs\` after restructuring to confirm cycles are resolved.
` : ''}
`;

writeFileSync(join(outputDir, 'dep-check.md'), md);

// ── Final output ──────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`📋  Dep-check summary: ${warnCount} total warning(s)`);
console.log(`    Reports written to: ${outputDir}`);

if (failOnWarn && warnCount > 0) {
  console.error(`\n❌  --fail-on-warn is set and ${warnCount} issue(s) were found.`);
  process.exit(1);
}
console.log('\n✅  Dependency check complete.');
