/**
 * Sub-ledger domain API client — @ovds/features/sub-ledger
 *
 * Covers: AR sub-ledger, AP sub-ledger, customer/vendor aging,
 * inter-company balances, sub-ledger reconciliation.
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

export const subLedgerApi = {
  arLedger:   (params: { companyId?: string | null; customerId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/sub-ledger/ar${qs(params)}`),
  apLedger:   (params: { companyId?: string | null; vendorId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/sub-ledger/ap${qs(params)}`),
  customerBalance:  (customerId: string, companyId?: string | null) =>
    get<any>(`/sub-ledger/ar/customer/${customerId}${qs({ companyId })}`),
  vendorBalance:    (vendorId: string, companyId?: string | null) =>
    get<any>(`/sub-ledger/ap/vendor/${vendorId}${qs({ companyId })}`),
  reconcile:        (companyId: string, date?: string) =>
    post<any>('/sub-ledger/reconcile', { companyId, date }),
  reconcileStatus:  (companyId?: string | null) =>
    get<any>(`/sub-ledger/reconcile/status${qs({ companyId })}`),
  interCompany:     (companyId?: string | null) =>
    get<any[]>(`/sub-ledger/inter-company${qs({ companyId })}`),
};

