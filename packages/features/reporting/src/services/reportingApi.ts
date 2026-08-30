/**
 * Reporting domain API client — @ovds/features/reporting
 *
 * Covers: Financial Statements (Bundle, Balance Sheet, P&L, Cash Flow,
 * Trial Balance), IFRS (IAS 12 Deferred Tax, IFRS 9 ECL, IFRS 15,
 * IFRS 10 Consolidation, IAS 1 Equity), AR/AP Aging + Dunning,
 * Approval Workflows, GRN / 3-Way Match, Budget vs Actual.
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

function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get  = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});

// ── Financial Statements Bundle ───────────────────────────────────────────────

export const financialStatementsApi = {
  /** All four statements + trial balance + CIT estimate in one request */
  bundle: (params: { companyId?: string; startDate?: string; endDate?: string; comparePriorYear?: boolean } = {}) =>
    get<any>(`/ovds/reports/bundle${qs(params)}`),
  balanceSheet:     (params: { companyId?: string; date?: string } = {}) =>
    get<any>(`/ovds/reports/balance-sheet${qs(params)}`),
  incomeStatement:  (params: { companyId?: string; startDate?: string; endDate?: string } = {}) =>
    get<any>(`/ovds/reports/income-statement${qs(params)}`),
  cashFlow:         (params: { companyId?: string; startDate?: string; endDate?: string } = {}) =>
    get<any>(`/ovds/reports/cash-flow${qs(params)}`),
  trialBalance:     (params: { companyId?: string; date?: string } = {}) =>
    get<any>(`/ovds/reports/trial-balance${qs(params)}`),
  generalLedger:    (params: { companyId?: string; accountId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/ovds/reports/general-ledger${qs(params)}`),
  healthScore:      (companyId?: string) =>
    get<any>(`/ovds/reports/health-score${qs({ companyId })}`),
  financialRatios:  (companyId?: string, date?: string) =>
    get<any>(`/ovds/reports/ratios${qs({ companyId, date })}`),
  budgetVsActual:   (params: { companyId?: string; year?: number; period?: string } = {}) =>
    get<any>(`/ovds/reports/budget-vs-actual${qs(params)}`),
};

// ── IFRS Reports ──────────────────────────────────────────────────────────────

export const ifrsReportsApi = {
  /** IAS 12 — Deferred Tax */
  deferredTax:       (companyId?: string, date?: string) =>
    get<any>(`/ovds/reports/deferred-tax${qs({ companyId, date })}`),
  postDeferredTax:   (companyId?: string, date?: string) =>
    post<any>('/ovds/reports/deferred-tax/post', { companyId, date }),

  /** IFRS 9 — Expected Credit Loss */
  ecl:               (companyId?: string, date?: string) =>
    get<any>(`/ovds/reports/ifrs9-ecl${qs({ companyId, date })}`),

  /** IFRS 15 — Revenue Recognition */
  ifrs15Schedule:    (companyId?: string, date?: string) =>
    get<any>(`/ovds/reports/ifrs15/schedule${qs({ companyId, date })}`),
  ifrs15Contract:    (invoiceId: string, companyId?: string) =>
    get<any>(`/ovds/reports/ifrs15/contract/${invoiceId}${qs({ companyId })}`),
  ifrs15Compliance:  (companyId?: string) =>
    get<any>(`/ovds/reports/ifrs15/compliance-check${qs({ companyId })}`),

  /** IAS 1 — Statement of Changes in Equity */
  changesInEquity:   (params: { companyId?: string; startDate?: string; endDate?: string } = {}) =>
    get<any>(`/ovds/reports/changes-in-equity${qs(params)}`),

  /** IFRS 10 — Group Consolidation */
  consolidation:     (parentCompanyId: string, params: { asOfDate?: string; startDate?: string; endDate?: string } = {}) =>
    get<any>(`/ovds/reports/consolidation/${parentCompanyId}${qs(params)}`),

  /** MoR Tax Bridge */
  morBridge:         (companyId?: string, period?: string) =>
    get<any>(`/ovds/reports/mor-tax-bridge${qs({ companyId, period })}`),
};

// ── AR / AP Aging + Dunning ───────────────────────────────────────────────────

export const agingApi = {
  arAging:      (companyId?: string, date?: string) =>
    get<any>(`/ovds/reports/ar-aging-full${qs({ companyId, date })}`),
  apAging:      (companyId?: string, date?: string) =>
    get<any>(`/ovds/reports/ap-aging-full${qs({ companyId, date })}`),
  runDunning:   (companyId?: string, dryRun = true) =>
    post<any>('/ovds/reports/dunning/run', { companyId, dryRun }),
  postEcl:      (companyId?: string, date?: string) =>
    post<any>('/ovds/reports/dunning/post-ecl-provision', { companyId, date }),
};

// ── Approval Workflows ────────────────────────────────────────────────────────

export const approvalApi = {
  rules:       (companyId?: string) =>
    get<any[]>(`/ovds/reports/approval/rules${qs({ companyId })}`),
  upsertRule:  (rule: any, companyId?: string) =>
    post<any>('/ovds/reports/approval/rules', { ...rule, companyId }),
  seedRules:   (companyId?: string) =>
    post<any>('/ovds/reports/approval/rules/seed', { companyId }),
  pending:     (companyId?: string) =>
    get<any[]>(`/ovds/reports/approval/pending${qs({ companyId })}`),
  approve:     (requestId: string, companyId?: string, comments?: string) =>
    post<any>(`/ovds/reports/approval/${requestId}/approve`, { companyId, comments }),
  reject:      (requestId: string, reason: string, companyId?: string) =>
    post<any>(`/ovds/reports/approval/${requestId}/reject`, { reason, companyId }),
};

// ── GRN / 3-Way Match ─────────────────────────────────────────────────────────

export const grnApi = {
  list:          (params: { companyId?: string; status?: string; purchaseOrderId?: string } = {}) =>
    get<any>(`/ovds/grn${qs(params)}`),
  get:           (id: string) => get<any>(`/ovds/grn/${id}`),
  stats:         (companyId?: string) => get<any>(`/ovds/grn/stats${qs({ companyId })}`),
  create:        (data: any, companyId?: string) =>
    post<any>('/ovds/grn', { ...data, companyId }),
  confirm:       (id: string) => post<any>(`/ovds/grn/${id}/confirm`),
  linkBill:      (id: string, billId: string) =>
    post<any>(`/ovds/grn/${id}/link-bill`, { billId }),
  threeWayMatch: (id: string) => get<any>(`/ovds/grn/${id}/three-way-match`),
  remove:        (id: string) => req<void>(`/ovds/grn/${id}`, 'DELETE'),
};

