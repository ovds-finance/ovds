/**
 * OVDS/Accounting domain API client — @ovds/features-accounting.
 *
 * Self-contained HTTP service using fetch. No imports from apps/frontend.
 * Types sourced from @ovds/contracts/schemas.
 *
 * Usage:
 *   import { customersApi, vendorsApi, ... } from '@ovds/features/accounting';
 *
 * The original file at apps/frontend/src/services/ovdsApi.ts should become
 * a re-export shim: export * from '@ovds/features/accounting';
 */
import type {
  Customer, Vendor, BankAccount, Item,
  Company, TaxRate, Partnership, Integration,
} from '@ovds/contracts/schemas';

export type { Company, TaxRate, Partnership, Integration };

// ── HTTP primitives ──────────────────────────────────────────────────────────

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

function getBaseUrl(): string {
  // Runtime injection point — the Vite app sets window._VITE_API_URL at startup
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

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

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
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
  // Unwrap TransformInterceptor envelope { success, data } → T
  return (json?.data ?? json) as T;
}

const get  = <T>(url: string) => request<T>(url, { method: 'GET' });
const post = <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body });
const patch = <T>(url: string, body: unknown) => request<T>(url, { method: 'PATCH', body });
const del  = <T>(url: string) => request<T>(url, { method: 'DELETE' });

// ── Query builder ────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') q.set(key, String(val));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ── API surface ──────────────────────────────────────────────────────────────

export const customersApi = {
  list: (params: { companyId?: string | null; search?: string; page?: number; limit?: number } = {}) =>
    get<Customer[]>(`/ovds/customers${buildQuery(params)}`),
  get:    (id: string) => get<Customer>(`/ovds/customers/${id}`),
  create: (data: Partial<Customer>) => post<Customer>('/ovds/customers', data),
  update: (id: string, data: Partial<Customer>) => patch<Customer>(`/ovds/customers/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/customers/${id}`),
};

export const vendorsApi = {
  list: (params: { companyId?: string | null; search?: string; page?: number; limit?: number } = {}) =>
    get<Vendor[]>(`/ovds/vendors${buildQuery(params)}`),
  get:    (id: string) => get<Vendor>(`/ovds/vendors/${id}`),
  create: (data: Partial<Vendor>) => post<Vendor>('/ovds/vendors', data),
  update: (id: string, data: Partial<Vendor>) => patch<Vendor>(`/ovds/vendors/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/vendors/${id}`),
};

export const itemsApi = {
  list: (params: { companyId?: string | null; search?: string; page?: number; limit?: number; category?: string } = {}) =>
    get<any>(`/ovds/items${buildQuery({ ...params, page: params.page ?? 1, limit: params.limit ?? 100 })}`),
  get:    (id: string) => get<Item>(`/ovds/items/${id}`),
  create: (data: Partial<Item>) => post<Item>('/ovds/items', data),
  update: (id: string, data: Partial<Item>) => patch<Item>(`/ovds/items/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/items/${id}`),
  adjustStock: (id: string, delta: number, reason?: string) =>
    post<any>(`/ovds/items/${id}/adjust-stock`, { delta, reason }),
};

export const bankAccountsApi = {
  list: (companyId?: string | null) =>
    get<BankAccount[]>(`/ovds/bank-accounts${buildQuery({ companyId })}`),
  get:    (id: string) => get<BankAccount>(`/ovds/bank-accounts/${id}`),
  create: (data: Partial<BankAccount>) => post<BankAccount>('/ovds/bank-accounts', data),
  update: (id: string, data: Partial<BankAccount>) => patch<BankAccount>(`/ovds/bank-accounts/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/bank-accounts/${id}`),
  getTransactions: (id: string, params: { page?: number; limit?: number; companyId?: string } = {}) =>
    get<any>(`/ovds/bank-accounts/${id}/transactions${buildQuery(params)}`),
  addTransaction: (id: string, data: { date: string; description: string; amount: number; reference?: string }) =>
    post<any>(`/ovds/bank-accounts/${id}/transactions`, data),
  reconciliationSummary: (companyId?: string) =>
    get<any>(`/ovds/bank-accounts/reconciliation-summary${buildQuery({ companyId })}`),
};

export const taxRatesApi = {
  list: (activeOnly = false) =>
    get<TaxRate[]>(`/ovds/tax-rates${buildQuery({ active: activeOnly ? 'true' : undefined })}`),
  get:           (id: string) => get<TaxRate>(`/ovds/tax-rates/${id}`),
  create:        (data: Partial<TaxRate>) => post<TaxRate>('/ovds/tax-rates', data),
  update:        (id: string, data: Partial<TaxRate>) => patch<TaxRate>(`/ovds/tax-rates/${id}`, data),
  remove:        (id: string) => del<void>(`/ovds/tax-rates/${id}`),
  seedEthiopian: () => post<any>('/ovds/tax-rates/seed-et', {}),
  bulkActivate:  (ids: string[]) => post<any>('/ovds/tax-rates/bulk-activate', { ids }),
  bulkDeactivate:(ids: string[]) => post<any>('/ovds/tax-rates/bulk-deactivate', { ids }),
  bulkDelete:    (ids: string[]) => post<any>('/ovds/tax-rates/bulk-delete', { ids }),
};

export const companiesApi = {
  list:     () => get<Company[]>('/ovds/companies'),
  stats:    () => get<any>('/ovds/companies/stats'),
  snapshot: (id: string) => get<any>(`/ovds/companies/${id}/snapshot`),
  users:    (id: string) => get<any[]>(`/ovds/companies/${id}/users`),
  create:   (data: Partial<Company>) => post<Company>('/ovds/companies', data),
  update:   (id: string, data: Partial<Company>) => patch<Company>(`/ovds/companies/${id}`, data),
  remove:   (id: string) => del<void>(`/ovds/companies/${id}`),
  seedAccounts: (id: string) => post<any>(`/ovds/companies/${id}/seed-accounts`, {}),
};

export const ovdsSummaryApi = {
  summary:         (companyId?: string | null) => get<any>(`/ovds/summary${buildQuery({ companyId })}`),
  revenueTrend:    (companyId?: string | null) => get<any[]>(`/ovds/revenue-trend${buildQuery({ companyId })}`),
  invoiceStats:    (companyId?: string | null) => get<any>(`/ovds/invoices/stats${buildQuery({ companyId })}`),
  billStats:       (companyId?: string | null) => get<any>(`/ovds/bills/stats${buildQuery({ companyId })}`),
  vatSummary:      (companyId?: string | null) => get<any>(`/ovds/vat/summary${buildQuery({ companyId })}`),
  whtSummary:      (companyId?: string | null, period?: string) => get<any>(`/ovds/wht/summary${buildQuery({ companyId, period })}`),
  taxpayerStatus:  (companyId?: string | null) => get<any>(`/ovds/taxpayer/status${buildQuery({ companyId })}`),
  healthScore:     (companyId?: string | null) => get<any>(`/ovds/reports/health-score${buildQuery({ companyId })}`),
  financialRatios: (companyId?: string | null, date?: string) => get<any>(`/ovds/reports/ratios${buildQuery({ companyId, date })}`),
  workflowProfile: (companyId?: string | null) => get<any>(`/ovds/workflow-profile${buildQuery({ companyId })}`),
  workflowCatalog: (companyId: string, period?: string) => get<any>(`/ovds/workflow/catalog${buildQuery({ companyId, period })}`),
  getWorkflowRun:  (companyId: string, period: string) => get<any>(`/ovds/workflow/${period}${buildQuery({ companyId })}`),
  runWorkflow:     (companyId: string, period: string) => post<any>(`/ovds/workflow/${period}/run?companyId=${companyId}`, {}),
  runWorkflowTask: (companyId: string, period: string, taskId: string) => post<any>(`/ovds/workflow/${period}/run/${taskId}?companyId=${companyId}`, {}),
  resetWorkflowRun:(companyId: string, period: string) => post<any>(`/ovds/workflow/${period}/reset?companyId=${companyId}`, {}),
  workflowSummary: (companyId: string, period: string) => get<any>(`/ovds/workflow/${period}/summary${buildQuery({ companyId })}`),
};

export const accountsApi = {
  list:     (companyId?: string | null) => get<any[]>(`/ovds/accounts${buildQuery({ companyId })}`),
  balances: (companyId?: string | null) => get<any>(`/ovds/accounts/balances${buildQuery({ companyId })}`),
  ledger:   (id: string, dateFrom?: string, dateTo?: string) => get<any>(`/ovds/accounts/${id}/ledger${buildQuery({ dateFrom, dateTo })}`),
  create:   (data: any) => post<any>('/ovds/accounts', data),
  update:   (id: string, data: any) => patch<any>(`/ovds/accounts/${id}`, data),
  postOpeningBalances: (balances: Array<{ accountId: string; balance: number }>, asOfDate: string) =>
    post<any>('/ovds/accounting/opening-balances', { balances, asOfDate }),
  openingBalanceStatus: (companyId?: string) =>
    get<any>(`/ovds/accounting/opening-balance-status${buildQuery({ companyId })}`),
  seed: (companyId: string) => post<any>('/ovds/accounts/seed', { companyId }),
};

export const journalEntriesApi = {
  list: (params: { companyId?: string | null; page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string } = {}) =>
    get<any>(`/ovds/journal-entries${buildQuery(params)}`),
  get:     (id: string) => get<any>(`/ovds/journal-entries/${id}`),
  create:  (data: any) => post<any>('/ovds/journal-entries', data),
  update:  (id: string, data: any) => patch<any>(`/ovds/journal-entries/${id}`, data),
  remove:  (id: string) => del<void>(`/ovds/journal-entries/${id}`),
  post:    (id: string) => post<any>(`/ovds/journal-entries/${id}/post`, {}),
  reverse: (id: string, date?: string) => post<any>(`/ovds/journal-entries/${id}/reverse`, { date }),
};

export const fixedAssetsApi = {
  list:   (companyId?: string) => get<any[]>(`/ovds/fixed-assets${buildQuery({ companyId })}`),
  get:    (id: string) => get<any>(`/ovds/fixed-assets/${id}`),
  create: (data: any) => post<any>('/ovds/fixed-assets', data),
  update: (id: string, data: any) => patch<any>(`/ovds/fixed-assets/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/fixed-assets/${id}`),
  depreciateAll: (period: string, companyId?: string) =>
    post<any>('/ovds/fixed-assets/depreciate-all', { period, companyId }),
  depreciationSchedule: (id: string) => get<any[]>(`/ovds/fixed-assets/${id}/depreciation-schedule`),
};

export const periodCloseApi = {
  list:   (companyId?: string) => get<any[]>(`/ovds/period-close${buildQuery({ companyId })}`),
  status: (period: string, companyId?: string) =>
    get<any>(`/ovds/period-close/status${buildQuery({ period, companyId })}`),
  initiate: (data: { period: string; companyId?: string }) => post<any>('/ovds/period-close', data),
  approve:  (id: string) => post<any>(`/ovds/period-close/${id}/approve`, {}),
};

export const budgetApi = {
  vsActual: (companyId?: string, year?: number, period?: string) =>
    get<any>(`/ovds/reports/budget-vs-actual${buildQuery({ companyId, year, period })}`),
  upsert: (data: any) => post<any>('/ovds/reports/budget', data),
  varianceSummary: (companyId?: string, period?: string) =>
    get<any>(`/ovds/budgets/variance/summary${buildQuery({ companyId, period })}`),
  varianceDetail: (companyId?: string, period?: string) =>
    get<any>(`/ovds/budgets/variance/detail${buildQuery({ companyId, period })}`),
};

export const partnershipsApi = {
  list:   (companyId?: string | null) => get<Partnership[]>(`/ovds/partnerships${buildQuery({ companyId })}`),
  get:    (id: string) => get<Partnership>(`/ovds/partnerships/${id}`),
  create: (data: Partial<Partnership>) => post<Partnership>('/ovds/partnerships', data),
  update: (id: string, data: Partial<Partnership>) => patch<Partnership>(`/ovds/partnerships/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/partnerships/${id}`),
};

export const integrationsApi = {
  list:   () => get<Integration[]>('/apps'),
  get:    (id: string) => get<Integration>(`/apps/${id}`),
  create: (data: Partial<Integration>) => post<Integration>('/apps', data),
  update: (id: string, data: Partial<Integration>) => patch<Integration>(`/apps/${id}`, data),
  remove: (id: string) => del<void>(`/apps/${id}`),
};

export const currencyApi = {
  rates:    (params: { from?: string; to?: string; companyId?: string } = {}) =>
    get<any[]>(`/ovds/currency-rates${buildQuery(params)}`),
  convert:  (amount: number, from: string, to: string) =>
    get<any>(`/ovds/currency-rates/convert${buildQuery({ amount, from, to })}`),
  upsert:   (data: { fromCurrency: string; toCurrency: string; rate: number; source?: string }) =>
    post<any>('/ovds/currency-rates', data),
  fetchLive:() => post<any>('/ovds/currency-rates/fetch-live', {}),
};

export const validationApi = {
  tin:    (tin: string) => get<any>(`/ovds/validate/tin/${encodeURIComponent(tin)}`),
  vat:    (vat: string) => get<any>(`/ovds/validate/vat/${encodeURIComponent(vat)}`),
  nid:    (nid: string) => get<any>(`/ovds/validate/nid/${encodeURIComponent(nid)}`),
  docRef: (ref: string) => get<any>(`/ovds/validate/docref/${encodeURIComponent(ref)}`),
  duplicatePayment: (ref: string, amount?: number) =>
    get<any>(`/ovds/payments/check-duplicate${buildQuery({ ref, amount })}`),
};

export const inventoryOvdsApi = {
  get: (companyId?: string | null, method: 'WA' | 'FIFO' | 'LIFO' = 'WA') =>
    get<any>(`/ovds/inventory${buildQuery({ companyId, method })}`),
  adjust: (data: { itemId: string; quantity: number; type: 'IN' | 'OUT' | 'ADJUSTMENT'; reason?: string; companyId?: string }) =>
    post<any>('/ovds/inventory/adjust', data),
  history: (itemId?: string, companyId?: string) =>
    get<any[]>(`/ovds/inventory/history${itemId ? `/${itemId}` : ''}${buildQuery({ companyId })}`),
  valuation: (companyId?: string) =>
    get<any>(`/ovds/inventory/valuation${buildQuery({ companyId })}`),
};

// ── Invoices & Estimates ─────────────────────────────────────────────────────

export const invoicesApi = {
  list: (params: { companyId?: string | null; search?: string; page?: number; limit?: number; status?: string; dateFrom?: string; dateTo?: string; docType?: string; eimsStatus?: string } = {}) =>
    get<any>(`/ovds/invoices${buildQuery(params)}`),
  get:    (id: string) => get<any>(`/ovds/invoices/${id}`),
  stats:  (companyId?: string | null) => get<any>(`/ovds/invoices/stats${buildQuery({ companyId })}`),
  nextNumber: (companyId?: string | null) => get<any>(`/ovds/invoices/next-number${buildQuery({ companyId })}`),
  create: (data: any) => post<any>('/ovds/invoices', data),
  update: (id: string, data: any) => patch<any>(`/ovds/invoices/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/invoices/${id}`),
  send:   (id: string) => post<any>(`/ovds/invoices/${id}/send`, {}),
  sendReminder: (id: string, body?: any) => post<any>(`/ovds/invoices/${id}/reminder`, body ?? {}),
  bulkSend:   (ids: string[]) => post<any>('/ovds/invoices/bulk-send', { ids }),
  bulkCancel: (ids: string[]) => post<any>('/ovds/invoices/bulk-cancel', { ids }),
  duplicate:  (id: string) => post<any>(`/ovds/invoices/${id}/duplicate`, {}),
  creditNote: (id: string) => post<any>(`/ovds/invoices/${id}/credit-note`, {}),
  debitNote: (id: string, amount: number) =>
    post<any>(`/ovds/invoices/${id}/debit-note`, { amount }),
  void:   (id: string, reason?: string, category?: string) =>
    post<any>(`/ovds/invoices/${id}/void`, { reason, category }),
  flagOverdue: (companyId?: string | null) => post<any>(`/ovds/invoices/flag-overdue`, { companyId }),
  getActivity: (id: string) => get<any[]>(`/ovds/invoices/${id}/activity`),
  share:  (id: string) => post<any>(`/ovds/invoices/${id}/share`, {}),
  recordPayment: (id: string, data: any) => post<any>(`/ovds/invoices/${id}/payments`, data),
  deletePayment: (paymentId: string) => del<void>(`/ovds/payments/${paymentId}`),
  validateCompliance: (id: string) => post<any>(`/ovds/invoices/${id}/validate-compliance`, {}),
  /** Download invoice as a PDF blob — use for programmatic save/attach, not browser print */
  downloadPdf: async (id: string): Promise<Blob> => {
    const token = localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '';
    const res = await fetch(`/api/ovds/invoices/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`PDF download failed: ${res.status}`);
    return res.blob();
  },
  /** Trigger PDF download for multiple invoices as a zip archive */
  bulkDownloadPdf: async (ids: string[]): Promise<Blob> => {
    const token = localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '';
    const res = await fetch('/api/ovds/invoices/bulk-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error(`Bulk PDF failed: ${res.status}`);
    return res.blob();
  },
};

export const estimatesApi = {
  list: (params: { companyId?: string | null; search?: string; page?: number; limit?: number; status?: string } = {}) =>
    get<any>(`/ovds/estimates${buildQuery(params)}`),
  get:    (id: string) => get<any>(`/ovds/estimates/${id}`),
  stats:  (companyId?: string | null) => get<any>(`/ovds/estimates/stats${buildQuery({ companyId })}`),
  nextNumber: (companyId?: string | null) => get<any>(`/ovds/estimates/next-number${buildQuery({ companyId })}`),
  create: (data: any) => post<any>('/ovds/estimates', data),
  update: (id: string, data: any) => patch<any>(`/ovds/estimates/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/estimates/${id}`),
  send:   (id: string) => post<any>(`/ovds/estimates/${id}/send`, {}),
  convertToInvoice: (id: string) => post<any>(`/ovds/estimates/${id}/convert`, {}),
  // Aliases — EstimatesPanel in Invoices.tsx calls these names
  delete:  (id: string) => del<void>(`/ovds/estimates/${id}`),
  convert: (id: string) => post<any>(`/ovds/estimates/${id}/convert`, {}),
};

// ── Fixed Asset Disposals ────────────────────────────────────────────────────

export const fixedAssetDisposalsApi = {
  list:    (companyId?: string | null) => get<any[]>(`/ovds/accounting/fixed-asset-disposals${buildQuery({ companyId })}`),
  get:     (id: string) => get<any>(`/ovds/accounting/fixed-asset-disposals/${id}`),
  dispose: (data: any) => post<any>('/ovds/accounting/fixed-asset-disposals', data),
  update:  (id: string, data: any) => patch<any>(`/ovds/accounting/fixed-asset-disposals/${id}`, data),
  remove:  (id: string) => del<void>(`/ovds/accounting/fixed-asset-disposals/${id}`),
};

// ── Entity Groups ────────────────────────────────────────────────────────────

export const entityGroupsApi = {
  list:   (companyId?: string | null) => get<any[]>(`/ovds/accounting/entity-groups${buildQuery({ companyId })}`),
  get:    (id: string) => get<any>(`/ovds/accounting/entity-groups/${id}`),
  create: (data: any) => post<any>('/ovds/accounting/entity-groups', data),
  update: (id: string, data: any) => patch<any>(`/ovds/accounting/entity-groups/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/accounting/entity-groups/${id}`),
};

// ── Translation Reserves ─────────────────────────────────────────────────────

export const translationReservesApi = {
  list:   (companyId?: string | null) => get<any[]>(`/ovds/accounting/translation-reserves${buildQuery({ companyId })}`),
  get:    (id: string) => get<any>(`/ovds/accounting/translation-reserves/${id}`),
  create: (data: any) => post<any>('/ovds/accounting/translation-reserves', data),
  update: (id: string, data: any) => patch<any>(`/ovds/accounting/translation-reserves/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/accounting/translation-reserves/${id}`),
};

// ── Reports ──────────────────────────────────────────────────────────────────

export const reportDefinitionsApi = {
  list:   (companyId?: string | null) => get<any[]>(`/ovds/reports/definitions${buildQuery({ companyId })}`),
  get:    (id: string) => get<any>(`/ovds/reports/definitions/${id}`),
  create: (data: any) => post<any>('/ovds/reports/definitions', data),
  update: (id: string, data: any) => patch<any>(`/ovds/reports/definitions/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/reports/definitions/${id}`),
};

export const reportLinesApi = {
  list:   (definitionId: string, companyId?: string | null) =>
    get<any[]>(`/ovds/reports/definitions/${definitionId}/lines${buildQuery({ companyId })}`),
  get:    (definitionId: string, id: string) => get<any>(`/ovds/reports/definitions/${definitionId}/lines/${id}`),
  create: (definitionId: string, data: any) => post<any>(`/ovds/reports/definitions/${definitionId}/lines`, data),
  update: (definitionId: string, id: string, data: any) =>
    patch<any>(`/ovds/reports/definitions/${definitionId}/lines/${id}`, data),
  remove: (definitionId: string, id: string) => del<void>(`/ovds/reports/definitions/${definitionId}/lines/${id}`),
};

// ── Period Close Workflow ────────────────────────────────────────────────────

export const periodCloseWorkflowApi = {
  runUnified: (companyId: string, year: number, month: number) =>
    post<any>(`/ovds/workflow/${year}-${String(month).padStart(2, '0')}/run-unified`, { companyId }),
  status: (companyId: string, period: string) =>
    get<any>(`/ovds/workflow/${period}/summary${buildQuery({ companyId })}`),
};

