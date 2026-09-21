/**
 * useApiPaginated — paginated API query with URL-synced filters.
 *
 * Combines useApiQuery + apiGetPaginated + URL state synchronization so
 * all filter/page/sort changes are reflected in the URL automatically.
 *
 * Features:
 * - URL-synced filters: browser back/forward navigation restores state
 * - Automatic page reset to 1 when filters change
 * - keepPreviousData: no flash of empty state on filter/page changes
 * - TanStack Query compatible shape for gradual migration
 *
 * Usage:
 *   const {
 *     data, total, page, totalPages,
 *     filters, setFilters,
 *     loading, refetch,
 *   } = useApiPaginated<Invoice>('/ovds/invoices', {
 *     defaults: { status: '', search: '', page: '1', limit: '20' },
 *   });
 *
 *   // Update filters — resets to page 1, pushes to history
 *   setFilters({ status: 'PAID' });
 *
 *   // Paginate
 *   setFilters({ page: String(page + 1) });
 */
import { useUrlState } from '@ovds/ui';
import type { PaginatedResult } from '@ovds/ui';
import { useCallback, useMemo } from 'react';

import { useApiQuery } from './useApiQuery';

export interface UseApiPaginatedDefaults {
  page?:      string;
  limit?:     string;
  search?:    string;
  sortBy?:    string;
  sortOrder?: string;
  [key: string]: string | undefined;
}

export interface UseApiPaginatedOptions<_T> {
  /** Default filter values — also used to reset */
  defaults?: UseApiPaginatedDefaults;
  /** staleTime in ms (default 30s) */
  staleTime?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Additional deps that trigger refetch when changed */
  deps?: unknown[];
  /** Suppress error toast */
  suppressToast?: boolean;
}

export interface UseApiPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  loading: boolean;
  isRefetching: boolean;
  error: { message: string } | null;
  /** Current URL-synced filter state */
  filters: Record<string, string>;
  /** Update filters — non-page changes auto-reset page to 1 */
  setFilters: (partial: Record<string, string> | null, opts?: { replace?: boolean }) => void;
  /** Convenience: go to a specific page */
  goToPage: (p: number) => void;
  /** Convenience: update search string */
  setSearch: (s: string) => void;
  refetch: () => void;
}

const BASE_DEFAULTS: UseApiPaginatedDefaults = {
  page:      '1',
  limit:     '20',
  search:    '',
  sortBy:    '',
  sortOrder: 'desc',
};

export function useApiPaginated<T = any>(
  baseUrl: string,
  options: UseApiPaginatedOptions<T> = {},
): UseApiPaginatedResult<T> {
  const {
    defaults: userDefaults = {},
    staleTime,
    enabled = true,
    deps = [],
    suppressToast = false,
  } = options;

  const defaults = useMemo(
    () => ({ ...BASE_DEFAULTS, ...userDefaults }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [filters, setUrlFilters] = useUrlState(defaults as Record<string, string>);

  // Build query string from current filters
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v && v !== '') params.set(k, v);
    }
    return params.toString();
  }, [filters]);

  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  const { data: raw, loading, isRefetching, error, refetch } = useApiQuery<PaginatedResult<T>>(
    url,
    {
      enabled,
      staleTime,
      suppressToast,
      keepPreviousData: true,
      deps,
      select: (res: any) => {
        // Handle both paginated and flat array responses
        const inner = res?.data ?? res;
        if (Array.isArray(inner?.data) && inner?.pagination) {
          return {
            data:       inner.data as T[],
            total:      inner.pagination.total      ?? 0,
            page:       inner.pagination.page       ?? 1,
            limit:      inner.pagination.take       ?? inner.pagination.limit ?? 20,
            totalPages: inner.pagination.pages      ?? inner.pagination.totalPages ?? 1,
          } satisfies PaginatedResult<T>;
        }
        if (Array.isArray(inner)) {
          return { data: inner as T[], total: inner.length, page: 1, limit: inner.length, totalPages: 1 };
        }
        return { data: [] as T[], total: 0, page: 1, limit: 20, totalPages: 0 };
      },
    },
  );

  const setFilters = useCallback(
    (partial: Record<string, string> | null, opts?: { replace?: boolean }) => {
      if (partial === null) {
        setUrlFilters(null, opts);
        return;
      }
      // Auto-reset page to 1 when any non-page filter changes
      const hasNonPageChange = Object.keys(partial).some(k => k !== 'page');
      setUrlFilters(
        hasNonPageChange ? { ...partial, page: '1' } : partial,
        opts,
      );
    },
    [setUrlFilters],
  );

  const goToPage = useCallback(
    (p: number) => setFilters({ page: String(p) }, { replace: true }),
    [setFilters],
  );

  const setSearch = useCallback(
    (s: string) => setFilters({ search: s }),
    [setFilters],
  );

  return {
    data:         raw?.data       ?? [],
    total:        raw?.total      ?? 0,
    page:         raw?.page       ?? Number(filters.page ?? 1),
    totalPages:   raw?.totalPages ?? 0,
    limit:        raw?.limit      ?? Number(filters.limit ?? 20),
    loading,
    isRefetching,
    error,
    filters,
    setFilters,
    goToPage,
    setSearch,
    refetch,
  };
}

