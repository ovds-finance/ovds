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
export declare function qs(params: Record<string, string | number | boolean | null | undefined>): string;
export declare function apiRequest<T>(path: string, options?: {
    method?: string;
    body?: unknown;
    config?: ApiClientConfig;
    parseJson?: boolean;
}): Promise<T>;
export declare function createApiClient(options?: ApiClientOptions): ApiClient;
export declare const api: {
    get: <T>(path: string, config?: ApiClientConfig) => Promise<T>;
    post: <T>(path: string, body: unknown, config?: ApiClientConfig) => Promise<T>;
    put: <T>(path: string, body: unknown, config?: ApiClientConfig) => Promise<T>;
    patch: <T>(path: string, body: unknown, config?: ApiClientConfig) => Promise<T>;
    del: <T>(path: string, config?: ApiClientConfig) => Promise<T>;
};
//# sourceMappingURL=api-client.d.ts.map