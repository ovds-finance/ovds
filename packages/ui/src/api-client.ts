/**
 * @ovds/ui — Shared API client for feature packages
 *
 * Eliminates the 50+ copy-pasted HTTP clients across feature packages.
 *
 * Usage:
 *   import { api } from '@ovds/ui';
 *   const data = await api.get('/endpoint');
 *   const result = await api.post('/endpoint', body);
 */

export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | null;
  getCompanyId?: () => string | null;
  getLocale?: () => string | null;
  onError?: (error: Error, response: Response) => void;
}

export interface ApiClient {
  get: <T>(url: string, params?: Record<string, string | number | boolean | null | undefined>) => Promise<T>;
  post: <T>(url: string, body?: unknown) => Promise<T>;
  patch: <T>(url: string, body: unknown) => Promise<T>;
  del: <T>(url: string) => Promise<T>;
  qs: (params: Record<string, string | number | boolean | null | undefined>) => string;
}

export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    config?: ApiClientOptions;
    parseJson?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, config, parseJson = true } = options;

  const base = config?.baseUrl ?? '/api';
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(config?.getToken?.() ? { Authorization: `Bearer ${config.getToken()}` } : {}),
      ...(config?.getCompanyId?.() ? { 'x-company-id': config.getCompanyId()! } : {}),
      ...(config?.getLocale?.() ? { 'x-locale': config.getLocale()! } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    const error = new Error(errorData.message || `HTTP ${response.status}`) as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (parseJson) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const {
    baseUrl = '/api',
    getToken = () => {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token');
    },
    getCompanyId = () => {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem('selected_company_id');
    },
    getLocale = () => {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem('ovds_locale') || (typeof navigator !== 'undefined' ? navigator.language : null);
    },
    onError,
  } = options;

  return {
    get: async <T>(url: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> => {
      const fullUrl = params ? `${url}${qs(params)}` : url;
      return apiRequest<T>(fullUrl, { method: 'GET', config: { baseUrl, getToken, getCompanyId, getLocale, onError } });
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      return apiRequest<T>(url, { method: 'POST', body, config: { baseUrl, getToken, getCompanyId, getLocale, onError } });
    },
    patch: async <T>(url: string, body: unknown): Promise<T> => {
      return apiRequest<T>(url, { method: 'PATCH', body, config: { baseUrl, getToken, getCompanyId, getLocale, onError } });
    },
    del: async <T>(url: string): Promise<T> => {
      return apiRequest<T>(url, { method: 'DELETE', config: { baseUrl, getToken, getCompanyId, getLocale, onError } });
    },
    qs,
  };
}

export const api = {
  get: <T>(path: string, config?: ApiClientOptions) => apiRequest<T>(path, { method: 'GET', config }),
  post: <T>(path: string, body: unknown, config?: ApiClientOptions) =>
    apiRequest<T>(path, { method: 'POST', body, config }),
  put: <T>(path: string, body: unknown, config?: ApiClientOptions) =>
    apiRequest<T>(path, { method: 'PUT', body, config }),
  patch: <T>(path: string, body: unknown, config?: ApiClientOptions) =>
    apiRequest<T>(path, { method: 'PATCH', body, config }),
  del: <T>(path: string, config?: ApiClientOptions) => apiRequest<T>(path, { method: 'DELETE', config }),
};
