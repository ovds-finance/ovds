/**
 * Trade domain API client — @ovds/features/trade
 *
 * Covers: Import/Export shipments, trade finance, letters of credit,
 * customs declarations, shipping tracking (ESLSE / EAL cargo).
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

export const shipmentsApi = {
  list:      (params: { companyId?: string | null; type?: string; status?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/trade/shipments${qs(params)}`),
  get:       (id: string) => get<any>(`/trade/shipments/${id}`),
  create:    (data: any) => post<any>('/trade/shipments', data),
  update:    (id: string, data: any) => patch<any>(`/trade/shipments/${id}`, data),
  remove:    (id: string) => del<void>(`/trade/shipments/${id}`),
  track:     (id: string) => get<any>(`/trade/shipments/${id}/track`),
  trackEslse:(awbOrBl: string) => get<any>(`/trade/track/eslse/${encodeURIComponent(awbOrBl)}`),
  trackEal:  (awb: string) => get<any>(`/trade/track/eal/${encodeURIComponent(awb)}`),
};

export const tradeFinanceApi = {
  letterOfCredit: {
    list:   (companyId?: string | null) => get<any[]>(`/trade/lc${qs({ companyId })}`),
    get:    (id: string) => get<any>(`/trade/lc/${id}`),
    create: (data: any) => post<any>('/trade/lc', data),
    update: (id: string, data: any) => patch<any>(`/trade/lc/${id}`, data),
    remove: (id: string) => del<void>(`/trade/lc/${id}`),
  },
  bankGuarantee: {
    list:   (companyId?: string | null) => get<any[]>(`/trade/bank-guarantee${qs({ companyId })}`),
    create: (data: any) => post<any>('/trade/bank-guarantee', data),
  },
};

export const customsApi = {
  declarations: (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/trade/customs${qs(params)}`),
  get:    (id: string) => get<any>(`/trade/customs/${id}`),
  create: (data: any) => post<any>('/trade/customs', data),
  submit: (id: string) => post<any>(`/trade/customs/${id}/submit`),
};

