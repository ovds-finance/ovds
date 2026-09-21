/**
 * useSearch — debounced search input with optional URL sync.
 *
 * Features:
 * - Debounced value for API calls (avoids request on every keystroke)
 * - Optional URL search param sync (?q=...)
 * - minLength guard — debouncedValue stays empty until threshold is met
 * - isPending flag — true while user is still typing
 * - resetOnChange — resets an external pagination state when search changes
 *
 * Usage:
 *   const search = useSearch({ delay: 400, paramKey: 'q', minLength: 2 });
 *
 *   <input value={search.value} onChange={e => search.setValue(e.target.value)} />
 *
 *   // Use debouncedValue for API calls — empty string when below minLength
 *   const { data } = useApiQuery(
 *     `/employees?search=${search.debouncedValue}&companyId=${companyId}`,
 *     { enabled: !!companyId, deps: [search.debouncedValue] }
 *   );
 */
import { useDebounce } from '@ovds/ui';
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseSearchOptions {
  /** Debounce delay in ms (default: 350) */
  delay?: number;
  /** URL search param key to sync with (default: no sync) */
  paramKey?: string;
  /** Initial value (overridden by URL param if paramKey is set) */
  initialValue?: string;
  /**
   * Minimum character count before debouncedValue is populated.
   * Below this threshold debouncedValue returns ''.
   * Default: 0 (no minimum)
   */
  minLength?: number;
  /**
   * Callback fired when the debounced value changes.
   * Useful for resetting pagination: resetOnChange: pg.reset
   */
  resetOnChange?: () => void;
}

interface UseSearchResult {
  /** Raw input value — bind to <input value> */
  value: string;
  /**
   * Debounced value — use for API calls.
   * Empty string when value.length < minLength.
   */
  debouncedValue: string;
  /** Update the search value */
  setValue: (v: string) => void;
  /** Clear the search and reset URL param */
  clear: () => void;
  /** true while the user is still typing (raw !== debounced) */
  isPending: boolean;
  /** true when debouncedValue is non-empty */
  isActive: boolean;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const {
    delay = 350,
    paramKey,
    initialValue = '',
    minLength = 0,
    resetOnChange,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const getInitial = () => {
    if (paramKey) return searchParams.get(paramKey) ?? initialValue;
    return initialValue;
  };

  const [value, setValueState] = useState<string>(getInitial);
  const rawDebounced = useDebounce(value, delay);

  // Apply minLength guard
  const debouncedValue = rawDebounced.length >= minLength ? rawDebounced : '';

  // Sync to URL param when debounced value changes
  useEffect(() => {
    if (!paramKey) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedValue) {
          next.set(paramKey, debouncedValue);
        } else {
          next.delete(paramKey);
        }
        return next;
      },
      { replace: true },
    );
  }, [debouncedValue, paramKey, setSearchParams]);

  // Fire resetOnChange when debounced value changes
  useEffect(() => {
    if (resetOnChange) resetOnChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  const setValue = useCallback((v: string) => setValueState(v), []);

  const clear = useCallback(() => {
    setValueState('');
    if (paramKey) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(paramKey);
          return next;
        },
        { replace: true },
      );
    }
  }, [paramKey, setSearchParams]);

  return {
    value,
    debouncedValue,
    setValue,
    clear,
    isPending: value !== rawDebounced,
    isActive: debouncedValue.length > 0,
  };
}

