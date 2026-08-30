/**
 * Banking domain API client — @ovds/features/banking
 *
 * Covers: Bank Accounts, Transactions, Reconciliation, FX Rates,
 * Bank Feeds (CSV / OFX / MT940 / OCR), Transfers, Recurring.
 *
 * No imports from apps/. Types from @ovds/contracts/schemas.
 */

// ── HTTP primitives ──────────────────────────────────────────────────────────

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  const loc = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  if (loc) { h['x-locale'] = loc; h['Accept-Language'] = loc; }
  return h;
}

async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}

function qs(p: object): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get   = <T>(url: string) => req<T>(url);
const post  = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);
const del   = <T>(url: string) => req<T>(url, 'DELETE');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BankAccountListParams {
  companyId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionListParams {
  companyId?: string | null;
  bankAccountId?: string;
  status?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ── Bank Accounts ─────────────────────────────────────────────────────────────

export const bankAccountsApi = {
  list:    (params: BankAccountListParams = {}) =>
    get<any>('/banking/accounts' + qs(params)),
  get:     (id: string) => get<any>(`/banking/accounts/${id}`),
  create:  (data: any) => post<any>('/banking/accounts', data),
  update:  (id: string, data: any) => patch<any>(`/banking/accounts/${id}`, data),
  remove:  (id: string) => del<void>(`/banking/accounts/${id}`),
  balance: (id: string) => get<any>(`/banking/accounts/${id}/balance`),
  reconciliationSummary: (companyId?: string | null) =>
    get<any>('/banking/reconciliation/stats' + qs({ companyId })),
  importOfx:   (id: string, ofxContent: string) =>
    post<any>(`/banking/feeds/${id}/import`, { content: ofxContent, format: 'OFX' }),
  importMt940: (id: string, mt940Content: string) =>
    post<any>(`/banking/feeds/${id}/import`, { content: mt940Content, format: 'MT940' }),
  importCsv:   (id: string, csvContent: string) =>
    post<any>(`/banking/feeds/${id}/import`, { content: csvContent, format: 'CSV' }),
  extractStatement: (id: string, base64Image: string, mimeType: string) =>
    post<any>(`/banking/feeds/${id}/import`, { content: base64Image, format: mimeType.includes('pdf') ? 'PDF' : 'IMAGE' }),
  // Recurring transactions
  listRecurring: (accountId: string) =>
    get<any>(`/banking/accounts/${accountId}/recurring`),
  createRecurring: (accountId: string, data: any) =>
    post<any>(`/banking/accounts/${accountId}/recurring`, data),
  deleteRecurring: (accountId: string, templateId: string) =>
    del<void>(`/banking/accounts/${accountId}/recurring/${templateId}`),
  postRecurring: (templateId: string, data: { date: string }) =>
    post<any>(`/banking/recurring/${templateId}/post`, data),
};

// ── Transactions ──────────────────────────────────────────────────────────────

export const bankTransactionsApi = {
  list:    (params: TransactionListParams = {}) =>
    get<any>('/banking/transactions' + qs(params)),
  get:     (id: string) => get<any>(`/banking/transactions/${id}`),
  create:  (data: any) => post<any>('/banking/transactions', data),
  update:  (id: string, data: any) => patch<any>(`/banking/transactions/${id}`, data),
  remove:  (id: string) => del<void>(`/banking/transactions/${id}`),
  reconcile: (id: string) => patch<any>(`/banking/transactions/${id}/reconcile`, {}),
  bulkReconcile: (ids: string[]) =>
    post<any>('/banking/transactions/bulk-reconcile', { ids }),
  match:   (id: string, payload: { matchType: 'INVOICE' | 'BILL'; matchId: string }) =>
    post<any>(`/banking/transactions/${id}/match`, payload),
  unmatch: (id: string) => post<any>(`/banking/transactions/${id}/unmatch`, {}),
  linkInvoice: (id: string, invoiceId: string) =>
    patch<any>(`/banking/transactions/${id}/link-invoice`, { invoiceId }),
  linkBill: (id: string, billId: string) =>
    patch<any>(`/banking/transactions/${id}/link-bill`, { billId }),
  categorize: (id: string, categoryId?: string, categoryName?: string) =>
    patch<any>(`/banking/transactions/${id}/categorize`, { categoryId, categoryName }),
  import:  (bankAccountId: string, rows: any[]) =>
    post<any>('/banking/transactions/import', { bankAccountId, rows }),
  stats:   (companyId?: string | null, bankAccountId?: string) =>
    get<any>('/banking/reconciliation/stats' + qs({ companyId, bankAccountId })),
};

// ── Reconciliation ────────────────────────────────────────────────────────────

export const reconciliationApi = {
  stats:    (companyId?: string | null) =>
    get<any>('/banking/reconciliation/stats' + qs({ companyId })),
  pending:  (params: { companyId?: string; bankAccountId?: string; page?: number; limit?: number; status?: string; search?: string } = {}) =>
    get<any>('/banking/reconciliation/pending' + qs(params)),
  run:      (params: { companyId?: string; bankAccountId?: string; applyAutoReconcile?: boolean; dateWindowDays?: number } = {}) =>
    post<any>('/banking/reconciliation/run', params),
  proposals: (transactionId: string, companyId?: string | null) =>
    get<any>(`/banking/reconciliation/transaction/${transactionId}/proposals${qs({ companyId })}`),
  confirm:  (transactionId: string, matchType: 'INVOICE' | 'BILL', matchId: string) =>
    post<any>(`/banking/reconciliation/transaction/${transactionId}/confirm`, { matchType, matchId }),
  dismiss:  (transactionId: string) =>
    post<any>(`/banking/reconciliation/transaction/${transactionId}/dismiss`, {}),
  periods:  (params: { companyId?: string; bankAccountId?: string; page?: number } = {}) =>
    get<any>('/banking/reconciliation/periods' + qs(params)),
  createPeriod: (data: any) =>
    post<any>('/banking/reconciliation/periods', data),
  completePeriod: (id: string, notes?: string) =>
    post<any>(`/banking/reconciliation/periods/${id}/complete`, { notes }),
  approvePeriod: (id: string) =>
    post<any>(`/banking/reconciliation/periods/${id}/approve`, {}),
  lockPeriod: (id: string) =>
    post<any>(`/banking/reconciliation/periods/${id}/lock`, {}),
  reports:  (params: { companyId?: string; periodId?: string; page?: number } = {}) =>
    get<any>('/banking/reconciliation/reports' + qs(params)),
  generateReport: (data: { periodId: string; reportType?: string }) =>
    post<any>('/banking/reconciliation/reports', data),
  approveReport: (id: string) =>
    post<any>(`/banking/reconciliation/reports/${id}/approve`, {}),
};

// ── Fund Transfers ─────────────────────────────────────────────────────────────

export const transfersApi = {
  list:    (params: { companyId?: string | null; page?: number; limit?: number; status?: string; type?: string } = {}) =>
    get<any>('/banking/transfers' + qs(params)),
  get:     (id: string) => get<any>(`/banking/transfers/${id}`),
  create:  (data: any) => post<any>('/banking/transfers', data),
  approve: (id: string) => patch<any>(`/banking/transfers/${id}/approve`, {}),
  reject:  (id: string) => patch<any>(`/banking/transfers/${id}/reject`, {}),
  remove:  (id: string) => del<void>(`/banking/transfers/${id}`),
};

// ── Bank Feeds ──────────────────────────────────────────────────────────────────

export const bankFeedsApi = {
  list:      (companyId?: string | null) =>
    get<any>('/banking/feeds' + qs({ companyId })),
  connect:   (data: { bankAccountId: string; provider: string; institutionId?: string; companyId?: string }) =>
    post<any>('/banking/feeds', data),
  sync:      (id: string) =>
    post<any>(`/banking/feeds/${id}/sync`, {}),
  disconnect: (id: string) =>
    del<void>(`/banking/feeds/${id}`),
  reauthenticate: (id: string) =>
    post<any>(`/banking/feeds/${id}/reauthenticate`, {}),
  importStatement: (id: string, content: string, format: 'OFX' | 'CSV' | 'MT940') =>
    post<any>(`/banking/feeds/${id}/import`, { content, format }),
};

// ── Categories & Rules ─────────────────────────────────────────────────────────

export const categoriesApi = {
  list:    (companyId?: string | null, type?: string) =>
    get<any>('/banking/categories' + qs({ companyId, type })),
};

export const rulesApi = {
  list:    (companyId?: string | null) =>
    get<any>('/banking/rules' + qs({ companyId })),
  create:  (data: any) =>
    post<any>('/banking/rules', data),
  update:  (id: string, data: any) =>
    patch<any>(`/banking/rules/${id}`, data),
  delete:  (id: string) =>
    del<void>(`/banking/rules/${id}`),
  test:    (pattern: string, companyId?: string | null) =>
    post<any>('/banking/rules/test', { pattern, companyId }),
  apply:   (companyId?: string | null) =>
    post<any>('/banking/rules/apply' + qs({ companyId })),
};

// ── FX Rates ──────────────────────────────────────────────────────────────────

export const fxRatesApi = {
  list:      (params: { from?: string; to?: string; companyId?: string; limit?: number } = {}) =>
    get<any>('/banking/fx-rates' + qs(params)),
  get:       (from: string, to: string, date?: string, companyId?: string) =>
    get<any>(`/banking/fx-rates/${from}/${to}` + qs({ date, companyId })),
  upsert:    (data: { fromCurrency: string; toCurrency: string; rate: number; rateDate?: string; source?: string; companyId?: string }) =>
    post<any>('/banking/fx-rates', data),
  convert:   (amount: number, from: string, to: string, companyId?: string) =>
    post<any>('/banking/fx-rates/convert', { amount, from, to, companyId }),
  listAdjustments: (params: { companyId?: string; bankTransactionId?: string } = {}) =>
    get<any>('/banking/fx-rates/adjustments' + qs(params)),
};

// ── Duplicates ─────────────────────────────────────────────────────────────────

export const duplicatesApi = {
  detect:   (companyId?: string | null, bankAccountId?: string, windowDays?: number) =>
    get<any>('/banking/transactions/duplicates' + qs({ companyId, bankAccountId, windowDays })),
  delete:   (companyId?: string | null) =>
    del<void>('/banking/transactions/duplicates' + qs({ companyId })),
};

// ── Cash Flow Report ───────────────────────────────────────────────────────────

export const reportsApi = {
  cashFlow: (companyId?: string | null, months?: number) =>
    get<any>('/banking/reports/cash-flow' + qs({ companyId, months })),
};

