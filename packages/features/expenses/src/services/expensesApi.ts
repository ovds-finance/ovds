/**
 * Expenses domain API client — @ovds/features/expenses
 *
 * Covers: General expenses, petty cash, expense categories,
 * mileage claims, per-diem allowances.
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

export const expensesApi = {
  list:     (params: { companyId?: string | null; category?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) =>
    get<any>(`/accounting/expenses${qs(params)}`),
  get:      (id: string) => get<any>(`/accounting/expenses/${id}`),
  create:   (data: any) => post<any>('/accounting/expenses', data),
  update:   (id: string, data: any) => patch<any>(`/accounting/expenses/${id}`, data),
  remove:   (id: string) => del<void>(`/accounting/expenses/${id}`),
  approve:  (id: string) => post<any>(`/accounting/expenses/${id}/approve`),
  categories: (companyId?: string | null) =>
    get<any[]>(`/accounting/expense-categories${qs({ companyId })}`),
  stats:    (companyId?: string | null, period?: string) =>
    get<any>(`/accounting/expenses/stats${qs({ companyId, period })}`),
};

export const pettyCashApi = {
  summary:      (companyId?: string | null) =>
    get<any>(`/accounting/petty-cash/summary${qs({ companyId })}`),
  transactions: (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/accounting/petty-cash/transactions${qs(params)}`),
  replenish:    (data: { amount: number; companyId?: string; notes?: string }) =>
    post<any>('/accounting/petty-cash/replenish', data),
  disburse:     (data: { amount: number; description: string; companyId?: string }) =>
    post<any>('/accounting/petty-cash/disburse', data),
};

