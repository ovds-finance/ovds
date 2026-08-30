/**
 * App Store domain API client — @ovds/features/appstore
 *
 * Uses the shared apiGet / apiPost helpers from the app's Axios client so
 * that auth headers, 401 refresh, and error handling all work consistently.
 *
 * Import these in feature hooks and page components; never call fetch() directly.
 */

// ── Helpers (use app Axios client when running inside the app) ────────────────
// The feature lib must not import from apps/ so we use a lightweight fallback
// that reads the same localStorage tokens as the app's api.ts.

function getBase(): string {
  return (typeof window !== "undefined" && (window as any)._VITE_API_URL) || "/api";
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof localStorage === "undefined") return h;
  const token =
    localStorage.getItem("ovds_token") ||
    localStorage.getItem("auth0_token") ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("auth0_token")) ||
    "";
  if (token) h["Authorization"] = `Bearer ${token}`;
  const cid = localStorage.getItem("selectedCompanyId");
  if (cid) h["x-company-id"] = cid;
  return h;
}

async function req<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}

function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

const get  = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, "POST", body ?? {});
const del  = <T>(url: string) => req<T>(url, "DELETE");
const patch = <T>(url: string, body?: unknown) => req<T>(url, "PATCH", body ?? {});

// ── App catalogue ─────────────────────────────────────────────────────────────

export interface AppInstallation {
  installationId: string;
  appId: string;
  companyId: string;
  installedVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  status: "ACTIVE" | "DISABLED" | "PENDING_UPDATE";
  config: Record<string, unknown> | null;
  installedAt: string;
  app: {
    id: string; name: string; slug: string; version: string;
    description?: string; iconUrl?: string; isFree: boolean;
    price: number; rating: number; downloads: number;
    developer?: string; category: string;
  };
  /** Only present for on-premise installs */
  downloadUrl?: string;
  deploymentType?: "CLOUD" | "ON_PREMISE";
}

export const appstoreApi = {
  /** Browse the app catalogue */
  list: (params: { category?: string; search?: string; take?: number; skip?: number } = {}) =>
    get<any>(`/apps${qs(params)}`),

  /** Get a single app's detail + reviews */
  get: (id: string) => get<any>(`/apps/${id}`),

  /**
   * Install an app for a company.
   * Cloud: activates immediately.
   * On-premise: records installation and returns `downloadUrl`.
   */
  install: (appId: string, companyId?: string | null, version?: string) =>
    post<AppInstallation>("/apps/install", { appId, companyId, version }),

  /** Uninstall (DISABLE) an app for a company */
  uninstall: (appId: string, companyId?: string | null) =>
    del<{ success: boolean }>(`/apps/${appId}/uninstall${qs({ companyId })}`),

  /** Get all installed apps for a company */
  installed: (companyId?: string | null) =>
    get<AppInstallation[]>(`/apps/installed${qs({ companyId })}`),

  /**
   * Update an installed app.
   * Cloud: applies immediately. On-premise: returns downloadUrl + PENDING_UPDATE status.
   */
  update: (appId: string, companyId?: string | null, targetVersion?: string) =>
    post<any>(`/apps/${appId}/update`, { companyId, targetVersion }),

  /** Save per-installation configuration */
  configure: (appId: string, config: Record<string, unknown>, companyId?: string | null) =>
    post<any>(`/apps/${appId}/configure`, { config, companyId }),

  /** Submit a rating + review */
  rate: (appId: string, rating: number, review?: string) =>
    post<any>(`/apps/${appId}/rate`, { rating, review }),

  /** Submit a full review object */
  review: (appId: string, userId: string | undefined, rating: number, comment?: string) =>
    post<any>("/apps/review", { appId, userId, rating, comment }),

  /** Record a download (increments counter) */
  recordDownload: (appId: string) =>
    post<any>(`/apps/${appId}/download`, {}),
};

// ── Module manager ────────────────────────────────────────────────────────────
// Routes corrected to match the actual backend controller mount: /api/system/modules

export const moduleManagerApi = {
  /** List all system modules with per-company enabled state */
  list: (companyId?: string | null) =>
    get<any[]>(`/api/system/modules${qs({ companyId })}`),

  /** Get a single module manifest + company state */
  get: (moduleName: string) =>
    get<any>(`/api/system/modules/${moduleName}`),

  /**
   * Enable or disable a module for the current company.
   * Requires apps:write permission.
   */
  toggle: (moduleName: string, enabled: boolean) =>
    post<any>("/api/system/modules/toggle", { moduleName, enabled }),

  /**
   * Get all modules for a specific company (apps:admin).
   */
  forCompany: (companyId: string) =>
    get<any[]>(`/api/system/modules/company/${companyId}`),

  /** Legacy aliases kept for backward compat */
  enable:  (moduleId: string, companyId: string) =>
    post<any>("/api/system/modules/toggle", { moduleName: moduleId, enabled: true }),
  disable: (moduleId: string, companyId: string) =>
    post<any>("/api/system/modules/toggle", { moduleName: moduleId, enabled: false }),

  /** Update settings for an enabled module */
  configure: (moduleName: string, companyId: string, settings: Record<string, string>) =>
    post<any>(`/api/system/modules/${moduleName}/configure`, { settings }),
};
