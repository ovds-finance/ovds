/**
 * Manufacturing domain API client — @ovds/features/manufacturing
 *
 * Covers: Manufacturing orders, Bill of Materials, work centres,
 * production runs, scrap reporting, costing.
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

export const manufacturingOrdersApi = {
  list:     (params: { companyId?: string | null; status?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/manufacturing/orders${qs(params)}`),
  get:      (id: string) => get<any>(`/manufacturing/orders/${id}`),
  create:   (data: any) => post<any>('/manufacturing/orders', data),
  update:   (id: string, data: any) => patch<any>(`/manufacturing/orders/${id}`, data),
  remove:   (id: string) => del<void>(`/manufacturing/orders/${id}`),
  start:    (id: string) => post<any>(`/manufacturing/orders/${id}/start`),
  complete: (id: string, data?: any) => post<any>(`/manufacturing/orders/${id}/complete`, data),
  cancel:   (id: string) => post<any>(`/manufacturing/orders/${id}/cancel`),
  scrap:    (id: string, data: any) => post<any>(`/manufacturing/orders/${id}/scrap`, data),
  costAnalysis: (id: string) => get<any>(`/manufacturing/orders/${id}/cost-analysis`),
};

export const bomApi = {
  get:    (itemId: string) => get<any>(`/manufacturing/bom/${itemId}`),
  create: (data: any) => post<any>('/manufacturing/bom', data),
  update: (id: string, data: any) => patch<any>(`/manufacturing/bom/${id}`, data),
  remove: (id: string) => del<void>(`/manufacturing/bom/${id}`),
  clone:  (id: string, newItemId: string) => post<any>(`/manufacturing/bom/${id}/clone`, { newItemId }),
};

export const workCentresApi = {
  list:   (companyId?: string | null) => get<any[]>(`/manufacturing/work-centres${qs({ companyId })}`),
  get:    (id: string) => get<any>(`/manufacturing/work-centres/${id}`),
  create: (data: any) => post<any>('/manufacturing/work-centres', data),
  update: (id: string, data: any) => patch<any>(`/manufacturing/work-centres/${id}`, data),
  remove: (id: string) => del<void>(`/manufacturing/work-centres/${id}`),
  capacity: (id: string, period?: string) =>
    get<any>(`/manufacturing/work-centres/${id}/capacity${qs({ period })}`),
};

