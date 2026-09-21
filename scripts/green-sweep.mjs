/**
 * green-sweep.mjs — final indigo→green brand color sweep
 * Run: node scripts/green-sweep.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const SKIP = ['node_modules', 'dist', '.git', '.nx', 'coverage'];
const EXT  = new Set(['.tsx', '.ts', '.css']);

// Ordered from most specific to most general to avoid double-replacing
const REPLACEMENTS = [
  // Additional dark-only variants missed in first pass
  ['dark:bg-indigo-900/5',  'dark:bg-green-900/5'],
  ['dark:bg-indigo-900/10', 'dark:bg-green-900/10'],
  ['dark:bg-indigo-900/15', 'dark:bg-green-900/15'],
  ['dark:bg-indigo-900/20', 'dark:bg-green-900/20'],
  ['dark:bg-indigo-900/25', 'dark:bg-green-900/25'],
  ['dark:bg-indigo-900/30', 'dark:bg-green-900/30'],
  ['dark:bg-indigo-900/40', 'dark:bg-green-900/40'],
  ['dark:bg-indigo-900/50', 'dark:bg-green-900/50'],
  ['dark:bg-indigo-950/5',  'dark:bg-green-950/5'],
  ['dark:bg-indigo-950/10', 'dark:bg-green-950/10'],
  ['dark:bg-indigo-950/15', 'dark:bg-green-950/15'],
  ['dark:bg-indigo-950/20', 'dark:bg-green-950/20'],
  ['dark:bg-indigo-950/25', 'dark:bg-green-950/25'],
  ['dark:bg-indigo-950/30', 'dark:bg-green-950/30'],
  ['dark:bg-indigo-950/40', 'dark:bg-green-950/40'],
  ['dark:bg-indigo-950/50', 'dark:bg-green-950/50'],
  ['dark:bg-indigo-800/40', 'dark:bg-green-800/40'],
  ['dark:text-indigo-300', 'dark:text-green-300'],
  ['dark:text-indigo-400', 'dark:text-[var(--pro-azure-light)]'],
  ['dark:text-indigo-200', 'dark:text-green-200'],
  ['dark:border-indigo-900/30', 'dark:border-green-900/30'],
  ['dark:border-indigo-900/40', 'dark:border-green-900/40'],
  ['dark:border-indigo-800/40', 'dark:border-green-800/40'],
  ['dark:border-indigo-800', 'dark:border-green-800'],
  ['dark:border-indigo-700', 'dark:border-green-700'],
  ['dark:border-indigo-600', 'dark:border-[var(--pro-azure-light)]'],
  ['dark:hover:bg-indigo-900', 'dark:hover:bg-green-900'],
  // text-indigo-800 (used in info callout boxes)
  ['text-indigo-800', 'text-[var(--pro-azure-dark)]'],
  ['text-indigo-100', 'text-green-100'],
  ['text-indigo-200', 'text-green-200'],
  ['text-indigo-300', 'text-green-300'],
  ['text-indigo-400', 'text-[var(--pro-azure-light)]'],
  // border-t-indigo (pipeline connectors)
  ['border-t-indigo-400', 'border-t-[var(--pro-azure)]'],
  ['border-t-indigo-500', 'border-t-[var(--pro-azure)]'],
  // bg-indigo-200/400 (progress/dot colors)
  ['bg-indigo-200', 'bg-[var(--pro-azure-200)]'],
  ['bg-indigo-300', 'bg-[var(--pro-azure-light)]'],
  ['bg-indigo-400', 'bg-[var(--pro-azure-light)]'],
  // inline rgba shadows
  ['rgba(99,102,241,.12)', 'rgba(79,186,111,.12)'],
  ['rgba(99,102,241,.15)', 'rgba(79,186,111,.15)'],
  ['rgba(99,102,241,.18)', 'rgba(79,186,111,.18)'],
  ['rgba(99,102,241,.1)',  'rgba(79,186,111,.1)'],
  ['rgba(99,102,241,.35)', 'rgba(79,186,111,.35)'],
  ['rgba(99,102,241,.45)', 'rgba(79,186,111,.45)'],
  ['rgba(99,102,241,.55)', 'rgba(79,186,111,.55)'],
  ['rgba(99,102,241,0.1)', 'rgba(79,186,111,0.1)'],
  ['rgba(99,102,241,0.15)', 'rgba(79,186,111,0.15)'],
  ['rgba(99,102,241,0.18)', 'rgba(79,186,111,0.18)'],
  ['rgba(99,102,241,0.25)', 'rgba(79,186,111,0.25)'],
  ['rgba(99,102,241,0.30)', 'rgba(79,186,111,0.30)'],
  ['rgba(99,102,241,0.35)', 'rgba(79,186,111,0.35)'],
  ['rgba(99,102,241,0.38)', 'rgba(79,186,111,0.38)'],
  ['rgba(99,102,241,0.45)', 'rgba(79,186,111,0.45)'],
  ['rgba(99,102,241,0.55)', 'rgba(79,186,111,0.55)'],
  // gradient from-indigo
  ['from-indigo-500 to-indigo-600', 'from-green-500 to-green-600'],
  ['from-indigo-500 to-indigo-700', 'from-green-500 to-green-700'],
  ['from-indigo-500 to-teal-600', 'from-[var(--pro-azure)] to-teal-600'],
  ['shadow-indigo-500/30', 'shadow-green-500/30'],
  ['shadow-indigo-500/20', 'shadow-green-500/20'],
  ['shadow-indigo-500/10', 'shadow-green-500/10'],
  // border-indigo-100 (leftover)
  ['border-indigo-100', 'border-[var(--pro-azure-100)]'],
  // ring variants
  ['ring-2 ring-indigo-100', 'ring-2 ring-[var(--pro-azure-100)]'],
  ['ring-inset ring-indigo-400', 'ring-inset ring-[var(--pro-azure)]'],
  ['ring-indigo-400', 'ring-[var(--pro-azure)]'],
  ['ring-indigo-500', 'ring-[var(--pro-azure)]'],
  // focus ring
  ['focus:ring-indigo-400', 'focus:ring-[var(--pro-azure)]'],
  // hover:bg-indigo-200
  ['hover:bg-indigo-200', 'hover:bg-[var(--pro-azure-200)]'],
  // hover:bg-indigo-100
  ['hover:bg-indigo-100', 'hover:bg-[var(--pro-azure-100)]'],
  ['dark:bg-indigo-900/30 dark:text-indigo-300', 'dark:bg-green-900/30 dark:text-green-300'],
  ['dark:bg-indigo-900/30 dark:text-indigo-400', 'dark:bg-green-900/30 dark:text-[var(--pro-azure-light)]'],
  ['dark:bg-indigo-900/10', 'dark:bg-green-900/10'],
  ['dark:bg-indigo-900/20', 'dark:bg-green-900/20'],
  ['dark:bg-indigo-900/30', 'dark:bg-green-900/30'],
  ['dark:bg-indigo-900/40', 'dark:bg-green-900/40'],
  ['dark:bg-indigo-950/10', 'dark:bg-green-950/10'],
  ['dark:bg-indigo-950/20', 'dark:bg-green-950/20'],
  ['dark:bg-indigo-950/30', 'dark:bg-green-950/30'],
  ['dark:bg-indigo-950/40', 'dark:bg-green-950/40'],
  ['dark:text-indigo-300', 'dark:text-green-300'],
  ['dark:text-indigo-400', 'dark:text-[var(--pro-azure-light)]'],
  ['dark:text-indigo-200', 'dark:text-green-200'],
  ['dark:border-indigo-900/30', 'dark:border-green-900/30'],
  ['dark:border-indigo-900/40', 'dark:border-green-900/40'],
  ['dark:border-indigo-800/40', 'dark:border-green-800/40'],
  ['dark:border-indigo-800', 'dark:border-green-800'],
  ['dark:border-indigo-700', 'dark:border-green-700'],
  ['dark:border-indigo-600', 'dark:border-[var(--pro-azure-light)]'],
  // text-indigo-800 (used in info callout boxes)
  ['text-indigo-800', 'text-[var(--pro-azure-dark)]'],
  // border-t-indigo (pipeline connectors)
  ['border-t-indigo-400', 'border-t-[var(--pro-azure)]'],
  ['border-t-indigo-500', 'border-t-[var(--pro-azure)]'],
  // ring variants
  ['ring-2 ring-indigo-100', 'ring-2 ring-[var(--pro-azure-100)]'],
  ['ring-inset ring-indigo-400', 'ring-inset ring-[var(--pro-azure)]'],
  ['bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400',
   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'],
  ['bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400',
   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
   'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
   'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300'],
  ['bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
   'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-[var(--pro-azure-light)]'],
  ['bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400',
   'bg-[var(--pro-azure-100)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
   'bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['bg-indigo-50 dark:bg-indigo-950/40', 'bg-[var(--pro-azure-50)] dark:bg-green-950/40'],
  ['bg-indigo-50 dark:bg-indigo-950/30', 'bg-[var(--pro-azure-50)] dark:bg-green-950/30'],
  ['bg-indigo-50 dark:bg-indigo-950/20', 'bg-[var(--pro-azure-50)] dark:bg-green-950/20'],
  ['bg-indigo-50 dark:bg-indigo-900/20', 'bg-[var(--pro-azure-50)] dark:bg-green-900/20'],
  ['bg-indigo-50 dark:bg-indigo-900/30', 'bg-[var(--pro-azure-50)] dark:bg-green-900/30'],
  ['bg-indigo-50 dark:bg-indigo-900/40', 'bg-[var(--pro-azure-50)] dark:bg-green-900/40'],
  ['bg-indigo-100 dark:bg-indigo-900/30', 'bg-[var(--pro-azure-100)] dark:bg-green-900/30'],
  ['bg-indigo-100 dark:bg-indigo-900/40', 'bg-[var(--pro-azure-100)] dark:bg-green-900/40'],
  ['bg-indigo-100 dark:bg-indigo-950/40', 'bg-[var(--pro-azure-100)] dark:bg-green-950/40'],
  ['border-indigo-200 dark:border-indigo-800/40', 'border-[var(--pro-azure-100)] dark:border-green-800/40'],
  ['border-indigo-200 dark:border-indigo-800', 'border-[var(--pro-azure-100)] dark:border-green-800'],
  ['border-indigo-300 dark:border-indigo-700', 'border-[var(--pro-azure-light)] dark:border-green-700'],
  ['text-indigo-700 dark:text-indigo-400', 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'],
  ['text-indigo-700 dark:text-indigo-300', 'text-[var(--pro-azure-dark)] dark:text-green-300'],
  ['text-indigo-800 dark:text-indigo-200', 'text-[var(--pro-azure-dark)] dark:text-green-200'],
  ['text-indigo-600 dark:text-indigo-400 dark:text-indigo-400', 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['text-indigo-600 dark:text-indigo-400/70', 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]/70'],
  ['text-indigo-600 dark:text-indigo-400', 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['text-indigo-500 dark:text-indigo-400', 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'],
  ['text-indigo-700', 'text-[var(--pro-azure-dark)]'],
  ['text-indigo-600', 'text-[var(--pro-azure)]'],
  ['text-indigo-500', 'text-[var(--pro-azure)]'],
  ['bg-indigo-50 text-indigo-700', 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]'],
  ['bg-indigo-100 text-indigo-700', 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'],
  ['hover:bg-indigo-50 dark:hover:bg-indigo-900/30', 'hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/30'],
  ['hover:bg-indigo-600', 'hover:bg-[var(--pro-azure-dark)]'],
  ['hover:bg-indigo-50', 'hover:bg-[var(--pro-azure-50)]'],
  ['hover:text-indigo-700', 'hover:text-[var(--pro-azure-dark)]'],
  ['hover:text-indigo-600', 'hover:text-[var(--pro-azure)]'],
  ['bg-indigo-500 text-white', 'bg-[var(--pro-azure)] text-white'],
  ['bg-indigo-600 text-white', 'bg-[var(--pro-azure)] text-white'],
  ['bg-indigo-50', 'bg-[var(--pro-azure-50)]'],
  ['bg-indigo-100', 'bg-[var(--pro-azure-100)]'],
  ['bg-indigo-500', 'bg-[var(--pro-azure)]'],
  ['bg-indigo-600', 'bg-[var(--pro-azure)]'],
  ["accent: 'indigo'", "accent: 'green'"],
  ["color: 'indigo'", "color: 'green'"],
  ['iconBg="bg-indigo-500"', 'iconBg="bg-[var(--pro-azure)]"'],
  ['iconBg="bg-indigo-600"', 'iconBg="bg-[var(--pro-azure)]"'],
  ['focus-visible:ring-indigo-400', 'focus-visible:ring-[var(--pro-azure)]'],
  ['focus-visible:ring-indigo-500', 'focus-visible:ring-[var(--pro-azure)]'],
  ['ring-2 ring-indigo-100', 'ring-2 ring-[var(--pro-azure-100)]'],
  ['ring-inset ring-indigo-400', 'ring-inset ring-[var(--pro-azure)]'],
  ['ring-indigo-400', 'ring-[var(--pro-azure)]'],
  ['ring-indigo-500', 'ring-[var(--pro-azure)]'],
  ['border-indigo-500', 'border-[var(--pro-azure)]'],
  ['border-indigo-400', 'border-[var(--pro-azure)]'],
  ['border-indigo-300', 'border-[var(--pro-azure-light)]'],
  ['border-indigo-200', 'border-[var(--pro-azure-100)]'],
  ['rgba(99,102,241,0.1)', 'rgba(79,186,111,0.1)'],
  ['rgba(99,102,241,0.18)', 'rgba(79,186,111,0.18)'],
  ['rgba(99,102,241,0.30)', 'rgba(79,186,111,0.30)'],
  ['rgba(99,102,241,0.38)', 'rgba(79,186,111,0.38)'],
  ['rgba(99,102,241,0.25)', 'rgba(79,186,111,0.25)'],
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.includes(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(extname(full))) files.push(full);
  }
  return files;
}

const all = walk(ROOT);
let changed = 0;

for (const f of all) {
  let c = readFileSync(f, 'utf8');
  const orig = c;
  for (const [from, to] of REPLACEMENTS) {
    if (c.includes(from)) c = c.split(from).join(to);
  }
  if (c !== orig) {
    writeFileSync(f, c, 'utf8');
    changed++;
  }
}

console.log(`Sweep complete. Updated ${changed} files.`);
