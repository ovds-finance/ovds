/**
 * AkiComponents — OVDS Ovds-signature premium UI components
 *
 * Implements the exact Ovds UI/UX signature in React:
 *   - Clean, airy white surfaces with subtle 1px borders
 *   - Single-blue (#0056D2) CTA dominance — 60-30-10 rule
 *   - Monospaced tabular-nums for all financial values
 *   - Minimal card shadows — structure through borders only
 *   - High-density but readable financial data layouts
 *   - Complete accessibility (ARIA, keyboard, focus rings)
 *   - Dark mode throughout
 *
 * Active exports (verified consumers in apps/frontend):
 *   AkiMetricCard       — Ovds-style KPI card with sparkline + trend
 *   AkiStatStrip        — borderless horizontal KPI strip (shared white card)
 *   AkiAuditTrail       — immutable audit timeline
 *   AkiValidationPanel  — sticky real-time validation sidebar
 *   AkiMultiStateProgress — visual timeline stepper bar
 *   AkiSectionHeader    — canonical section header with icon + title + action
 *   AkiLoadingBar       — animated top-of-page loading bar
 */

import React, { useState } from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Internal tiny SVG icons (zero runtime deps)
// ─────────────────────────────────────────────────────────────────────────────
const UpArrow = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const DownArrow = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const InfoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const WarnIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UnlockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// AkiMetricCard — Ovds-signature KPI card
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiMetricCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  /** Tailwind bg class for icon box e.g. 'bg-[var(--pro-azure-50)]' */
  iconBg?: string;
  /** Tailwind text class for icon */
  iconColor?: string;
  /** Left accent border: 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' */
  accent?: 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'teal' | 'sky' | 'orange' | 'green';
  /** Sparkline data points (simple numbers) */
  sparkData?: number[];
  onClick?: () => void;
  loading?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

const ACCENT_BORDER: Record<string, string> = {
  blue:    'border-l-[var(--pro-azure)]',
  amber:   'border-l-amber-500',
  rose:    'border-l-rose-500',
  violet:  'border-l-violet-500',
  teal:    'border-l-teal-500',
  sky:     'border-l-sky-500',
  indigo:  'border-l-indigo-500',
  orange:  'border-l-orange-500',
  green:   'border-l-green-500',
};

const SPARK_COLOR: Record<string, string> = {
  blue:    '#0056D2',
  amber:   '#F59E0B',
  rose:    '#F43F5E',
  violet:  '#8B5CF6',
  teal:    '#14B8A6',
  sky:     '#0EA5E9',
  indigo:  '#4FBA6F',
  orange:  '#F97316',
  green:   '#10B981',
};

/** Tiny SVG sparkline — zero runtime deps */
const TinySparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline = pts.join(' ');
  const fillPts = `0,${h} ${polyline} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polygon points={fillPts} fill={color} fillOpacity="0.1" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const AkiMetricCard: React.FC<AkiMetricCardProps> = ({
  label,
  value,
  sub,
  trend,
  trendLabel = 'vs last period',
  icon,
  iconBg = 'bg-white',
  iconColor = 'text-slate-500',
  accent = 'blue',
  sparkData,
  onClick,
  loading = false,
  badge,
  className,
}) => {
  const hasUpTrend = trend !== undefined && trend > 0;
  const hasDownTrend = trend !== undefined && trend < 0;

  if (loading) {
    return (
      <div className={cn('aki-kpi-card', ACCENT_BORDER[accent], 'animate-pulse', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="aki-skeleton h-2.5 w-20 rounded" />
            <div className="aki-skeleton h-7 w-28 rounded" />
            <div className="aki-skeleton h-2 w-16 rounded" />
          </div>
          <div className="aki-skeleton w-9 h-9 rounded-xl shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'aki-kpi-card border-l-4',
        ACCENT_BORDER[accent],
        onClick && 'cursor-pointer hover:shadow-raised hover:-translate-y-0.5 transition-all duration-150',
        onClick && 'focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/25',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="aki-kpi-label truncate">{label}</span>
          {badge}
        </div>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 mt-2">
        <span className="aki-kpi-value flex-1 min-w-0 truncate">{value}</span>
        {sparkData && sparkData.length >= 2 && (
          <TinySparkline data={sparkData} color={SPARK_COLOR[accent] ?? '#0056D2'} />
        )}
      </div>

      {(sub || trend !== undefined) && (
        <div className="flex items-center justify-between gap-2 mt-2">
          {sub && (
            <span className="aki-kpi-sub truncate">{sub}</span>
          )}
          {trend !== undefined && trend !== 0 && (
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-bold shrink-0 ml-auto px-1.5 py-0.5 rounded-full',
              hasUpTrend
                ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)]'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
            )}>
              {hasUpTrend ? <UpArrow /> : <DownArrow />}
              {hasUpTrend ? '+' : ''}{trend.toFixed(1)}%
              <span className="font-normal ml-0.5 opacity-70">{trendLabel}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AkiStatStrip — borderless horizontal KPI strip
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiStatCell {
  label: string;
  value: React.ReactNode;
  sub?: string;
  trend?: number;
  /** Bottom accent line Tailwind class e.g. 'bg-[var(--pro-azure)]' */
  accentLine?: string;
  onClick?: () => void;
}

export interface AkiStatStripProps {
  cells: AkiStatCell[];
  className?: string;
  /** Loading state — renders shimmer skeletons */
  loading?: boolean;
}

export const AkiStatStrip: React.FC<AkiStatStripProps> = ({ cells, className, loading = false }) => {
  if (loading) {
    return (
      <div
        className={cn('aki-stats-row animate-pulse', className)}
        style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
      >
        {cells.map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <div className="aki-skeleton h-2.5 w-16 rounded" />
            <div className="aki-skeleton h-6 w-24 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('aki-stats-row', className)}
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          onClick={cell.onClick}
          role={cell.onClick ? 'button' : undefined}
          tabIndex={cell.onClick ? 0 : undefined}
          onKeyDown={cell.onClick ? (e) => e.key === 'Enter' && cell.onClick?.() : undefined}
          className={cn(
            'px-5 py-4 relative cursor-default',
            cell.onClick && 'cursor-pointer hover:bg-[var(--surface-alt)] transition-colors',
          )}
        >
          <p className="text-label mb-1.5">{cell.label}</p>
          <p className="text-mono font-bold text-[20px] text-slate-800 dark:text-slate-100 tabular-nums leading-tight">{cell.value}</p>
          {(cell.sub || cell.trend !== undefined) && (
            <div className="flex items-center gap-2 mt-1">
              {cell.sub && <p className="text-caption leading-tight truncate">{cell.sub}</p>}
              {cell.trend !== undefined && cell.trend !== 0 && (
                <span className={cn(
                  'text-[9px] font-bold flex items-center gap-0.5 shrink-0 ml-auto',
                  cell.trend > 0 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-rose-500 dark:text-rose-400',
                )}>
                  {cell.trend > 0 ? <UpArrow /> : <DownArrow />}
                  {Math.abs(cell.trend).toFixed(1)}%
                </span>
              )}
            </div>
          )}
          {cell.accentLine && (
            <div className={cn('absolute bottom-0 left-4 right-4 h-[2px] rounded-t-sm', cell.accentLine)} />
          )}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AkiSectionHeader — canonical section header with icon + title + action
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  action?: React.ReactNode;
  className?: string;
}

export const AkiSectionHeader: React.FC<AkiSectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-white dark:bg-slate-900',
  action,
  className,
}) => (
  <div className={cn('ovds-section-title-row', className)}>
    <div className="flex items-center gap-2.5">
      {icon && (
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
          'border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400',
          iconBg,
        )}>
          {icon}
        </div>
      )}
      <div>
        <h2 className="ovds-section-title">{title}</h2>
        {subtitle && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AkiAuditTrail — immutable event timeline
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiAuditEntry {
  id: string;
  action: string;
  user: string;
  time: string;
  detail?: string;
  /** 'default' | 'success' | 'warning' | 'danger' | 'ai' */
  type?: 'default' | 'success' | 'warning' | 'danger' | 'ai';
}

const AUDIT_DOT: Record<string, string> = {
  default: 'aki-timeline-dot',
  success: 'aki-timeline-dot success',
  warning: 'aki-timeline-dot warning',
  danger:  'aki-timeline-dot danger',
  ai:      'aki-timeline-dot bg-violet-500 shadow-[0_0_0_2px_#EDE9FE]',
};

export interface AkiAuditTrailProps {
  entries: AkiAuditEntry[];
  loading?: boolean;
  className?: string;
}

export const AkiAuditTrail: React.FC<AkiAuditTrailProps> = ({
  entries,
  loading = false,
  className,
}) => (
  <div className={cn('aki-timeline', className)} aria-label="Audit trail">
    {loading ? (
      Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aki-timeline-item">
          <div className="aki-timeline-dot muted" />
          <div className="space-y-1">
            <div className="aki-skeleton h-3 w-40 rounded" />
            <div className="aki-skeleton h-2.5 w-24 rounded" />
          </div>
        </div>
      ))
    ) : (
      entries.map((entry) => (
        <div key={entry.id} className="aki-timeline-item" role="listitem">
          <div className={AUDIT_DOT[entry.type ?? 'default']} aria-hidden="true" />
          <div>
            <span className="aki-timeline-label">
              {entry.type === 'ai' && (
                <span className="inline-flex items-center gap-1 mr-1 text-[9px] font-bold uppercase tracking-wider bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded-full">
                  <SparkleIcon /> AI
                </span>
              )}
              {entry.action}
            </span>
            <p className="aki-timeline-meta">
              by <strong>{entry.user}</strong>
            </p>
            {entry.detail && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{entry.detail}</p>
            )}
            <p className="aki-timeline-time mt-0.5">{entry.time}</p>
          </div>
        </div>
      ))
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AkiMultiStateProgress — visual timeline stepper bar
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiProgressStep {
  label: string;
  done?: boolean;
  active?: boolean;
  error?: boolean;
}

export interface AkiMultiStateProgressProps {
  steps: AkiProgressStep[];
  className?: string;
}

export const AkiMultiStateProgress: React.FC<AkiMultiStateProgressProps> = ({
  steps,
  className,
}) => (
  <div className={cn('aki-stepper', className)} aria-label="Progress">
    {steps.map((step, i) => (
      <div
        key={i}
        className={cn(
          'aki-step',
          step.done && 'completed',
          step.active && 'active',
          step.error && 'error',
        )}
        aria-current={step.active ? 'step' : undefined}
      >
        <div className="aki-step-circle">
          {step.done ? (
            <CheckIcon />
          ) : step.error ? (
            '!'
          ) : (
            i + 1
          )}
        </div>
        <span className="aki-step-label">{step.label}</span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AkiValidationPanel — sticky real-time validation sidebar
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'ok';
  onClick?: () => void;
}

export interface AkiValidationPanelProps {
  items: AkiValidationError[];
  loading?: boolean;
  className?: string;
}

export const AkiValidationPanel: React.FC<AkiValidationPanelProps> = ({
  items,
  loading = false,
  className,
}) => {
  const errors = items.filter(i => i.type === 'error').length;
  const warnings = items.filter(i => i.type === 'warning').length;

  return (
    <div className={cn('aki-validation-panel', className)}>
      <div className="aki-validation-panel-header">
        {errors > 0 ? (
          <span className="text-rose-600">
            {errors} error{errors > 1 ? 's' : ''} to fix
          </span>
        ) : warnings > 0 ? (
          <span className="text-amber-600">
            {warnings} warning{warnings > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-[var(--pro-azure-dark)]">All checks passed ✓</span>
        )}
        {(errors > 0 || warnings > 0) && !loading && (
          <span className="text-[9px] font-normal text-slate-400">
            {items.length} checks
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aki-skeleton h-8 rounded" />
          ))}
        </div>
      ) : (
        <div className="aki-validation-panel-body">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={item.onClick}
              disabled={!item.onClick}
              className={cn(
                'aki-validation-item',
                item.type,
                !item.onClick && 'cursor-default',
              )}
            >
              <span className="shrink-0 mt-0.5">
                {item.type === 'error' && <span className="text-rose-500"><InfoIcon /></span>}
                {item.type === 'warning' && <span className="text-amber-500"><WarnIcon /></span>}
                {item.type === 'ok' && <span className="text-[var(--pro-azure)]"><CheckIcon /></span>}
              </span>
              <div className="min-w-0 text-left">
                <p className={cn(
                  'text-[11px] font-semibold leading-tight',
                  item.type === 'error' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400',
                )}>
                  {item.field}
                </p>
                <p className={cn(
                  'text-[10px] leading-snug mt-0.5',
                  item.type === 'error' ? 'text-rose-600 dark:text-rose-400' :
                  item.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                  'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                )}>
                  {item.message}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AkiLoadingBar — animated top-of-page loading indicator
// ─────────────────────────────────────────────────────────────────────────────

export interface AkiLoadingBarProps {
  active?: boolean;
  className?: string;
}

export const AkiLoadingBar: React.FC<AkiLoadingBarProps> = ({ active = true, className }) => {
  if (!active) return null;
  return (
    <div className={cn('aki-loading-bar', className)} role="progressbar" aria-label="Loading" />
  );
};
