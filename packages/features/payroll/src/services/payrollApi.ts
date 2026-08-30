/**
 * Payroll domain API client — @ovds/features/payroll
 *
 * Covers: Payroll runs, payslips, bulk workflow, bank payroll export,
 * cost centres, shift scheduling, biometric attendance.
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
async function reqBlob(url: string): Promise<Blob> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const h = headers(); delete h['Content-Type'];
  const res = await fetch(fullUrl, { method: 'GET', headers: h });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.blob();
}
function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)); }
  const s = q.toString(); return s ? `?${s}` : '';
}
const get   = <T>(url: string) => req<T>(url);
const post  = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);

export const payrollRunsApi = {
  list:        (params: { year?: number; month?: number; departmentId?: string; page?: number; limit?: number; companyId?: string | null } = {}) =>
    get<any>(`/payroll${qs({ ...params, page: params.page ?? 1, limit: params.limit ?? 100 })}`),
  dashboard:   () => get<any>('/payroll/dashboard-stats'),
  advanceStatus:(employeeId: string, status: string, year: number, month: number) =>
    patch<any>(`/payroll/workflow/${employeeId}`, { status, year, month }),
  bulkAdvance: (employeeIds: string[], status: string, year: number, month: number) =>
    patch<any>('/payroll/bulk-workflow', { employeeIds, status, year, month }),
  generate:    (companyId: string, year: number, month: number) =>
    post<any>('/payroll/generate', { companyId, year, month }),
  approve:     (companyId: string, year: number, month: number) =>
    post<any>('/payroll/approve', { companyId, year, month }),
};

export const payslipsApi = {
  download:   (employeeId: string, year: number, month: number) =>
    reqBlob(`/payroll/payslip/${employeeId}/${year}/${month}`),
  exportCsv:  (year: number, month: number) => reqBlob(`/payroll/export-csv/${year}/${month}`),
  exportPdf:  (year: number, month: number) => reqBlob(`/payroll/export-pdf/${year}/${month}`),
  bankExport: (companyId: string, year: number, month: number, bankName?: string) =>
    post<any>('/payroll/bank-export', { companyId, year, month, bankName }),
};

export const shiftsApi = {
  list:     (params: { companyId?: string | null; employeeId?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/hr/shifts${qs(params)}`),
  get:      (id: string) => get<any>(`/hr/shifts/${id}`),
  create:   (data: any) => post<any>('/hr/shifts', data),
  update:   (id: string, data: any) => patch<any>(`/hr/shifts/${id}`, data),
  remove:   (id: string) => req<void>(`/hr/shifts/${id}`, 'DELETE'),
  assign:   (shiftId: string, employeeIds: string[]) =>
    post<any>(`/hr/shifts/${shiftId}/assign`, { employeeIds }),
};

