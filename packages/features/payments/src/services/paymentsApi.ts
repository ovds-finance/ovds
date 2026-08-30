/**
 * Payments domain API client — @ovds/features/payments
 *
 * Covers: Payment records, payment verification (CBE, Telebirr, Awash, Amole),
 * receipt generation, duplicate detection.
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
const del  = <T>(url: string) => req<T>(url, 'DELETE');

export const paymentsApi = {
  list:             (params: { companyId?: string | null; page?: number; limit?: number; status?: string } = {}) =>
    get<any>(`/ovds/payments${qs(params)}`),
  get:              (id: string) => get<any>(`/ovds/payments/${id}`),
  remove:           (id: string) => del<void>(`/ovds/payments/${id}`),
  checkDuplicate:   (ref: string, amount?: number) =>
    get<any>(`/ovds/payments/check-duplicate${qs({ ref, amount })}`),
};

export const paymentVerificationApi = {
  verifyCbe:      (data: any) => post<any>('/payments/verify/cbe', data),
  verifyTelebirr: (data: any) => post<any>('/payments/verify/telebirr', data),
  verifyAwash:    (data: any) => post<any>('/payments/verify/awash', data),
  verifyAmole:    (data: any) => post<any>('/payments/verify/amole', data),
  verifyDashen:   (data: any) => post<any>('/payments/verify/dashen', data),
  unified:        (data: any) => post<any>('/payments/verify', data),
};

export const receiptsApi = {
  get:      (id: string) => get<any>(`/ovds/universal-invoice/${id}/receipt`),
  list:     (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/ovds/receipts${qs(params)}`),
  create:   (data: any) => post<any>('/ovds/receipts', data),
  send:     (id: string) => post<any>(`/ovds/receipts/${id}/send`),
};

