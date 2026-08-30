/**
 * General ledger compliance domain API client — @ovds/features/general-ledger-compliance
 *
 * Covers: Period-close checklist, GL audit, posting compliance,
 * locked periods, segregation of duties.
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

export const periodCloseApi = {
  list:     (companyId?: string | null) => get<any[]>(`/ovds/period-close${qs({ companyId })}`),
  status:   (period: string, companyId?: string | null) =>
    get<any>(`/ovds/period-close/status${qs({ period, companyId })}`),
  initiate: (data: { period: string; companyId?: string }) =>
    post<any>('/ovds/period-close', data),
  approve:  (id: string) => post<any>(`/ovds/period-close/${id}/approve`),
  reopen:   (id: string, reason: string) =>
    post<any>(`/ovds/period-close/${id}/reopen`, { reason }),
};

export const glComplianceApi = {
  checklist:      (companyId?: string | null, period?: string) =>
    get<any[]>(`/gl-compliance/checklist${qs({ companyId, period })}`),
  auditTrail:     (params: { companyId?: string | null; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/gl-compliance/audit-trail${qs(params)}`),
  segregationReport: (companyId?: string | null) =>
    get<any>(`/gl-compliance/segregation${qs({ companyId })}`),
  lockedPeriods:  (companyId?: string | null) =>
    get<any[]>(`/gl-compliance/locked-periods${qs({ companyId })}`),
  lockPeriod:     (period: string, companyId: string) =>
    post<any>('/gl-compliance/lock-period', { period, companyId }),
  unlockPeriod:   (period: string, companyId: string, reason: string) =>
    post<any>('/gl-compliance/unlock-period', { period, companyId, reason }),
};

