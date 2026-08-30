#!/usr/bin/env node
/**
 * check-docs-health.mjs
 * ---------------------------------------------------------------------------
 * Zero-dependency validator for the OVDS documentation tree.
 *
 *   - Walks docs/**\/*.md (recursively) and parses every Markdown link.
 *   - Skips fenced code blocks (``` ... ```) so example URLs in snippets are
 *     not flagged.
 *   - Resolves relative links (./, ../, bare) against the file they appear in
 *     and reports any that point at a missing file.
 *   - Ignores external (http/https/mailto) links and pure #anchors.
 *   - Detects links to the generated DATA-MODEL.md (kept out of the portal DB)
 *     and warns if the file is stale by re-running the schema generator's
 *     --check in-process (optional; requires the schema to be present).
 *
 * Exit code is 1 if any broken link is found (CI gate). Use --json for machine
 * output, or --help for usage.
 *
 * Usage:
 *   node scripts/check-docs-health.mjs
 *   node scripts/check-docs-health.mjs --root docs --json
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const args = process.argv.slice(2);
const opt = (name) => args.includes(name);
const getOpt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (opt('--help') || opt('-h')) {
  console.log(`Usage: node scripts/check-docs-health.mjs [--root <dir>] [--json] [--no-schema-check] [--warn]`);
  process.exit(0);
}

const DOCS_ROOT = resolve(repoRoot, getOpt('--root', 'docs'));
const EMIT_JSON = opt('--json');
const SCHEMA_CHECK = !opt('--no-schema-check');
const WARN_ONLY = opt('--warn'); // report broken links but exit 0 (CI soft gate)

// ---- collect markdown files -------------------------------------------------
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

if (!existsSync(DOCS_ROOT)) {
  console.error(`docs root not found: ${DOCS_ROOT}`);
  process.exit(1);
}
const files = walk(DOCS_ROOT);

// ---- parse links, skipping fenced code --------------------------------------
const LINK_RE = /\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
const broken = [];
const linkCountByFile = new Map();

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  // remove fenced code blocks
  const cleaned = raw.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
  const fileDir = dirname(file);
  let m;
  const seen = new Set();
  while ((m = LINK_RE.exec(cleaned)) !== null) {
    const rawTarget = m[1].trim();
    // Decode URL-encoded paths (e.g. spaces written as %20) so they resolve
    // against the on-disk filename.
    const target = (() => { try { return decodeURIComponent(rawTarget); } catch { return rawTarget; } })();
    if (/^(https?:|mailto:)/i.test(target)) continue;
    if (target.startsWith('#')) continue; // in-page anchor
    const [pathPart] = target.split('#'); // ignore anchor, keep file path
    if (!pathPart) continue;
    const key = `${file}::${target}`;
    if (seen.has(key)) continue; // de-dupe identical links in one file
    seen.add(key);
    linkCountByFile.set(file, (linkCountByFile.get(file) ?? 0) + 1);
    const abs = resolve(fileDir, pathPart);
    if (!existsSync(abs)) {
      broken.push({ file: relative(repoRoot, file), link: target, resolved: relative(repoRoot, abs) });
    }
  }
}

// ---- optional: is DATA-MODEL.md fresh? --------------------------------------
let schemaStale = false;
let schemaMsg = '';
if (SCHEMA_CHECK) {
  const dataModel = resolve(DOCS_ROOT, '09-developers', 'DATA-MODEL.md');
  if (existsSync(dataModel)) {
    try {
      const { execFileSync } = await import('node:child_process');
      execFileSync('node', [resolve(__dirname, 'generate-schema-docs.mjs'), '--check'], {
        cwd: repoRoot,
        stdio: 'pipe',
      });
    } catch (e) {
      schemaStale = true;
      schemaMsg = String(e?.stderr ?? e?.stdout ?? e).split('\n').slice(-3).join(' ').trim();
    }
  }
}

// ---- report -----------------------------------------------------------------
const totalLinks = [...linkCountByFile.values()].reduce((a, b) => a + b, 0);

if (EMIT_JSON) {
  console.log(JSON.stringify({ root: relative(repoRoot, DOCS_ROOT), files: files.length, linkCount: totalLinks, broken, schemaStale, schemaMsg }, null, 2));
} else {
  console.log(`\nDocs health — root: ${relative(repoRoot, DOCS_ROOT)}`);
  console.log(`  markdown files: ${files.length}`);
  console.log(`  links checked: ${totalLinks}`);
  if (broken.length === 0) console.log('  broken links: 0 ✔');
  else {
    console.log(`  broken links: ${broken.length}`);
    for (const b of broken) console.log(`    • ${b.file}\n        -> ${b.link}  (resolves to ${b.resolved})`);
  }
  if (SCHEMA_CHECK) {
    if (schemaStale) console.log(`  DATA-MODEL.md: STALE — ${schemaMsg}`);
    else console.log('  DATA-MODEL.md: fresh ✔');
  }
}

if (schemaStale) process.exit(1); // schema drift is always a hard gate
if (broken.length > 0) {
  if (WARN_ONLY) console.log(`Docs health: ${broken.length} broken link(s) reported (--warn, not failing CI)`);
  else process.exit(1);
}
console.log('Docs health OK ✔');
process.exit(0);
