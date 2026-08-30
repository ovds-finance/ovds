/**
 * Tax domain API client — @ovds/features/tax
 *
 * Covers: VAT, TOT, BIT/Schedule-D, WHT, DRRF, PAYE, Pension,
 * TaxFilings, ETax integration, ERCA compliance, Universal Tax Config.
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

function qs(p: { [key: string]: string | number | boolean | null | undefined }): string {
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

// ── VAT ───────────────────────────────────────────────────────────────────────

export interface VatFilingParams {
  companyId?: string | null;
  period?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export const vatApi = {
  summary:    (companyId?: string | null) => get<any>(`/tax/vat/summary${qs({ companyId })}`),
  filings:    (params: VatFilingParams = {}) => get<any>(`/tax/vat/filings${qs(params)}`),
  getFiling:  (id: string) => get<any>(`/tax/vat/filings/${id}`),
  compute:    (companyId: string, period: string) =>
    post<any>('/tax/vat/compute', { companyId, period }),
  submit:     (id: string) => post<any>(`/tax/vat/filings/${id}/submit`),
  acknowledge:(id: string, data: { acknowledgementNumber: string; submittedAt: string }) =>
    post<any>(`/tax/vat/filings/${id}/acknowledge`, data),
  createAmendment: (id: string, data: any) =>
    post<any>(`/tax/vat/filings/${id}/amend`, data),
  input:      (companyId?: string | null, period?: string) =>
    get<any>(`/tax/vat/input${qs({ companyId, period })}`),
  output:     (companyId?: string | null, period?: string) =>
    get<any>(`/tax/vat/output${qs({ companyId, period })}`),
  administration: (companyId?: string | null) =>
    get<any>(`/tax/vat/administration${qs({ companyId })}`),
};

// ── TOT (Turnover Tax) ────────────────────────────────────────────────────────

export const totApi = {
  filings:   (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/tax/tot/filings${qs(params)}`),
  compute:   (companyId: string, period: string) =>
    post<any>('/tax/tot/compute', { companyId, period }),
  submit:    (id: string) => post<any>(`/tax/tot/filings/${id}/submit`),
  dashboard: (companyId?: string | null) => get<any>(`/tax/tot/dashboard${qs({ companyId })}`),
};

// ── BIT / Business Income Tax ─────────────────────────────────────────────────

export const bitApi = {
  filings:   (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/tax/bit/filings${qs(params)}`),
  compute:   (companyId: string, year: number) =>
    post<any>('/tax/bit/compute', { companyId, year }),
  submit:    (id: string) => post<any>(`/tax/bit/filings/${id}/submit`),
  advance:   (companyId?: string | null) => get<any>(`/tax/bit/advance${qs({ companyId })}`),
  dashboard: (companyId?: string | null) => get<any>(`/tax/bit/dashboard${qs({ companyId })}`),
  estimator: (companyId?: string | null, year?: number) =>
    get<any>(`/tax/bit/estimator${qs({ companyId, year })}`),
};

// ── Schedule-D Tax ────────────────────────────────────────────────────────────

export const scheduleD = {
  list:   (companyId?: string | null, year?: number) =>
    get<any[]>(`/tax/schedule-d${qs({ companyId, year })}`),
  compute:(companyId: string, year: number) =>
    post<any>('/tax/schedule-d/compute', { companyId, year }),
  submit: (id: string) => post<any>(`/tax/schedule-d/${id}/submit`),
};

// ── WHT (Withholding Tax) ─────────────────────────────────────────────────────

export const whtApi = {
  certificates: (params: { companyId?: string | null; page?: number; limit?: number; status?: string } = {}) =>
    get<any>(`/tax/wht/certificates${qs(params)}`),
  getCertificate:(id: string) => get<any>(`/tax/wht/certificates/${id}`),
  create:        (data: any) => post<any>('/tax/wht/certificates', data),
  update:        (id: string, data: any) => patch<any>(`/tax/wht/certificates/${id}`, data),
  remove:        (id: string) => del<void>(`/tax/wht/certificates/${id}`),
  summary:       (companyId?: string | null, period?: string) =>
    get<any>(`/tax/wht/summary${qs({ companyId, period })}`),
  submit:        (id: string) => post<any>(`/tax/wht/certificates/${id}/submit`),
};

// ── DRRF (Disaster Risk Reduction Fund) ──────────────────────────────────────

export const drrfApi = {
  summary: (companyId?: string | null, period?: string) =>
    get<any>(`/tax/drrf/summary${qs({ companyId, period })}`),
  filings: (params: { companyId?: string | null; page?: number } = {}) =>
    get<any>(`/tax/drrf/filings${qs(params)}`),
  compute: (companyId: string, period: string) =>
    post<any>('/tax/drrf/compute', { companyId, period }),
  submit:  (id: string) => post<any>(`/tax/drrf/filings/${id}/submit`),
};

// ── PAYE / Payroll Tax ────────────────────────────────────────────────────────

export const payeApi = {
  declarations: (params: { companyId?: string | null; year?: number; month?: number; page?: number } = {}) =>
    get<any>(`/tax/paye/declarations${qs(params)}`),
  getDeclaration: (id: string) => get<any>(`/tax/paye/declarations/${id}`),
  generate:       (companyId: string, year: number, month: number) =>
    post<any>('/tax/paye/generate', { companyId, year, month }),
  submit:         (id: string) => post<any>(`/tax/paye/declarations/${id}/submit`),
};

// ── Pension ───────────────────────────────────────────────────────────────────

export const pensionApi = {
  remittances: (params: { companyId?: string | null; page?: number } = {}) =>
    get<any>(`/tax/pension/remittances${qs(params)}`),
  generate:    (companyId: string, year: number, month: number) =>
    post<any>('/tax/pension/generate', { companyId, year, month }),
  submit:      (id: string) => post<any>(`/tax/pension/remittances/${id}/submit`),
};

// ── Excise / Stamp / Property / Custom Duties ─────────────────────────────────

export const exciseTaxApi = {
  items:    (companyId?: string | null) => get<any[]>(`/tax/excise/items${qs({ companyId })}`),
  compute:  (companyId: string, period: string) =>
    post<any>('/tax/excise/compute', { companyId, period }),
  filings:  (params: { companyId?: string | null; page?: number } = {}) =>
    get<any>(`/tax/excise/filings${qs(params)}`),
};

export const stampDutyApi = {
  list:     (companyId?: string | null) => get<any[]>(`/tax/stamp-duty${qs({ companyId })}`),
  calculate:(data: { transactionType: string; amount: number }) =>
    post<any>('/tax/stamp-duty/calculate', data),
};

export const propertyTaxApi = {
  assessments: (companyId?: string | null) => get<any[]>(`/tax/property-tax${qs({ companyId })}`),
  calculate:   (data: { propertyValue: number; type: string }) =>
    post<any>('/tax/property-tax/calculate', data),
};

// ── Universal Tax Config ──────────────────────────────────────────────────────

export const universalTaxConfigApi = {
  get:    (companyId: string) => get<any>(`/tax/universal-config${qs({ companyId })}`),
  update: (companyId: string, data: any) => patch<any>(`/tax/universal-config`, { ...data, companyId }),
  seed:   (companyId: string) => post<any>('/tax/universal-config/seed', { companyId }),
};

// ── Tax Dashboard ─────────────────────────────────────────────────────────────

export const taxDashboardApi = {
  overview:       (companyId?: string | null) => get<any>(`/tax/dashboard${qs({ companyId })}`),
  liabilities:    (companyId?: string | null, period?: string) =>
    get<any>(`/tax/dashboard/liabilities${qs({ companyId, period })}`),
  calendar:       (companyId?: string | null, year?: number) =>
    get<any>(`/tax/dashboard/calendar${qs({ companyId, year })}`),
  taxpayerStatus: (companyId?: string | null) =>
    get<any>(`/tax/taxpayer/status${qs({ companyId })}`),
  ercaDashboard:  (companyId?: string | null) =>
    get<any>(`/tax/erca/dashboard${qs({ companyId })}`),
};

// ── ETax / ERCA Integration ───────────────────────────────────────────────────

export const etaxApi = {
  submit:     (filingId: string, type: string) =>
    post<any>('/tax/etax/submit', { filingId, type }),
  status:     (submissionId: string) => get<any>(`/tax/etax/status/${submissionId}`),
  acknowledge:(data: { submissionId: string; tin: string }) =>
    post<any>('/tax/etax/acknowledge', data),
  penaltyCalc:(companyId: string, filingType: string, dueDate: string) =>
    post<any>('/tax/erca/penalty-calculate', { companyId, filingType, dueDate }),
};

// ── Tax Acknowledgement Vault ─────────────────────────────────────────────────

export const taxVaultApi = {
  list:   (companyId?: string | null) => get<any[]>(`/tax/vault${qs({ companyId })}`),
  get:    (id: string) => get<any>(`/tax/vault/${id}`),
  upload: (data: any) => post<any>('/tax/vault', data),
  remove: (id: string) => del<void>(`/tax/vault/${id}`),
};

// ── Tax Filing (general) ──────────────────────────────────────────────────────

export const taxFilingsApi = {
  list:   (params: { companyId?: string | null; type?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/tax/filings${qs(params)}`),
  get:    (id: string) => get<any>(`/tax/filings/${id}`),
  submit: (id: string) => post<any>(`/tax/filings/${id}/submit`),
  history:(companyId?: string | null) => get<any[]>(`/tax/filings/history${qs({ companyId })}`),
};

// ── Tax Payment References ────────────────────────────────────────────────────

export const taxPaymentRefApi = {
  list:     (companyId?: string | null) => get<any[]>(`/tax/payment-references${qs({ companyId })}`),
  generate: (filingId: string) => post<any>('/tax/payment-references', { filingId }),
  verify:   (ref: string) => get<any>(`/tax/payment-references/verify/${ref}`),
};

// ── Tax Filing Actions ─────────────────────────────────────────────────────────

export async function recordTaxFiling(dto: {
  type: string;
  year?: number;
  period?: string;
  amount?: number;
  taxDue?: number;
  taxableIncome?: number;
  notes?: string;
  matAmount?: number;
}): Promise<any> {
  const backendDto = {
    ...dto,
    type: dto.type === 'BIT' ? 'INCOME_TAX' : dto.type,
    period: dto.type === 'BIT' || dto.type === 'INCOME_TAX'
      ? String(dto.year ?? new Date().getFullYear())
      : dto.period,
    amount: dto.amount ?? dto.taxDue ?? 0,
  };
  const res = await post<any>('/tax/filing', backendDto);
  return res?.data ?? res;
}

export async function generateETaxPayload(payload: {
  filingId: string;
  type: string;
  period: string;
}): Promise<{ eTaxPayload: typeof payload }> {
  const res = await post<any>('/tax/etax-payload', payload);
  return { eTaxPayload: res?.data ?? payload };
}

export async function exportETaxJson(period: string): Promise<Blob> {
  const fullUrl = `${getBase()}/tax/export-etax/${period}`;
  const res = await fetch(fullUrl, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.blob();
}

export async function submitToETax(filingId: string): Promise<any> {
  const res = await post<any>(`/tax/submit-to-etax/${filingId}`);
  return res?.data ?? res;
}

export async function syncBankTransactions(bankAccountId: string): Promise<any> {
  const res = await post<any>(`/tax/sync-bank-transactions/${bankAccountId}`);
  return res?.data ?? res;
}

// ── TOT Actions ────────────────────────────────────────────────────────────────

export async function calculateTot(period: string): Promise<{
  period: string;
  goodsAmount: number;
  servicesAmount: number;
  totGoods: number;
  totServices: number;
  netPayable: number;
}> {
  const res = await get<any>(`/tax/tot/${period}`);
  return res?.data ?? res;
}

export async function triggerAutoComputeTot(period?: string): Promise<{
  computed: boolean;
  period: string;
  message: string;
  totGoods?: number;
  totServices?: number;
  netPayable?: number;
}> {
  const res = await post<any>('/tax/auto-compute-tot', period ? { period } : {});
  return res?.data ?? res;
}

// ── Tax Filing Recording ───────────────────────────────────────────────────────

export async function recordBITFiling(
  year: number,
  amount: number,
  opts: { taxableIncome?: number; notes?: string; matAmount?: number } = {},
): Promise<any> {
  const res = await post<any>('/tax/filing', {
    type: 'INCOME_TAX',
    period: String(year),
    amount,
    taxableIncome: opts.taxableIncome,
    matAmount: opts.matAmount,
    notes: opts.notes,
    ias12Treatment: 'EXPENSE',
  });
  return res?.data ?? res;
}

export async function recordDRRFRemittance(
  period: string,
  amount: number,
  opts: { drrfCategory?: string; notes?: string } = {},
): Promise<any> {
  const res = await post<any>('/tax/filing', {
    type: 'DRRF',
    period,
    amount,
    drrfCategory: opts.drrfCategory ?? 'OTHER',
    notes: opts.notes,
    ias12Treatment: 'NOT_INCOME_TAX',
  });
  return res?.data ?? res;
}

export async function recordWHTRemittance(
  period: string,
  amount: number,
  opts: { whtType?: string; notes?: string } = {},
): Promise<any> {
  const res = await post<any>('/tax/filing', {
    type: 'WITHHOLDING',
    period,
    amount,
    whtType: opts.whtType ?? 'SERVICES',
    notes: opts.notes,
    ias12Treatment: 'NOT_INCOME_TAX',
  });
  return res?.data ?? res;
}

// ── ERCA Penalty Calculator ────────────────────────────────────────────────────

export async function calculateERCAPenalty(params: {
  taxType: 'VAT' | 'BIT' | 'WHT' | 'DRRF' | 'TOT' | 'PIT' | 'PENSION';
  taxDue: number;
  dueDate: string;
  paymentDate: string;
}): Promise<any> {
  const res = await post<any>('/tax/calculate-penalty', params);
  return res?.data ?? res;
}

// ── Universal Tax Config ───────────────────────────────────────────────────────

export async function updateCompanyTaxProfile(
  updates: Record<string, unknown>,
  companyId?: string,
): Promise<any> {
  const q = companyId ? `?companyId=${companyId}` : '';
  const res = await patch<any>(`/tax/universal/profile${q}`, updates);
  return res?.data ?? res;
}

export async function resolveTaxesForTransaction(params: {
  amountEtb: number;
  transactionType: 'GOODS' | 'SERVICES' | 'CONSTRUCTION_GRAIN_FARM' | 'IMPORT' | 'CONTRACT';
  isNonResident?: boolean;
  applyWht?: boolean;
  isContract?: boolean;
  importCifEtb?: number;
  companyId?: string;
}): Promise<any> {
  const { companyId, ...body } = params;
  const q = companyId ? `?companyId=${companyId}` : '';
  const res = await post<any>(`/tax/universal/resolve${q}`, body);
  return res?.data ?? res;
}

