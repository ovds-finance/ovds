/**
 * MetricsGrid — Ovds SaaS Metrics Overview Grid
 * ──────────────────────────────────────────────
 * The high-density KPI row that sits between the Actions Row and the
 * Data Grid in the Ovds SaaS Grid-over-Card layout.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Metrics Overview Grid (Receivables | Payables | Cash Flow)   │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Design rules:
 *   • Muted surface colours — no distracting, multi-coloured card arrays.
 *   • Trend indicator (↑ / ↓) shown with semantic colour only.
 *   • Progress bar shows collected vs total without distracting chrome.
 *   • Fully accessible: all decorative SVGs are aria-hidden.
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ── Base metric card ──────────────────────────────────────────────────────────

export interface MetricsCardProps {
  label: string;
  value: string | number;
  /** Optional sub-label shown beneath value */
  subLabel?: string;
  /** Trend direction and magnitude */
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
    /** Whether "up" is good (default: true). Payables: up is bad. */
    positiveIsUp?: boolean;
  };
  /** 0–1 progress for collection / payment rate */
  progress?: number;
  icon?: React.ReactNode;
  /** Tailwind bg class for icon background */
  iconBg?: string;
  /** Tailwind text class for icon colour */
  iconColor?: string;
  onClick?: () => void;
}

const TREND_ICON = {
  up:   <ArrowUpRight   size={12} aria-hidden />,
  down: <ArrowDownRight size={12} aria-hidden />,
  flat: <Minus          size={12} aria-hidden />,
};

/** Reusable base MetricsCard — used by all three variants below. */
export const MetricsCard: React.FC<MetricsCardProps> = ({
  label,
  value,
  subLabel,
  trend,
  progress,
  icon,
  iconBg = 'bg-slate-100 dark:bg-slate-800',
  iconColor = 'text-slate-500 dark:text-slate-400',
  onClick,
}) => {
  const trendPositive =
    trend
      ? trend.direction === 'flat'
        ? null
        : (trend.positiveIsUp ?? true)
          ? trend.direction === 'up'
          : trend.direction === 'down'
      : null;

  const trendCls =
    trendPositive === null
      ? 'text-slate-400'
      : trendPositive
      ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
      : 'text-rose-500 dark:text-rose-400';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-700',
        'transition-shadow',
        onClick ? 'cursor-pointer hover:shadow-md focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
          {label}
        </span>
        {icon && (
          <span
            aria-hidden
            className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${iconBg} ${iconColor}`}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-black tabular-nums leading-none text-slate-800 dark:text-slate-100 truncate">
          {value}
        </p>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold flex-shrink-0 ${trendCls}`}>
            {TREND_ICON[trend.direction]}
            {trend.label}
          </span>
        )}
      </div>

      {/* Sub-label */}
      {subLabel && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
          {subLabel}
        </p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="space-y-1" aria-label={`${Math.round(progress * 100)}% collected`}>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--pro-azure)] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {Math.round(progress * 100)}% collected
          </p>
        </div>
      )}
    </div>
  );
};

// ── Specialised metric cards ──────────────────────────────────────────────────

export interface ReceivablesMetricProps {
  /** Total outstanding receivables */
  totalOutstanding: number;
  /** Amount collected in current period */
  collected: number;
  /** Total invoiced in current period */
  totalInvoiced: number;
  /** Number of overdue invoices */
  overdueCount?: number;
  trend?: MetricsCardProps['trend'];
  /** Currency symbol / code prefix */
  currency?: string;
  onClick?: () => void;
}

/**
 * Receivables summary card — the most important card in the invoice module.
 * Shows total outstanding AR, collection rate bar, and overdue warning.
 */
export const ReceivablesMetric: React.FC<ReceivablesMetricProps> = ({
  totalOutstanding,
  collected,
  totalInvoiced,
  overdueCount = 0,
  trend,
  currency = 'ETB',
  onClick,
}) => {
  const collectionRate = totalInvoiced > 0 ? collected / totalInvoiced : 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n);

  return (
    <MetricsCard
      label="Receivables"
      value={`${currency} ${fmt(totalOutstanding)}`}
      subLabel={
        overdueCount > 0
          ? `${overdueCount} invoice${overdueCount !== 1 ? 's' : ''} overdue`
          : 'All invoices current'
      }
      trend={trend ?? {
        direction: totalOutstanding > 0 ? 'up' : 'flat',
        label: `${fmt(totalInvoiced)} invoiced`,
        positiveIsUp: false,
      }}
      progress={collectionRate}
      icon={<CheckCircle2 size={14} />}
      iconBg="bg-[var(--pro-azure-50)] dark:bg-green-900/30"
      iconColor="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
      onClick={onClick}
    />
  );
};

export interface PayablesMetricProps {
  /** Total outstanding payables (bills owed to suppliers) */
  totalOutstanding: number;
  /** Amount paid in current period */
  paid: number;
  /** Total billed in current period */
  totalBilled: number;
  /** Number of overdue bills */
  overdueCount?: number;
  trend?: MetricsCardProps['trend'];
  currency?: string;
  onClick?: () => void;
}

/**
 * Payables summary card — mirrors the Receivables card for the AP side.
 * "Up" is bad for payables (growing debt), so positiveIsUp = false.
 */
export const PayablesMetric: React.FC<PayablesMetricProps> = ({
  totalOutstanding,
  paid,
  totalBilled,
  overdueCount = 0,
  trend,
  currency = 'ETB',
  onClick,
}) => {
  const paymentRate = totalBilled > 0 ? paid / totalBilled : 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n);

  return (
    <MetricsCard
      label="Payables"
      value={`${currency} ${fmt(totalOutstanding)}`}
      subLabel={
        overdueCount > 0
          ? `${overdueCount} bill${overdueCount !== 1 ? 's' : ''} overdue`
          : 'All bills on schedule'
      }
      trend={trend ?? {
        direction: totalOutstanding > 0 ? 'up' : 'flat',
        label: `${fmt(totalBilled)} billed`,
        positiveIsUp: false,
      }}
      progress={paymentRate}
      icon={<AlertTriangle size={14} />}
      iconBg="bg-rose-50 dark:bg-rose-900/30"
      iconColor="text-rose-600 dark:text-rose-400"
      onClick={onClick}
    />
  );
};

export interface CashFlowMetricProps {
  /** Net cash position (inflows − outflows) for the period */
  netCashFlow: number;
  /** Total inflows */
  inflows: number;
  /** Total outflows */
  outflows: number;
  /** Previous period net for trend calculation */
  previousNetCashFlow?: number;
  currency?: string;
  onClick?: () => void;
}

/**
 * Cash Flow summary card — shows net cash position with inflow/outflow breakdown.
 * Positive net flow is always green; negative is always red.
 */
export const CashFlowMetric: React.FC<CashFlowMetricProps> = ({
  netCashFlow,
  inflows,
  outflows,
  previousNetCashFlow,
  currency = 'ETB',
  onClick,
}) => {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(Math.abs(n));

  const isPositive = netCashFlow >= 0;

  let trendDir: 'up' | 'down' | 'flat' = 'flat';
  let trendLabel = '—';
  if (previousNetCashFlow !== undefined && previousNetCashFlow !== 0) {
    const delta = ((netCashFlow - previousNetCashFlow) / Math.abs(previousNetCashFlow)) * 100;
    trendDir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    trendLabel = `${Math.abs(Math.round(delta))}% vs prev`;
  }

  return (
    <MetricsCard
      label="Cash Flow"
      value={`${isPositive ? '+' : '−'}${currency} ${fmt(netCashFlow)}`}
      subLabel={`In: ${currency} ${fmt(inflows)}  ·  Out: ${currency} ${fmt(outflows)}`}
      trend={{ direction: trendDir, label: trendLabel, positiveIsUp: true }}
      icon={<Banknote size={14} />}
      iconBg={
        isPositive
          ? 'bg-sky-50 dark:bg-sky-900/30'
          : 'bg-amber-50 dark:bg-amber-900/30'
      }
      iconColor={
        isPositive
          ? 'text-sky-600 dark:text-sky-400'
          : 'text-amber-600 dark:text-amber-400'
      }
      onClick={onClick}
    />
  );
};

// ── MetricsGrid container ─────────────────────────────────────────────────────

export interface MetricsGridProps {
  children: React.ReactNode;
  /** Number of columns on desktop (default: 3) */
  cols?: 2 | 3 | 4;
  className?: string;
}

/**
 * Responsive grid that lays out metric cards in a row.
 * On mobile: single column stack. On sm+: equal-width columns.
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  children,
  cols = 3,
  className = '',
}) => {
  const colsCls =
    cols === 2
      ? 'sm:grid-cols-2'
      : cols === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : 'sm:grid-cols-3';

  return (
    <div
      className={`grid grid-cols-1 ${colsCls} gap-3 ${className}`}
    >
      {children}
    </div>
  );
};
