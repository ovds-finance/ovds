/**
 * IFRS domain API client — @ovds/features/ifrs
 *
 * Covers: IFRS 16 Leases, IAS 36 Impairment, IAS 38 Intangibles,
 * IAS 19 Employee Benefits, Depreciation schedules, Disclosure notes.
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

// IFRS 16 — Leases
export const leasesApi = {
  list:           (params: { companyId?: string | null; page?: number; limit?: number; status?: string } = {}) =>
    get<any>(`/ifrs/leases${qs(params)}`),
  get:            (id: string) => get<any>(`/ifrs/leases/${id}`),
  create:         (data: any) => post<any>('/ifrs/leases', data),
  update:         (id: string, data: any) => patch<any>(`/ifrs/leases/${id}`, data),
  remove:         (id: string) => del<void>(`/ifrs/leases/${id}`),
  schedule:       (id: string) => get<any[]>(`/ifrs/leases/${id}/schedule`),
  postPayment:    (id: string, data: any) => post<any>(`/ifrs/leases/${id}/payment`, data),
  modifications:  (id: string) => get<any[]>(`/ifrs/leases/${id}/modifications`),
  terminate:      (id: string, data: any) => post<any>(`/ifrs/leases/${id}/terminate`, data),
  summary:        (companyId?: string | null) => get<any>(`/ifrs/leases/summary${qs({ companyId })}`),
};

// Fixed Assets / IAS 16
export const fixedAssetsApi = {
  list:                (companyId?: string | null) => get<any[]>(`/ovds/fixed-assets${qs({ companyId })}`),
  get:                 (id: string) => get<any>(`/ovds/fixed-assets/${id}`),
  create:              (data: any) => post<any>('/ovds/fixed-assets', data),
  update:              (id: string, data: any) => patch<any>(`/ovds/fixed-assets/${id}`, data),
  remove:              (id: string) => del<void>(`/ovds/fixed-assets/${id}`),
  depreciateAll:       (period: string, companyId?: string) =>
    post<any>('/ovds/fixed-assets/depreciate-all', { period, companyId }),
  depreciationSchedule:(id: string) => get<any[]>(`/ovds/fixed-assets/${id}/depreciation-schedule`),
  disposals:           (companyId?: string | null) =>
    get<any[]>(`/ovds/accounting/fixed-asset-disposals${qs({ companyId })}`),
  dispose:             (data: any) => post<any>('/ovds/accounting/fixed-asset-disposals', data),
};

// Impairment / IAS 36
export const impairmentApi = {
  list:    (companyId?: string | null) => get<any[]>(`/ifrs/impairment${qs({ companyId })}`),
  get:     (id: string) => get<any>(`/ifrs/impairment/${id}`),
  create:  (data: any) => post<any>('/ifrs/impairment', data),
  update:  (id: string, data: any) => patch<any>(`/ifrs/impairment/${id}`, data),
  remove:  (id: string) => del<void>(`/ifrs/impairment/${id}`),
  test:    (assetId: string, companyId?: string) =>
    post<any>('/ifrs/impairment/test', { assetId, companyId }),
};

// Disclosure Notes
export const disclosureNotesApi = {
  list:   (companyId?: string | null, period?: string) =>
    get<any[]>(`/ifrs/disclosure-notes${qs({ companyId, period })}`),
  get:    (id: string) => get<any>(`/ifrs/disclosure-notes/${id}`),
  create: (data: any) => post<any>('/ifrs/disclosure-notes', data),
  update: (id: string, data: any) => patch<any>(`/ifrs/disclosure-notes/${id}`, data),
  remove: (id: string) => del<void>(`/ifrs/disclosure-notes/${id}`),
  generate: (companyId: string, period: string) =>
    post<any>('/ifrs/disclosure-notes/generate', { companyId, period }),
};

