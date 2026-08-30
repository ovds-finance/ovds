/**
 * Currency domain API client — @ovds/features/currency
 *
 * Covers: Exchange rates, currency conversion, NBE live rates,
 * multi-currency accounting.
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

export const currencyRatesApi = {
  list:      (params: { from?: string; to?: string; companyId?: string } = {}) =>
    get<any[]>(`/ovds/currency-rates${qs(params)}`),
  get:       (from: string, to: string, date?: string) =>
    get<any>(`/ovds/currency-rates/${from}/${to}${qs({ date })}`),
  upsert:    (data: { fromCurrency: string; toCurrency: string; rate: number; source?: string }) =>
    post<any>('/ovds/currency-rates', data),
  fetchLive: () => post<any>('/ovds/currency-rates/fetch-live'),
  convert:   (amount: number, from: string, to: string, date?: string) =>
    get<any>(`/ovds/currency-rates/convert${qs({ amount, from, to, date })}`),
  history:   (from: string, to: string, days?: number) =>
    get<any[]>(`/ovds/currency-rates/${from}/${to}/history${qs({ days })}`),
  currencies: () => get<any[]>('/ovds/currencies'),
  nbeRates:  () => get<any>('/banking/nbe-rates'),
};

export const fxRevaluationApi = {
  preview:  (companyId: string, date: string) =>
    post<any>('/ovds/fx-revaluation/preview', { companyId, date }),
  run:      (companyId: string, date: string) =>
    post<any>('/ovds/fx-revaluation/run', { companyId, date }),
  history:  (companyId?: string | null) =>
    get<any[]>(`/ovds/fx-revaluation/history${qs({ companyId })}`),
};

