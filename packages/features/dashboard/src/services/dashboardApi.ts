/**
 * Dashboard domain API client — @ovds/features/dashboard
 *
 * Covers: KPI summary, revenue trend, widget data, activity feed,
 * company setup progress, dashboard stats.
 *
 * No imports from apps/. Types from @ovds/shared.
 */

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  const loc = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  if (loc) { h['x-locale'] = loc; h['Accept-Language'] = loc; }
  return h;
}

async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: headers(),
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
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get  = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats:         (companyId?: string | null) =>
    get<any>(`/dashboard/stats${qs({ companyId })}`),
  kpis:          (companyId?: string | null, period?: string) =>
    get<any>(`/dashboard/kpis${qs({ companyId, period })}`),
  revenueTrend:  (companyId?: string | null, months?: number) =>
    get<any[]>(`/ovds/revenue-trend${qs({ companyId, months })}`),
  summary:       (companyId?: string | null) =>
    get<any>(`/ovds/summary${qs({ companyId })}`),
  activityFeed:  (companyId?: string | null, limit?: number) =>
    get<any[]>(`/dashboard/activity${qs({ companyId, limit })}`),
  setupProgress: (companyId?: string | null) =>
    get<any>(`/dashboard/setup-progress${qs({ companyId })}`),
  widgets:       (companyId?: string | null) =>
    get<any[]>(`/dashboard/widgets${qs({ companyId })}`),
  updateWidgets: (widgets: any[], companyId?: string | null) =>
    post<any>('/dashboard/widgets', { widgets, companyId }),
  financialAlerts: (companyId?: string | null) =>
    get<any[]>(`/dashboard/alerts${qs({ companyId })}`),
  healthScore:   (companyId?: string | null) =>
    get<any>(`/ovds/reports/health-score${qs({ companyId })}`),
};

