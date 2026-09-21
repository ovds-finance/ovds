/**
 * useFetchQuery — thin adapter over useApiQuery for service-layer hooks.
 *
 * PURPOSE
 * ------- 
 * Across taxApi.ts, vatApi.ts, reportsApi.ts and similar service files, every
 * data-fetching hook was written as the same manual triad:
 *
 *   const [data, setData] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *   const fetch = useCallback(async () => { setLoading(true); try { ... } finally { setLoading(false); } }, [deps]);
 *   useEffect(() => { fetch(); }, [fetch]);
 *   return { data, loading, refetch: fetch };
 *
 * That pattern:
 *   - Has no caching (every mount hits the network)
 *   - Has no request deduplication (concurrent mounts fire duplicate requests)
 *   - Has no structured error objects
 *   - Has no 5xx/network retry
 *   - Uses `{ headers: { 'x-background': '1' } } as any` on every call
 *
 * useFetchQuery replaces the triad with a single line and delegates to
 * useApiQuery which already provides all of the above.
 *
 * USAGE
 * -----
 *   // Simple: URL is always the same
 *   export function useVatNotes() {
 *     return useFetchQuery<VatNote[]>('/vat/notes', { select: toArray });
 *   }
 *
 *   // With dependencies: URL changes based on parameters
 *   export function useTotFilings(period?: string) {
 *     const url = period ? `/tax/tot-filings?period=${period}` : '/tax/tot-filings';
 *     return useFetchQuery<TotFiling[]>(url, { deps: [period] });
 *   }
 *
 *   // Disabled until a required param is present
 *   export function useGrnStats(companyId?: string) {
 *     return useFetchQuery<GrnStats>(`/ovds/reports/grns/stats?companyId=${companyId ?? ''}`, {
 *       enabled: !!companyId,
 *       deps: [companyId],
 *     });
 *   }
 *
 * RETURN VALUE
 * -----------
 * Returns the full UseApiQueryResult shape so callers get structured errors,
 * isRefetching, mutate, etc. for free. The most common destructuring pattern
 * `{ data, loading, refetch }` is a strict superset of the old pattern.
 */

import { useApiQuery, type UseApiQueryResult } from './useApiQuery';

export interface UseFetchQueryOptions<T> {
  /** Transform the raw response payload before storing in state. */
  select?: (raw: any) => T;
  /** Only fetch when true (default: true). */
  enabled?: boolean;
  /**
   * Extra reactive dependencies that should trigger a refetch when changed.
   * Usually the URL already encodes all dependencies, but list them here
   * when the URL itself might not change while a dep value does (rare).
   */
  deps?: unknown[];
  /**
   * How long cached data stays fresh in ms (default: 30 s).
   * Set to 0 to always fetch on mount.
   */
  staleTime?: number;
  /**
   * Poll interval in ms. 0 = disabled (default).
   */
  pollInterval?: number;
  /**
   * Suppress the global error toast for this query and handle errors inline.
   * Default: false (suppressed — service hooks show their own error UI).
   */
  suppressToast?: boolean;
}

/**
 * Drop-in replacement for the manual useState/useCallback/useEffect fetch triad
 * used throughout the service API layer.
 *
 * All requests are automatically marked as background (`x-background: 1`) so
 * they don't trigger the global loading indicator. This matches the original
 * service hook behaviour.
 */
export function useFetchQuery<T = unknown>(
  url: string,
  options: UseFetchQueryOptions<T> = {},
): UseApiQueryResult<T> {
  return useApiQuery<T>(url, {
    select:        options.select,
    enabled:       options.enabled ?? true,
    deps:          options.deps ?? [],
    staleTime:     options.staleTime ?? 30_000,
    pollInterval:  options.pollInterval ?? 0,
    // Background flag: matches `{ headers: { 'x-background': '1' } }` used
    // in all the old manual hooks — suppresses the global loading overlay
    // and prevents error toasts from double-firing.
    suppressToast: options.suppressToast ?? true,
  });
}

export default useFetchQuery;
