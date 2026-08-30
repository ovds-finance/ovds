/**
 * Double-entry accounting API client — @ovds/features/double-entry
 *
 * Covers: Journal entries, ledger entries, chart of accounts,
 * period-close, sub-ledger, GL compliance.
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

export const journalEntriesApi = {
  list:    (params: { companyId?: string | null; page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string } = {}) =>
    get<any>(`/ovds/journal-entries${qs(params)}`),
  get:     (id: string) => get<any>(`/ovds/journal-entries/${id}`),
  create:  (data: any) => post<any>('/ovds/journal-entries', data),
  update:  (id: string, data: any) => patch<any>(`/ovds/journal-entries/${id}`, data),
  remove:  (id: string) => del<void>(`/ovds/journal-entries/${id}`),
  post:    (id: string) => post<any>(`/ovds/journal-entries/${id}/post`),
  reverse: (id: string, date?: string) => post<any>(`/ovds/journal-entries/${id}/reverse`, { date }),
};

export const ledgerEntriesApi = {
  list:    (params: { companyId?: string | null; accountId?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) =>
    get<any>(`/ovds/ledger-entries${qs(params)}`),
  trialBalance: (params: { companyId?: string | null; date?: string } = {}) =>
    get<any>(`/ovds/reports/trial-balance${qs(params)}`),
};

export const chartOfAccountsApi = {
  list:     (companyId?: string | null) => get<any[]>(`/ovds/accounts${qs({ companyId })}`),
  balances: (companyId?: string | null) => get<any>(`/ovds/accounts/balances${qs({ companyId })}`),
  ledger:   (id: string, dateFrom?: string, dateTo?: string) =>
    get<any>(`/ovds/accounts/${id}/ledger${qs({ dateFrom, dateTo })}`),
  create:   (data: any) => post<any>('/ovds/accounts', data),
  update:   (id: string, data: any) => patch<any>(`/ovds/accounts/${id}`, data),
  remove:   (id: string) => del<void>(`/ovds/accounts/${id}`),
  seed:     (companyId: string) => post<any>('/ovds/accounts/seed', { companyId }),
  openingBalances: (balances: Array<{ accountId: string; balance: number }>, asOfDate: string) =>
    post<any>('/ovds/accounting/opening-balances', { balances, asOfDate }),
};

