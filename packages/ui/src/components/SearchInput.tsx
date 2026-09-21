/**
 * SearchInput — debounced search input with clear button and loading indicator.
 *
 * Fires `onChange` only after the user stops typing for `debounceMs` ms
 * (default 300ms), preventing excessive API calls.
 *
 * Usage:
 *   <SearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Search invoices…"
 *     loading={isFetching}
 *   />
 *
 *   // Controlled with URL state
 *   const [filters, setFilters] = useUrlState({ search: '' });
 *   <SearchInput
 *     value={filters.search}
 *     onChange={v => setFilters({ search: v, page: '1' })}
 *   />
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
  /** Show a spinner — useful while a query is in flight */
  loading?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Input size variant */
  size?: 'sm' | 'md';
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: externalValue = '',
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  loading = false,
  disabled = false,
  className = '',
  size = 'md',
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. reset from URL state)
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(val), debounceMs);
    },
    [onChange, debounceMs],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Keyboard shortcut: Escape clears
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && localValue) {
        e.preventDefault();
        handleClear();
      }
    },
    [localValue, handleClear],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const sizeClasses = size === 'sm'
    ? 'h-7 text-[11px] pl-7 pr-7'
    : 'h-8 text-[12px] pl-8 pr-8';

  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Leading icon */}
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        {loading
          ? <Loader2 size={iconSize} className="animate-spin text-[var(--pro-azure)]" />
          : <Search size={iconSize} />
        }
      </span>

      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className={[
          sizeClasses,
          'w-full rounded-lg border border-slate-200 dark:border-slate-700',
          'bg-white dark:bg-slate-900',
          'text-slate-800 dark:text-slate-100',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/30 focus:border-[var(--pro-azure)]',
          'transition-all duration-150',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          // Hide the native browser clear button (we have our own)
          '[&::-webkit-search-cancel-button]:hidden',
        ].filter(Boolean).join(' ')}
        aria-label={placeholder}
      />

      {/* Clear button */}
      {localValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Clear search"
        >
          <X size={iconSize} />
        </button>
      )}
    </div>
  );
};
