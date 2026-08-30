import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { ApiResponse } from '@ovds/ui';
import i18n from '../i18n';
import type { NavigateFunction } from 'react-router-dom';
import { attachRequestSignature } from '../utils/requestSigning';
import { isHttpOnlyAuth, getCsrfToken } from '../utils/authMode';
import { BEARER_PREFIX } from '../utils/constants';

/** Wired by NavigateInjector in app.tsx after BrowserRouter initialises. */
export const navigateRef: { current: NavigateFunction | null } = { current: null };

export const API_BASE = import.meta.env.VITE_API_URL || '/api';
const USE_HTTPONLY = isHttpOnlyAuth();
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000', 10);
const RETRY_JITTER_MS = parseInt(import.meta.env.VITE_RETRY_JITTER_MS || '500', 10);
const RETRY_BASE_DELAY_MS = parseInt(import.meta.env.VITE_RETRY_BASE_DELAY_MS || '250', 10);
const TOAST_DURATION_MS = parseInt(import.meta.env.VITE_TOAST_DURATION_MS || '5000', 10);
const RETRY_AFTER_FALLBACK_S = parseInt(import.meta.env.VITE_RETRY_AFTER_FALLBACK_S || '5', 10);
const MAX_RETRY_COUNT = parseInt(import.meta.env.VITE_MAX_RETRY_COUNT || '2', 10);
const RATE_LIMIT_TOAST_THROTTLE_MS = parseInt(import.meta.env.VITE_RATE_LIMIT_TOAST_THROTTLE_MS || '15000', 10);
const JITTER_CAP_MS = parseInt(import.meta.env.VITE_JITTER_CAP_MS || '1000', 10);
const NETWORK_RETRY_BASE_MS = parseInt(import.meta.env.VITE_NETWORK_RETRY_BASE_MS || '500', 10);
const NETWORK_RETRY_JITTER_MS = parseInt(import.meta.env.VITE_NETWORK_RETRY_JITTER_MS || '250', 10);

const api: any = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  withCredentials: USE_HTTPONLY,
  headers: { 'Content-Type': 'application/json' },
});

// -- Status code → user-friendly message map ---------------------------------
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request — please check your input.',
  401: 'Your session has expired. Please log in again.',
  402: 'This feature requires an active subscription.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  405: 'This action is not supported here.',
  408: 'The request timed out. Please try again.',
  409: 'A conflict occurred — this record may already exist.',
  410: 'This resource is no longer available.',
  413: 'The file or payload is too large.',
  415: 'Unsupported file type.',
  422: 'The data provided could not be processed.',
  429: 'Too many requests — please wait a moment and try again.',
  500: 'A server error occurred. Our team has been notified.',
  501: 'This feature is not yet implemented.',
  502: 'The server received an invalid response from an upstream service.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
};

// -- Jitter helper — prevents thundering herd on concurrent retries -----------
const withJitter = (baseMs: number, jitterMs = RETRY_JITTER_MS): number =>
  baseMs + Math.random() * jitterMs;

// -- Idempotency key generator — uses crypto.randomUUID when available --------
export const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Secure fallback via getRandomValues — available in all modern browsers
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  // Last-resort: log a warning and throw — Math.random() is NOT cryptographically
  // secure and must never be used for idempotency keys sent to the server.
  // If this branch is reached in a real browser/Node environment, it indicates
  // the Web Crypto API is unavailable and requests should not be retried blindly.
  console.error(
    '[api] Web Crypto API unavailable — cannot generate a secure idempotency key.',
  );
  // Return a timestamp-based placeholder so the request still goes through,
  // but tag it so server-side deduplication knows it is not trustworthy.
  return `insecure-${Date.now()}-${typeof performance !== 'undefined' ? performance.now().toString(36) : '0'}`;
};

// -- Rate limit state — track remaining quota ---------------------------------
let _rateLimitRemaining = Infinity;

// -- Token refresh queue — prevents concurrent 401s from each triggering a refresh
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

function subscribeToRefresh(cb: (token: string | null) => void) {
  _refreshQueue.push(cb);
}
function resolveRefreshQueue(token: string | null) {
  _refreshQueue.forEach(cb => cb(token));
  _refreshQueue = [];
}
let _rateLimitReset = 0;

export const getRateLimitState = () => ({
  remaining: _rateLimitRemaining,
  resetAt: _rateLimitReset,
  isThrottled: _rateLimitRemaining === 0 && Date.now() < _rateLimitReset * 1000,
});

// -- Request interceptor — attach JWT + idempotency key + HMAC signing -------
api.interceptors.request.use(
  async (config: any) => {
    if (USE_HTTPONLY) {
      config.withCredentials = true;
      const csrf = getCsrfToken();
      if (csrf) config.headers!['x-xsrf-token'] = csrf;
    } else {
      const token =
        localStorage.getItem('ovds_token') ||
        localStorage.getItem('auth0_token') ||
        sessionStorage.getItem('auth0_token');
      if (token) {
        config.headers!.Authorization = `${BEARER_PREFIX}${token}`;
      }
    }

    // -- Locale propagation (frontend → backend) ------------------------
    // Backend can use this to localize error payloads when emitting
    // translation keys.
    try {
      const lng = localStorage.getItem('i18nextLng')
        ?? (typeof navigator !== 'undefined' ? navigator.language : null);
      if (lng) {
        // Prefer explicit i18next language code (en/am/ti)
        const code = String(lng).split('-')[0];
        config.headers!['x-locale'] = code;
        config.headers!['Accept-Language'] = lng;
      }
    } catch {
      // ignore locale propagation errors
    }

    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    if (selectedCompanyId) {
      // Don't send x-company-id on:
      // 1. The companies list bootstrap call (used to discover available companies)
      // 2. Auth routes (they don't need company context and the guard skips them)
      const reqUrl = config.url ?? '';
      const isCompaniesBootstrap = reqUrl.includes('/ovds/companies') && !reqUrl.includes('/ovds/companies/');
      const isAuthRoute = reqUrl.startsWith('/auth/') || reqUrl === '/auth';
      if (!isCompaniesBootstrap && !isAuthRoute) {
        config.headers!['x-company-id'] = selectedCompanyId;
      }
    }

    // Auto-attach idempotency key to mutating requests (POST/PUT/PATCH)
    // unless the caller already provided one
    const method = (config.method ?? '').toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method) && !config.headers!['Idempotency-Key']) {
      config.headers!['Idempotency-Key'] = generateIdempotencyKey();
    }

    // HMAC signing for sensitive financial endpoints (@SignedRequest)
    try {
      await attachRequestSignature(
        method,
        config.url ?? '',
        config.data,
        config.headers!,
      );
    } catch {
      // Signing is optional when VITE_REQUEST_SIGNING_SECRET is unset (dev)
    }

    return config;
  },
  (error: any) => Promise.reject(error),
);

// -- Axios config extension — custom fields used by the interceptor -----------
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** Set to true to suppress error toasts and redirects for background polls */
    _background?: boolean;
    /** Retry flag — set by the interceptor to prevent infinite retry loops */
    _retry?: boolean;
    /** Retry count for 5xx exponential backoff */
    _retryCount?: number;
  }
}

// -- Response interceptor — unified error handling ---------------------------
api.interceptors.response.use(
  (response: any) => {
    // Track rate-limit headers from successful responses
    const remaining = response.headers?.['x-ratelimit-remaining'];
    const reset = response.headers?.['x-ratelimit-reset'];
    if (remaining !== undefined) _rateLimitRemaining = parseInt(remaining, 10);
    if (reset !== undefined) _rateLimitReset = parseInt(reset, 10);
    return response;
  },
  async (error: any) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status: number | undefined = error.response?.status;
    const url: string = originalRequest?.url ?? '';
    const isBackground =
      originalRequest?._background ||
      originalRequest?.headers?.['x-background'];
    const isAuthRoute = url.includes('/auth/') || url.includes('/health');

    // -- 401 Unauthorized — queued token refresh (prevents concurrent refresh storms)
    // If _retry is already set, the refresh already failed — reject silently, no toast
    if (status === 401 && originalRequest._retry) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {      originalRequest._retry = true;

      // If a refresh is already in flight, queue this request to retry after it resolves
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((token) => {
            if (!token) return reject(error);
            originalRequest.headers!['Authorization'] = `${BEARER_PREFIX}${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      _isRefreshing = true;
      try {
        const isAuth0User = (() => {
          try {
            const raw = localStorage.getItem('ovds_user');
            return raw ? JSON.parse(raw)?.isAuth0User === true : false;
          } catch {
            return false;
          }
        })();

        let newToken: string | null = null;

        if (isAuth0User) {
          newToken = await Promise.race([
            import('./auth0TokenRefresh').then((m) => m.refreshAuth0Token()),
            new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Token refresh timeout')), 5_000),
            ),
          ]);
          if (newToken) {
            localStorage.setItem('ovds_token', newToken);
            window.dispatchEvent(new CustomEvent('ovds:token-refreshed'));
          }
        } else if (USE_HTTPONLY) {
          const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              ...(getCsrfToken() ? { 'x-xsrf-token': getCsrfToken()! } : {}),
            },
          });
          if (res.ok) {
            const data = (await res.json()) as { access_token?: string; csrf_token?: string; token_delivery?: string };
            if (data.csrf_token) {
              const { setCsrfToken } = await import('../utils/authMode');
              setCsrfToken(data.csrf_token);
            }
            newToken = data.access_token ?? (data.token_delivery === 'cookie' ? '__cookie__' : null);
            if (newToken) window.dispatchEvent(new CustomEvent('ovds:token-refreshed'));
          }
        } else {
          const currentToken = localStorage.getItem('ovds_token');
          if (currentToken) {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { Authorization: `${BEARER_PREFIX}${currentToken}` },
            });
            if (res.ok) {
              const data = (await res.json()) as { access_token?: string };
              newToken = data.access_token ?? null;
              if (newToken) {
                localStorage.setItem('ovds_token', newToken);
                window.dispatchEvent(new CustomEvent('ovds:token-refreshed'));
              }
            }
          }
        }

        if (!newToken) throw new Error('No token returned');
        resolveRefreshQueue(newToken);
        _isRefreshing = false;
        if (newToken !== '__cookie__') {
          originalRequest.headers!['Authorization'] = `${BEARER_PREFIX}${newToken}`;
        }
        return api(originalRequest);
      } catch {
        // Refresh failed — drain queue with null, clear session, redirect
        resolveRefreshQueue(null);
        _isRefreshing = false;
        // Dispatch synchronously — stops all polling hooks before clearSession runs
        window.dispatchEvent(new CustomEvent('ovds:session-expired'));
        import('../utils/storage').then(({ clearSession }) => clearSession());
        if (!window.location.pathname.includes('/login')) {
          if (navigateRef.current) {
            navigateRef.current('/login', { replace: true });
          } else {
            console.warn('[api] navigateRef not set — falling back to hard redirect');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    }

    // -- 429 Too Many Requests — retry after Retry-After header + jitter --
    if (status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      _rateLimitRemaining = 0;
      const retryAfter = parseInt(
        error.response?.headers?.['retry-after'] ?? String(RETRY_AFTER_FALLBACK_S),
        10,
      );
      const delay = withJitter(retryAfter * 1000, JITTER_CAP_MS);
      if (!isBackground) {
        toast.error(`Rate limit reached. Retrying in ${retryAfter}s…`, {
          id: 'rate-limit',
        });
      }
      await new Promise((r) => setTimeout(r, delay));
      return api(originalRequest);
    }

    // -- 502 / 503 / 504 — retry up to 2 times with short exponential backoff + jitter
    const isRetryable = status === 503 || status === 502 || status === 504;
    const retryCount = originalRequest._retryCount ?? 0;
    if (isRetryable && !isAuthRoute && retryCount < MAX_RETRY_COUNT) {
      originalRequest._retryCount = retryCount + 1;
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const baseDelay = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
      const delay = withJitter(baseDelay, RETRY_JITTER_MS);
      await new Promise((r) => setTimeout(r, delay));
      return api(originalRequest);
    }

    // -- After retries exhausted on 5xx — redirect to service-unavailable -
    if (isRetryable && retryCount >= MAX_RETRY_COUNT && !isBackground && !isAuthRoute) {
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const params = new URLSearchParams({
        status: String(status),
        ...(retryAfterHeader ? { retryAfter: retryAfterHeader } : {}),
      });
      const currentPath = window.location.pathname;
      const errorPages = ['/service-unavailable', '/forbidden', '/login'];
      if (!errorPages.some((p) => currentPath.startsWith(p))) {
        if (navigateRef.current) {
          navigateRef.current(`/service-unavailable?${params.toString()}`, { replace: true });
        } else {
          window.location.href = `/service-unavailable?${params.toString()}`;
        }
      }
      return Promise.reject(error);
    }

    // -- 402 Payment Required — redirect to payment page ------------------
    if (status === 402 && !isBackground) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/payment-required') && !currentPath.startsWith('/plans')) {
        // Extract the feature key from the error response if available
        const rawData = error.response?.data;
        const responseData: Record<string, unknown> =
          rawData !== null && typeof rawData === 'object' && !Array.isArray(rawData)
            ? (rawData as Record<string, unknown>)
            : {};
        const featureKey =
          typeof responseData['featureKey'] === 'string'
            ? responseData['featureKey']
            : typeof responseData['message'] === 'string'
              ? (responseData['message'] as string).match(/Missing: (.+)/)?.[1]
              : undefined;
        const params = featureKey ? `?feature=${encodeURIComponent(featureKey)}` : '';
        window.location.href = `/payment-required${params}`;
      }
      return Promise.reject(error);
    }

    // -- 405 Method Not Allowed — show allowed methods if available --------
    if (status === 405 && !isBackground) {
      const allowHeader = error.response?.headers?.['allow'];
      const msg = allowHeader
        ? `Method not allowed. Allowed: ${allowHeader}`
        : STATUS_MESSAGES[405];
      toast.error(msg, { id: 'method-not-allowed' });
      return Promise.reject(error);
    }

    // -- Network error (no response) — show offline message ---------------
    if (!error.response) {
      if (!navigator.onLine) return Promise.reject(error);
      // Never retry auth routes (login, OTP, signup) on network error —
      // retrying a login POST would submit credentials again unintentionally
      // and burn into the account lockout counter.
      if (isAuthRoute) return Promise.reject(error);
      // Retry once silently before showing the toast — avoids false positives
      // during backend restarts or brief network blips
      const retryCount = originalRequest._retryCount ?? 0;
      if (retryCount < 1) {
        originalRequest._retryCount = (retryCount) + 1;
        await new Promise((r) => setTimeout(r, withJitter(NETWORK_RETRY_BASE_MS, NETWORK_RETRY_JITTER_MS)));
        return api(originalRequest);
      }

      if (!isBackground) {
        const now = Date.now();
        const lastShown = (window as any).__lastNetworkErrorToast ?? 0;
        if (now - lastShown > RATE_LIMIT_TOAST_THROTTLE_MS) {
          (window as any).__lastNetworkErrorToast = now;
          toast.error('No connection to server — check your network.', {
            id: 'network-error',
            duration: 6000,
          });
        }
      }
      return Promise.reject(error);
    }

    // -- Suppress toasts for background polls and auth routes -------------
    // Auth routes (login, OTP, social) handle their own error display inline.
    // Suppressing here prevents a double-toast when the backend returns 4xx/5xx.
    if (isBackground || isAuthRoute) {
      return Promise.reject(error);
    }

    // -- Show user-friendly toast for all other errors ---------------------
    if (status !== 401) {
      const _rawServerData = error.response?.data;
      const serverData: Record<string, unknown> =
        _rawServerData !== null && typeof _rawServerData === 'object' && !Array.isArray(_rawServerData)
          ? (_rawServerData as Record<string, unknown>)
          : {};

      // New i18n error format (preferred): { messageKey, vars }
      // Backward compatible with the legacy shape: { message }
      const messageKey = serverData.messageKey as string | undefined;
      const vars = serverData.vars as Record<string, any> | undefined;

      let displayMessage: string;
      if (messageKey) {
        // Backend preferred shape:
        //   { messageKey: 'common.errors.some_key', vars: {...}, message?: 'fallback/english' }
        // If translation key is missing, i18next returns the key by default,
        // so `fallback` provides a human readable message.
        const fallback = serverData.message as string | undefined;
        const translated = String(i18n.t(messageKey, vars ?? {}));
        displayMessage = translated === messageKey ? fallback ?? messageKey : translated;
      } else {
        const serverMessage = serverData['message'];
        const fallback =
          STATUS_MESSAGES[status ?? 0] ??
          error.message ??
          'An unexpected error occurred.';
        displayMessage = Array.isArray(serverMessage)
          ? (serverMessage as unknown[])[0] as string
          : typeof serverMessage === 'string'
            ? serverMessage
            : fallback;
      }


      const toastId = `api-error-${status ?? 'network'}`;
      toast.error(displayMessage, { id: toastId, duration: TOAST_DURATION_MS });
    }

    return Promise.reject(error);
  },
);

// -- Response helpers (consistent data extraction) ---------------------------
export const extractData = <T>(response: { data: ApiResponse<T> | T }): T => {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as ApiResponse<T>).data as T;
  }
  return body as T;
};

export const apiGet = <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
  api.get(url, config).then(extractData<T>);

export const apiPost = <T>(url: string, data?: unknown, config?: Parameters<typeof api.get>[1]) =>
  api.post(url, data, config).then(extractData<T>);

export const apiPut = <T>(url: string, data?: unknown, config?: Parameters<typeof api.get>[1]) =>
  api.put(url, data, config).then(extractData<T>);

export const apiPatch = <T>(url: string, data?: unknown, config?: Parameters<typeof api.get>[1]) =>
  api.patch(url, data, config).then(extractData<T>);

export const apiDelete = <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
  api.delete(url, config).then(extractData<T>);

// -- Paginated GET helper ------------------------------------------------------
import type { PaginatedResult } from '@ovds/ui';

export interface PaginatedParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

/**
 * Type-safe paginated GET — handles the OVDS nested paginated response shape.
 *
 * @example
 * const result = await apiGetPaginated<Invoice>('/ovds/invoices', {
 *   page: 1, limit: 20, search: 'INV-001', status: 'PAID',
 * });
 * // result: PaginatedResult<Invoice>
 */
export async function apiGetPaginated<T>(
  url: string,
  params?: PaginatedParams,
  config?: Parameters<typeof api.get>[1],
): Promise<PaginatedResult<T>> {
  const res = await api.get(url, { ...(config as object), params });
  const body = res.data;

  // Shape: { success, data: { data: T[], pagination: { total, page, take, pages } } }
  const inner = body?.data ?? body;
  if (Array.isArray(inner?.data) && inner?.pagination) {
    return {
      data:       inner.data as T[],
      total:      inner.pagination.total      ?? 0,
      page:       inner.pagination.page       ?? 1,
      limit:      inner.pagination.take       ?? inner.pagination.limit ?? 20,
      totalPages: inner.pagination.pages      ?? inner.pagination.totalPages ?? 1,
    };
  }

  // Flat array (non-paginated endpoint — wrap gracefully)
  if (Array.isArray(inner)) {
    return { data: inner as T[], total: inner.length, page: 1, limit: inner.length, totalPages: 1 };
  }

  return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
}

// -- Background (silent) fetch — suppresses toasts for polling ----------------
export const apiGetBackground = <T>(url: string, params?: Record<string, unknown>) =>
  api.get(url, { params, headers: { 'x-background': 'true' } }).then(extractData<T>);

// -- Offline Resilience (MoR Regulation No. 570/2025) -------------------------

export async function getOfflineCapabilities() {
  const res = await api.get('/offline/capabilities', { headers: { 'x-background': '1' } } as any);
  return res.data?.data ?? res.data;
}

export async function getOfflineSLAReport() {
  const res = await api.get('/offline/sla-report', { headers: { 'x-background': '1' } } as any);
  return res.data?.data ?? res.data;
}

export async function getRegulatedSectors() {
  const res = await api.get('/sync/regulated-sectors');
  return res.data?.data ?? res.data;
}

export default api;

