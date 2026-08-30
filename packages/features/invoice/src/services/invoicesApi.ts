/**
 * invoicesApi — typed CRUD client for invoices, estimates, bills, customers.
 * Separate from invoiceApi.ts which covers the universal invoice engine.
 */

function getBase(): string { return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api'; }
function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  const locale = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  if (locale) { h['x-locale'] = locale; h['Accept-Language'] = locale; }
  return h;
}
async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, {
    method, headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) { const text = await res.text().catch(() => res.statusText); throw new Error(`${res.status}: ${text}`); }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}
function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString(); return s ? `?${s}` : '';
}
const get    = <T>(url: string) => req<T>(url);
const post   = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch  = <T>(url: string, body?: unknown) => req<T>(url, 'PATCH', body ?? {});
const del    = <T>(url: string) => req<T>(url, 'DELETE');

export interface InvoiceListParams {
  companyId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Invoices ───────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list:           (p: InvoiceListParams = {}) => get<any>(`/ovds/invoices${qs(p as any)}`),
  get:            (id: string) => get<any>(`/ovds/invoices/${id}`),
  stats:          (companyId?: string) => get<any>(`/ovds/invoices/stats${qs({ companyId })}`),
  nextNumber:     (companyId?: string) => get<any>(`/ovds/invoices/next-number${qs({ companyId })}`),
  create:         (data: any) => post<any>('/ovds/invoices', data),
  update:         (id: string, data: any) => patch<any>(`/ovds/invoices/${id}`, data),
  remove:         (id: string) => del<any>(`/ovds/invoices/${id}`),
  send:           (id: string) => post<any>(`/ovds/invoices/${id}/send`),
  void:           (id: string, reason: string, category?: string) =>
    post<any>(`/ovds/invoices/${id}/void`, { reason, category }),
  archive:        (id: string) => post<any>(`/ovds/invoices/${id}/archive`),
  bulkArchive:    (ids: string[]) => post<any>('/ovds/invoices/bulk-archive', { ids }),
  creditNote:     (id: string) => post<any>(`/ovds/invoices/${id}/credit-note`),
  byShareToken:   (token: string) => get<any>(`/ovds/invoices/share/${token}`),
  exportCsv:      (p: InvoiceListParams = {}) => get<any>(`/ovds/invoices/export/csv${qs(p as any)}`),
};

// ── Estimates ──────────────────────────────────────────────────────────────────
export const estimatesApi = {
  list:       (p: InvoiceListParams = {}) => get<any>(`/ovds/estimates${qs(p as any)}`),
  stats:      (companyId?: string) => get<any>(`/ovds/estimates/stats${qs({ companyId })}`),
  nextNumber: (companyId?: string) => get<any>(`/ovds/estimates/next-number${qs({ companyId })}`),
  create:     (data: any) => post<any>('/ovds/estimates', data),
  update:     (id: string, data: any) => patch<any>(`/ovds/estimates/${id}`, data),
  remove:     (id: string) => del<any>(`/ovds/estimates/${id}`),
  send:       (id: string) => post<any>(`/ovds/estimates/${id}/send`),
  convert:    (id: string) => post<any>(`/ovds/estimates/${id}/convert`),
};

// ── Bills ──────────────────────────────────────────────────────────────────────
export const billsApi = {
  list:        (p: InvoiceListParams = {}) => get<any>(`/ovds/bills${qs(p as any)}`),
  get:         (id: string) => get<any>(`/ovds/bills/${id}`),
  stats:       (companyId?: string) => get<any>(`/ovds/bills/stats${qs({ companyId })}`),
  create:      (data: any) => post<any>('/ovds/bills', data),
  update:      (id: string, data: any) => patch<any>(`/ovds/bills/${id}`, data),
  remove:      (id: string) => del<any>(`/ovds/bills/${id}`),
  duplicate:   (id: string) => post<any>(`/ovds/bills/${id}/duplicate`),
  archive:     (id: string) => post<any>(`/ovds/bills/${id}/archive`),
  bulkArchive: (ids: string[]) => post<any>('/ovds/bills/bulk-archive', { ids }),
  runRecurring:() => post<any>('/ovds/bills/recurring/run'),
  payments: {
    list:   (billId: string) => get<any>(`/ovds/bills/${billId}/payments`),
    create: (billId: string, data: any) => post<any>(`/ovds/bills/${billId}/payments`, data),
    remove: (billId: string, paymentId: string) => del<any>(`/ovds/bills/${billId}/payments/${paymentId}`),
  },
};

// ── Customers ──────────────────────────────────────────────────────────────────
export const customersApi = {
  list:   (p?: { companyId?: string; search?: string; page?: number; limit?: number }) =>
    get<any>(`/ovds/customers/registry${qs(p ?? {})}`),
  get:    (id: string) => get<any>(`/ovds/customers/registry/${id}`),
  create: (data: any) => post<any>('/ovds/customers/registry', data),
  update: (id: string, data: any) => patch<any>(`/ovds/customers/registry/${id}`, data),
  remove: (id: string) => del<any>(`/ovds/customers/registry/${id}`),
};

// ── Tax helpers ────────────────────────────────────────────────────────────────
export const invoiceTaxApi = {
  calculateVat: (subtotal: number, vatRate?: number) =>
    post<any>('/ovds/invoices/calculate-vat', { subtotal, vatRate }),
  calculateWht: (transactionType: 'GOODS' | 'SERVICES', amount: number) =>
    post<any>('/ovds/invoices/calculate-wht', { transactionType, amount }),
  calculateTot: (annualRevenue: number, taxpayerCategory?: 'A' | 'B' | 'C') =>
    post<any>('/ovds/invoices/calculate-tot', { annualRevenue, taxpayerCategory }),
  auditTrail: (companyId?: string, action?: string, limit?: number) =>
    get<any>(`/ovds/audit-trail${qs({ companyId, action, limit })}`),
};

