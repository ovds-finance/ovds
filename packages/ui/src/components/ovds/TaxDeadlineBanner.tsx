/**
 * TaxDeadlineBanner — surfaces upcoming ERCA tax filing deadlines.
 *
 * Uses efyTaxDeadlines() from @ovds/shared to compute all current-period
 * deadlines and renders them as color-coded status strips.
 *
 * Variants:
 *   'banner'  — full-width alert bar (mounts at top of Tax pages)
 *   'compact' — small inline chip row (mounts in page heroes / stat bars)
 *   'card'    — widget card with all deadlines listed
 *
 * Usage:
 *   // At the top of a tax page
 *   <TaxDeadlineBanner variant="banner" />
 *
 *   // Inside a stat bar
 *   <TaxDeadlineBanner variant="compact" maxItems={2} />
 *
 *   // Full deadline widget
 *   <TaxDeadlineBanner variant="card" />
 */
import React, { useMemo } from 'react';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { efyTaxDeadlines } from '@ovds/shared';

interface DeadlineItem {
  type:     string;
  label:    string;
  deadline: Date;
  daysLeft: number;
  isOverdue:boolean;
  legalRef: string;
}

function getDeadlineStyle(item: DeadlineItem): {
  bg: string; text: string; border: string; icon: React.ReactNode;
} {
  if (item.isOverdue) return {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: <AlertTriangle size={12} className="text-rose-500 shrink-0" />,
  };
  if (item.daysLeft <= 7) return {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock size={12} className="text-amber-500 shrink-0 animate-pulse" />,
  };
  return {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    icon: <Calendar size={12} className="text-sky-500 shrink-0" />,
  };
}

export interface TaxDeadlineBannerProps {
  variant?: 'banner' | 'compact' | 'card';
  /** Max deadlines to show (default: show all urgent ones) */
  maxItems?: number;
  /** Only show deadlines within this many days (default: 45) */
  withinDays?: number;
  className?: string;
}

export const TaxDeadlineBanner: React.FC<TaxDeadlineBannerProps> = ({
  variant = 'banner',
  maxItems,
  withinDays = 45,
  className = '',
}) => {
  const deadlines = useMemo<DeadlineItem[]>(() => {
    try {
      return efyTaxDeadlines()
        .filter(d => d.isOverdue || d.daysLeft <= withinDays)
        .slice(0, maxItems);
    } catch {
      return [];
    }
  }, [withinDays, maxItems]);

  if (deadlines.length === 0) return null;

  // -- Compact: pill row ----------------------------------------------------
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {deadlines.map((d, i) => {
          const s = getDeadlineStyle(d);
          return (
            <div
              key={i}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${s.bg} ${s.text} ${s.border}`}
              title={d.legalRef}
            >
              {s.icon}
              <span>{d.type}</span>
              <span className="opacity-70">
                {d.isOverdue ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // -- Banner: full-width alert strip ---------------------------------------
  if (variant === 'banner') {
    const hasOverdue  = deadlines.some(d => d.isOverdue);
    const hasUrgent   = deadlines.some(d => !d.isOverdue && d.daysLeft <= 7);
    const bannerStyle = hasOverdue
      ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
      : hasUrgent
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
        : 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800';

    return (
      <div className={`w-full border rounded-xl px-4 py-2.5 ${bannerStyle} ${className}`}>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {hasOverdue
              ? <AlertTriangle size={13} className="text-rose-500" />
              : <Clock size={13} className="text-amber-500" />
            }
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Tax Deadlines
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {deadlines.map((d, i) => {
              const s = getDeadlineStyle(d);
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${s.bg} ${s.text} ${s.border}`}
                  title={`${d.label} — ${d.legalRef}`}
                >
                  {s.icon}
                  {d.type}: {d.isOverdue ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d`}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -- Card: full deadline list ----------------------------------------------
  return (
    <div className={`ovds-widget-card ${className}`}>
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-slate-500" />
          <span className="ovds-card-title">Upcoming ERCA Deadlines</span>
        </div>
      </div>
      <div className="ovds-widget-body divide-y divide-slate-100 dark:divide-slate-800 !p-0">
        {deadlines.map((d, i) => {
          const s = getDeadlineStyle(d);
          return (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {s.icon}
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold truncate ${s.text}`}>{d.label}</p>
                  <p className="ovds-caption mt-0.5 truncate">{d.legalRef}</p>
                </div>
              </div>
              <div className={`shrink-0 px-2 py-0.5 rounded border text-[10px] font-bold ${s.bg} ${s.text} ${s.border}`}>
                {d.isOverdue
                  ? `${Math.abs(d.daysLeft)}d overdue`
                  : d.daysLeft === 0 ? 'Today' : `${d.daysLeft}d left`
                }
              </div>
            </div>
          );
        })}
        {deadlines.every(d => !d.isOverdue) && (
          <div className="flex items-center gap-2 px-4 py-2.5 text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
            <CheckCircle size={11} />
            All upcoming deadlines within schedule
          </div>
        )}
      </div>
    </div>
  );
};
