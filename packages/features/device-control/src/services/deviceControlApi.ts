/**
 * Device control domain API client — @ovds/features/device-control
 *
 * Covers: Unified control node, device commands, biometric integration,
 * ERCA TASS/SRM fiscal hardware.
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
const get  = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);

export const deviceControlApi = {
  status:       (companyId?: string | null) =>
    get<any>(`/control/status${qs({ companyId })}`),
  devices:      (params: { companyId?: string | null; type?: string } = {}) =>
    get<any[]>(`/control/devices${qs(params)}`),
  sendCommand:  (deviceId: string, command: string, payload?: any) =>
    post<any>('/control/command', { deviceId, command, payload }),
  heartbeats:   (companyId?: string | null) =>
    get<any[]>(`/control/heartbeats${qs({ companyId })}`),
  logs:         (deviceId: string, params: { page?: number; limit?: number } = {}) =>
    get<any>(`/control/devices/${deviceId}/logs${qs(params)}`),
};

export const biometricApi = {
  devices:      (companyId?: string | null) =>
    get<any[]>(`/control/biometric/devices${qs({ companyId })}`),
  enroll:       (data: any) => post<any>('/control/biometric/enroll', data),
  verify:       (data: any) => post<any>('/control/biometric/verify', data),
  syncAttendance:(deviceId: string) =>
    post<any>('/control/biometric/sync-attendance', { deviceId }),
};

export const fiscalDeviceApi = {
  devices:     (companyId?: string | null) =>
    get<any[]>(`/control/fiscal/devices${qs({ companyId })}`),
  register:    (data: any) => post<any>('/control/fiscal/register', data),
  update:      (id: string, data: any) => patch<any>(`/control/fiscal/devices/${id}`, data),
  dailyReport: (deviceId: string) =>
    post<any>('/control/fiscal/daily-report', { deviceId }),
  zReport:     (deviceId: string) =>
    post<any>('/control/fiscal/z-report', { deviceId }),
};

