/**
 * DashboardPrimitives — ovds-inspired layout primitives for the OVDS grid-based UI.
 * Implements 60-30-10 color rule for data-dense financial clarity.
 *
 * Exports:
 *   GridLayout    — responsive CSS grid container with 60-30-10 variants
 *   GridItem      — explicit column-span wrapper
 *   WidgetCard    — clean white card with optional header / footer slots
 *   StatRow       — borderless horizontal KPI strip (cells share one card)
 *   StatCell      — individual KPI cell with hover reveal details
 *   ContextPill   — status chip for context strips
 *   ContextStrip  — horizontal row of ContextPills
 *   SectionTitle  — section header with icon, title, subtitle, action
 *   FavNav        — Favorites navigation tab for sidebar pinning
 */

import React from 'react';

// -----------------------------------------------------------------------------
// GridLayout
// -----------------------------------------------------------------------------

export type GridCols = 1 | 2 | 3 | 4 | 'auto';
export type GridGap  = 'sm' | 'md' | 'lg';

export interface GridLayoutProps {
  children: React.ReactNode;
  /** Number of columns — or 'auto' for responsive auto-fill */
  cols?: GridCols;
  /** Gap size (sm=12px, md=20px default, lg=28px) */
  gap?: GridGap;
  className?: string;
}

const COL_MAP: Record<string | number, string> = {
  1: 'ovds-grid-layout cols-1',
  2: 'ovds-grid-layout cols-2',
  3: 'ovds-grid-layout cols-3',
  4: 'ovds-grid-layout cols-4',
  auto: 'ovds-grid-layout cols-auto',
};
const GAP_MAP: Record<string, string> = {
  sm:  'gap-sm',
  md:  '',
  lg:  'gap-lg',
};

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  cols = 2,
  gap = 'md',
  className = '',
}) => (
  <div
    className={[
      COL_MAP[cols] ?? COL_MAP[2],
      GAP_MAP[gap],
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);

// -----------------------------------------------------------------------------
// GridItem
// -----------------------------------------------------------------------------

export interface GridItemProps {
  children: React.ReactNode;
  /** How many grid columns to span */
  span?: 1 | 2 | 3 | 'full';
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({ children, span = 1, className = '' }) => {
  const spanCls =
    span === 2    ? 'ovds-col-span-2'
    : span === 3  ? 'ovds-col-span-3'
    : span === 'full' ? 'ovds-col-span-full'
    : '';
  return (
    <div className={[spanCls, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
};

// -----------------------------------------------------------------------------
// WidgetCard — clean white panel with optional header / footer
// -----------------------------------------------------------------------------

export interface WidgetCardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  header,
  footer,
  className = '',
  bodyClassName = '',
  onClick,
  children,
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={[
      'ovds-widget-card',
      onClick ? 'cursor-pointer' : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    {header && <div className="ovds-widget-header">{header}</div>}
    <div className={['ovds-widget-body', bodyClassName].filter(Boolean).join(' ')}>
      {children}
    </div>
    {footer && <div className="ovds-widget-footer">{footer}</div>}
  </div>
);

// -----------------------------------------------------------------------------
// StatRow / StatCell — borderless horizontal KPI strip
// -----------------------------------------------------------------------------

export interface StatRowProps {
  cols?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * All cells share a single white card background — no per-cell shadow noise.
 * Implements 60-30-10: 60% background, 30% structure, 10% accent.
 */
export const StatRow: React.FC<StatRowProps> = ({ cols, className = '', children }) => (
  <div
    className={['ovds-stat-row', className].filter(Boolean).join(' ')}
    style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
  >
    {children}
  </div>
);

export interface StatCellProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  /** Tailwind bg class for the bottom accent line e.g. 'bg-emerald-500' */
  accentCls?: string;
  active?: boolean;
  className?: string;
  /** Details revealed on hover - for line items */
  detail?: React.ReactNode;
}

export const StatCell: React.FC<StatCellProps> = ({
  label,
  value,
  sub,
  accentCls,
  active,
  className = '',
  detail,
}) => (
  <div className={['ovds-kpi-cell relative group', active ? 'active' : '', detail ? 'ovds-row-hover' : '', className].filter(Boolean).join(' ')}>
    <p className="ovds-label mb-1.5">{label}</p>
    <p className="ovds-value text-slate-800 dark:text-slate-100">{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
    {detail && (
      <div className="ovds-cell-detail mt-1" style={{ display: 'none' }}>
        {detail}
      </div>
    )}
    {accentCls && (
      <div className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-t-sm ${accentCls}`} />
    )}
  </div>
);

// -----------------------------------------------------------------------------
// ContextPill / ContextStrip
// -----------------------------------------------------------------------------

export type ContextPillVariant = 'default' | 'success' | 'alert' | 'info';

export interface ContextPillProps {
  label: string;
  leading?: React.ReactNode;
  variant?: ContextPillVariant;
  /** Animated pulse dot — signals live / real-time data */
  live?: boolean;
  className?: string;
}

const PILL_CLS: Record<string, string> = {
  default: 'bg-white border-slate-100 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300',
  alert:   'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300',
  info:    'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-300',
};

const DOT_CLS: Record<string, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  alert:   'bg-rose-500',
  info:    'bg-sky-500',
};

export const ContextPill: React.FC<ContextPillProps> = ({
  label,
  leading,
  variant = 'default',
  live = false,
  className = '',
}) => (
  <div
    className={[
      'inline-flex items-center gap-1.5 px-3 py-1.5',
      'rounded-xl border text-[11px] font-semibold shadow-sm shrink-0',
      PILL_CLS[variant] ?? PILL_CLS.default,
      className,
    ].filter(Boolean).join(' ')}
  >
    {leading && <span className="shrink-0 opacity-70">{leading}</span>}
    {live && (
      <span
        className={[
          'w-1.5 h-1.5 rounded-full animate-pulse shrink-0',
          DOT_CLS[variant] ?? DOT_CLS.default,
        ].join(' ')}
        aria-hidden="true"
      />
    )}
    <span>{label}</span>
  </div>
);

export interface ContextStripProps {
  children: React.ReactNode;
  className?: string;
}

export const ContextStrip: React.FC<ContextStripProps> = ({ children, className = '' }) => (
  <div
    className={['flex items-center gap-3 flex-wrap', className].filter(Boolean).join(' ')}
    role="status"
    aria-live="polite"
  >
    {children}
  </div>
);

// -----------------------------------------------------------------------------
// SectionTitle
// -----------------------------------------------------------------------------

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => (
  <div className={['flex items-center justify-between mb-4 mt-1', className].filter(Boolean).join(' ')}>
    <div className="flex items-center gap-2.5">
      {icon && (
        <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h2 className="ovds-section-title">{title}</h2>
        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// -----------------------------------------------------------------------------
// FavNav — Favorites navigation tab for sidebar pinning
// Implements progressive disclosure: only show when items are pinned
// -----------------------------------------------------------------------------

export interface FavNavProps {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FavNav: React.FC<FavNavProps> = ({
  label,
  icon,
  count,
  active,
  onClick,
  className = '',
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={[
      'ovds-nav-fav',
      active ? 'active' : '',
      onClick ? 'cursor-pointer' : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    <span className="ovds-fav-pin">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15 8.5 22 9.3 17 14.2 18.5 21 12 17.8 5.5 21 7 14.2 2 9.3 9 8.5 12 2" />
      </svg>
    </span>
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{label}</span>
    {count !== undefined && (
      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
        {count}
      </span>
    )}
  </button>
);
