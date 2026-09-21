/**
 * @ovds/features/appstore — API client
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers two concerns:
 *
 *  1. App-catalogue + installation CRUD  →  `/api/appstore/*`
 *     (backed by AppstoreController in apps/backend/src/platform/appstore.controller.ts)
 *
 *  2. Programmatic module download jobs  →  `/api/modules/*`
 *     (backed by ModuleDownloadController in apps/backend/src/platform/module-download.controller.ts)
 *
 * The client is self-contained: it reads the JWT from localStorage using the
 * same keys as the main app's api.ts, so auth headers flow correctly without
 * importing from apps/ (which would violate Nx module boundaries).
 */

// ── Internal HTTP helpers ─────────────────────────────────────────────────────

function getApiBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof localStorage === 'undefined') return h;

  const token =
    localStorage.getItem('ovds_token') ||
    localStorage.getItem('auth0_token') ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('auth0_token') : null) ||
    '';
  if (token) h['Authorization'] = `Bearer ${token}`;

  const cid = localStorage.getItem('selectedCompanyId');
  if (cid) h['x-company-id'] = cid;

  return h;
}

async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${getApiBase()}${path}`;
  const res = await fetch(url, {
    method,
    headers: buildHeaders(),
    signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j?.message ?? j?.error ?? text;
    } catch { /* use raw text */ }
    throw new Error(`${res.status}: ${msg}`);
  }

  if (res.status === 204) return null as unknown as T;
  const json = await res.json();
  // Unwrap the standard OVDS response envelope { success, data }
  return (json?.data ?? json) as T;
}

function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppCatalogItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: string;
  category: string;
  isFree: boolean;
  price: number;
  rating: number;
  downloads: number;
  developer?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AppInstallation {
  /** AppInstallation PK */
  id: string;
  appId: string;
  companyId: string;
  version: string;
  /** ACTIVE | DISABLED | PENDING_UPDATE */
  status: 'ACTIVE' | 'DISABLED' | 'PENDING_UPDATE';
  config: Record<string, unknown> | null;
  installedBy?: string;
  installedAt: string;
  updatedAt: string;
  app: Pick<AppCatalogItem, 'id' | 'name' | 'slug' | 'version' | 'description' | 'iconUrl' | 'category'>;
  /** Version currently installed on this company */
  installedVersion?: string;
  /** Latest version available from the app store / repository */
  latestVersion?: string;
  /** Download URL for on-premise update packages */
  downloadUrl?: string;
}

/** Status of a ModuleDownloadJob row */
export type DownloadJobStatus =
  | 'PENDING'
  | 'DOWNLOADING'
  | 'EXTRACTING'
  | 'ACTIVATING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED';

export interface ModuleDownloadJob {
  jobId: string;
  moduleAlias: string;
  status: DownloadJobStatus;
  /** ON_PREMISE | SAAS */
  deploymentType: 'ON_PREMISE' | 'SAAS';
  /** 0-100 */
  progress: number;
  message: string | null;
  targetPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ── App-catalogue API ─────────────────────────────────────────────────────────

export const appstoreApi = {
  /**
   * Browse the catalogue of available apps.
   * Maps to GET /api/appstore/apps
   */
  listCatalog: (params: { category?: string; search?: string; free?: boolean } = {}) =>
    request<AppCatalogItem[]>(`/appstore/apps${qs(params)}`),

  /** GET /api/appstore/apps/:id */
  getCatalogApp: (id: string) =>
    request<AppCatalogItem>(`/appstore/apps/${id}`),

  // ── Installations ──────────────────────────────────────────────────────────

  /** GET /api/appstore/installations  — all ACTIVE + DISABLED installs for the company */
  listInstallations: (status?: string) =>
    request<AppInstallation[]>(`/appstore/installations${qs({ status })}`),

  /** GET /api/appstore/installations/:id */
  getInstallation: (id: string) =>
    request<AppInstallation>(`/appstore/installations/${id}`),

  /**
   * Install (or re-activate) an app.
   * POST /api/appstore/installations
   * Cloud/SaaS: instant. On-premise: also starts a download job (see moduleDownloadApi).
   */
  install: (appId: string, config?: Record<string, unknown>) =>
    request<AppInstallation>('/appstore/installations', 'POST', { appId, config }),

  /**
   * Uninstall (soft-disable) an installed app.
   * DELETE /api/appstore/installations/:id
   */
  uninstall: (installationId: string) =>
    request<{ success: boolean }>(`/appstore/installations/${installationId}`, 'DELETE'),

  /**
   * Update per-installation config key/values.
   * PATCH /api/appstore/installations/:id/config
   */
  updateConfig: (installationId: string, config: Record<string, unknown>) =>
    request<AppInstallation>(`/appstore/installations/${installationId}/config`, 'PATCH', config),

  /** POST /api/apps/review  — submit a star rating + comment */
  submitReview: (appId: string, userId: string | undefined, rating: number, comment?: string) =>
    request<{ success: boolean }>('/apps/review', 'POST', { appId, userId, rating, comment }),
};

// ── Module download-job API ───────────────────────────────────────────────────

export const moduleDownloadApi = {
  /**
   * Trigger an on-premises physical download + ZIP extraction.
   * POST /api/modules/download-local
   * Returns a job record immediately; poll `getJobStatus` for progress.
   * Throws 400 if IS_SAAS=true on the server.
   */
  downloadLocal: (moduleAlias: string, apiKey: string) =>
    request<ModuleDownloadJob>('/modules/download-local', 'POST', { moduleAlias, apiKey }),

  /**
   * Activate a module for the current tenant in SaaS/cloud mode.
   * POST /api/modules/activate-saas
   * Writes CompanyModule + AppInstallation records; no file I/O.
   */
  activateSaaS: (moduleAlias: string) =>
    request<ModuleDownloadJob>('/modules/activate-saas', 'POST', { moduleAlias }),

  /**
   * Poll the status and progress of a download job.
   * GET /api/modules/download-status/:jobId
   */
  getJobStatus: (jobId: string, signal?: AbortSignal) =>
    request<ModuleDownloadJob>(`/modules/download-status/${jobId}`, 'GET', undefined, signal),

  /**
   * List the 50 most recent download jobs for the company.
   * GET /api/modules/download-jobs
   */
  listJobs: () =>
    request<ModuleDownloadJob[]>('/modules/download-jobs'),

  /**
   * Cancel a PENDING or DOWNLOADING job.
   * POST /api/modules/download-jobs/:jobId/cancel
   */
  cancelJob: (jobId: string) =>
    request<ModuleDownloadJob>(`/modules/download-jobs/${jobId}/cancel`, 'POST'),
};

// ── moduleManagerApi — re-exported from platform lib for backward compat ──────
// AppStore.tsx imports `moduleManagerApi` from '@ovds/features/appstore', so
// we provide a real implementation here that delegates to the correct endpoints.

export const moduleManagerApi = {
  /** List all system modules with per-company enabled state */
  list: (companyId?: string | null) =>
    request<any[]>(`/system/modules${qs({ companyId })}`),

  /** Get a single module manifest + company state */
  get: (moduleName: string) =>
    request<any>(`/system/modules/${moduleName}`),

  /**
   * Enable or disable a module for the current company.
   * In SaaS mode this is a DB flag.
   * In on-premise mode callers should use moduleDownloadApi.downloadLocal first.
   */
  toggle: (moduleName: string, enabled: boolean, settings?: Record<string, string>) =>
    request<any>('/system/modules/toggle', 'POST', { moduleName, enabled, settings }),

  /** Convenience alias */
  enable: (moduleName: string) =>
    request<any>('/system/modules/toggle', 'POST', { moduleName, enabled: true }),

  /** Convenience alias */
  disable: (moduleName: string) =>
    request<any>('/system/modules/toggle', 'POST', { moduleName, enabled: false }),

  /** Update settings for an enabled module */
  configure: (moduleName: string, companyId: string, settings: Record<string, string>) =>
    request<any>(`/system/modules/${moduleName}/configure`, 'POST', { settings }),

  /** Get modules for a specific company (SPURADMIN) */
  forCompany: (companyId: string) =>
    request<any[]>(`/system/modules/company/${companyId}`),
};
