import React from 'react';
import { HelpCircle } from 'lucide-react';
import { COLOR_VALUE, ICON_BG } from './tokens';
import { InlineTooltip } from './tokens';

export interface AppStatProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: keyof typeof COLOR_VALUE;
  onClick?: () => void;
  tooltip?: string;
}

export const AppStat: React.FC<AppStatProps> = ({
  label,
  value,
  sub,
  trend,
  icon,
  color = 'emerald',
  onClick,
  tooltip,
}) => {
  const valCls = COLOR_VALUE[color] ?? 'text-emerald-600 dark:text-emerald-400';
  const iconCls = ICON_BG[color] ?? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)]',
        onClick
          ? 'cursor-pointer hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.08)] dark:hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.16)] hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/40'
          : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
            {icon}
          </div>
        )}
        {trend !== undefined && trend !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${
              trend > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'
            }`}
          >
            {trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
          {label}
        </p>
        {tooltip && <InlineTooltip text={tooltip} />}
      </div>
      <p className={`text-[20px] font-bold tabular-nums tracking-tight leading-none ${valCls}`}>{value}</p>
      {sub && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-tight">{sub}</p>
      )}
    </div>
  );
};

import { TrendingUp, TrendingDown } from 'lucide-react';
