/**
 * Receipts domain API client — @ovds/features/receipts
 *
 * Covers: Receipt management, payment receipts, QR-coded receipts,
 * ERCA-compliant receipt generation, share/download.
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

export const receiptsApi = {
  list:      (params: { companyId?: string | null; page?: number; limit?: number; customerId?: string } = {}) =>
    get<any>(`/ovds/receipts${qs(params)}`),
  get:       (id: string) => get<any>(`/ovds/receipts/${id}`),
  getForInvoice: (invoiceId: string) =>
    get<any>(`/ovds/universal-invoice/${invoiceId}/receipt`),
  create:    (data: any) => post<any>('/ovds/receipts', data),
  send:      (id: string, email?: string) =>
    post<any>(`/ovds/receipts/${id}/send`, { email }),
  share:     (id: string) => post<any>(`/ovds/receipts/${id}/share`),
  byToken:   (token: string) => get<any>(`/ovds/receipts/token/${token}`),
  printable: (id: string) => get<any>(`/ovds/receipts/${id}/print`),
};

