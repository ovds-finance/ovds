/**
 * Procurement domain API client — @ovds/features/procurement
 *
 * Covers: Purchase requisitions, RFQs, supplier evaluation,
 * procurement contracts, approved vendor list.
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

export const requisitionsApi = {
  list:    (params: { companyId?: string | null; status?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/procurement/requisitions${qs(params)}`),
  get:     (id: string) => get<any>(`/procurement/requisitions/${id}`),
  create:  (data: any) => post<any>('/procurement/requisitions', data),
  update:  (id: string, data: any) => patch<any>(`/procurement/requisitions/${id}`, data),
  remove:  (id: string) => del<void>(`/procurement/requisitions/${id}`),
  approve: (id: string) => post<any>(`/procurement/requisitions/${id}/approve`),
  reject:  (id: string, reason: string) =>
    post<any>(`/procurement/requisitions/${id}/reject`, { reason }),
  convertToRfq: (id: string) => post<any>(`/procurement/requisitions/${id}/rfq`),
};

export const rfqApi = {
  list:     (params: { companyId?: string | null; status?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/procurement/rfq${qs(params)}`),
  get:      (id: string) => get<any>(`/procurement/rfq/${id}`),
  create:   (data: any) => post<any>('/procurement/rfq', data),
  update:   (id: string, data: any) => patch<any>(`/procurement/rfq/${id}`, data),
  remove:   (id: string) => del<void>(`/procurement/rfq/${id}`),
  send:     (id: string, vendorIds: string[]) =>
    post<any>(`/procurement/rfq/${id}/send`, { vendorIds }),
  award:    (id: string, vendorId: string) =>
    post<any>(`/procurement/rfq/${id}/award`, { vendorId }),
  convertToPo: (id: string) => post<any>(`/procurement/rfq/${id}/purchase-order`),
};

export const procurementContractsApi = {
  list:   (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/procurement/contracts${qs(params)}`),
  get:    (id: string) => get<any>(`/procurement/contracts/${id}`),
  create: (data: any) => post<any>('/procurement/contracts', data),
  update: (id: string, data: any) => patch<any>(`/procurement/contracts/${id}`, data),
  remove: (id: string) => del<void>(`/procurement/contracts/${id}`),
  renew:  (id: string, data: any) => post<any>(`/procurement/contracts/${id}/renew`, data),
};

