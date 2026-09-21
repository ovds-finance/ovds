/**
 * GridPageLayout — Ovds SaaS Grid-over-Card Layout System
 * ─────────────────────────────────────────────────────────
 * Master page shell that composes the three structural Akaunting zones
 * in the correct slot order:
 *
 *   ┌────────────────────────────────────────────────────────────────────────┐
 *   │ Page Header  (title, breadcrumb, page-level actions)                   │
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ [ActionsRow]  Filter · Search · + New CTA                              │
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ [MetricsOverviewGrid]  KPI strip                                       │
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ [DataGrid]  High-density data table (hover-to-reveal actions)          │
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ [Pagination]  Optional row count + pager                               │
 *   └────────────────────────────────────────────────────────────────────────┘
 *
 * All zones are slot-based — pass `null` or omit to suppress any zone.
 *
 * Design principles:
 *  • Structural, not visual — this component owns spacing and slot ordering
 *    only. Visual opinions live in the child components.
 *  • Tabs slot allows multi-tab pages (Invoices / Estimates / Recurring)
 *    without duplicating the full layout tree.
 *  • Fully accessible: main landmark, heading hierarchy, live region for
 *    loading state.
 */

import { Loader2, RefreshCw } from 'lucide-react';
import React from 'react';

// ── Breadcrumb item ───────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

// ── Pagination state ──────────────────────────────────────────────────────────

export interface GridPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GridPaginationCallbacks {
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

// ── Tab definition ────────────────────────────────────────────────────────────

export interface GridTab {
  key: string;
  label: string;
  count?: number;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Whether this tab is the active one. */
  active: boolean;
  onClick: () => void;
}

// ── GridPageLayout props ──────────────────────────────────────────────────────

export interface GridPageLayoutProps {
  /** Page heading — rendered as an <h1>. */
  title: string;
  /** Optional page sub-heading or description. */
  description?: string;
  /** Breadcrumb trail. If omitted no breadcrumb renders. */
  breadcrumb?: BreadcrumbItem[];
  /** Header-row right-side slot: page-level action buttons (not row actions). */
  headerActions?: React.ReactNode;

  /** Tabs strip — renders below the header, above the actions row. */
  tabs?: GridTab[];

  /** ActionsRow component instance (filter, search, primary CTA). */
  actionsRow?: React.ReactNode;

  /** MetricsOverviewGrid component instance. */
  metricsGrid?: React.ReactNode;

  /** The main DataGrid component instance. */
  dataGrid: React.ReactNode;

  /**
   * Optional Pagination props.
   * If `pagination` is provided the built-in pager renders below the grid.
   */
  pagination?: GridPaginationState & GridPaginationCallbacks;

  /**
   * Refreshes data — if provided a "Last refreshed" indicator + button appears
   * in the header.
   */
  onRefresh?: () => void;
  refreshing?: boolean;

  /** Global page loading — dims the entire content area. */
  loading?: boolean;

  /** Additional class names on the root <main> element. */
  className?: string;
}

// ── Built-in pagination ───────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const BuiltInPagination: React.FC<{
  state: GridPaginationState;
  cbs: GridPaginationCallbacks;
}> = ({ state, cbs }) => {
  const { page, limit, total, totalPages } = state;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-2.5">
      {/* Row count summary */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{from}–{to}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{total.toLocaleString()}</span>
        </p>
        {cbs.onLimitChange && (
          <select
            value={limit}
            onChange={(e) => cbs.onLimitChange!(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/40"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <PagerBtn
          label="Previous page"
          disabled={page <= 1}
          onClick={() => cbs.onPageChange(page - 1)}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11L5 7l4-4" />
          </svg>
        </PagerBtn>

        {buildPageRange(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none">…</span>
          ) : (
            <PagerBtn
              key={p}
              label={`Page ${p}`}
              active={p === page}
              disabled={false}
              onClick={() => cbs.onPageChange(p as number)}
            >
              <span className="text-xs tabular-nums">{p}</span>
            </PagerBtn>
          )
        )}

        <PagerBtn
          label="Next page"
          disabled={page >= totalPages}
          onClick={() => cbs.onPageChange(page + 1)}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </PagerBtn>
      </div>
    </div>
  );
};

const PagerBtn: React.FC<{
  label: string;
  active?: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, active = false, disabled, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    disabled={disabled}
    onClick={onClick}
    className={[
      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/40',
      disabled
        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
        : active
          ? 'bg-[var(--pro-azure)] text-white shadow-sm shadow-green-500/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700',
    ].join(' ')}
  >
    {children}
  </button>
);

/** Build a compact page range: [1, 2, …, 7, 8] style. */
function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

const Breadcrumb: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && (
          <svg className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {item.href || item.onClick ? (
          <a
            href={item.href}
            onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick!(); } : undefined}
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            {item.label}
          </a>
        ) : (
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200" aria-current="page">
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// ── Tabs strip ────────────────────────────────────────────────────────────────

const TabsStrip: React.FC<{ tabs: GridTab[] }> = ({ tabs }) => (
  <div
    className="flex items-center gap-0.5 border-b border-slate-200 dark:border-slate-700 overflow-x-auto"
    role="tablist"
  >
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={tab.active}
        onClick={tab.onClick}
        className={[
          'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500/40',
          tab.active
            ? 'border-[var(--pro-azure)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600',
        ].join(' ')}
      >
        {tab.icon && <span className="w-4 h-4 flex items-center justify-center" aria-hidden="true">{tab.icon}</span>}
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={[
              'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
              tab.active
                ? 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
            ].join(' ')}
          >
            {tab.count.toLocaleString()}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ── GridPageLayout ────────────────────────────────────────────────────────────

export const GridPageLayout: React.FC<GridPageLayoutProps> = ({
  title,
  description,
  breadcrumb,
  headerActions,
  tabs,
  actionsRow,
  metricsGrid,
  dataGrid,
  pagination,
  onRefresh,
  refreshing = false,
  loading = false,
  className = '',
}) => {
  return (
    <main
      className={`flex flex-col gap-5 min-h-0 ${className}`}
      aria-label={title}
    >
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb items={breadcrumb} />
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing || loading}
                aria-label="Refresh data"
                className={[
                  'h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center',
                  'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                  'hover:bg-slate-50 dark:hover:bg-slate-800 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40',
                  refreshing || loading ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? 'animate-spin' : ''}
                  aria-hidden="true"
                />
              </button>
            )}
            {headerActions}
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      {tabs && tabs.length > 0 && <TabsStrip tabs={tabs} />}

      {/* ── Actions row ─────────────────────────────────────────────── */}
      {actionsRow}

      {/* ── Metrics grid ────────────────────────────────────────────── */}
      {metricsGrid}

      {/* ── Data grid + pagination ───────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 min-h-0 relative">
        {/* Page-level loading overlay — shown when entire page data is being fetched */}
        {loading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl"
            aria-live="polite"
            aria-label="Loading page data"
          >
            <Loader2 size={20} className="animate-spin text-[var(--pro-azure)]" />
          </div>
        )}

        {dataGrid}

        {pagination && (
          <BuiltInPagination
            state={pagination}
            cbs={{ onPageChange: pagination.onPageChange, onLimitChange: pagination.onLimitChange }}
          />
        )}
      </div>
    </main>
  );
};
