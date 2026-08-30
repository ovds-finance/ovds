/**
 * useDebouncedSearch — debounced search input state + clear.
 *
 * Combines a controlled input value with a debounced version for API queries.
 * The UI always shows the live value; queries fire after the debounce delay.
 *
 * Usage:
 *   const { query, debouncedQuery, setQuery, clear } = useDebouncedSearch(400);
 *
 *   useEffect(() => {
 *     if (debouncedQuery) fetchResults(debouncedQuery);
 *   }, [debouncedQuery]);
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface DebouncedSearch {
  /** Live input value (bind to input) */
  query:          string;
  /** Debounced value (use for API calls) */
  debouncedQuery: string;
  setQuery:       (value: string) => void;
  /** Clear both query and debouncedQuery */
  clear:          () => void;
  /** True while the debounce timer is pending (input changed but not yet fired) */
  pending:        boolean;
}

export function useDebouncedSearch(delay = 350): DebouncedSearch {
  const [query,          setQueryRaw]          = useState('');
  const [debouncedQuery, setDebouncedQuery]     = useState('');
  const [pending,        setPending]            = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((value: string) => {
    setQueryRaw(value);
    setPending(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      setPending(false);
    }, delay);
  }, [delay]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueryRaw('');
    setDebouncedQuery('');
    setPending(false);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { query, debouncedQuery, setQuery, clear, pending };
}
