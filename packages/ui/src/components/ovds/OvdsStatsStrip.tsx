/**
 * ovdsStatsStrip — ovds-style horizontal KPI strip.
 * Used at the top of Bills, Invoices, Expenses, Vendors pages.
 * Non-accountant friendly: plain labels + hover tooltips.
 *
 * Uses the OVDS grid layout system for consistent multi-device spacing.
 */
import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';

// -- Types ----------------------------------------------------------------------

export interface StripStat {
  label: string;
  tooltip?: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  /** Tailwind bg class e.g. "bg-emerald-50" */
  iconBg: string;
  /** Tailwind text class e.g. "text-emerald-600" */
  iconColor: string;
  /** Override value text color e.g. "text-rose-600" */
  valueColor?: string;
  /** Percentage change — drives the trend badge */
  trend?: number;
  onClick?: () => void;
}

export interface ovdsStatsStripProps {
  stats: StripStat[];
  loading?: boolean;
  cols?: 2 | 3 | 4 | 5 | 6;
}

// cols → ovds-grid-layout modifier class
const COL_CLS: Record<number, string> = {
  2: 'cols-2',
  3: 'cols-3',
  4: 'cols-4',
  5: 'cols-auto',
  6: 'cols-auto',
};

// -- Component ------------------------------------------------------------------

export const OvdsStatsStrip: React.FC<ovdsStatsStripProps> = ({
  stats,
  loading,
  cols = 4,
}) => {
  const colCls = COL_CLS[cols] ?? 'cols-4';

  // -- Loading skeleton ------------------------------------------------------
  if (loading) {
    return (
      <div className={`ovds-grid-layout ${colCls}`}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="ovds-widget-card p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
              <div className="h-2.5 bg-slate-100 rounded w-20" />
            </div>
            <div className="h-6 bg-slate-100 rounded w-28 mb-1.5" />
            <div className="h-2 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  // -- Data ------------------------------------------------------------------
  return (
    <div className={`ovds-grid-layout ${colCls}`}>
      {stats.map((stat, i) => (
        <div
          key={i}
          onClick={stat.onClick}
          role={stat.onClick ? 'button' : undefined}
          tabIndex={stat.onClick ? 0 : undefined}
          onKeyDown={stat.onClick ? (e) => e.key === 'Enter' && stat.onClick?.() : undefined}
          className={[
            'ovds-widget-card p-4',
            stat.onClick
              ? 'cursor-pointer hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.08)] hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
              : '',
          ].filter(Boolean).join(' ')}
        >
          {/* Icon + label row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                  {stat.label}
                </span>
                {stat.tooltip && (
                  <div className="relative group/tip">
                    <HelpCircle size={9} className="text-slate-300 cursor-help" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                                    opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-100">
                      <div className="bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg
                                      whitespace-nowrap shadow-xl max-w-[180px] text-center leading-snug">
                        {stat.tooltip}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Trend badge */}
            {stat.trend !== undefined && stat.trend !== 0 && (
              <div className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                stat.trend > 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-500'
              }`}>
                {stat.trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {stat.trend > 0 ? '+' : ''}{stat.trend.toFixed(1)}%
              </div>
            )}
          </div>

          {/* Value */}
          <p className={`text-[20px] font-bold tabular-nums tracking-tight leading-none ${stat.valueColor ?? 'text-slate-800'}`}>
            {stat.value}
          </p>

          {/* Sub */}
          {stat.sub && (
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-tight">
              {stat.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default OvdsStatsStrip;
