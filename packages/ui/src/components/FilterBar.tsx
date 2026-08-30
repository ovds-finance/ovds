/**
 * FilterBar — horizontal filter/search bar for list pages.
 *
 * Combines a search input, date range pickers, and arbitrary filter chips
 * into a consistent, accessible bar above data tables.
 *
 * Usage:
 *   <FilterBar
 *     search={search}
 *     onSearchChange={setSearch}
 *     filters={[
 *       { key: 'status', label: 'Status', options: statusOptions, value: statusFilter, onChange: setStatusFilter },
 *     ]}
 *     dateFrom={dateFrom}
 *     dateTo={dateTo}
 *     onDateFromChange={setDateFrom}
 *     onDateToChange={setDateTo}
 *     onReset={resetFilters}
 *     count={totalCount}
 *   />
 */
import React from 'react';
import { X, Search, SlidersHorizontal } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key:      string;
  label:    string;
  options:  FilterOption[];
  value:    string;
  onChange: (value: string) => void;
  /** If true, include an "All" option as the first option */
  showAll?: boolean;
}

export interface FilterBarProps {
  /** Search query */
  search?:          string;
  onSearchChange?:  (v: string) => void;
  searchPlaceholder?: string;
  /** Additional filter dropdowns */
  filters?:         FilterDef[];
  /** Date range */
  dateFrom?:        string;
  dateTo?:          string;
  onDateFromChange?: (v: string) => void;
  onDateToChange?:   (v: string) => void;
  /** Reset all filters */
  onReset?:         () => void;
  /** Whether any filter is active (shows reset button) */
  hasActiveFilters?: boolean;
  /** Total count label */
  count?:           number;
  /** Extra actions (e.g. Export button) */
  actions?:         React.ReactNode;
  className?:       string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onReset,
  hasActiveFilters,
  count,
  actions,
  className = '',
}) => {
  const inputCls =
    'px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ' +
    'rounded-lg text-[12px] text-slate-700 dark:text-slate-300 font-medium ' +
    'focus:outline-none focus:ring-2 focus:ring-aki-blue/20 dark:focus:ring-aki-blue/30 ' +
    'focus:border-aki-blue dark:focus:border-aki-blue transition-all ' +
    'placeholder-slate-400 dark:placeholder-slate-600';

  return (
    <div
      className={`flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 ${className}`}
      role="search"
      aria-label="Filter controls"
    >
      {/* Filter icon */}
      <SlidersHorizontal size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />

      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
          />
          <input
            type="search"
            value={search ?? ''}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            className={`${inputCls} pl-7 w-full`}
          />
        </div>
      )}

      {/* Dropdown filters */}
      {filters.map(f => (
        <div key={f.key} className="flex items-center gap-1">
          <label
            htmlFor={`filter-${f.key}`}
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap"
          >
            {f.label}
          </label>
          <select
            id={`filter-${f.key}`}
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            className={`${inputCls} pr-6 min-w-[100px]`}
          >
            {f.showAll !== false && <option value="">All</option>}
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}

      {/* Date range */}
      {onDateFromChange && (
        <div className="flex items-center gap-1">
          <label
            htmlFor="filter-date-from"
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
          >
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={dateFrom ?? ''}
            onChange={e => onDateFromChange(e.target.value)}
            className={inputCls}
          />
        </div>
      )}
      {onDateToChange && (
        <div className="flex items-center gap-1">
          <label
            htmlFor="filter-date-to"
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
          >
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={dateTo ?? ''}
            onChange={e => onDateToChange(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {/* Count badge */}
      {count !== undefined && (
        <span className="ml-auto text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {count.toLocaleString()} result{count !== 1 ? 's' : ''}
        </span>
      )}

      {/* Extra actions */}
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}

      {/* Reset */}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
          aria-label="Reset all filters"
        >
          <X size={10} />
          Clear
        </button>
      )}
    </div>
  );
};
