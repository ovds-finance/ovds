import React from 'react';
import { HelpCircle, ChevronRight, Search, TrendingUp, TrendingDown, RefreshCw, Plus, X, AlertCircle } from 'lucide-react';

// -----------------------------------------------------------------------------
// Design tokens (inline — no import needed, keeps package self-contained)
// -----------------------------------------------------------------------------
export const COLOR_VALUE: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  sky: 'text-sky-600 dark:text-sky-400',
  violet: 'text-violet-600 dark:text-violet-400',
  slate: 'text-slate-700 dark:text-slate-300',
  teal: 'text-teal-600 dark:text-teal-400',
  orange: 'text-orange-600 dark:text-orange-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  pink: 'text-pink-600 dark:text-pink-400',
};
export const ICON_BG: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
};
export const BORDER_COLOR: Record<string, string> = {
  emerald: 'border-emerald-500',
  rose: 'border-rose-500',
  amber: 'border-amber-500',
  blue: 'border-blue-500',
  sky: 'border-sky-500',
  violet: 'border-violet-500',
  slate: 'border-slate-400',
  teal: 'border-teal-500',
  orange: 'border-orange-500',
  indigo: 'border-indigo-500',
  pink: 'border-pink-500',
};
export const ACCENT_BG: Record<string, string> = {
  emerald: 'bg-emerald-50/40 dark:bg-emerald-950/20',
  rose: 'bg-rose-50/40 dark:bg-rose-950/20',
  amber: 'bg-amber-50/40 dark:bg-amber-950/20',
  blue: 'bg-blue-50/40 dark:bg-blue-950/20',
  sky: 'bg-sky-50/40 dark:bg-sky-950/20',
  violet: 'bg-violet-50/40 dark:bg-violet-950/20',
  slate: 'bg-slate-100/40 dark:bg-slate-800/20',
  teal: 'bg-teal-50/40 dark:bg-teal-950/20',
  orange: 'bg-orange-50/40 dark:bg-orange-950/20',
  indigo: 'bg-indigo-50/40 dark:bg-indigo-950/20',
  pink: 'bg-pink-50/40 dark:bg-pink-950/20',
};
export const ACCENT_COUNT_BG: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/50',
  rose: 'bg-rose-100 dark:bg-rose-900/50',
  amber: 'bg-amber-100 dark:bg-amber-900/50',
  blue: 'bg-blue-100 dark:bg-blue-900/50',
  sky: 'bg-sky-100 dark:bg-sky-900/50',
  violet: 'bg-violet-100 dark:bg-violet-900/50',
  slate: 'bg-slate-200 dark:bg-slate-700',
  teal: 'bg-teal-100 dark:bg-teal-900/50',
  orange: 'bg-orange-100 dark:bg-orange-900/50',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/50',
  pink: 'bg-pink-100 dark:bg-pink-900/50',
};
export const PROGRESS_BG: Record<string, string> = {
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
};

// -----------------------------------------------------------------------------
// Reusable inline tooltip (lightweight, no Radix dep)
// -----------------------------------------------------------------------------
export const InlineTooltip: React.FC<{ text: string; children?: React.ReactNode }> = ({ text, children }) => (
  <div className="relative group/tip">
    {children ?? <HelpCircle size={9} className="text-slate-300 dark:text-slate-600 cursor-help" />}
    <div
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                    opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-75"
    >
      <div
        className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg
                      shadow-xl max-w-[200px] text-center leading-snug whitespace-normal"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
      </div>
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Shared icons
// -----------------------------------------------------------------------------
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
