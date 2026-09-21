#!/usr/bin/env node
'use strict';
const { readFileSync, writeFileSync, readdirSync, statSync } = require('node:fs');
const { join, extname } = require('node:path');

const ROOT = process.cwd();
const SKIP = ['node_modules', 'dist', '.git', '.nx', 'coverage', '.next'];
const EXT  = new Set(['.tsx', '.ts', '.css']);

const REPLACEMENTS = [
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
  ['dark:text-indigo-300',  'dark:text-green-300'],
  ['dark:text-indigo-400',  'dark:text-[var(--pro-azure-light)]'],
  ['dark:text-indigo-200',  'dark:text-green-200'],
  ['dark:border-indigo-900/30', 'dark:border-green-900/30'],
  ['dark:border-indigo-900/40', 'dark:border-green-900/40'],
  ['dark:border-indigo-800/40', 'dark:border-green-800/40'],
  ['dark:border-indigo-800', 'dark:border-green-800'],
  ['dark:border-indigo-700', 'dark:border-green-700'],
  ['dark:border-indigo-600', 'dark:border-[var(--pro-azure-light)]'],
  ['dark:hover:bg-indigo-900', 'dark:hover:bg-green-900'],
  ['text-indigo-800', 'text-[var(--pro-azure-dark)]'],
  ['text-indigo-400', 'text-[var(--pro-azure-light)]'],
  ['text-indigo-300', 'text-green-300'],
  ['text-indigo-200', 'text-green-200'],
  ['text-indigo-100', 'text-green-100'],
  ['border-t-indigo-400', 'border-t-[var(--pro-azure)]'],
  ['border-t-indigo-500', 'border-t-[var(--pro-azure)]'],
  ['bg-indigo-200', 'bg-[var(--pro-azure-200)]'],
  ['bg-indigo-300', 'bg-[var(--pro-azure-light)]'],
  ['bg-indigo-400', 'bg-[var(--pro-azure-light)]'],
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
  ['from-indigo-500 to-indigo-600', 'from-green-500 to-green-600'],
  ['from-indigo-500 to-indigo-700', 'from-green-500 to-green-700'],
  ['from-indigo-500 to-teal-600', 'from-[var(--pro-azure)] to-teal-600'],
  ['from-indigo-500 to-violet-600', 'from-[var(--pro-azure)] to-violet-600'],
  ['shadow-indigo-500/30', 'shadow-green-500/30'],
  ['shadow-indigo-500/20', 'shadow-green-500/20'],
  ['shadow-indigo-500/10', 'shadow-green-500/10'],
  ['border-indigo-100', 'border-[var(--pro-azure-100)]'],
  ['ring-2 ring-indigo-100', 'ring-2 ring-[var(--pro-azure-100)]'],
  ['ring-inset ring-indigo-400', 'ring-inset ring-[var(--pro-azure)]'],
  ['ring-indigo-400', 'ring-[var(--pro-azure)]'],
  ['ring-indigo-500', 'ring-[var(--pro-azure)]'],
  ['focus:ring-indigo-400', 'focus:ring-[var(--pro-azure)]'],
  ['hover:bg-indigo-200', 'hover:bg-[var(--pro-azure-200)]'],
  ['hover:bg-indigo-100', 'hover:bg-[var(--pro-azure-100)]'],
  ['dark:group-hover:bg-indigo-900/40', 'dark:group-hover:bg-green-900/40'],
  ['dark:group-hover:bg-indigo-900/30', 'dark:group-hover:bg-green-900/30'],
  ['dark:group-hover:bg-indigo-950/50', 'dark:group-hover:bg-green-950/50'],
  ["'#4f46e5'", "'#4FBA6F'"],
  ["color: '#4f46e5'", "color: '#4FBA6F'"],
  ["background: '#4f46e5'", "background: '#4FBA6F'"],
  ["border-color:#4f46e5", "border-color:#4FBA6F"],
  ["background:#4f46e5", "background:#4FBA6F"],
  ["'#6366f1'", "'#4FBA6F'"],
  ["background:#6366f1", "background:#2ED47A"],
  ["border:2px solid ${sel ? '#4FBA6F'", "border:2px solid ${sel ? '#4FBA6F'"],
  ['linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', 'linear-gradient(135deg, #4FBA6F 0%, #2ED47A 100%)'],
  ['linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)', 'linear-gradient(135deg, #3B9957 0%, #4FBA6F 100%)'],
  ["background: '#4f46e5'", "background: '#4FBA6F'"],
  ["background: sel ? '#4f46e5'", "background: sel ? '#4FBA6F'"],
  ["border: `2px solid ${sel ? '#4f46e5'", "border: `2px solid ${sel ? '#4FBA6F'"],
  ["background: sel ? '#4f46e5' : '#fff'", "background: sel ? '#4FBA6F' : '#fff'"],
  ["color: '#4f46e5'", "color: '#4FBA6F'"],
  ["color: '#3730a3'", "color: '#3B9957'"],
  ["background: '#4f46e5', borderRadius: 3", "background: '#4FBA6F', borderRadius: 3"],
  ["background:'#4f46e5'", "background:'#4FBA6F'"],
  ["border-color:#4f46e5", "border-color:#4FBA6F"],
  ["background:linear-gradient(180deg,#6366f1,#4f46e5)", "background:linear-gradient(180deg,#2ED47A,#4FBA6F)"],
  ['font-size:.6875rem; font-weight:700; color:#4f46e5', 'font-size:.6875rem; font-weight:700; color:#4FBA6F'],
  ['.rg-dot-active { width:20px; height:8px; border-radius:999px; background:#4f46e5', '.rg-dot-active { width:20px; height:8px; border-radius:999px; background:#4FBA6F'],
  ['.rg-dot-done   { width:8px;  height:8px; border-radius:50%;   background:#a5b4fc', '.rg-dot-done   { width:8px;  height:8px; border-radius:50%;   background:#BBF7D0'],
  ['.rg-dot-done:hover { background:#818cf8', '.rg-dot-done:hover { background:#6EE8A4'],
  ["background: 'linear-gradient(135deg,#818cf8,#4f46e5)'", "background: 'linear-gradient(135deg,#6EE8A4,#4FBA6F)'"],
  ["boxShadow: '0 2px 8px rgba(79,70,229,.30)'", "boxShadow: '0 2px 8px rgba(79,186,111,0.30)'"],
  ["boxShadow: '0 4px 14px rgba(79,70,229,.35)'", "boxShadow: '0 4px 14px rgba(79,186,111,.35)'"],
  ["'border: 1px solid', sel ? '#c7d2fe'", "'border: 1px solid', sel ? '#BBF7D0'"],
  ["'#c7d2fe'", "'#BBF7D0'"],
  ["border: '1.5px solid #c7d2fe'", "border: '1.5px solid #BBF7D0'"],
  ["fontSize: '.8125rem', fontWeight: 700, color: '#4f46e5'", "fontSize: '.8125rem', fontWeight: 700, color: '#4FBA6F'"],
  // oklch indigo hue 278 in Register
  ['oklch(0.55 0.22 278 / .32)', 'oklch(0.59 0.19 145 / .32)'],
  ['oklch(0.55 0.22 278 / .40)', 'oklch(0.59 0.19 145 / .40)'],
  ['oklch(0.55 0.22 278 / .12)', 'oklch(0.59 0.19 145 / .12)'],
  ['oklch(0.55 0.22 278 / .10)', 'oklch(0.59 0.19 145 / .10)'],
  ['oklch(0.975 0.018 278)', 'oklch(0.975 0.018 145)'],
  ['oklch(0 0 278)', 'oklch(0 0 145)'],
  ['oklch(0.48 0.18 278)', 'oklch(0.48 0.18 145)'],
  // SinglePageAccounting dark card
  ["Card className=\"bg-indigo-900 border-indigo-900\"", "Card className=\"bg-[var(--pro-azure-dark)] border-[var(--pro-azure-dark)]\""],
  ["bg-indigo-800 flex", "bg-[var(--pro-azure)] flex"],
  ["text-indigo-50", "text-green-50"],
  // IfsDashboard dark hover
  ['dark:hover:bg-indigo-950/50', 'dark:hover:bg-green-950/50'],
  // SalesOrders avatar ring
  ['ring-indigo-200/50 dark:ring-indigo-700/30', 'ring-[var(--pro-azure-200)]/50 dark:ring-green-700/30'],
  ['dark:from-indigo-900/40', 'dark:from-green-900/40'],
  // RolePermissions gradient divider
  ['from-indigo-500/30', 'from-[var(--pro-azure)]/30'],
  // Reports shadow
  ['shadow-indigo-50', 'shadow-green-50'],
  ['shadow-indigo-100', 'shadow-green-100'],
  // Releases decorative orb
  ["bg-indigo-800/30", "bg-[var(--pro-azure)]/10"],
  // SetupOnPremise gradient
  ['from-indigo-500 to-slate-800', 'from-[var(--pro-azure)] to-slate-800'],
  ['from-indigo-100 to-indigo-100', 'from-[var(--pro-azure-100)] to-[var(--pro-azure-100)]'],
  ['from-indigo-950 dark:via-slate-900 dark:to-slate-900', 'from-green-950 dark:via-slate-900 dark:to-slate-900'],
  ['dark:from-indigo-950 dark:to-slate-900', 'dark:from-green-950 dark:to-slate-900'],
  ['dark:from-indigo-950', 'dark:from-green-950'],
  ['from-indigo-950/60', 'from-green-950/60'],
  ['from-indigo-950/20', 'from-green-950/20'],
  ['from-indigo-500/5', 'from-[var(--pro-azure)]/5'],
  ['from-indigo-500/60', 'from-[var(--pro-azure)]/60'],
  ['hover:from-indigo-700', 'hover:from-[var(--pro-azure-dark)]'],
  ['hover:to-green-700', 'hover:to-[var(--pro-azure-dark)]'],
  ['hover:to-indigo-700', 'hover:to-[var(--pro-azure-dark)]'],
  ['shadow-indigo-500/25', 'shadow-green-500/25'],
  ["bg-indigo-900 text-white", "bg-[var(--pro-azure-dark)] text-white"],
  ['from-indigo-50 to-white', 'from-[var(--pro-azure-50)] to-white'],
  // NotificationBell --lv fallback
  ["var(--lv, #4f46e5)", "var(--lv, #4FBA6F)"],
  ["var(--lv-dim, #eef2ff)", "var(--lv-dim, #F0FDF4)"],
  // seed.ts category color
  ["'#6366f1'", "'#4FBA6F'"],
  // design-system accentIndigo hex
  ["accentIndigo: '#6366F1'", "accentIndigo: '#4FBA6F'"],
  ["accentIndigoHover: '#4F46E5'", "accentIndigoHover: '#3B9957'"],
  // chartColors indigo entry
  ["'#6366F1',  /* indigo */", "'#4FBA6F',  /* brand green (alias) */"],
  // from-indigo-500 to-blue-600 (CRM avatar palette)
  ["from-indigo-500 to-blue-600", "from-[var(--pro-azure)] to-blue-600"],
  ['from-indigo-400 to-teal-500', 'from-[var(--pro-azure)] to-teal-500'],
  ['from-indigo-400 to-teal-600', 'from-[var(--pro-azure)] to-teal-600'],
  ['from-indigo-100 to-teal-100', 'from-[var(--pro-azure-100)] to-teal-100'],
  ['from-indigo-400 to-indigo-300', 'from-[var(--pro-azure-light)] to-[var(--pro-azure-light)]'],
  ['from-indigo-900 to-teal-800', 'from-[var(--pro-azure-dark)] to-teal-800'],
  ['from-indigo-900 to-teal-900', 'from-[var(--pro-azure-dark)] to-teal-900'],
  ['from-indigo-900 to-slate-900', 'from-[var(--pro-azure-dark)] to-slate-900'],
  ['from-indigo-950/60 via-slate-900 to-slate-900', 'from-green-950/60 via-slate-900 to-slate-900'],
  ['from-indigo-700 via-indigo-600 to-violet-700', 'from-[var(--pro-azure-dark)] via-[var(--pro-azure)] to-violet-700'],
  ['from-indigo-500 to-slate-700', 'from-[var(--pro-azure)] to-slate-700'],
  ['shadow-indigo-900/20', 'shadow-green-900/20'],
  // Login hardcoded hex
  ["'linear-gradient(135deg,#4f46e5,#6366f1)'", "'linear-gradient(135deg,#4FBA6F,#2ED47A)'"],
  ['linear-gradient(135deg,#4f46e5,#6366f1)', 'linear-gradient(135deg,#4FBA6F,#2ED47A)'],
  // Landing oklch indigo hue 278
  ["'oklch(0.55 0.22 278)'", "'oklch(0.59 0.19 145)'"],
  ["oklch(0.55 0.22 278)", 'oklch(0.59 0.19 145)'],
  ['oklch(0.82 0.08 278)', 'oklch(0.82 0.08 145)'],
  ['oklch(0.88 0.06 278)', 'oklch(0.88 0.06 145)'],
  // border-indigo-50 (used in entry portal)
  ['border-indigo-50', 'border-[var(--pro-azure-50)]'],
  // peer-focus:ring-indigo-800
  ['peer-focus:ring-indigo-800', 'peer-focus:ring-green-800'],
  ['dark:peer-focus:ring-indigo-800', 'dark:peer-focus:ring-green-800'],
  // any remaining rgba
  ["rgba(99,102,241,0.28)", "rgba(79,186,111,0.28)"],
  ["rgba(99,102,241,.08)", "rgba(79,186,111,.08)"],
  ["rgba(99,102,241,.14)", "rgba(79,186,111,.14)"],
  ["rgba(99,102,241,.25)", "rgba(79,186,111,.25)"],
  ['focus:ring-indigo-100 dark:focus:ring-indigo-900/40', 'focus:ring-[var(--pro-azure-100)] dark:focus:ring-green-900/40'],
  ['focus:ring-indigo-100', 'focus:ring-[var(--pro-azure-100)]'],
  ['dark:focus:ring-indigo-900/40', 'dark:focus:ring-green-900/40'],
  ['from-indigo-400 to-indigo-500', 'from-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['from-indigo-400 to-indigo-600', 'from-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['dark:hover:bg-indigo-950/10', 'dark:hover:bg-green-950/10'],
  ['dark:hover:bg-indigo-950/20', 'dark:hover:bg-green-950/20'],
  ['dark:hover:bg-indigo-950/30', 'dark:hover:bg-green-950/30'],
  ['dark:hover:bg-indigo-950/40', 'dark:hover:bg-green-950/40'],
  ['border-indigo-800', 'border-[var(--pro-azure-dark)]'],
  // Financial report gradient backgrounds - replace indigo with soft green tones
  ['from-indigo-50 via-white to-indigo-50', 'from-[var(--pro-azure-50)] via-white to-[var(--pro-azure-50)]'],
  ['from-indigo-50 to-indigo-100', 'from-[var(--pro-azure-50)] to-[var(--pro-azure-100)]'],
  ['from-indigo-50 to-indigo-50', 'from-[var(--pro-azure-50)] to-[var(--pro-azure-50)]'],
  ['from-indigo-50/70 to-sky-50/70', 'from-[var(--pro-azure-50)]/70 to-sky-50/70'],
  ['from-indigo-700 to-indigo-900', 'from-[var(--pro-azure-dark)] to-[var(--pro-azure-dark)]'],
  ['from-indigo-700 via-indigo-600 to-indigo-800', 'from-[var(--pro-azure-dark)] via-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['from-indigo-900 to-indigo-700', 'from-[var(--pro-azure-dark)] to-[var(--pro-azure)]'],
  ['dark:from-slate-100 dark:via-indigo-300 dark:to-indigo-400', 'dark:from-slate-100 dark:via-green-300 dark:to-[var(--pro-azure-light)]'],
  ['dark:from-slate-100 dark:to-indigo-400', 'dark:from-slate-100 dark:to-[var(--pro-azure-light)]'],
  ['from-indigo-600/5 to-violet-50/50', 'from-[var(--pro-azure)]/5 to-violet-50/50'],
  ['from-indigo-600/5 to-transparent', 'from-[var(--pro-azure)]/5 to-transparent'],
  ['from-indigo-200 to-sky-200', 'from-[var(--pro-azure-200)] to-sky-200'],
  ['h-px bg-gradient-to-r from-indigo-200', 'h-px bg-gradient-to-r from-[var(--pro-azure-200)]'],
  ['from-indigo-600/5', 'from-[var(--pro-azure)]/5'],
  ['from-indigo-600/10', 'from-[var(--pro-azure)]/10'],
  ['dark:from-indigo-600/10', 'dark:from-[var(--pro-azure)]/10'],
  ['from-indigo-600 via-indigo-600 to-indigo-700', 'from-[var(--pro-azure)] via-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['from-indigo-600 to-violet-600', 'from-[var(--pro-azure)] to-violet-600'],
  ['from-indigo-600 to-indigo-700', 'from-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['from-indigo-600', 'from-[var(--pro-azure)]'],
  ['from-indigo-200 via-slate-200', 'from-[var(--pro-azure-200)] via-slate-200'],
  ['dark:from-indigo-800', 'dark:from-green-800'],
  ['dark:group-hover:bg-indigo-950/30', 'dark:group-hover:bg-green-950/30'],
  ['dark:group-hover:bg-indigo-950/20', 'dark:group-hover:bg-green-950/20'],
  ['shadow-indigo-200', 'shadow-green-200'],
  ['shadow-indigo-900/30', 'shadow-green-900/30'],
  ['ring-1 ring-indigo-300', 'ring-1 ring-[var(--pro-azure-light)]'],
  ['ring-indigo-300', 'ring-[var(--pro-azure-light)]'],
  ['border-indigo-700', 'border-[var(--pro-azure-dark)]'],
  ['bg-gradient-to-br from-indigo-600 to-indigo-700', 'bg-gradient-to-br from-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['from-indigo-500/80 to-indigo-600', 'from-[var(--pro-azure)] to-[var(--pro-azure-dark)]'],
  ['dark:border-indigo-900', 'dark:border-green-900'],
  ['dark:hover:border-indigo-800', 'dark:hover:border-green-800'],
  ['dark:hover:border-indigo-700', 'dark:hover:border-green-700'],
  ['dark:hover:border-indigo-600', 'dark:hover:border-[var(--pro-azure-light)]'],
  ['dark:hover:border-indigo-900', 'dark:hover:border-green-900'],
  // border-indigo-600 (for active tab underlines etc.)
  ['border-indigo-600', 'border-[var(--pro-azure)]'],
  // gradient from-indigo-600
  ['from-indigo-600 to-violet-600', 'from-[var(--pro-azure)] to-violet-600'],
  ['bg-gradient-to-r from-indigo-600 to-violet-600', 'bg-gradient-to-r from-[var(--pro-azure)] to-violet-600'],
  ['bg-indigo-700', 'bg-[var(--pro-azure-dark)]'],
  ['hover:bg-indigo-700', 'hover:bg-[var(--pro-azure-dark)]'],
  ['hover:bg-[var(--pro-azure-50)]0', 'hover:bg-[var(--pro-azure-dark)]'],
  ['bg-[var(--pro-azure-50)]0 file:text-white hover:file:bg-indigo-700', 'bg-[var(--pro-azure-50)] file:text-white hover:file:bg-[var(--pro-azure-dark)]'],
  ['text-indigo-900', 'text-[var(--pro-azure-dark)]'],
  // border-indigo-600 for active elements
  ['border-indigo-600 bg-[var(--pro-azure-50)]', 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]'],
  ['border-indigo-100', 'border-[var(--pro-azure-100)]'],
  ['border-b-2 border-indigo-600', 'border-b-2 border-[var(--pro-azure)]'],
  // QR scanner corners
  ['border-indigo-600 rounded-tl-lg', 'border-[var(--pro-azure)] rounded-tl-lg'],
  ['border-indigo-600 rounded-tr-lg', 'border-[var(--pro-azure)] rounded-tr-lg'],
  ['border-indigo-600 rounded-bl-lg', 'border-[var(--pro-azure)] rounded-bl-lg'],
  ['border-indigo-600 rounded-br-lg', 'border-[var(--pro-azure)] rounded-br-lg'],
  ['bg-indigo-50', 'bg-[var(--pro-azure-50)]'],
  ['bg-indigo-100', 'bg-[var(--pro-azure-100)]'],
  ['bg-indigo-500', 'bg-[var(--pro-azure)]'],
  ['bg-indigo-600', 'bg-[var(--pro-azure)]'],
  ['text-indigo-700', 'text-[var(--pro-azure-dark)]'],
  ['text-indigo-600', 'text-[var(--pro-azure)]'],
  ['text-indigo-500', 'text-[var(--pro-azure)]'],
  ['border-indigo-500', 'border-[var(--pro-azure)]'],
  ['border-indigo-400', 'border-[var(--pro-azure)]'],
  ['border-indigo-300', 'border-[var(--pro-azure-light)]'],
  ['border-indigo-200', 'border-[var(--pro-azure-100)]'],
  ["accent: 'indigo'", "accent: 'green'"],
  ["color: 'indigo'", "color: 'green'"],
  ['hover:bg-indigo-600', 'hover:bg-[var(--pro-azure-dark)]'],
  ['hover:bg-indigo-50', 'hover:bg-[var(--pro-azure-50)]'],
  ['hover:text-indigo-700', 'hover:text-[var(--pro-azure-dark)]'],
  ['hover:text-indigo-600', 'hover:text-[var(--pro-azure)]'],
];

function walk(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const e of entries) {
    if (SKIP.includes(e)) continue;
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(extname(full))) files.push(full);
  }
  return files;
}

const all = walk(ROOT);
let changed = 0;

for (const f of all) {
  let c;
  try { c = readFileSync(f, 'utf8'); } catch { continue; }
  const orig = c;
  for (const [from, to] of REPLACEMENTS) {
    if (c.includes(from)) c = c.split(from).join(to);
  }
  if (c !== orig) {
    writeFileSync(f, c, 'utf8');
    changed++;
    process.stdout.write('.');
  }
}

console.log(`\nSweep complete. Updated ${changed} files.`);
