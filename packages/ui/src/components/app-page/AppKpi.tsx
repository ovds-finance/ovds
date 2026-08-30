import React from 'react';
import { HelpCircle } from 'lucide-react';
import { COLOR_VALUE, ICON_BG, PROGRESS_BG, InlineTooltip } from './tokens';

export interface KpiCell {
  label: string;
  value: string | number;
  color?: keyof typeof COLOR_VALUE;
  icon?: React.ReactNode;
  sub?: string;
  tooltip?: string;
  onClick?: () => void;
  trend?: number;
  progress?: number;
}

export interface AppKpiProps {
  cells: KpiCell[];
  className?: string;
  cols?: 2 | 3 | 4 | 5 | 6;
}

export const AppKpi: React.FC<AppKpiProps> = ({ cells, className, cols }) => {
  const gridCols = cols
    ? {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      }[cols]
    : undefined;

  return (
    <div
      className={[
        'grid bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)] mb-4',
        className ?? '',
      ].join(' ')}
      style={!gridCols ? { gridTemplateColumns: `repeat(${Math.min(cells.length, 6)}, minmax(0,1fr))` } : undefined}
      role="list"
    >
      {cells.map((cell, i) => {
        const valCls = COLOR_VALUE[cell.color ?? 'emerald'] ?? 'text-emerald-600 dark:text-emerald-400';
        const iconCls = ICON_BG[cell.color ?? 'emerald'] ?? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
        const progCls = PROGRESS_BG[cell.color ?? 'emerald'] ?? 'bg-emerald-500';

        return (
          <div
            key={i}
            role="listitem"
            onClick={cell.onClick}
            tabIndex={cell.onClick ? 0 : undefined}
            onKeyDown={cell.onClick ? (e) => e.key === 'Enter' && cell.onClick?.() : undefined}
            className={[
              'p-4 transition-colors relative',
              i < cells.length - 1 ? 'border-r border-slate-100 dark:border-slate-800' : '',
              cell.onClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/50 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900/50 active:bg-slate-100 dark:active:bg-slate-900' : 'hover:bg-slate-50/40 dark:hover:bg-slate-900/30',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{cell.label}</span>
                {cell.tooltip && <InlineTooltip text={cell.tooltip} />}
              </div>
              {cell.icon && (
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
                  {cell.icon}
                </span>
              )}
            </div>
            <p className={`text-[20px] font-bold tabular-nums tracking-tight leading-none ${valCls}`}>{cell.value}</p>
            <div className="flex items-center justify-between mt-1.5 gap-1">
              {cell.sub && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">{cell.sub}</p>
              )}
              {cell.trend !== undefined && cell.trend !== 0 && (
                <span className={`text-[9px] font-bold flex items-center gap-0.5 shrink-0 ml-auto ${
                  cell.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                }`}>
                  {cell.trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {cell.trend > 0 ? '+' : ''}{cell.trend.toFixed(1)}%
                </span>
              )}
            </div>
            {cell.progress !== undefined && (
              <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${progCls}`} style={{ width: `${Math.min(100, Math.max(0, cell.progress))}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Local icon imports for the Kpi component
import { TrendingUp, TrendingDown } from 'lucide-react';
