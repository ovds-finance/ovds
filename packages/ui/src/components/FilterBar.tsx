/**
 * FilterBar — Ovds SaaS horizontal filter strip.
 *
 * Design:
 *  - Sits above data tables; light grey bg (var(--sys-bg-subtle)), 1px bottom border
 *  - Search input: green focus ring, magnifier left icon
 *  - Dropdown selects: consistent 12px font, green focus ring
 *  - Date inputs: same style as selects
 *  - Count badge: Ovds SaaS green pill
 *  - Reset: rose-text ghost button
 */
import React from 'react';
import { X, Search, SlidersHorizontal } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  showAll?: boolean;
}

export interface FilterBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (v: string) => void;
  onDateToChange?: (v: string) => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}

/* ── Shared input/select style ──────────────────────────────────── */
const FIELD_BASE: React.CSSProperties = {
  height: 32,
  padding: '0 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text)',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'var(--pro-azure)';
  e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,186,111,0.18)';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'var(--border)';
  e.currentTarget.style.boxShadow   = 'none';
};

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
}) => (
  <div
    className={`flex flex-wrap items-center gap-2 px-4 py-2.5 ${className}`}
    style={{
      background: 'var(--sys-bg-subtle)',
      borderBottom: '1px solid var(--border-alt)',
    }}
    role="search"
    aria-label="Filter controls"
  >
    {/* Icon */}
    <SlidersHorizontal size={12} style={{ color: 'var(--text-4)', flexShrink: 0 }} />

    {/* Search input */}
    {onSearchChange !== undefined && (
      <div className="relative flex-1 min-w-[140px] max-w-[220px]">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-4)' }}
        />
        <input
          type="search"
          value={search ?? ''}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search"
          style={{ ...FIELD_BASE, paddingLeft: 28, width: '100%' }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    )}

    {/* Dropdown filters */}
    {filters.map(f => (
      <div key={f.key} className="flex items-center gap-1.5">
        <label
          htmlFor={`filter-${f.key}`}
          className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
          style={{ color: 'var(--text-5)' }}
        >
          {f.label}
        </label>
        <select
          id={`filter-${f.key}`}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          style={{ ...FIELD_BASE, paddingRight: 28, minWidth: 100 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="filter-date-from"
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: 'var(--text-5)' }}
        >
          From
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={dateFrom ?? ''}
          onChange={e => onDateFromChange(e.target.value)}
          style={FIELD_BASE}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    )}
    {onDateToChange && (
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="filter-date-to"
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: 'var(--text-5)' }}
        >
          To
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={dateTo ?? ''}
          onChange={e => onDateToChange(e.target.value)}
          style={FIELD_BASE}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    )}

    {/* Count */}
    {count !== undefined && (
      <span
        className="ml-auto text-[11px] font-semibold whitespace-nowrap tabular-nums"
        style={{ color: 'var(--text-4)' }}
      >
        {count.toLocaleString()} result{count !== 1 ? 's' : ''}
      </span>
    )}

    {/* Extra actions */}
    {actions && <div className="flex items-center gap-1.5">{actions}</div>}

    {/* Reset */}
    {hasActiveFilters && onReset && (
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors"
        style={{ color: '#9F1239' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#FFF1F2')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        aria-label="Reset all filters"
      >
        <X size={10} />
        Clear
      </button>
    )}
  </div>
);
