/**
 * Disaster fund domain API client — @ovds/features/disaster-fund
 *
 * Covers: DRRF levy management, fund contributions, remittances.
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

export const drrfApi = {
  summary:       (companyId?: string | null, period?: string) =>
    get<any>(`/tax/drrf/summary${qs({ companyId, period })}`),
  filings:       (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/tax/drrf/filings${qs(params)}`),
  getFiling:     (id: string) => get<any>(`/tax/drrf/filings/${id}`),
  compute:       (companyId: string, period: string) =>
    post<any>('/tax/drrf/compute', { companyId, period }),
  submit:        (id: string) => post<any>(`/tax/drrf/filings/${id}/submit`),
  contributions: (companyId?: string | null) =>
    get<any[]>(`/tax/drrf/contributions${qs({ companyId })}`),
  remittances:   (params: { companyId?: string | null; page?: number } = {}) =>
    get<any>(`/tax/drrf/remittances${qs(params)}`),
  remit:         (id: string) => post<any>(`/tax/drrf/remittances/${id}/remit`),
};

