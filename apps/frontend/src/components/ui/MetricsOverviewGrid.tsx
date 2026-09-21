/**
 * MetricsOverviewGrid — Ovds SaaS Grid-over-Card Layout System
 * ─────────────────────────────────────────────────────────────
 * Akaunting-inspired horizontal metric strip.
 *
 * Design principles:
 *  • Clean, intentional layout — no distracting multi-color card arrays.
 *  • Each cell is monochromatic (slate/white base) with a subtle accent icon.
 *  • Trend indicators (↑ / ↓) use semantic color only — not decoration.
 *  • Fully responsive: single column on mobile, 2-up on sm, full grid on lg+.
 *  • Pure display — receives pre-computed metric objects, emits nothing.
 *  • Skeleton mode for loading state keeps layout stable (no CLS).
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React from 'react';

// ── Metric definition ─────────────────────────────────────────────────────────

export type MetricTrend = {
  /** Formatted trend value, e.g. "+12.4%" or "ETB 4,200" */
  label: string;
  /** positive = favorable (green), negative = unfavorable (red), neutral = no change */
  direction: 'positive' | 'negative' | 'neutral';
  /** Optional: period context shown below, e.g. "vs last month" */
  period?: string;
};

export interface MetricItem {
  /** Stable key for React reconciliation. */
  key: string;
  /** Short label above the value, e.g. "Total Receivables" */
  label: string;
  /** Primary formatted value, e.g. "ETB 124,500" */
  value: string | number;
  /** Optional secondary value — e.g. invoice count */
  sub?: string;
  /** Optional trend data */
  trend?: MetricTrend | null;
  /** Lucide icon element */
  icon?: React.ReactNode;
  /**
   * Optional accent color applied to the icon background.
   * Uses a Tailwind key: 'green' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate'
   * Defaults to 'slate'.
   */
  accent?: 'green' | 'indigo' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';
  /** If true the card renders a skeleton shimmer regardless of value. */
  loading?: boolean;
  /** Optional click handler — turns the card into a button. */
  onClick?: () => void;
}

// ── MetricsOverviewGrid props ─────────────────────────────────────────────────

export interface MetricsOverviewGridProps {
  metrics: MetricItem[];
  /** True while all metrics are loading — shows skeleton for every card. */
  loading?: boolean;
  /** Additional Tailwind classes on the grid container. */
  className?: string;
  /**
   * Number of columns at the lg breakpoint.
   * Defaults to the number of metrics (up to 5).
   */
  cols?: 2 | 3 | 4 | 5;
}

// ── Accent palette ────────────────────────────────────────────────────────────

const ACCENT_ICON_BG: Record<string, string> = {
  indigo: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  green:  'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  rose:    'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  sky:     'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
  violet:  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  slate:   'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

// ── Trend component ───────────────────────────────────────────────────────────

const TrendBadge: React.FC<{ trend: MetricTrend }> = ({ trend }) => {
  const colorMap = {
    positive: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    negative: 'text-rose-500 dark:text-rose-400',
    neutral:  'text-slate-500 dark:text-slate-400',
  };
  const iconMap = {
    positive: <TrendingUp size={11} aria-hidden="true" />,
    negative: <TrendingDown size={11} aria-hidden="true" />,
    neutral:  <Minus size={11} aria-hidden="true" />,
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`flex items-center gap-1 text-[11px] font-bold ${colorMap[trend.direction]}`}>
        {iconMap[trend.direction]}
        {trend.label}
      </span>
      {trend.period && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{trend.period}</span>
      )}
    </div>
  );
};

// ── Skeleton shimmer card ─────────────────────────────────────────────────────

const MetricSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
    <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2" />
    <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
  </div>
);

// ── Metric card ───────────────────────────────────────────────────────────────

const MetricCard: React.FC<{ metric: MetricItem; globalLoading: boolean }> = ({
  metric,
  globalLoading,
}) => {
  const isLoading = globalLoading || metric.loading;
  if (isLoading) return <MetricSkeleton />;

  const accentClass = ACCENT_ICON_BG[metric.accent ?? 'slate'];
  const Tag = metric.onClick ? 'button' : 'div';

  return (
    <Tag
      {...(metric.onClick
        ? {
            type: 'button' as const,
            onClick: metric.onClick,
            className: [
              'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
              'p-4 flex flex-col gap-2.5 text-left',
              'transition-all hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40',
              'cursor-pointer w-full',
            ].join(' '),
          }
        : {
            className:
              'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col gap-2.5',
          })}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-relaxed">
          {metric.label}
        </span>
        {metric.icon && (
          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${accentClass}`}>
            <span className="w-4 h-4 flex items-center justify-center">
              {metric.icon}
            </span>
          </div>
        )}
      </div>

      {/* Primary value */}
      <p className="text-2xl font-black tabular-nums leading-none text-slate-800 dark:text-slate-100 tracking-tight">
        {metric.value}
      </p>

      {/* Sub-label and trend row */}
      <div className="flex items-end justify-between gap-2 min-h-[20px]">
        {metric.sub && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {metric.sub}
          </span>
        )}
        {metric.trend && <TrendBadge trend={metric.trend} />}
      </div>
    </Tag>
  );
};

// ── Grid breakpoint classes ───────────────────────────────────────────────────

const COLS_CLASS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
};

// ── MetricsOverviewGrid ───────────────────────────────────────────────────────

export const MetricsOverviewGrid: React.FC<MetricsOverviewGridProps> = ({
  metrics,
  loading = false,
  className = '',
  cols,
}) => {
  const colCount = cols ?? Math.min(metrics.length, 5) as 2 | 3 | 4 | 5;
  const colClass = COLS_CLASS[colCount] ?? COLS_CLASS[4];

  return (
    <div
      className={`grid gap-3 ${colClass} ${className}`}
      role="region"
      aria-label="Key metrics"
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.key} metric={metric} globalLoading={loading} />
      ))}
    </div>
  );
};
