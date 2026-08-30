/**
 * MetricCard — Ovds-style glanceable financial KPI card.
 * White surface · left accent border · tabular-nums value · trend pill.
 * Fully aligned with OVDS design-system tokens.
 */
import React from 'react';

export interface MetricCardProps {
  title: string;
  amount: string;
  percentage: number;
  isPositive: boolean;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Accent colour: 'blue' | 'emerald' | 'amber' | 'rose' */
  accent?: 'blue' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

const ACCENT_BORDER: Record<string, string> = {
  blue:    'border-l-[var(--aki-blue)]',
  emerald: 'border-l-emerald-500',
  amber:   'border-l-amber-500',
  rose:    'border-l-rose-500',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  percentage,
  isPositive,
  icon,
  accent = 'blue',
  onClick,
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={[
      'bg-white dark:bg-[var(--surface)] p-5',
      'border border-[var(--border)] border-l-4',
      ACCENT_BORDER[accent] ?? ACCENT_BORDER.blue,
      'rounded-[var(--card-radius)]',
      'shadow-[var(--card-shadow)]',
      'transition-all duration-150',
      onClick
        ? 'cursor-pointer hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.08)] hover:-translate-y-0.5'
        : '',
    ].filter(Boolean).join(' ')}
  >
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text-4)]">
        {title}
      </span>
      {icon && (
        <span className="w-8 h-8 rounded-xl bg-[var(--aki-blue-50)] text-[var(--aki-blue)] flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
      {!icon && (
        <span className={[
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          isPositive
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
        ].join(' ')}>
          {isPositive ? '+' : ''}{percentage}%
        </span>
      )}
    </div>

    {/* Value */}
    <h3 className="font-mono text-[22px] font-bold tracking-tight tabular-nums text-[var(--text)] leading-none">
      {amount}
    </h3>

    {/* Trend (when icon is present) */}
    {icon && (
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-[var(--text-4)]">vs last period</span>
        <span className={[
          'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          isPositive
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
        ].join(' ')}>
          {isPositive ? '↑' : '↓'} {Math.abs(percentage)}%
        </span>
      </div>
    )}
  </div>
);

export default MetricCard;
