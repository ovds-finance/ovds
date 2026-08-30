/**
 * VVSummaryCard — minimalist verification card.
 *
 * Ovds-style grid card with large, bold typography so users can verify
 * parsed totals and running balances at a glance during the Verification step.
 */
import React from 'react';
import { cn } from '../../lib/utils';

export type VVCardTone = 'neutral' | 'success' | 'danger' | 'info' | 'credit';

export interface VVSummaryCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
  tone?: VVCardTone;
  /** Optional pill shown on the top-right (e.g. "Balanced") */
  badge?: string;
  className?: string;
}

const TONE: Record<VVCardTone, { value: string; bg: string; badge?: string }> = {
  neutral: { value: 'text-slate-800 dark:text-slate-100', bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700' },
  success: { value: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  danger:  { value: 'text-rose-600 dark:text-rose-400', bg: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  info:    { value: 'text-aki-blue dark:text-blue-400', bg: 'bg-white dark:bg-slate-900 border-aki-blue/30 dark:border-blue-800', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  credit:  { value: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' },
};

export const VVSummaryCard: React.FC<VVSummaryCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  tone = 'neutral',
  badge,
  className,
}) => {
  const t = TONE[tone];
  return (
    <div className={cn('rounded-oki border p-4 flex flex-col gap-1.5 relative overflow-hidden', t.bg, className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        {badge && (
          <span className={cn('text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border', t.badge)}>
            {badge}
          </span>
        )}
      </div>
      <p className={cn('text-2xl font-black tabular-nums tracking-tight leading-none', t.value)}>
        {value}
      </p>
      {sublabel && <p className="text-[10px] text-slate-400 font-medium leading-tight">{sublabel}</p>}
      {icon && (
        <div className="absolute -bottom-2 -right-2 opacity-[0.04] pointer-events-none select-none">
          <div className="w-16 h-16">{icon}</div>
        </div>
      )}
    </div>
  );
};
