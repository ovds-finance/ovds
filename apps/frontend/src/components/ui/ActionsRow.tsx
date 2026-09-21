/**
 * ActionsRow — Ovds SaaS Grid-over-Card Layout System
 * ─────────────────────────────────────────────────────
 * Top-of-page toolbar matching Akaunting's action bar:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ [Filter Status ▾]  [Search...]  [⋮ More]  [+ New Item] │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Design principles:
 *  • Stateless — all values come in as props, changes go out as callbacks.
 *  • Search is debounce-ready: callers typically debounce `onSearchChange`.
 *  • Status filter is a controlled <select> that drives the grid filter.
 *  • Secondary actions slot accepts any React nodes (Import, Export, etc.).
 *  • Primary CTA (e.g. "+ New Invoice") is right-aligned, high-contrast.
 *  • Responsive: stacks on mobile, single row on sm+.
 */

import { Search, X, Plus, Filter } from 'lucide-react';
import React, { useId } from 'react';

// ── Filter option ─────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

// ── Primary CTA definition ────────────────────────────────────────────────────

export interface PrimaryAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

// ── ActionsRow props ──────────────────────────────────────────────────────────

export interface ActionsRowProps {
  /** Controlled search value. */
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;

  /** Filter options. If omitted the status dropdown is not rendered. */
  filterOptions?: FilterOption[];
  /** Controlled filter value. */
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  /** Label for the filter dropdown. Defaults to "All Statuses". */
  filterLabel?: string;

  /**
   * Primary CTA button definition.
   * If omitted, no primary button renders — useful for read-only views.
   */
  primaryAction?: PrimaryAction;

  /**
   * Secondary action slot — rendered between the search/filter group and the
   * primary CTA. Accepts any React nodes: icon buttons, dropdowns, etc.
   */
  secondaryActions?: React.ReactNode;

  /** Total result count shown next to the search field. */
  resultCount?: number;

  /** Whether the search / filter row is in a loading state. */
  loading?: boolean;

  /** Additional class names on the root wrapper. */
  className?: string;
}

// ── Reusable icon button (secondary actions) ──────────────────────────────────

export const ActionsIconBtn: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ label, icon, onClick, active = false, disabled = false }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={[
      'h-9 px-3 rounded-lg border flex items-center gap-1.5 text-sm font-medium transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/40',
      disabled
        ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed bg-white dark:bg-slate-900'
        : active
          ? 'border-[var(--pro-azure-light)] dark:border-green-700 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-900/20'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600',
    ].join(' ')}
  >
    <span className="shrink-0">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// ── ActionsRow component ──────────────────────────────────────────────────────

export const ActionsRow: React.FC<ActionsRowProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filterOptions,
  filterValue = 'ALL',
  onFilterChange,
  filterLabel = 'All Statuses',
  primaryAction,
  secondaryActions,
  resultCount,
  loading = false,
  className = '',
}) => {
  const searchId = useId();
  const filterId = useId();

  const hasFilter = !!filterOptions && filterOptions.length > 0;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2.5 ${className}`}
      role="toolbar"
      aria-label="Table actions"
    >
      {/* ── Left group: filter dropdown + search ─────────────────────── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Status / category filter dropdown */}
        {hasFilter && (
          <div className="relative shrink-0">
            <Filter
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <select
              id={filterId}
              value={filterValue}
              onChange={(e) => onFilterChange?.(e.target.value)}
              disabled={loading}
              aria-label="Filter by status"
              className={[
                'h-9 pl-7 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                'text-sm text-slate-700 dark:text-slate-200 font-medium',
                'appearance-none cursor-pointer transition-all',
                'focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/40 focus:border-[var(--pro-azure)]',
                'hover:border-slate-300 dark:hover:border-slate-600',
                loading ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <option value="ALL">{filterLabel}</option>
              {filterOptions!.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
              fill="none"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Search input */}
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={loading}
            aria-label="Search"
            autoComplete="off"
            className={[
              'w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400',
              'transition-all focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/40 focus:border-[var(--pro-azure)]',
              'hover:border-slate-300 dark:hover:border-slate-600',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Result count badge */}
        {resultCount !== undefined && !loading && (
          <span
            className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums"
            aria-live="polite"
            aria-label={`${resultCount} result${resultCount === 1 ? '' : 's'}`}
          >
            {resultCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Right group: secondary actions + primary CTA ─────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {secondaryActions}

        {primaryAction && (
          <button
            type="button"
            disabled={primaryAction.disabled ?? loading}
            onClick={primaryAction.onClick}
            className={[
              'h-9 px-4 rounded-lg flex items-center gap-2 text-sm font-bold text-white',
              'bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] active:bg-[var(--pro-azure-dark)]',
              'shadow-sm shadow-green-500/20 dark:shadow-green-500/10',
              'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/40',
              (primaryAction.disabled ?? loading) ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {primaryAction.icon ?? <Plus size={15} aria-hidden="true" />}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
};
