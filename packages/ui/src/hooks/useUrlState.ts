/**
 * useUrlState — sync component state with URL search params.
 *
 * Keeps filter, pagination, and sort state in the URL so:
 * - Browser back/forward navigation works correctly
 * - Sharing a URL preserves the current view
 * - Page refresh restores the exact state
 *
 * Usage:
 *   const [filters, setFilters] = useUrlState({
 *     status: '',
 *     search: '',
 *     page: '1',
 *   });
 *
 *   // Read
 *   const status = filters.status;
 *
 *   // Write (merges partial updates, pushes to history)
 *   setFilters({ status: 'PAID', page: '1' });
 *
 *   // Reset to defaults
 *   setFilters(null);
 *
 * Type-safe: generic TState constrains keys to strings.
 * Empty string values are omitted from the URL (cleaner URLs).
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export type UrlStateValue = string;
export type UrlStateShape = Record<string, UrlStateValue>;

/** Merge defaults with current URL params */
function readFromUrl<T extends UrlStateShape>(defaults: T): T {
  if (typeof window === 'undefined') return { ...defaults };
  const params = new URLSearchParams(window.location.search);
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const val = params.get(key);
    if (val !== null) (result as UrlStateShape)[key] = val;
  }
  return result;
}

/** Serialize state to URLSearchParams, omitting empty/default values */
function toSearchParams<T extends UrlStateShape>(state: T, defaults: T): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(state)) {
    const val = state[key];
    // Omit empty strings and values equal to the default (keeps URL clean)
    if (val !== '' && val !== defaults[key]) {
      params.set(key, val);
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

export type SetUrlState<T extends UrlStateShape> = (
  partial: Partial<T> | null,
  options?: { replace?: boolean },
) => void;

export function useUrlState<T extends UrlStateShape>(
  defaults: T,
): [T, SetUrlState<T>] {
  const defaultsRef = useRef(defaults);
  const [state, setState] = useState<T>(() => readFromUrl(defaults));

  // Sync from URL when browser navigates back/forward
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = () => setState(readFromUrl(defaultsRef.current));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setUrlState: SetUrlState<T> = useCallback((partial, options) => {
    setState(prev => {
      const next: T = partial === null
        ? { ...defaultsRef.current }
        : { ...prev, ...partial };

      const search = toSearchParams(next, defaultsRef.current);
      const newUrl = window.location.pathname + search;

      if (options?.replace) {
        window.history.replaceState(null, '', newUrl);
      } else {
        window.history.pushState(null, '', newUrl);
      }

      return next;
    });
  }, []);

  return [state, setUrlState];
}
