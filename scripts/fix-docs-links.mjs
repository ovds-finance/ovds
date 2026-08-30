#!/usr/bin/env node
/**
 * fix-docs-links.mjs
 * ---------------------------------------------------------------------------
 * One-off maintainer tool: rewrites broken internal Markdown links in docs/
 * to their correct relative path.
 *
 * Strategy (safe + mechanical):
 *   - For every link, resolve relative to the file it appears in (code fences
 *     skipped, same as check-docs-health.mjs).
 *   - If the resolved target is missing BUT a file with the SAME BASENAME
 *     exists exactly once somewhere under docs/, rewrite the link to the correct
 *     relative path (anchor/query preserved).
 *   - Links whose basename is ambiguous (e.g. many README.md) or whose file
 *     simply does not exist are SKIPPED (cannot be guessed safely).
 *
 * This only touches links that are currently broken and uniquely resolvable,
 * so it will not rewrite any already-correct link.
 *
 * Usage:
 *   node scripts/fix-docs-links.mjs --dry-run
 *   node scripts/fix-docs-links.mjs --apply
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, relative, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const DOCS_ROOT = resolve(repoRoot, 'docs');
const APPLY = process.argv.includes('--apply');
const DRY = process.argv.includes('--dry-run') || !APPLY;

// ---- index: basename -> [abs paths] ----------------------------------------
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}
const files = walk(DOCS_ROOT);
const byBase = new Map();
for (const f of files) {
  const b = basename(f);
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(f);
}

const LINK_RE = /\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
const FENCE_RE = /^(```|~~~)/;

let changed = 0;
const fixes = [];

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inFence = false;
  let fileChanged = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE_RE.test(line.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;

    let m;
    LINK_RE.lastIndex = 0;
    const matches = [];
    while ((m = LINK_RE.exec(line)) !== null) matches.push(m);

    let newLine = line;
    let lineChanged = false;
    // apply right-to-left so earlier indices stay valid while we splice
    for (let k = matches.length - 1; k >= 0; k--) {
      const mm = matches[k];
      const rawTarget = mm[2].trim();
      const target = (() => { try { return decodeURIComponent(rawTarget); } catch { return rawTarget; } })();
      if (/^(https?:|mailto:)/i.test(target)) continue;
      if (target.startsWith('#')) continue;
      const [pathPart, anchor = ''] = target.split('#');
      if (!pathPart) continue;
      const abs = resolve(dirname(file), pathPart);
      if (existsSync(abs)) continue; // already correct

      const b = basename(pathPart);
      const candidates = byBase.get(b);
      if (!candidates || candidates.length !== 1) continue; // ambiguous or missing -> skip
      const correctAbs = candidates[0];

      let rel = relative(dirname(file), correctAbs).split(sep).join('/');
      if (!rel.startsWith('.')) rel = './' + rel;
      const corrected = anchor ? `${rel}#${anchor}` : rel;

      // replace ONLY the path substring at its exact position.
      // Anchor on the '](' separator (unambiguous) rather than indexOf, which
      // would otherwise match a path substring that also appears inside the text.
      const start = mm.index + mm[0].indexOf('](') + 2;
      const end = start + mm[2].length;
      newLine = newLine.slice(0, start) + corrected + newLine.slice(end);
      fixes.push({ file: relative(repoRoot, file), from: rawTarget, to: corrected });
      lineChanged = true;
    }
    if (lineChanged) { lines[i] = newLine; fileChanged = true; }
  }

  if (fileChanged) {
    changed++;
    if (APPLY) writeFileSync(file, lines.join('\n'), 'utf8');
  }
}

console.log(`\nDocs link fixer — mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`  files scanned: ${files.length}`);
console.log(`  links fixed:   ${fixes.length}`);
console.log(`  files changed: ${changed}`);
if (fixes.length) {
  console.log('  ---');
  for (const f of fixes) console.log(`  • ${f.file}\n      ${f.from}  ->  ${f.to}`);
}
if (APPLY) console.log('\nApplied. Run: node scripts/check-docs-health.mjs --no-schema-check');
else console.log('\nDry-run only. Re-run with --apply to write changes.');
