/**
 * GridHero — OVDS Modern Grid Hero components
 *
 * A family of top-of-page hero and summary primitives that implement the
 * OVDS "clean, responsive Grid layout replacing traditional card UI" design.
 *
 * Inspired by ovds's airy white space + CycleIQ stat card density.
 * All components are pure (no app-specific hooks or routing).
 *
 * Exports:
 *   GridHero        — full-width page hero with animated accent stripe, title,
 *                     subtitle, breadcrumb, actions, and optional slider slot
 *   GridHeroSlim    — compact variant for sub-pages (no accent stripe)
 *   GridStatBar     — responsive horizontal KPI strip (1–6 cells, borderless)
 *   GridStatCell    — individual stat cell for GridStatBar
 *   GridSummaryRow  — two-part income/expense split bar with totals
 *   GridModuleCard  — clean white module card for the App Store / dashboard
 *   GridSection     — section wrapper with title row, optional icon + action
 */

import React, { useRef, useEffect } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface GridHeroProps {
  /** Primary page title */
  title: string;
  /** Secondary subtitle / description */
  subtitle?: string;
  /** Small breadcrumb items above the title */
  crumbs?: Array<{ label: string; href?: string }>;
  /** Right-aligned action buttons/chips */
  actions?: React.ReactNode;
  /** Slot below the title row, above the divider — ideal for DashboardSlider */
  sliderSlot?: React.ReactNode;
  /** Slot for ovds-style tab bar below the slider */
  tabSlot?: React.ReactNode;
  /** Extra CSS class on root */
  className?: string;
  /** Disable the animated rainbow accent stripe at the top */
  noStripe?: boolean;
}

export interface GridStatCellProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  trend?: number;
  /** Tailwind bg class for bottom accent line e.g. 'bg-[var(--pro-azure)]' */
  accentCls?: string;
  /** Make entire cell clickable */
  onClick?: () => void;
  className?: string;
}

export interface GridStatBarProps {
  /** Cell definitions — 2 to 6 cells recommended */
  cells: GridStatCellProps[];
  className?: string;
  /** Force number of columns instead of auto */
  cols?: 2 | 3 | 4 | 5 | 6;
}

export interface GridSummaryRowProps {
  /** Total income / money-in amount string */
  income: string;
  /** Total expense / money-out amount string */
  expense: string;
  /** Net profit / balance string */
  net: string;
  /** Progress % of income collected (0–100) */
  collectionPct?: number;
  period?: string;
  currency?: string;
  loading?: boolean;
  className?: string;
}

export interface GridModuleCardProps {
  /** Module name */
  title: string;
  /** Short tagline */
  description?: string;
  /** Icon element */
  icon?: React.ReactNode;
  /** Icon background Tailwind class */
  iconBg?: string;
  /** Category label e.g. "ovds", "HR" */
  category?: string;
  /** Whether this module is installed/active */
  active?: boolean;
  /** Called when Install / Open is clicked */
  onAction?: () => void;
  /** Action button label — default "Open" when active, "Get Module" when not */
  actionLabel?: string;
  /** Subscription price string e.g. "$12.00/mo" */
  price?: string;
  /** Price label e.g. "Subscription" */
  priceLabel?: string;
  /** License term string e.g. "Renews Oct 2026" */
  licenseTerm?: string;
  /** License term label e.g. "License Term" */
  licenseTermLabel?: string;
  /** Rating number (0-5) */
  rating?: number;
  /** Additional className */
  className?: string;
}

export interface GridSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Spacing above the section */
  spacing?: 'sm' | 'md' | 'lg';
}

// -----------------------------------------------------------------------------
// GridHero
// -----------------------------------------------------------------------------

/**
 * Full-width sticky page hero bar.
 *
 * Layout (top → bottom):
 *   [3px animated accent stripe]
 *   [Breadcrumb]
 *   [Title] ··············· [Actions]
 *   [sliderSlot — DashboardSlider]
 *   [tabSlot — ovds tab nav]
 */
export const GridHero: React.FC<GridHeroProps> = ({
  title,
  subtitle,
  crumbs,
  actions,
  sliderSlot,
  tabSlot,
  className = '',
  noStripe = false,
}) => (
  <div
    className={[
      'ovds-page-hero',
      className,
    ].filter(Boolean).join(' ')}
  >
    {/* Breadcrumb */}
    {crumbs && crumbs.length > 0 && (
      <nav
        className="ovds-breadcrumb mb-2"
        aria-label="Breadcrumb"
      >
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">›</span>}
            {c.href
              ? <a href={c.href}>{c.label}</a>
              : <span>{c.label}</span>
            }
          </React.Fragment>
        ))}
      </nav>
    )}

    {/* Title + actions */}
    <div className="ovds-page-hero-body">
      <div className="min-w-0">
        <h1 className="ovds-hero-title">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-slate-400 mt-1 font-medium leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="ovds-page-hero-actions">
          {actions}
        </div>
      )}
    </div>

    {/* Dashboard slider slot */}
    {sliderSlot && (
      <div className="mt-4">
        {sliderSlot}
      </div>
    )}

    {/* Tab nav slot */}
    {tabSlot && (
      <div className="mt-3">
        {tabSlot}
      </div>
    )}

    {/* Bottom spacer so tabs don't overlap content */}
    {tabSlot && <div className="h-5" />}
  </div>
);

// -----------------------------------------------------------------------------
// GridHeroSlim — compact variant (no accent stripe, no slider)
// -----------------------------------------------------------------------------

export const GridHeroSlim: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className = '' }) => (
  <div
    className={[
      'bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800',
      'px-5 py-4 flex items-center justify-between gap-3',
      className,
    ].filter(Boolean).join(' ')}
  >
    <div className="min-w-0">
      <h2 className="ovds-module-title">{title}</h2>
      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    )}
  </div>
);

// -----------------------------------------------------------------------------
// GridStatBar + GridStatCell
// -----------------------------------------------------------------------------

/**
 * A horizontal row of KPI cells sharing a single white card background.
 * Cells are separated by subtle 1px dividers — no per-cell shadow noise.
 *
 * Uses the same `.ovds-stat-row` CSS class as StatRow in DashboardPrimitives,
 * adding automatic column count control and per-cell trend indicators.
 */
export const GridStatBar: React.FC<GridStatBarProps> = ({
  cells,
  className = '',
  cols,
}) => {
  const colCount = cols ?? Math.min(cells.length, 6);
  return (
    <div
      className={['ovds-stat-row', className].filter(Boolean).join(' ')}
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, i) => (
        <GridStatCell key={i} {...cell} />
      ))}
    </div>
  );
};

export const GridStatCell: React.FC<GridStatCellProps> = ({
  label,
  value,
  sub,
  trend,
  accentCls,
  onClick,
  className = '',
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={[
      'ovds-kpi-cell relative',
      onClick ? 'cursor-pointer' : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    <p className="ovds-label mb-1.5">{label}</p>
    <p className="ovds-value text-slate-800 dark:text-slate-100 tabular-nums">
      {value}
    </p>
    {(sub || trend !== undefined) && (
      <div className="flex items-center gap-2 mt-1">
        {sub && (
          <p className="text-[10px] text-slate-400 font-medium truncate leading-tight">
            {sub}
          </p>
        )}
        {trend !== undefined && trend !== 0 && (
          <span
            className={[
              'text-[9px] font-bold flex items-center gap-0.5 shrink-0 ml-auto',
              trend > 0 ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-rose-500 dark:text-rose-400',
            ].join(' ')}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    )}
    {accentCls && (
      <div
        className={[
          'absolute bottom-0 left-3 right-3 h-[2px] rounded-t-sm',
          accentCls,
        ].join(' ')}
      />
    )}
  </div>
);

// -----------------------------------------------------------------------------
// GridSummaryRow — income / expense split bar widget
// -----------------------------------------------------------------------------

export const GridSummaryRow: React.FC<GridSummaryRowProps> = ({
  income,
  expense,
  net,
  collectionPct = 0,
  period,
  currency = 'ETB',
  loading = false,
  className = '',
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el || loading) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 0.8s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${Math.min(100, Math.max(0, collectionPct))}%`;
    }, 120);
    return () => clearTimeout(t);
  }, [collectionPct, loading]);

  if (loading) {
    return (
      <div className={[
        'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5',
        'shadow-sm animate-pulse',
        className,
      ].join(' ')}>
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-6 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const netPositive = !net.startsWith('-');

  return (
    <div
      className={[
        'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl',
        'shadow-sm overflow-hidden',
        className,
      ].join(' ')}
    >
      {/* Collection progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-green-500 to-green-600"
          style={{ width: 0 }}
        />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-5">
          {/* Money In */}
          <div>
            <p className="ovds-label mb-1.5">Money In</p>
            <p className="ovds-value text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] tabular-nums">
              {income}
            </p>
            {period && (
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{period}</p>
            )}
          </div>

          {/* Money Out */}
          <div>
            <p className="ovds-label mb-1.5">Money Out</p>
            <p className="ovds-value text-rose-500 dark:text-rose-400 tabular-nums">
              {expense}
            </p>
            {collectionPct > 0 && (
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                {collectionPct.toFixed(0)}% collected
              </p>
            )}
          </div>

          {/* Net */}
          <div>
            <p className="ovds-label mb-1.5">Net Profit</p>
            <p
              className={[
                'ovds-value tabular-nums',
                netPositive
                  ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                  : 'text-rose-500 dark:text-rose-400',
              ].join(' ')}
            >
              {net}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{currency}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// GridModuleCard — App Store / UI theme module card
// -----------------------------------------------------------------------------

/**
 * A clean module card for the OVDS App Store / module marketplace.
 * Allows developers to build and install UI/theme modules from the Apps Market.
 *
 * Features (v5.0):
 *  - White card with rounded-xl border, subtle shadow
 *  - Category pill + star rating in header
 *  - Title + line-clamped description
 *  - Subscription price / license term info
 *  - Active state with indigo ring + "Installed" badge
 *  - "Get Module" / "Configure" CTA buttons
 */
export const GridModuleCard: React.FC<GridModuleCardProps> = ({
  title,
  description,
  icon,
  iconBg = 'bg-[var(--pro-azure-50)]',
  category,
  active = false,
  onAction,
  actionLabel,
  price,
  priceLabel = 'Subscription',
  licenseTerm,
  licenseTermLabel = 'License Term',
  rating,
  className = '',
}) => (
  <div
    className={[
      'group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200',
      active ? 'ring-1 ring-[var(--pro-azure)]/30' : '',
      className,
    ].filter(Boolean).join(' ')}
    aria-labelledby={`mod-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
  >
    <div>
      {/* Meta Information Row */}
      <div className="flex items-center justify-between mb-4">
        {category && (
          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            {category}
          </span>
        )}
        {rating !== undefined && (
          <div className="flex items-center gap-1 text-amber-500" aria-label={`Rating: ${rating} out of 5 stars`}>
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-3">
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 id={`mod-title-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h3>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>

    {/* Interaction / Price Line */}
    <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
      <div className="flex flex-col">
        {active && licenseTerm ? (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">{licenseTermLabel}</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{licenseTerm}</span>
          </>
        ) : price ? (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">{priceLabel}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {price}
            </span>
          </>
        ) : null}
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className={[
            'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer',
            active
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)] focus:ring-offset-2',
          ].join(' ')}
          aria-haspopup="dialog"
        >
          {active && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset mr-2" style={{ background: 'var(--pro-azure-50)', color: 'var(--pro-azure-dark)', borderColor: 'var(--pro-azure-100)' }}>
              Installed
            </span>
          )}
          {actionLabel ?? (active ? 'Configure' : 'Get Module')}
        </button>
      )}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// GridSection — Section wrapper with semantic header
// -----------------------------------------------------------------------------

const SPACING: Record<string, string> = {
  sm: 'mt-4',
  md: 'mt-6',
  lg: 'mt-8',
};

export const GridSection: React.FC<GridSectionProps> = ({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  spacing = 'md',
}) => (
  <section
    className={[SPACING[spacing], className].filter(Boolean).join(' ')}
    aria-label={title}
  >
    {/* Section header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
            {icon}
          </div>
        )}
        <div>
          <h2 className="ovds-section-title">{title}</h2>
          {subtitle && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>

    {/* Content */}
    {children}
  </section>
);

export default GridHero;
