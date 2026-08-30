/**
 * Compliance domain API client — @ovds/features/compliance
 *
 * Covers: Business registration, sector compliance, TIN/VAT validation,
 * ERCA portal, annual return filing, company profile.
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
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);

export const complianceApi = {
  status:       (companyId?: string | null) =>
    get<any>(`/compliance/status${qs({ companyId })}`),
  checklist:    (companyId?: string | null) =>
    get<any[]>(`/compliance/checklist${qs({ companyId })}`),
  filings:      (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/compliance/filings${qs(params)}`),
  submit:       (id: string) => post<any>(`/compliance/filings/${id}/submit`),
  annualReturn: (companyId: string, year: number) =>
    post<any>('/compliance/annual-return', { companyId, year }),
};

export const validationApi = {
  tin:    (tin: string) => get<any>(`/ovds/validate/tin/${encodeURIComponent(tin)}`),
  vat:    (vat: string) => get<any>(`/ovds/validate/vat/${encodeURIComponent(vat)}`),
  nid:    (nid: string) => get<any>(`/ovds/validate/nid/${encodeURIComponent(nid)}`),
  docRef: (ref: string) => get<any>(`/ovds/validate/docref/${encodeURIComponent(ref)}`),
  ebp:    (tin: string) => post<any>('/compliance/ebp/verify', { tin }),
};

export const businessRegistrationApi = {
  get:    (companyId: string) => get<any>(`/compliance/registration${qs({ companyId })}`),
  update: (companyId: string, data: any) =>
    patch<any>('/compliance/registration', { ...data, companyId }),
  documents: (companyId?: string | null) =>
    get<any[]>(`/compliance/documents${qs({ companyId })}`),
};

