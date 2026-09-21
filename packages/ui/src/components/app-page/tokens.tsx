import React from 'react';
import { HelpCircle, ChevronRight, Search, TrendingUp, TrendingDown, RefreshCw, Plus, X, AlertCircle } from 'lucide-react';

/**
 * app-page design tokens — Ovds SaaS.
 *
 * The "indigo" key is aliased to the Ovds SaaS primary green (--pro-azure)
 * so every component using the indigo fallback automatically renders in the
 * correct brand colour without requiring call-site changes.
 */

/* ── Value text colours ─────────────────────────────────────────── */
export const COLOR_VALUE: Record<string, string> = {
  // Ovds SaaS green — default
  indigo: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  green:   'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  // Accents
  rose:    'text-rose-600 dark:text-rose-400',
  amber:   'text-amber-600 dark:text-amber-400',
  blue:    'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  sky:     'text-sky-600 dark:text-sky-400',
  violet:  'text-violet-600 dark:text-violet-400',
  slate:   'text-slate-700 dark:text-slate-300',
  teal:    'text-teal-600 dark:text-teal-400',
  orange:  'text-orange-600 dark:text-orange-400',
  pink:    'text-pink-600 dark:text-pink-400',
};

/* ── Icon badge background + text ───────────────────────────────── */
export const ICON_BG: Record<string, string> = {
  indigo: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]/10 dark:text-[var(--pro-azure-light)]',
  green:   'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]/10 dark:text-[var(--pro-azure-light)]',
  rose:    'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  amber:   'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  blue:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]/10 dark:text-[var(--pro-azure-light)]',
  sky:     'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  violet:  'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  slate:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  teal:    'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  orange:  'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  pink:    'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
};

/* ── Left-border stripe colour ─────────────────────────────────── */
export const BORDER_COLOR: Record<string, string> = {
  indigo: 'border-[var(--pro-azure)]',
  green:   'border-[var(--pro-azure)]',
  rose:    'border-rose-500',
  amber:   'border-amber-500',
  blue:    'border-[var(--pro-azure)]',
  sky:     'border-sky-500',
  violet:  'border-violet-500',
  slate:   'border-slate-400',
  teal:    'border-teal-500',
  orange:  'border-orange-500',
  pink:    'border-pink-500',
};

/* ── Active tab background tint ─────────────────────────────────── */
export const ACCENT_BG: Record<string, string> = {
  indigo: 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]/10',
  green:   'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]/10',
  rose:    'bg-rose-50/50 dark:bg-rose-950/20',
  amber:   'bg-amber-50/50 dark:bg-amber-950/20',
  blue:    'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]/10',
  sky:     'bg-sky-50/50 dark:bg-sky-950/20',
  violet:  'bg-violet-50/50 dark:bg-violet-950/20',
  slate:   'bg-slate-100/60 dark:bg-slate-800/30',
  teal:    'bg-teal-50/50 dark:bg-teal-950/20',
  orange:  'bg-orange-50/50 dark:bg-orange-950/20',
  pink:    'bg-pink-50/50 dark:bg-pink-950/20',
};

/* ── Count badge background ─────────────────────────────────────── */
export const ACCENT_COUNT_BG: Record<string, string> = {
  indigo: 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/20',
  green:   'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/20',
  rose:    'bg-rose-100 dark:bg-rose-900/50',
  amber:   'bg-amber-100 dark:bg-amber-900/50',
  blue:    'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/20',
  sky:     'bg-sky-100 dark:bg-sky-900/50',
  violet:  'bg-violet-100 dark:bg-violet-900/50',
  slate:   'bg-slate-200 dark:bg-slate-700',
  teal:    'bg-teal-100 dark:bg-teal-900/50',
  orange:  'bg-orange-100 dark:bg-orange-900/50',
  pink:    'bg-pink-100 dark:bg-pink-900/50',
};

/* ── Progress bar fill ──────────────────────────────────────────── */
export const PROGRESS_BG: Record<string, string> = {
  indigo: 'bg-[var(--pro-azure)]',
  green:   'bg-[var(--pro-azure)]',
  rose:    'bg-rose-500',
  amber:   'bg-amber-500',
  blue:    'bg-[var(--pro-azure)]',
  sky:     'bg-sky-500',
  violet:  'bg-violet-500',
  slate:   'bg-slate-400',
  teal:    'bg-teal-500',
  orange:  'bg-orange-500',
  pink:    'bg-pink-500',
};

/* ── Inline tooltip ─────────────────────────────────────────────── */
export const InlineTooltip: React.FC<{ text: string; children?: React.ReactNode }> = ({ text, children }) => (
  <div className="relative group/tip">
    {children ?? (
      <HelpCircle
        size={9}
        className="cursor-help"
        style={{ color: 'var(--text-5)' }}
      />
    )}
    <div
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-75"
    >
      <div
        className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg
                   shadow-xl max-w-[200px] text-center leading-snug whitespace-normal"
        style={{ background: '#1F2937', color: '#F9FAFB' }}
      >
        {text}
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: '#1F2937' }}
        />
      </div>
    </div>
  </div>
);

/* ── Shared icon exports ─────────────────────────────────────────── */
export const ICONS = {
  ChevronRight,
  X,
  Search,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  AlertCircle,
  Plus,
  RefreshCw,
};
