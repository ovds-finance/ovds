/**
 * HR domain API client — @ovds/features/hr.
 *
 * Self-contained HTTP service using fetch. No imports from apps/frontend.
 * Import from '@ovds/features/hr' — never from the original path.
 * The original file at apps/frontend/src/services/hrApi.ts should become
 * a re-export shim: export * from '@ovds/features/hr';
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  departmentId?: string | null;
  designation?: string | null;
  baseSalary: number;
  hourlyRate: number;
  pensionRate: number;
  employerPensionRate: number;
  incomeTaxRate: number;
  payrollStatus: string;
  employmentNature: string;
  bankName?: string | null;
  accountNumber?: string | null;
  phone?: string | null;
  companyId?: string | null;
  createdAt: string;
  department?: { id: string; name: string } | null;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  type: string;
  status: string;
  netPay: number;
  grossPay: number;
  totalDeductions: number;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string | null;
  createdAt: string;
}

// ── HTTP primitives ────────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const companyId =
    typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (companyId) headers['x-company-id'] = companyId;
  const locale =
    typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  if (locale) { headers['x-locale'] = locale; headers['Accept-Language'] = locale; }
  return headers;
}

function getBaseUrl(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

async function request<T>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
  const res = await fetch(fullUrl, {
    method: options.method ?? 'GET',
    headers: getHeaders(),
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}

/** Download a binary response as a Blob (for CSV/PDF exports). */
async function requestBlob(url: string): Promise<Blob> {
  const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
  const headers = getHeaders();
  delete headers['Content-Type']; // let browser set correct accept for blob
  const res = await fetch(fullUrl, { method: 'GET', headers });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.blob();
}

const get  = <T>(url: string) => request<T>(url, { method: 'GET' });
const post = <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body });
const patch = <T>(url: string, body: unknown) => request<T>(url, { method: 'PATCH', body });
const del  = <T>(url: string) => request<T>(url, { method: 'DELETE' });

function q(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ── Query key factory ──────────────────────────────────────────────────────────

export const hrKeys = {
  employees:  (companyId?: string) => ['hr', 'employees', companyId] as const,
  employee:   (id: string) => ['hr', 'employee', id] as const,
  payroll:    (year: number, month: number) => ['hr', 'payroll', year, month] as const,
  leaves:     (employeeId?: string) => ['hr', 'leaves', employeeId] as const,
  attendance: (employeeId?: string) => ['hr', 'attendance', employeeId] as const,
  payCalendars: (companyId?: string) => ['hr', 'pay-calendars', companyId] as const,
  hrAssets:   (companyId?: string) => ['hr', 'hr-assets', companyId] as const,
};

// ── Employees ──────────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (params?: { companyId?: string; search?: string; departmentId?: string; page?: number; limit?: number }) =>
    get<any>(`/hr/employees${q({ companyId: params?.companyId, search: params?.search, departmentId: params?.departmentId, page: params?.page ?? 1, limit: params?.limit ?? 50 })}`),
  get:    (id: string) => get<Employee>(`/hr/employees/${id}`),
  create: (data: Partial<Employee>) => post<Employee>('/hr/employees', data),
  update: (id: string, data: Partial<Employee>) => patch<Employee>(`/hr/employees/${id}`, data),
  remove: (id: string) => del<void>(`/hr/employees/${id}`),
  getPayrollStatusSummary: (companyId?: string) =>
    get<any>(`/hr/employees/payroll-status-summary${q({ companyId })}`),
};

// ── Payroll ────────────────────────────────────────────────────────────────────

export const payrollApi = {
  getSummary: (year: number, month: number, params?: { departmentId?: string; page?: number; limit?: number }) =>
    get<any>(`/payroll${q({ year, month, departmentId: params?.departmentId, page: params?.page ?? 1, limit: params?.limit ?? 100 })}`),
  advanceStatus: (employeeId: string, status: string, year: number, month: number) =>
    patch<any>(`/payroll/workflow/${employeeId}`, { status, year, month }),
  bulkAdvance: (employeeIds: string[], status: string, year: number, month: number) =>
    patch<any>('/payroll/bulk-workflow', { employeeIds, status, year, month }),
  downloadCsv: (year: number, month: number) =>
    requestBlob(`/payroll/export-csv/${year}/${month}`),
  downloadPdf: (year: number, month: number) =>
    requestBlob(`/payroll/export-pdf/${year}/${month}`),
  downloadPayslip: (employeeId: string, year: number, month: number) =>
    requestBlob(`/payroll/payslip/${employeeId}/${year}/${month}`),
  getDashboard: () => get<any>('/payroll/dashboard-stats'),
};

// ── Leaves ─────────────────────────────────────────────────────────────────────

export const leavesApi = {
  list: (params?: { employeeId?: string; status?: string; companyId?: string }) =>
    get<any>(`/hr/leaves${q({ employeeId: params?.employeeId, status: params?.status, companyId: params?.companyId })}`),
  apply:   (data: Partial<LeaveRequest>) => post<LeaveRequest>('/hr/leaves', data),
  update:  (id: string, data: Partial<LeaveRequest>) => patch<LeaveRequest>(`/hr/leaves/${id}`, data),
  approve: (id: string) => patch<LeaveRequest>(`/hr/leaves/${id}`, { status: 'APPROVED' }),
  reject:  (id: string) => patch<LeaveRequest>(`/hr/leaves/${id}`, { status: 'REJECTED' }),
};

// ── Attendance ─────────────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (params?: { employeeId?: string; dateFrom?: string; dateTo?: string; companyId?: string }) =>
    get<any>(`/hr/attendance${q({ employeeId: params?.employeeId, dateFrom: params?.dateFrom, dateTo: params?.dateTo, companyId: params?.companyId })}`),
  checkIn: (data: { employeeId: string; method?: string; latitude?: number; longitude?: number }) =>
    post<any>('/hr/attendance/check-in', data),
  checkOut: (data: { employeeId: string; method?: string }) =>
    post<any>('/hr/attendance/check-out', data),
  update: (id: string, data: any) => patch<any>(`/hr/attendance/${id}`, data),
};

// ── Departments ────────────────────────────────────────────────────────────────

export const departmentsApi = {
  list: (params?: { companyId?: string }) =>
    get<any[]>(`/hr/departments${q({ companyId: params?.companyId })}`),
  get:    (id: string) => get<any>(`/hr/departments/${id}`),
  create: (data: any) => post<any>('/hr/departments', data),
  update: (id: string, data: any) => patch<any>(`/hr/departments/${id}`, data),
  remove: (id: string) => del<void>(`/hr/departments/${id}`),
};

// ── Pay Calendars ──────────────────────────────────────────────────────────────

export interface PayCalendar {
  id: string;
  name: string;
  frequency: string;
  startDate: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export const payCalendarsApi = {
  list: (params?: { companyId?: string; page?: number; take?: number; search?: string }) =>
    get<any>(`/hr/pay-calendars${q({ companyId: params?.companyId, page: params?.page ?? 1, take: params?.take ?? 25, search: params?.search })}`),
  get:    (id: string) => get<PayCalendar>(`/hr/pay-calendars/${id}`),
  create: (data: Partial<PayCalendar>) => post<PayCalendar>('/hr/pay-calendars', data),
  update: (id: string, data: Partial<PayCalendar>) => patch<PayCalendar>(`/hr/pay-calendars/${id}`, data),
  remove: (id: string) => del<void>(`/hr/pay-calendars/${id}`),
};

// ── HR Assets ──────────────────────────────────────────────────────────────────

export interface HrAsset {
  id: string;
  employeeId: string;
  employeeName?: string;
  assetName: string;
  assetType: string;
  serialNumber?: string;
  assignedDate: string;
  returnDate?: string;
  conditionNotes?: string;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export const hrAssetsApi = {
  list: (params?: { companyId?: string; page?: number; take?: number; search?: string; status?: string; employeeId?: string }) =>
    get<any>(`/hr/assets${q({ companyId: params?.companyId, page: params?.page ?? 1, take: params?.take ?? 25, search: params?.search, status: params?.status, employeeId: params?.employeeId })}`),
  getStats: (companyId?: string) =>
    get<any>(`/hr/assets/stats${q({ companyId })}`),
  get:    (id: string) => get<HrAsset>(`/hr/assets/${id}`),
  create: (data: Partial<HrAsset>) => post<HrAsset>('/hr/assets', data),
  update: (id: string, data: Partial<HrAsset>) => patch<HrAsset>(`/hr/assets/${id}`, data),
  remove: (id: string) => del<void>(`/hr/assets/${id}`),
};
