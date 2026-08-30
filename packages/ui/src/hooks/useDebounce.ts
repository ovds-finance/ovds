import { useState, useEffect } from 'react';

/**
 * Debounces a value — only updates after the specified delay has passed
 * without the value changing. Useful for search inputs to avoid firing
 * an API call on every keystroke.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 350);
 *   useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
