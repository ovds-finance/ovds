/**
 * useRefineSearch — debounced search + filter state for Refine pages.
 *
 * Usage:
 *   const { searchValue, setSearchValue, searchFilters } = useRefineSearch('search');
 *
 *   // Pass searchFilters into useRefineCrud filters.initial, or call
 *   // setFilters(searchFilters) imperatively when searchFilters changes.
 *
 * The hook debounces input by 350 ms so it does not fire a request on every
 * keystroke, and maps the search term to a Refine CrudFilter array you can
 * merge with your other filters.
 */
import { useState, useEffect, useRef } from "react";
import type { CrudFilters } from "@refinedev/core";

interface UseRefineSearchOptions {
  /** Query param name the backend expects. Defaults to "search". */
  field?: string;
  /** Debounce delay in ms. Defaults to 350. */
  delay?: number;
  /** Additional static filters to always merge in. */
  staticFilters?: CrudFilters;
}

interface UseRefineSearchResult {
  /** Controlled input value (bind to <input value={searchValue} onChange={...} />) */
  searchValue: string;
  setSearchValue: (v: string) => void;
  /** Debounced Refine CrudFilters — pass to setFilters() */
  searchFilters: CrudFilters;
  /** True while the debounce timer is pending */
  isPending: boolean;
  /** Reset search back to empty */
  clearSearch: () => void;
}

function useRefineSearch(
  field: string = "search",
  options: UseRefineSearchOptions = {},
): UseRefineSearchResult {
  const { delay = 350, staticFilters = [] } = options;
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchValue === debouncedValue) {
      setIsPending(false);
      return;
    }
    setIsPending(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedValue(searchValue);
      setIsPending(false);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchValue, delay, debouncedValue]);

  const searchFilters: CrudFilters = [
    ...staticFilters,
    ...(debouncedValue.trim()
      ? [{ field, operator: "contains" as const, value: debouncedValue.trim() }]
      : []),
  ];

  const clearSearch = () => {
    setSearchValue("");
    setDebouncedValue("");
  };

  return { searchValue, setSearchValue, searchFilters, isPending, clearSearch };
}

export { useRefineSearch };
export type { UseRefineSearchResult, UseRefineSearchOptions };
