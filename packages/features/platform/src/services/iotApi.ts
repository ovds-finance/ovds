/**
 * IoT domain API client — @ovds/features/iot
 *
 * Covers: IoT devices, node registry, telemetry, alerts, device billing.
 */

function getBase(): string { return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api'; }
function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) || (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  return h;
}
async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, { method, headers: headers(), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!res.ok) { const text = await res.text().catch(() => res.statusText); throw new Error(`${res.status}: ${text}`); }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}
function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)); }
  const s = q.toString(); return s ? `?${s}` : '';
}
const get   = <T>(url: string) => req<T>(url);
const post  = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);
const del   = <T>(url: string) => req<T>(url, 'DELETE');

export const iotDevicesApi = {
  list:       (params: { companyId?: string | null; status?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/iot/devices${qs(params)}`),
  get:        (id: string) => get<any>(`/iot/devices/${id}`),
  register:   (data: any) => post<any>('/iot/devices/register', data),
  update:     (id: string, data: any) => patch<any>(`/iot/devices/${id}`, data),
  remove:     (id: string) => del<void>(`/iot/devices/${id}`),
  heartbeat:  (id: string) => post<any>(`/iot/devices/${id}/heartbeat`),
  telemetry:  (id: string, params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) =>
    get<any>(`/iot/devices/${id}/telemetry${qs(params)}`),
  command:    (id: string, command: string, payload?: any) =>
    post<any>(`/iot/devices/${id}/command`, { command, payload }),
  stats:      (companyId?: string | null) => get<any>(`/iot/devices/stats${qs({ companyId })}`),
};

export const iotNodesApi = {
  list:     (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/nodes${qs(params)}`),
  get:      (id: string) => get<any>(`/nodes/${id}`),
  register: (data: any) => post<any>('/nodes/register', data),
  update:   (id: string, data: any) => patch<any>(`/nodes/${id}`, data),
  remove:   (id: string) => del<void>(`/nodes/${id}`),
  ping:     (id: string) => post<any>(`/nodes/${id}/ping`),
};

export const iotAlertsApi = {
  list:    (params: { companyId?: string | null; page?: number; limit?: number; severity?: string } = {}) =>
    get<any>(`/iot/alerts${qs(params)}`),
  get:     (id: string) => get<any>(`/iot/alerts/${id}`),
  resolve: (id: string) => post<any>(`/iot/alerts/${id}/resolve`),
  rules:   (companyId?: string | null) => get<any[]>(`/iot/alert-rules${qs({ companyId })}`),
  createRule: (data: any) => post<any>('/iot/alert-rules', data),
};

