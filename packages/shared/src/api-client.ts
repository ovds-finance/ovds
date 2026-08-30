/**
 * @ovds/shared — Shared API client utilities
 *
 * Single source of truth for HTTP client configuration.
 * Eliminates duplication across 50+ feature packages.
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

export interface ApiClientConfig {
  baseURL?: string;
  tokenGetter?: () => string | null;
  companyIdGetter?: () => string | null;
  localeGetter?: () => string | null;
}

const DEFAULT_BASE = '/api';

function getBase(config?: ApiClientConfig): string {
  if (typeof window !== 'undefined' && (window as any)._VITE_API_URL) {
    return (window as any)._VITE_API_URL;
  }
  return config?.baseURL ?? DEFAULT_BASE;
}

function getHeaders(config?: ApiClientConfig): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token =
    config?.tokenGetter?.() ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('ovds_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('auth0_token') : null) ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('auth0_token') : null);

  if (token) {
    h['Authorization'] = `Bearer ${token}`;
  }

  const companyId =
    config?.companyIdGetter?.() ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('selected_company_id') : null);

  if (companyId) {
    h['x-company-id'] = companyId;
  }

  const locale =
    config?.localeGetter?.() ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('ovds_locale') : null) ||
    (typeof navigator !== 'undefined' ? navigator.language : null);

  if (locale) {
    h['x-locale'] = locale;
  }

  return h;
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
    config?: ApiClientConfig;
    parseJson?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, config, parseJson = true } = options;

  const base = getBase(config);
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const response = await fetch(url, {
    method,
    headers: getHeaders(config),
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
      return localStorage.getItem('selectedCompanyId');
    },
    getLocale = () => {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem('ovds_locale') || (typeof navigator !== 'undefined' ? navigator.language : null);
    },
    onError,
  } = options;

  const config: ApiClientConfig = {
    baseURL: baseUrl,
    tokenGetter: getToken,
    companyIdGetter: getCompanyId,
    localeGetter: getLocale,
  };

  return {
    get: async <T>(url: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> => {
      const fullUrl = params ? `${url}${qs(params)}` : url;
      return apiRequest<T>(fullUrl, { method: 'GET', config });
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
      return apiRequest<T>(url, { method: 'POST', body, config });
    },
    patch: async <T>(url: string, body: unknown): Promise<T> => {
      return apiRequest<T>(url, { method: 'PATCH', body, config });
    },
    del: async <T>(url: string): Promise<T> => {
      return apiRequest<T>(url, { method: 'DELETE', config });
    },
    qs,
  };
}

export const api = {
  get: <T>(path: string, config?: ApiClientConfig) => apiRequest<T>(path, { method: 'GET', config }),
  post: <T>(path: string, body: unknown, config?: ApiClientConfig) =>
    apiRequest<T>(path, { method: 'POST', body, config }),
  put: <T>(path: string, body: unknown, config?: ApiClientConfig) =>
    apiRequest<T>(path, { method: 'PUT', body, config }),
  patch: <T>(path: string, body: unknown, config?: ApiClientConfig) =>
    apiRequest<T>(path, { method: 'PATCH', body, config }),
  del: <T>(path: string, config?: ApiClientConfig) => apiRequest<T>(path, { method: 'DELETE', config }),
};
