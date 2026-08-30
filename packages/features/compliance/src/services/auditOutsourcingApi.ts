/**
 * Audit outsourcing domain API client — @ovds/features/audit-outsourcing
 *
 * Covers: External auditor access, audit requests, document sharing,
 * findings management, audit trail export.
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

export const auditOutsourcingApi = {
  requests:     (params: { companyId?: string | null; status?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/audit-outsourcing/requests${qs(params)}`),
  get:          (id: string) => get<any>(`/audit-outsourcing/requests/${id}`),
  create:       (data: any) => post<any>('/audit-outsourcing/requests', data),
  update:       (id: string, data: any) => patch<any>(`/audit-outsourcing/requests/${id}`, data),
  remove:       (id: string) => del<void>(`/audit-outsourcing/requests/${id}`),
  approve:      (id: string) => post<any>(`/audit-outsourcing/requests/${id}/approve`),
  reject:       (id: string, reason: string) =>
    post<any>(`/audit-outsourcing/requests/${id}/reject`, { reason }),
  findings:     (requestId: string) =>
    get<any[]>(`/audit-outsourcing/requests/${requestId}/findings`),
  addFinding:   (requestId: string, data: any) =>
    post<any>(`/audit-outsourcing/requests/${requestId}/findings`, data),
  exportTrail:  (companyId: string, params: { dateFrom?: string; dateTo?: string } = {}) =>
    get<any>(`/audit-outsourcing/export-trail${qs({ companyId, ...params })}`),
  auditors:     (companyId?: string | null) =>
    get<any[]>(`/audit-outsourcing/auditors${qs({ companyId })}`),
  grantAccess:  (data: any) => post<any>('/audit-outsourcing/access/grant', data),
  revokeAccess: (auditorId: string, companyId: string) =>
    post<any>('/audit-outsourcing/access/revoke', { auditorId, companyId }),
};

