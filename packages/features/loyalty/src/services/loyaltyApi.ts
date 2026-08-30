/**
 * Loyalty domain API client — @ovds/features/loyalty
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

export const loyaltyProgramsApi = {
  list:   (companyId?: string | null) =>
    get<any[]>(`/loyalty/programs${qs({ companyId })}`),
  get:    (id: string) => get<any>(`/loyalty/programs/${id}`),
  create: (data: any) => post<any>('/loyalty/programs', data),
  update: (id: string, data: any) => patch<any>(`/loyalty/programs/${id}`, data),
  remove: (id: string) => del<void>(`/loyalty/programs/${id}`),
};

export const loyaltyPointsApi = {
  balance:  (customerId: string, companyId?: string | null) =>
    get<any>(`/loyalty/points/${customerId}${qs({ companyId })}`),
  history:  (customerId: string, params: { page?: number; limit?: number } = {}) =>
    get<any>(`/loyalty/points/${customerId}/history${qs(params)}`),
  award:    (data: { customerId: string; points: number; reason?: string; companyId?: string }) =>
    post<any>('/loyalty/points/award', data),
  redeem:   (data: { customerId: string; points: number; companyId?: string }) =>
    post<any>('/loyalty/points/redeem', data),
  expire:   (companyId: string) => post<any>('/loyalty/points/expire', { companyId }),
};

export const loyaltyTiersApi = {
  list:   (companyId?: string | null) =>
    get<any[]>(`/loyalty/tiers${qs({ companyId })}`),
  create: (data: any) => post<any>('/loyalty/tiers', data),
  update: (id: string, data: any) => patch<any>(`/loyalty/tiers/${id}`, data),
  remove: (id: string) => del<void>(`/loyalty/tiers/${id}`),
};

