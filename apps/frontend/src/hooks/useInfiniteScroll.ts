/**
 * useInfiniteScroll — paginated infinite-scroll data fetching.
 *
 * Features:
 * - Auto-loads next page when sentinel div enters viewport
 * - Structured error (ApiQueryError) — compatible with ApiErrorState
 * - Abort on unmount / param change
 * - Reset on param change
 * - Manual loadMore() for button-triggered pagination
 *
 * Usage:
 *   const { items, loading, loadingMore, hasMore, error, sentinelRef, reset } =
 *     useInfiniteScroll<Employee>({
 *       url: '/hr/employees',
 *       params: { companyId },
 *       enabled: !!companyId,
 *     });
 *
 *   {items.map(e => <EmployeeRow key={e.id} employee={e} />)}
 *   {error && <ApiErrorState error={error} onRetry={reset} compact />}
 *   {loadingMore && <Spinner />}
 *   <div ref={sentinelRef} />   ← auto-triggers next page
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';
import { buildApiQueryError, type ApiQueryError } from './useApiQuery';

interface UseInfiniteScrollOptions<T> {
  /** Base URL — page/take params are appended automatically */
  url: string;
  /** Items per page (default: 25) */
  pageSize?: number;
  /** Extra query params appended to every request */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Transform the raw response into { data, total } */
  select?: (raw: any) => { data: T[]; total: number };
  /** Only fetch when true (default: true) */
  enabled?: boolean;
  /** Intersection observer root margin — how early to trigger (default: '200px') */
  rootMargin?: string;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  /** Structured error — pass to <ApiErrorState error={error} onRetry={reset} /> */
  error: ApiQueryError | null;
  /** Load the next page manually */
  loadMore: () => void;
  /** Reset and reload from page 1 */
  reset: () => void;
  /** Attach to a sentinel div at the bottom of the list for auto-load */
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T = any>(
  options: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollResult<T> {
  const {
    url,
    pageSize = 25,
    params = {},
    select,
    enabled = true,
    rootMargin = '200px',
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiQueryError | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasMore = items.length < total;

  // Stable serialised params key — triggers reset when params change
  const paramsKey = JSON.stringify(params);

  const buildUrl = useCallback(
    (p: number) => {
      const qs = new URLSearchParams();
      qs.set('page', String(p));
      qs.set('take', String(pageSize));
      const parsedParams = JSON.parse(paramsKey) as typeof params;
      for (const [k, v] of Object.entries(parsedParams)) {
        if (v !== undefined && v !== null && v !== '') {
          qs.set(k, String(v));
        }
      }
      return `${url}?${qs.toString()}`;
    },
    [url, pageSize, paramsKey],
  );

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      if (!enabled) return;
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (p === 1) { setLoading(true); if (!append) setItems([]); }
      else setLoadingMore(true);
      setError(null);

      try {
        const res = await api.get(buildUrl(p), {
          signal: abortRef.current.signal,
        });
        const raw = res.data;
        let data: T[];
        let tot: number;

        if (select) {
          const parsed = select(raw);
          data = parsed.data;
          tot = parsed.total;
        } else {
          // Standard OVDS paginated response: { data: { data, pagination } }
          const payload = raw?.data ?? raw;
          data = payload?.data ?? payload ?? [];
          tot = payload?.pagination?.total ?? data.length;
        }

        setTotal(tot);
        setItems(prev => append ? [...prev, ...data] : data);
        setPage(p);
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        setError(buildApiQueryError(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [enabled, buildUrl, select],
  );

  // Reset and reload when params/url change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    setError(null);
    fetchPage(1, false);
    return () => abortRef.current?.abort();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchPage(page + 1, true);
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    setError(null);
    fetchPage(1, false);
  }, [fetchPage]);

  // IntersectionObserver — auto-load when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore, rootMargin]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    total,
    error,
    loadMore,
    reset,
    sentinelRef,
  };
}

