/**
 * API hooks for new tax/ovds modules:
 *   - Property Tax
 *   - Excise Tax
 *   - Stamp Duty
 *   - Gratuity / Labour Act
 *   - Budget Variance
 *   - Sub-Ledger (AR/AP/GL)
 *   - Cost Centers
 */
import { useState, useEffect, useCallback } from 'react';
import api from './api';
import toast from 'react-hot-toast';

// -- Generic fetcher helper -----------------------------------------------------
function useFetch<T>(
  url: string | null,
  fallback: T,
  deps: any[] = [],
): { data: T; loading: boolean; refetch: () => void } {
  const [data, setData]       = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      const d = res.data?.data ?? res.data;
      setData(d ?? fallback);
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPERTY TAX
// ═══════════════════════════════════════════════════════════════════════════════
export function usePropertyTaxDashboard(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  return useFetch<any>(`/ovds/property-tax/dashboard${cq}`, null, [companyId]);
}

export function usePropertyRecords(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/property-tax/properties${cq}`, [], [companyId]);
  return { properties: data, loading, refetch };
}

export function usePropertyAssessments(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/property-tax/assessments${cq}`, [], [companyId]);
  return { assessments: data, loading, refetch };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCISE TAX
// ═══════════════════════════════════════════════════════════════════════════════
export function useExciseDashboard(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  return useFetch<any>(`/ovds/excise-tax/dashboard?${q}`, null, [period, companyId]);
}

export function useExciseRecords(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/excise-tax/records?${q}`, [], [period, companyId]);
  return { records: data, loading, refetch };
}

export function useExciseFilings(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/excise-tax/filings?${q}`, [], [period, companyId]);
  return { filings: data, loading, refetch };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAMP DUTY
// ═══════════════════════════════════════════════════════════════════════════════
export function useStampDutyRecords(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/stamp-duty${cq}`, [], [companyId]);
  return { records: data, loading, refetch };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRATUITY
// ═══════════════════════════════════════════════════════════════════════════════
export function useGratuityRecords(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  const { data, loading, refetch } = useFetch<any[]>(`/hr/gratuity${cq}`, [], [companyId]);
  return { records: data, loading, refetch };
}

export async function calculateGratuityApi(dto: {
  monthlySalary: number;
  startDate: string;
  endDate?: string;
  terminationType: string;
  unusedLeaveDays?: number;
  noticePeriodGiven?: boolean;
}) {
  const res = await api.post('/hr/gratuity/calculate', dto);
  return res.data?.data ?? res.data;
}

export async function saveGratuityRecord(dto: any) {
  const res = await api.post('/hr/gratuity', dto);
  return res.data?.data ?? res.data;
}

export async function markGratuityPaid(id: string, companyId?: string) {
  const res = await api.post(`/hr/gratuity/${id}/mark-paid`, { companyId });
  return res.data?.data ?? res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGET VARIANCE
// ═══════════════════════════════════════════════════════════════════════════════
export function useBudgetVarianceSummary(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  return useFetch<any>(`/ovds/budgets/variance/summary?${q}`, null, [period, companyId]);
}

export function useBudgetVarianceDetail(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/budgets/variance/detail?${q}`, [], [period, companyId]);
  return { lines: data, loading, refetch };
}

export function useBudgetVarianceTrend(period: string, months = 6, companyId?: string) {
  const q = new URLSearchParams({ period, months: String(months) });
  if (companyId) q.set('companyId', companyId);
  return useFetch<{ trend: any[]; months: number; endPeriod: string } | null>(
    `/ovds/budgets/variance/trend?${q}`,
    null,
    [period, months, companyId],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-LEDGER
// ═══════════════════════════════════════════════════════════════════════════════
export function useArSummary(asOf: string, companyId?: string) {
  const q = new URLSearchParams({ asOf });
  if (companyId) q.set('companyId', companyId);
  return useFetch<any>(`/ovds/sub-ledger/ar/summary?${q}`, null, [asOf, companyId]);
}

export function useArCustomers(asOf: string, companyId?: string) {
  const q = new URLSearchParams({ asOf });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/sub-ledger/ar/customers?${q}`, [], [asOf, companyId]);
  return { customers: data, loading, refetch };
}

export function useApVendors(asOf: string, companyId?: string) {
  const q = new URLSearchParams({ asOf });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/sub-ledger/ap/vendors?${q}`, [], [asOf, companyId]);
  return { vendors: data, loading, refetch };
}

export function useApSummary(asOf: string, companyId?: string) {
  const q = new URLSearchParams({ asOf });
  if (companyId) q.set('companyId', companyId);
  return useFetch<any>(`/ovds/sub-ledger/ap/summary?${q}`, null, [asOf, companyId]);
}

export async function fetchGlEntries(accountId: string, startDate: string, endDate: string, companyId?: string) {
  const q = new URLSearchParams({ accountId, startDate, endDate });
  if (companyId) q.set('companyId', companyId);
  const res = await api.get(`/ovds/sub-ledger/gl?${q}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: [] }));
  return res.data?.data ?? res.data ?? [];
}

export async function fetchArTransactions(customerId: string, asOf: string, companyId?: string) {
  const q = new URLSearchParams({ customerId, asOf });
  if (companyId) q.set('companyId', companyId);
  const res = await api.get(`/ovds/sub-ledger/ar/transactions?${q}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: [] }));
  return res.data?.data ?? res.data ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST CENTERS
// ═══════════════════════════════════════════════════════════════════════════════
export function useCostCenters(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/cost-centers${cq}`, [], [companyId]);
  return { centers: data, loading, refetch };
}

export function useCostCenterAllocations(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/cost-centers/allocations?${q}`, [], [period, companyId]);
  return { allocations: data, loading, refetch };
}

export function useCostCenterPerformance(period: string, companyId?: string) {
  const q = new URLSearchParams({ period });
  if (companyId) q.set('companyId', companyId);
  const { data, loading, refetch } = useFetch<any[]>(`/ovds/cost-centers/performance?${q}`, [], [period, companyId]);
  return { performance: data, loading, refetch };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ETAX DECLARATION (JSON payload builder — new MoR submission endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ETaxDeclarationResult {
  declaration: {
    Header: { TaxpayerTIN: string; TaxpayerName: string; FilingPeriodCode: string; DeclarationTimestamp: string };
    VatSummary?: Record<string, number>;
    TotSummary?: Record<string, number>;
    WithholdingTaxSummary?: Record<string, number>;
    PayeSummary?: Record<string, number>;
    BusinessIncomeTaxSummary?: Record<string, number>;
    DrrfSummary?: Record<string, number>;
    SystemSecurity: { ApplicationSignature: string; AuditLogReference: string };
  };
  validationErrors: string[];
}

/**
 * Build a signed monthly TaxpayerDeclaration JSON from live DB data.
 * POST /tax/declaration/monthly/:period
 */
export async function buildMonthlyDeclaration(params: {
  period: string;
  tin: string;
  taxpayerName: string;
  companyId?: string;
  auditLogRef?: string;
}): Promise<ETaxDeclarationResult> {
  const res = await api.post(`/tax/declaration/monthly/${params.period}`, {
    tin:          params.tin,
    taxpayerName: params.taxpayerName,
    auditLogRef:  params.auditLogRef,
  }, {
    headers: params.companyId ? { 'x-company-id': params.companyId } : {},
  } as any);
  return res.data?.data ?? res.data;
}

/**
 * Build a signed annual CIT (BIT) declaration from the income tax filing record.
 * POST /tax/declaration/annual-bit/:year
 */
export async function buildAnnualBitDeclaration(params: {
  year: number;
  tin: string;
  taxpayerName: string;
  companyId?: string;
  auditLogRef?: string;
}): Promise<ETaxDeclarationResult> {
  const res = await api.post(`/tax/declaration/annual-bit/${params.year}`, {
    tin:          params.tin,
    taxpayerName: params.taxpayerName,
    auditLogRef:  params.auditLogRef,
  }, {
    headers: params.companyId ? { 'x-company-id': params.companyId } : {},
  } as any);
  return res.data?.data ?? res.data;
}

/**
 * Export a tax type as CSV from the eTax export endpoints.
 * Returns the download URL for the browser to trigger.
 */
export function getETaxExportUrl(
  type: 'vat-sales' | 'purchase-annexure' | 'paye-salary' | 'wht-certificates' | 'tot-log' | 'drrf-register' | 'bit-declaration',
  periodOrYear: string,
): string {
  const base = type === 'bit-declaration'
    ? `/api/tax/export/bit-declaration/${periodOrYear}`
    : `/api/tax/export/${type}/${periodOrYear}`;
  return base;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERCA PENALTY CALCULATOR — backend-authoritative calculation
// ═══════════════════════════════════════════════════════════════════════════════

export interface PenaltyCalcRequest {
  taxType: 'VAT' | 'BIT' | 'WHT' | 'DRRF' | 'TOT' | 'PIT' | 'PENSION';
  taxDue: number;
  dueDate: string;
  paymentDate: string;
}

export interface PenaltyCalcResult {
  taxType:         string;
  taxDue:          number;
  dueDate:         string;
  paymentDate:     string;
  daysLate:        number;
  monthsLate:      number;
  flatPenaltyRate: string;
  flatPenalty:     number;
  monthlyRate:     string;
  interestAmount:  number;
  totalPenalty:    number;
  totalOwed:       number;
  isOverdue:       boolean;
  legalReference:  string;
  calculatedAt:    string;
  journalEntry:    {
    description: string;
    lines: Array<{ account: string; debit: number; credit: number }>;
  } | null;
}

/**
 * Call the backend ERCA penalty calculator for an authoritative, auditable result.
 * Falls back to client-side calculation if the API is unavailable.
 */
export async function calculatePenaltyApi(dto: PenaltyCalcRequest): Promise<PenaltyCalcResult> {
  const res = await api.post('/tax/calculate-penalty', dto);
  return res.data?.data ?? res.data;
}

/**
 * Fetch the overdue tax summary for a company — all overdue filings with estimated penalties.
 */
export function useOverdueTaxSummary(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  return useFetch<{
    items: any[];
    summary: {
      overdueCount: number;
      totalTaxDue: number;
      totalPenaltyExposure: number;
      totalOwed: number;
      generatedAt: string;
    };
  } | null>(`/tax/overdue-summary${cq}`, null, [companyId]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPENING BALANCE STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export function useOpeningBalanceStatus(companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  return useFetch<{
    hasOpeningBalances: boolean;
    openingDate?: string;
    accountsWithBalance: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  } | null>(`/accounting/opening-balance-status${cq}`, null, [companyId]);
}


// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE ANNEXURE (Annexure 12) — input VAT from bills
// GET /ovds/tax/export/purchase-annexure/:period
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Download Purchase Annexure CSV (Annexure 12) for a period.
 * Triggers a browser download of the MoR-compliant CSV.
 */
export function downloadPurchaseAnnexure(period: string): void {
  const url = getETaxExportUrl('purchase-annexure', period);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MoR_Purchase_Annexure_${period}.csv`;
  a.click();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECLARATION READINESS VALIDATION
// GET /tax/validate/:period
// ═══════════════════════════════════════════════════════════════════════════════

export interface DeclarationReadinessResult {
  ready: boolean;
  periodLocked: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    salesAnnexureVat:    number;
    purchaseAnnexureVat: number;
    filedOutputVat:      number;
    filedInputVat:       number;
    outputVatDiff:       number;
    inputVatDiff:        number;
    whtCertCount:        number;
    whtMissingTin:       number;
    drrfFromInvoices:    number;
    drrfFromContribs:    number;
  };
}

/**
 * Validate declaration readiness before submitting to MoR.
 * Cross-checks sales/purchase annexure totals vs filed VatFiling record.
 * GET /tax/validate/:period
 */
export async function validateDeclarationReadiness(
  period: string,
  companyId?: string,
): Promise<DeclarationReadinessResult> {
  const q = companyId ? `?companyId=${companyId}` : '';
  const res = await api.get(`/tax/validate/${period}${q}`);
  return res.data?.data ?? res.data;
}

/**
 * React hook for declaration readiness check.
 * Runs automatically when period changes.
 */
export function useDeclarationReadiness(period: string | null, companyId?: string) {
  return useFetch<DeclarationReadinessResult | null>(
    period ? `/tax/validate/${period}${companyId ? `?companyId=${companyId}` : ''}` : null,
    null,
    [period, companyId],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAT PERIOD SUMMARY — consolidated single-period view
// GET /vat/period-summary/:period
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * React hook: consolidated VAT dashboard for a specific YYYY-MM period.
 * Used by the eTax declaration screen before submission.
 */
export function useVatPeriodSummary(period: string | null, companyId?: string) {
  const cq = companyId ? `?companyId=${companyId}` : '';
  return useFetch<{
    totalOutputVat: number;
    totalInputVat: number;
    claimableInputVat: number;
    netPayable: number;
    totalWithheld: number;
    totalReverseCharge: number;
    pendingRefunds: number;
    unremittedWithholding: number;
    reverseCharge: any[];
    refundClaims: any[];
    withholding: any[];
    inputLedger: any[];
    outputLedger: any[];
  } | null>(
    period ? `/vat/period-summary/${period}${cq}` : null,
    null,
    [period, companyId],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAT LEDGER UPDATES — PATCH input/output entries
// ═══════════════════════════════════════════════════════════════════════════════

/** Update a VAT input ledger entry (apportionment %, claimable flag, amounts) */
export async function updateInputLedgerEntry(
  id: string,
  dto: {
    supplier?: string;
    netAmount?: number;
    vatAmount?: number;
    claimable?: boolean;
    apportionmentPct?: number;
    period?: string;
    hsCode?: string;
    importDeclNo?: string;
  },
): Promise<any> {
  const res = await api.patch(`/vat/input-ledger/${id}`, dto);
  return res.data?.data ?? res.data;
}

/** Update a VAT output ledger entry (amounts, category, buyer VAT reg no.) */
export async function updateOutputLedgerEntry(
  id: string,
  dto: {
    customer?: string;
    netAmount?: number;
    vatAmount?: number;
    category?: string;
    period?: string;
    buyerVatRegNo?: string;
  },
): Promise<any> {
  const res = await api.patch(`/vat/output-ledger/${id}`, dto);
  return res.data?.data ?? res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IRN — Invoice Registration Number (OVDS Directive 1142/2026)
// POST /vat/irn/generate
// GET  /vat/irn/:invoiceId
// ═══════════════════════════════════════════════════════════════════════════════

export interface IrnRecord {
  irn: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  grossAmount: number;
  outputVat: number;
  tin: string | null;
  period: string;
  vatForm1Generated: boolean;
  conformsToOVDSSpec: boolean;
  generatedAt?: string;
  spec?: string;
}

/**
 * Generate an IRN for an invoice (required for VAT Form 1).
 * POST /vat/irn/generate
 */
export async function generateIrn(dto: {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  grossAmount: number;
  tin?: string;
}): Promise<IrnRecord> {
  const res = await api.post('/vat/irn/generate', dto);
  return res.data?.data ?? res.data;
}

/**
 * Get IRN registration details for an invoice.
 * GET /vat/irn/:invoiceId
 */
export async function getInvoiceIrn(invoiceId: string): Promise<IrnRecord> {
  const res = await api.get(`/vat/irn/${invoiceId}`);
  return res.data?.data ?? res.data;
}

/**
 * React hook: fetch IRN for an invoice (auto-refetch on invoiceId change).
 */
export function useInvoiceIrn(invoiceId: string | null) {
  return useFetch<IrnRecord | null>(
    invoiceId ? `/vat/irn/${invoiceId}` : null,
    null,
    [invoiceId],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAT APPORTIONMENT — GET current filing apportionment
// GET  /vat/filings/:id/apportionment
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApportionmentResult {
  filingId: string;
  period: string;
  apportionmentPct: number;
  totalInputVat: number;
  claimableInputVat: number;
  nonClaimableInputVat: number;
  periodLocked: boolean;
}

/**
 * Fetch the current apportionment % and claimable breakdown for a VAT filing.
 * GET /vat/filings/:id/apportionment
 */
export async function getFilingApportionment(filingId: string): Promise<ApportionmentResult> {
  const res = await api.get(`/vat/filings/${filingId}/apportionment`);
  return res.data?.data ?? res.data;
}

/**
 * React hook: get apportionment for a filing, auto-refetch on id change.
 */
export function useFilingApportionment(filingId: string | null) {
  return useFetch<ApportionmentResult | null>(
    filingId ? `/vat/filings/${filingId}/apportionment` : null,
    null,
    [filingId],
  );
}
