import React from 'react';
import { STATUS_CONFIG, type StatusVariant } from '@ovds/shared';
import { Icon } from './ui/icon';

const statusStyles: Record<
  StatusVariant,
  {
    bg: string;
    text: string;
    border: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    dot: string;
  }
> = {
  settled: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-950/40',
    darkText: 'dark:text-emerald-400',
    darkBorder: 'dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-950/40',
    darkText: 'dark:text-amber-400',
    darkBorder: 'dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    darkBg: 'dark:bg-slate-800',
    darkText: 'dark:text-slate-400',
    darkBorder: 'dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  overdue: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    darkBg: 'dark:bg-rose-950/40',
    darkText: 'dark:text-rose-400',
    darkBorder: 'dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  sent: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    darkBg: 'dark:bg-sky-950/40',
    darkText: 'dark:text-sky-400',
    darkBorder: 'dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  pipeline: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    darkBg: 'dark:bg-indigo-950/40',
    darkText: 'dark:text-indigo-400',
    darkBorder: 'dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    darkBg: 'dark:bg-blue-950/40',
    darkText: 'dark:text-blue-400',
    darkBorder: 'dark:border-blue-800',
    dot: 'bg-blue-500',
  },
} as const;

interface StatusBadgeProps {
  status: string;
  /** Override the display label */
  label?: string;
  /** Show the icon (default: true) */
  showIcon?: boolean;
  /** Show a dot indicator instead of an icon */
  dot?: boolean;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * Consistent status badge across all OVDS pages.
 * Data-driven from @ovds/shared STATUS_CONFIG and @ovds/design-system colors.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  dot = false,
  size = 'xs',
  className = '',
}) => {
  const key = (status ?? '').toUpperCase();
  const cfg = STATUS_CONFIG[key] ?? {
    label: status ?? '—',
    icon: 'CLOCK',
    variant: 'draft',
  };

  const statusStyle = statusStyles[cfg.variant] ?? statusStyles.draft;

  const sizeCls =
    size === 'md'
      ? 'px-3 py-1 text-xs gap-1.5'
      : size === 'sm'
        ? 'px-2.5 py-0.5 text-[11px] gap-1'
        : 'px-2 py-0.5 text-[10px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border whitespace-nowrap transition-colors ${sizeCls} ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} ${statusStyle.darkBg} ${statusStyle.darkText} ${statusStyle.darkBorder} ${className}`}
    >
      {dot ? (
        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${statusStyle.dot}`} />
      ) : (
        showIcon && <Icon name={cfg.icon} size={size === 'md' ? 12 : 10} />
      )}
      {label ?? cfg.label}
    </span>
  );
};
