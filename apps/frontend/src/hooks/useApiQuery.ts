import { useState, useEffect, useCallback, useRef } from 'react';

import api from '../services/api';

// -- In-memory cache: url → { data, ts } -------------------------------------
// Bounded to MAX_CACHE_SIZE entries. When the limit is reached, the oldest
// entry (first insertion — Maps preserve insertion order) is evicted before
// writing the new one. This prevents unbounded memory growth in long-lived
// sessions with many unique query URLs.
const MAX_CACHE_SIZE = 500;
const cache = new Map<string, { data: unknown; ts: number }>();

function setCacheEntry(url: string, value: { data: unknown; ts: number }): void {
  if (cache.has(url)) {
    // Update in-place: delete + re-set to refresh insertion order
    cache.delete(url);
  } else if (cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry (Maps preserve insertion order)
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(url, value);
}

/**
 * Unwrap the NestJS TransformInterceptor envelope.
 *
 * Every backend response is wrapped as:
 *   { statusCode: number, message: string, data: T, success: boolean }
 *
 * This helper returns `wrapper.data` when the shape matches, otherwise
 * returns the value unchanged so non-wrapped responses still work.
 *
 * Callers that already do `res?.data ?? res` continue to work because
 * after unwrapping `data` IS the payload — the extra `?.data` just
 * returns `undefined` and falls back to the payload itself.
 */
function unwrapNestJs(raw: unknown): unknown {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'success' in (raw as object) &&
    'data' in (raw as object) &&
    ('statusCode' in (raw as object) || 'message' in (raw as object))
  ) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}
const DEFAULT_STALE_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

const backoffMs = (attempt: number) => 1000 * Math.pow(2, attempt - 1);

// Deduplication: track in-flight requests
const inFlight = new Map<string, Promise<any>>();

// -- Types ---------------------------------------------------------------------

export interface ApiQueryError {
  message: string;
  statusCode?: number;
  /** Field-level validation errors from NestJS ValidationPipe */
  fields?: Record<string, string>;
  /** X-Request-ID from the server — useful for support tickets */
  requestId?: string;
  /** true when the error is a network failure (no response) */
  isNetworkError: boolean;
  /** true when the error is a 4xx client error */
  isClientError: boolean;
  /** true when the error is a 5xx server error */
  isServerError: boolean;
}

interface UseApiQueryOptions<T> {
  select?: (data: any) => T;
  enabled?: boolean;
  deps?: unknown[];
  staleTime?: number;
  retries?: number;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiQueryError) => void;
  /** Refetch on window focus (default: false) */
  refetchOnFocus?: boolean;
  /** Refetch on network reconnect (default: true) */
  refetchOnReconnect?: boolean;
  /** Poll interval in ms — 0 disables polling (default: 0) */
  pollInterval?: number;
  /**
   * Suppress the global axios error toast for this query.
   * Use when the component renders its own error UI (e.g. ApiErrorState).
   * Default: false
   */
  suppressToast?: boolean;
  /**
   * Keep showing previous data while a new fetch is in progress.
   * Prevents the flash of empty/loading state on filter/page changes.
   * Default: false
   */
  keepPreviousData?: boolean;
}

export interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  /** Structured error with status code, fields, and type flags */
  error: ApiQueryError | null;
  /** Raw error message string for convenience */
  errorMessage: string | null;
  refetch: () => void;
  mutate: (updater: (prev: T | null) => T) => void;
  /** true when a background refetch is in progress (data is still shown) */
  isRefetching: boolean;
}

// -- Error builder -------------------------------------------------------------

export function buildApiQueryError(err: any): ApiQueryError {
  const statusCode: number | undefined = err?.response?.status;
  const data = err?.response?.data;

  // Extract message — prefer array[0] for ValidationPipe errors
  const rawMessage = data?.message ?? err?.message ?? 'Request failed';
  const message = Array.isArray(rawMessage) ? rawMessage[0] : String(rawMessage);

  // Extract field-level validation errors
  let fields: Record<string, string> | undefined;
  if (Array.isArray(data?.message)) {
    fields = {};
    for (const msg of data.message as string[]) {
      const spaceIdx = msg.indexOf(' ');
      if (spaceIdx > 0) {
        const field = msg.substring(0, spaceIdx);
        if (/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(field)) {
          fields[field] = msg.substring(spaceIdx + 1);
        }
      }
    }
    if (Object.keys(fields).length === 0) fields = undefined;
  }
  // Also check structured fields map from ValidationExceptionFilter
  if (data?.fields && typeof data.fields === 'object') {
    fields = { ...fields, ...data.fields };
  }

  const requestId: string | undefined =
    err?.response?.headers?.['x-request-id'] ?? data?.requestId;

  return {
    message,
    statusCode,
    fields,
    requestId,
    isNetworkError: !statusCode,
    isClientError: !!statusCode && statusCode >= 400 && statusCode < 500,
    isServerError: !!statusCode && statusCode >= 500,
  };
}

// -- Main hook -----------------------------------------------------------------

/**
 * Lightweight data-fetching hook with:
 * - Stale-while-revalidate caching
 * - Request deduplication
 * - Exponential backoff retries (5xx + network errors only)
 * - Structured error objects with status code, fields, requestId
 * - Background refetch indicator
 * - Window focus refetch
 * - Network reconnect refetch
 * - Polling support
 * - Abort on unmount / re-fetch
 * - suppressToast option for inline error UI
 */
export function useApiQuery<T = any>(
  url: string,
  options: UseApiQueryOptions<T> = {},
): UseApiQueryResult<T> {
  const {
    select,
    enabled = true,
    deps = [],
    staleTime = DEFAULT_STALE_MS,
    retries = MAX_RETRIES,
    timeout = DEFAULT_TIMEOUT_MS,
    onSuccess,
    onError,
    refetchOnFocus = false,
    refetchOnReconnect = true,
    pollInterval = 0,
    suppressToast = false,
    keepPreviousData = false,
  } = options;

  const [data, setData] = useState<T | null>(() => {
    const hit = cache.get(url);
    if (hit && staleTime > 0 && Date.now() - hit.ts < staleTime) {
      return select ? select(hit.data) : (hit.data as T);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    const hit = cache.get(url);
    return !(hit && staleTime > 0 && Date.now() - hit.ts < staleTime);
  });
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<ApiQueryError | null>(null);
  const mounted = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  // Track whether data has been loaded without adding `data` to fetchData deps,
  // which would cause an infinite re-fetch loop.
  const hasDataRef = useRef<boolean>(data !== null);
  const fetchWithRetry = useCallback(
    async (attempt = 0, signal?: AbortSignal): Promise<any> => {
      try {
        // Deduplication: if an identical request is already in-flight, share it.
        // Do NOT pass signal to the shared promise — one caller aborting must
        // not cancel a request that other callers are also waiting on.
        const existing = inFlight.get(url);
        if (existing) return existing;
        const config: any = {};
        if (suppressToast) config.headers = { ...(config.headers ?? {}), 'x-background': '1' };
        // signal is intentionally NOT passed to the shared request
        const req = api.get(url, config);
        inFlight.set(url, req);
        try {
          return await req;
        } finally {
          inFlight.delete(url);
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') throw err;
        const status = err.response?.status as number | undefined;
        // Only retry on network errors or 5xx — never retry 4xx
        const isRetryable = !status || status >= 500;
        if (isRetryable && attempt < retries) {
          await new Promise((r) => setTimeout(r, backoffMs(attempt + 1)));
          return fetchWithRetry(attempt + 1, signal);
        }
        throw err;
      }
    },
    [url, retries, suppressToast],
  );

  const fetchData = useCallback(
    async (force = false) => {
      if (!enabled) return;

      abortRef.current?.abort();
      const controller = timeout > 0 ? new AbortController() : null;
      abortRef.current = controller;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      if (controller && timeout > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeout);
      }

      // Serve from cache if still fresh (unless forced)
      if (!force && staleTime > 0) {
        const hit = cache.get(url);
        if (hit && Date.now() - hit.ts < staleTime) {
          if (mounted.current) {
            const payload = unwrapNestJs(hit.data);
            setData(select ? select(payload) : (payload as T));
            setLoading(false);
            setIsRefetching(false);
          }
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
      }

      // Show loading on first fetch; isRefetching on subsequent.
      // When keepPreviousData is true, always use isRefetching so existing
      // data stays visible during filter/page changes instead of flashing empty.
      if (mounted.current) {
        if (hasDataRef.current || keepPreviousData) {
          setIsRefetching(true);
          setError(null); // always clear previous error on new fetch
        } else {
          setLoading(true);
          setError(null);
        }
      }

      try {
        const res = await fetchWithRetry(0, controller?.signal);
        if (timeoutId) clearTimeout(timeoutId);
        if (!mounted.current) return;
        setCacheEntry(url, { data: res.data, ts: Date.now() });
        // Auto-unwrap NestJS TransformInterceptor envelope:
        // { statusCode, message, data: T, success } → T
        // Pages that already do `result?.data ?? result` still work because
        // after unwrapping, `result` IS the payload.
        const payload = unwrapNestJs(res.data);
        const resolved = select ? select(payload) : (payload as T);
        hasDataRef.current = true;
        setData(resolved);
        setError(null);
        onSuccess?.(resolved);
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!mounted.current) return;
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        const structured = buildApiQueryError(err);
        setError(structured);
        onError?.(structured);
      } finally {
        if (mounted.current) {
          setLoading(false);
          setIsRefetching(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, enabled, staleTime, timeout, keepPreviousData, fetchWithRetry, ...deps],
  );

  // Initial fetch + re-fetch on dep change
  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, [fetchData]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnFocus) return;
    const handler = () => { if (document.visibilityState === 'visible') fetchData(true); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [refetchOnFocus, fetchData]);

  // Network reconnect refetch
  useEffect(() => {
    if (!refetchOnReconnect) return;
    const handler = () => fetchData(true);
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [refetchOnReconnect, fetchData]);

  // Polling
  useEffect(() => {
    if (!pollInterval || pollInterval <= 0 || !enabled) return;
    const id = setInterval(() => fetchData(true), pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, enabled, fetchData]);

  const mutate = useCallback((updater: (prev: T | null) => T) => {
    setData((prev) => updater(prev));
  }, []);

  return {
    data,
    loading,
    error,
    errorMessage: error?.message ?? null,
    refetch: () => fetchData(true),
    mutate,
    isRefetching,
  };
}

// -- Cache helpers -------------------------------------------------------------

export function invalidateQuery(url: string) {
  cache.delete(url);
}

export function invalidateQueryPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearQueryCache() {
  cache.clear();
}

// Clear the entire query cache when the session expires so stale data
// doesn't persist across login/logout cycles.
if (typeof window !== 'undefined') {
  window.addEventListener('ovds:session-expired', () => {
    cache.clear();
    inFlight.clear();
  });
}

/**
 * Read the current cached value for a URL without triggering a fetch.
 * Useful for optimistic updates in event handlers.
 */
export function getCacheData<T = unknown>(url: string): T | null {
  const hit = cache.get(url);
  return hit ? (hit.data as T) : null;
}

/**
 * Write a value directly into the cache.
 * Useful for optimistic pre-population before a mutation completes.
 *
 * @example
 *   // Optimistically add a new invoice to the list
 *   setCacheData('/invoices?companyId=abc', (prev: Invoice[]) => [newInvoice, ...(prev ?? [])]);
 */
export function setCacheData<T = unknown>(
  url: string,
  updater: T | ((prev: T | null) => T),
): void {
  const current = getCacheData<T>(url);
  const next =
    typeof updater === 'function'
      ? (updater as (prev: T | null) => T)(current)
      : updater;
  setCacheEntry(url, { data: next, ts: Date.now() });
}


