/**
 * DashboardGrid — Clean, responsive grid layout for financial KPIs
 * Implements the 60-30-10 color system:
 *   - 60%: background (neutral-60) - dominant neutral surfaces
 *   - 30%: surface/border (secondary-30) - structure & cards
 *   - 10%: accent (ovds-accent) - primary CTAs and key metrics
 */
import React from 'react';

interface GridWidget {
  id: string;
  title: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
  priority?: 1 | 2 | 3; // For F-shaped reading pattern (1 = top-left)
  colSpan?: number;
  rowSpan?: number;
}

interface Props {
  widgets: GridWidget[];
  className?: string;
}

/**
 * Responsive grid container for dashboard widgets
 * Uses CSS grid with auto-fit for responsive columns
 */
export const DashboardGrid: React.FC<Props> = ({ widgets, className = '' }) => {
  // Sort by priority for F-shaped reading pattern (1 = top-left)
  const sortedWidgets = [...widgets].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3));

  return (
    <div className={`ovds-grid-auto gap-4 ${className}`}>
      {sortedWidgets.map((widget) => (
        <DashboardWidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
};

/**
 * Individual widget card following 60-30-10 system
 * 60% background, 30% surface, 10% accent
 */
const DashboardWidgetCard: React.FC<{ widget: GridWidget }> = ({ widget }) => {
  return (
    <div className="ovds-widget-card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {widget.title}
        </h3>
        {widget.icon && (
          <div className="w-8 h-8 rounded-lg bg-ovds-accent/10 flex items-center justify-center text-ovds-accent">
            {widget.icon}
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono-num tabular-nums">
          {typeof widget.value === 'number'
            ? widget.value.toLocaleString()
            : widget.value
          }
        </p>

        {widget.trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${
            widget.trend.positive ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            <span>{widget.trend.positive ? '↑' : '↓'}</span>
            {Math.abs(widget.trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Grid stats row - borderless with dividers between cells
 * For KPIs like: Receivables | Payables | Cash Flow | Net Position
 */
export const GridStatsRow: React.FC<{
  stats: { label: string; value: string | number; trend?: number }[];
  className?: string;
}> = ({ stats, className = '' }) => {
  return (
    <div className={`ovds-grid-stats ${className}`}>
      {stats.map((stat, i) => (
        <div key={i} className="px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono-num tabular-nums">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </p>
          {stat.trend !== undefined && (
            <p className={`text-xs font-semibold ${stat.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stat.trend >= 0 ? '+' : ''}{stat.trend}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DashboardGrid;