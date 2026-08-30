/**
 * PageHeader â€” CycleIQ-style page header
 * Clean white Â· Emerald accents Â· Responsive
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
  color?: 'blue' | 'amber' | 'emerald' | 'rose' | 'violet';
}

interface PageHeaderProps {
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

const variantCls: Record<string, string> = {
  primary:
    'bg-financial-accent text-white hover:bg-indigo-700 shadow-[0_2px_4px_rgba(0,0,0,0.05)] active:scale-95',
  secondary:
    'bg-white border border-slate-200 text-financial-textMain font-medium hover:border-slate-300 hover:bg-slate-50 active:scale-95',
  danger:
    'bg-rose-50 border border-rose-200 text-financial-danger font-medium hover:bg-rose-100 active:scale-95',
};

const chipColor: Record<string, string> = {
  blue:    'bg-sky-50 border-sky-200 text-sky-700',
  amber:   'bg-amber-50 border-amber-200 text-amber-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rose:    'bg-rose-50 border-rose-200 text-rose-700',
  violet:  'bg-violet-50 border-violet-200 text-violet-700',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-financial-accent',
  iconColor = 'text-white',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions = [],
  children,
  resultCount,
  resultLabel = 'results',
  filterChips = [],
  onClearAllFilters,
  isSearching = false,
}) => {
  const searchId = useId();
  const hasSearch = onSearchChange !== undefined;
  const hasFilters = filterChips.length > 0;
  const hasTitle = !!title;

  return (
    <div className="bg-white border border-slate-100 rounded-ovds shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-4 overflow-hidden">
      {/* â”€â”€ Title row â”€â”€ */}
      {hasTitle && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className={`w-8 h-8 rounded-ovds ${iconBg} flex items-center justify-center shrink-0 ${iconColor} shadow-sm`}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-financial-textMain leading-tight tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-financial-textMuted mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {!hasSearch && (actions.length > 0 || children) && (
            <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.onClick}
                  disabled={a.disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-ovds text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${
                    variantCls[a.variant ?? 'primary']
                  }`}
                >
                  {a.icon}
                  {a.label && <span>{a.label}</span>}
                </button>
              ))}
              {children}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Search / filter row â”€â”€ */}
      {(hasSearch || (!hasTitle && (actions.length > 0 || children))) && (
        <div className="flex flex-col gap-2 px-5 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              {hasSearch && (
                <div className="relative flex-1 max-w-xs group">
                  <label htmlFor={searchId} className="sr-only">
                    {searchPlaceholder}
                  </label>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isSearching ? (
                      <div className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    ) : (
                      <Search size={13} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    )}
                  </div>
                  <input
                    id={searchId}
                    type="search"
                    placeholder={searchPlaceholder}
                    value={searchValue ?? ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-9 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-ovds text-sm text-financial-textMain placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-financial-accent focus:bg-white focus:border-financial-accent transition-all"
                  />
                  {searchValue && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}

              {children}

              {resultCount !== undefined && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-lg border ${
                  searchValue && resultCount === 0
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}>
                  {resultCount.toLocaleString()} {resultLabel}
                </span>
              )}
            </div>

            {hasSearch && actions.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.onClick}
                    disabled={a.disabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${
                      variantCls[a.variant ?? 'primary']
                    }`}
                  >
                    {a.icon}
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasFilters && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <SlidersHorizontal size={9} /> Filters
              </span>
              {filterChips.map((chip, i) => (
                <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${chipColor[chip.color ?? 'emerald']}`}>
                  {chip.label}
                  <button onClick={chip.onRemove} className="hover:opacity-60 transition-opacity ml-0.5" aria-label={`Remove ${chip.label}`}>
                    <X size={9} />
                  </button>
                </span>
              ))}
              {filterChips.length > 1 && onClearAllFilters && (
                <button onClick={onClearAllFilters} className="text-[10px] font-bold text-emerald-600 hover:text-rose-500 transition-colors underline underline-offset-2">
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Title-only with filter chips */}
      {hasTitle && !hasSearch && !children && hasFilters && (
        <div className="flex items-center gap-1.5 flex-wrap px-5 pb-3">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <SlidersHorizontal size={9} /> Filters
          </span>
          {filterChips.map((chip, i) => (
            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${chipColor[chip.color ?? 'emerald']}`}>
              {chip.label}
              <button onClick={chip.onRemove} className="hover:opacity-60 transition-opacity ml-0.5" aria-label={`Remove ${chip.label}`}>
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
