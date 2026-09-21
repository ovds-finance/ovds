import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { COLOR_VALUE, ICON_BG, PROGRESS_BG, BORDER_COLOR, InlineTooltip } from './tokens';

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
  loading?: boolean;
}

/**
 * Ovds SaaS style KPI strip.
 * Each cell has a coloured left-border stripe and sits in a flat white card row.
 */
export const AppKpi: React.FC<AppKpiProps> = ({ cells, className, cols, loading }) => {
  const gridCols = cols
    ? { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }[cols]
    : undefined;

  return (
    <div
      className={['grid mb-4 rounded-lg overflow-hidden', gridCols ?? '', className ?? '', loading ? 'animate-pulse' : ''].join(' ')}
      style={
        !gridCols
          ? { gridTemplateColumns: `repeat(${Math.min(cells.length, 6)}, minmax(0,1fr))` }
          : undefined
      }
      role="list"
    >
      {cells.map((cell, i) => {
        const color = cell.color ?? 'green';
        const valCls  = COLOR_VALUE[color]  ?? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]';
        const iconCls = ICON_BG[color]      ?? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-[var(--pro-azure-light)]';
        const progCls = PROGRESS_BG[color]  ?? 'bg-[var(--pro-azure)]';
        const bdrCls  = BORDER_COLOR[color] ?? 'border-[var(--pro-azure)]';

        return (
          <div
            key={i}
            role="listitem"
            onClick={cell.onClick}
            tabIndex={cell.onClick ? 0 : undefined}
            onKeyDown={cell.onClick ? (e) => e.key === 'Enter' && cell.onClick?.() : undefined}
            className={[
              'p-4 relative transition-colors',
              /* Ovds SaaS left-border stripe per cell */
              `border-l-4 ${bdrCls}`,
              i < cells.length - 1 ? 'border-r' : '',
              cell.onClick
                ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/30'
                : '',
            ].join(' ')}
            style={{
              background: 'var(--surface)',
              borderRight: i < cells.length - 1 ? '1px solid var(--border-alt)' : undefined,
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}
            onMouseEnter={cell.onClick ? (e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--sys-bg-subtle)';
            } : undefined}
            onMouseLeave={cell.onClick ? (e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)';
            } : undefined}
          >
            {/* Label row */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider truncate"
                  style={{ color: 'var(--text-4)' }}
                >
                  {cell.label}
                </span>
                {cell.tooltip && <InlineTooltip text={cell.tooltip} />}
              </div>
              {cell.icon && (
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
                  {cell.icon}
                </span>
              )}
            </div>

            {/* Value */}
            <p className={`text-[20px] font-bold tabular-nums tracking-tight leading-none ${valCls}`}>
              {cell.value}
            </p>

            {/* Sub + trend */}
            <div className="flex items-center justify-between mt-1.5 gap-1">
              {cell.sub && (
                <p className="text-[10px] leading-tight truncate" style={{ color: 'var(--text-4)' }}>
                  {cell.sub}
                </p>
              )}
              {cell.trend !== undefined && cell.trend !== 0 && (
                <span
                  className={`text-[9px] font-bold flex items-center gap-0.5 shrink-0 ml-auto`}
                  style={
                    cell.trend > 0
                      ? { color: 'var(--pro-azure-dark)' }
                      : { color: '#9F1239' }
                  }
                >
                  {cell.trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {cell.trend > 0 ? '+' : ''}{cell.trend.toFixed(1)}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            {cell.progress !== undefined && (
              <div
                className="mt-2 h-1 rounded-full overflow-hidden"
                style={{ background: 'var(--border-alt)' }}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progCls}`}
                  style={{ width: `${Math.min(100, Math.max(0, cell.progress))}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
