/**
 * Fiscal domain API client — @ovds/features/fiscal
 *
 * Covers: ERCA TASS/SRM fiscal hardware, fiscal day operations,
 * Z-reports, fiscal receipts, EFY calendar utilities.
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

export const fiscalDevicesApi = {
  list:        (companyId?: string | null) =>
    get<any[]>(`/fiscal/devices${qs({ companyId })}`),
  get:         (id: string) => get<any>(`/fiscal/devices/${id}`),
  register:    (data: any) => post<any>('/fiscal/devices/register', data),
  update:      (id: string, data: any) => patch<any>(`/fiscal/devices/${id}`, data),
  status:      (id: string) => get<any>(`/fiscal/devices/${id}/status`),
  dailyReport: (id: string) => post<any>(`/fiscal/devices/${id}/daily-report`),
  zReport:     (id: string) => post<any>(`/fiscal/devices/${id}/z-report`),
  openDay:     (id: string) => post<any>(`/fiscal/devices/${id}/open-day`),
  closeDay:    (id: string) => post<any>(`/fiscal/devices/${id}/close-day`),
};

export const fiscalReceiptsApi = {
  list:    (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/fiscal/receipts${qs(params)}`),
  get:     (id: string) => get<any>(`/fiscal/receipts/${id}`),
  void:    (id: string, reason: string) =>
    post<any>(`/fiscal/receipts/${id}/void`, { reason }),
  reprint: (id: string) => post<any>(`/fiscal/receipts/${id}/reprint`),
};

export const efyApi = {
  currentYear: () => get<any>('/fiscal/efy/current'),
  bounds:      (year: number) => get<any>(`/fiscal/efy/bounds/${year}`),
  deadlines:   (year: number) => get<any>(`/fiscal/efy/deadlines/${year}`),
  convert:     (date: string) => get<any>(`/fiscal/efy/convert${qs({ date })}`),
};

