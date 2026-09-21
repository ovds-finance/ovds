/**
 * PageHeader — Ovds SaaS page-level header.
 *
 * Design:
 *  - White surface, 1px border-[var(--border)], 8px radius, subtle shadow
 *  - Title: 15px bold, var(--text); subtitle: 12px, var(--text-4)
 *  - Search pill: 40px, green focus ring, magnifier icon
 *  - Primary action: Ovds SaaS green button
 *  - Secondary action: white card button (outline)
 *  - Danger action: rose tint button
 *  - Filter chips: coloured pill badges with ×
 */
import React, { useId } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface FilterChip {
  label: string;
  value: string;
  onRemove: () => void;
  color?: 'green' | 'blue' | 'amber' | 'rose' | 'violet';
}

export interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: Action[];
  children?: React.ReactNode;
  resultCount?: number;
  resultLabel?: string;
  filterChips?: FilterChip[];
  onClearAllFilters?: () => void;
  isSearching?: boolean;
}

/* ── Variant styles ─────────────────────────────────────────────── */
const ACTION_CLS: Record<string, string> = {
  primary: [
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer select-none',
    'bg-[var(--pro-azure)] text-white border border-[var(--pro-azure)]',
    'shadow-sm shadow-[var(--pro-azure)]/20',
    'hover:bg-[var(--pro-azure-dark)] hover:border-[var(--pro-azure-dark)] hover:-translate-y-px hover:shadow-md hover:shadow-[var(--pro-azure)]/30',
    'active:scale-[0.97]',
    'disabled:opacity-45 disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1',
  ].join(' '),
  secondary: [
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer select-none',
    'bg-white border border-[var(--border)] text-[var(--text-2)]',
    'shadow-sm shadow-black/[0.03]',
    'hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)]',
    'active:scale-[0.97]',
    'disabled:opacity-45 disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1',
  ].join(' '),
  danger: [
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer select-none',
    'bg-rose-50 border border-rose-200 text-rose-700',
    'hover:bg-rose-100 hover:border-rose-300',
    'active:scale-[0.97]',
    'disabled:opacity-45 disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-1',
  ].join(' '),
};

const CHIP_CLS: Record<string, string> = {
  green:  'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  blue:   'bg-sky-50 border-sky-200 text-sky-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-700',
  rose:   'bg-rose-50 border-rose-200 text-rose-700',
  violet: 'bg-violet-50 border-violet-200 text-violet-700',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor = 'text-white',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions = [],
  children,
  resultCount,
  resultLabel = 'results',
  filterChips = [],
  onClearAllFilters,
  isSearching = false,
}) => {
  const searchId  = useId();
  const hasSearch  = onSearchChange !== undefined;
  const hasFilters = filterChips.length > 0;
  const hasTitle   = !!title;

  return (
    <div
      className="mb-4 overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* ── Title row ──────────────────────────────────────────────── */}
      {hasTitle && (
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 gap-3"
          style={{ borderBottom: (hasSearch || hasFilters || children) ? '1px solid var(--border-alt)' : undefined }}
        >
          {/* Left: icon + title */}
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}
                style={{ background: iconBg ?? 'var(--pro-azure)' }}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="text-[15px] font-bold leading-tight truncate"
                style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: actions (shown in title row only when there's no search bar) */}
          {!hasSearch && (actions.length > 0 || children) && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {children}
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.onClick}
                  disabled={a.disabled}
                  className={ACTION_CLS[a.variant ?? 'primary']}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Search / filter row ─────────────────────────────────────── */}
      {(hasSearch || (!hasTitle && (actions.length > 0 || children))) && (
        <div className="flex flex-col gap-2 px-5 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">

            {/* Search input */}
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              {hasSearch && (
                <div className="relative flex-1 max-w-[260px] group">
                  <label htmlFor={searchId} className="sr-only">{searchPlaceholder}</label>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isSearching ? (
                      <div
                        className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-[var(--pro-azure)] animate-spin"
                      />
                    ) : (
                      <Search
                        size={13}
                        className="transition-colors"
                        style={{ color: 'var(--text-4)' }}
                      />
                    )}
                  </div>
                  <input
                    id={searchId}
                    type="search"
                    placeholder={searchPlaceholder}
                    value={searchValue ?? ''}
                    onChange={e => onSearchChange!(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-9 pr-8 py-2 text-[12px] font-medium rounded-lg outline-none transition-all duration-150"
                    style={{
                      height: 36,
                      background: 'var(--sys-bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--pro-azure)';
                      e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,186,111,0.18)';
                      e.currentTarget.style.background  = 'var(--surface)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow   = 'none';
                      e.currentTarget.style.background  = 'var(--sys-bg-subtle)';
                    }}
                  />
                  {searchValue && (
                    <button
                      onClick={() => onSearchChange!('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                      style={{ color: 'var(--text-4)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                      aria-label="Clear search"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}

              {children}

              {resultCount !== undefined && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-lg border"
                  style={
                    searchValue && resultCount === 0
                      ? { background: '#FFF1F2', borderColor: '#FECDD3', color: '#9F1239' }
                      : { background: 'var(--pro-azure-50)', borderColor: 'var(--pro-azure-100)', color: 'var(--pro-azure-dark)' }
                  }
                >
                  {resultCount.toLocaleString()} {resultLabel}
                </span>
              )}
            </div>

            {/* Actions next to search */}
            {hasSearch && actions.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.onClick}
                    disabled={a.disabled}
                    className={ACTION_CLS[a.variant ?? 'primary']}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-5)' }}
              >
                <SlidersHorizontal size={9} /> Filters
              </span>
              {filterChips.map((chip, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${CHIP_CLS[chip.color ?? 'green']}`}
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              {filterChips.length > 1 && onClearAllFilters && (
                <button
                  onClick={onClearAllFilters}
                  className="text-[10px] font-bold transition-colors underline underline-offset-2"
                  style={{ color: 'var(--pro-azure)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--pro-rose)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--pro-azure)')}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter chips — title-only mode */}
      {hasTitle && !hasSearch && !children && hasFilters && (
        <div className="flex items-center gap-1.5 flex-wrap px-5 pb-3">
          <span
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-5)' }}
          >
            <SlidersHorizontal size={9} /> Filters
          </span>
          {filterChips.map((chip, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${CHIP_CLS[chip.color ?? 'green']}`}
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
