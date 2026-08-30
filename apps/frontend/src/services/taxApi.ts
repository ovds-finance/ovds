import { useState, useEffect, useCallback } from 'react';
import api from './api';
import { ETH_TAX } from '@ovds/shared';
import type {
  TaxDashboard, VatReconciliation, IncomeTaxReport,
  TaxReport,
} from '../types/tax';

// Re-export pure API functions from @ovds/features/tax
export {
  recordTaxFiling,
  generateETaxPayload,
  exportETaxJson,
  submitToETax,
  syncBankTransactions,
  calculateTot,
  triggerAutoComputeTot,
  recordBITFiling,
  recordDRRFRemittance,
  recordWHTRemittance,
  calculateERCAPenalty,
  updateCompanyTaxProfile,
  resolveTaxesForTransaction,
} from '@ovds/features/tax';

export type { TotCalculation, TotFiling, TaxAutomationStatus } from '@ovds/features/tax';

// -- Tax Dashboard -------------------------------------------------------------
export function useTaxDashboard() {
  const [dashboard, setDashboard] = useState<TaxDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/dashboard', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      const raw = res.data?.data ?? res.data;
      if (raw) {
        // Normalise backend field names → frontend TaxDashboard shape.
        // Our backend (getTaxDashboard) returns overdueFilings directly.
        // Legacy deployments returned overdueVat + overdueDrrf separately.
        setDashboard({
          ...raw,
          overdueFilings: raw.overdueFilings ?? (raw.overdueVat ?? 0) + (raw.overdueDrrf ?? 0),
          drrfPending:    raw.drrfPending ?? raw.drrfPendingYear ?? raw.drrfCurrent ?? 0,
          // Ensure taxpayer category fields are surfaced
          taxpayerCategory:      raw.taxpayerCategory      ?? raw.incomeTaxSchedule ?? 'A',
          vatTotComplianceBand:  raw.vatTotComplianceBand  ?? (raw.vatRegistrationRequired ? 'A' : raw.taxpayerCategory ?? 'A'),
          matPayable:            raw.matPayable            ?? 0,
          matApplies:            raw.matApplies            ?? false,
          annualRevenue:         raw.annualRevenue         ?? 0,
          vatRegistrationRequired: raw.vatRegistrationRequired ?? false,
        });
      } else {
        setDashboard({
          year: new Date().getFullYear(),
          vatCurrent: 0,
          incomeTaxDue: 0,
          drrfPending: 0,
          overdueFilings: 0,
          nextDue: {
            vat: `${new Date().toISOString().slice(0, 7)}-30`,
            drrf: `${new Date().toISOString().slice(0, 7)}-15`,
          },
          complianceScore: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { dashboard, loading, refetch: fetch };
}

// -- VAT Reconciliation --------------------------------------------------------
export function useVatReconciliation(period?: string) {
  const [recon, setRecon] = useState<VatReconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    try {
      const periodParam = p ?? new Date().toISOString().slice(0, 7);
      const url = `/tax/vat-reconciliation/${periodParam}`;
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      const d = res.data?.data ?? res.data;
      setRecon(d ? {
        period: p ?? new Date().toISOString().slice(0, 7),
        outputVat: d.totalOutputVat ?? d.outputVat ?? 0,
        inputVat: d.totalInputVat ?? d.inputVat ?? 0,
        netPayable: d.netPayable ?? (d.totalOutputVat ?? 0) - (d.totalInputVat ?? 0),
      } : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);
  return { recon, loading, refetch: () => fetch(period) };
}

// -- Income Tax ----------------------------------------------------------------
export function useIncomeTax(year?: number) {
  const [report, setReport] = useState<IncomeTaxReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (y?: number) => {
    setLoading(true);
    try {
      const yearParam = y ?? new Date().getFullYear();
      const url = `/tax/income-tax/${yearParam}`;
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      const d = res.data?.data ?? res.data;
      setReport(d ?? { year: y ?? new Date().getFullYear(), netProfit: 0, rate: 0.3, taxPayable: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(year); }, [fetch, year]);
  return { report, loading, refetch: () => fetch(year) };
}

// -- Tax Reports list ----------------------------------------------------------
export function useTaxReports() {
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/reports', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: [] }));
      setReports(res.data?.data ?? res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { reports, loading, refetch: fetch };
}

// -- Tax Reports list ----------------------------------------------------------
export function useTaxpayerStatus(companyId?: string) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = '/ovds/taxpayer/status' + (companyId ? `?companyId=${companyId}` : '');
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setStatus(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { status, loading, refetch: fetch };
}

// -- WHT Summary (Proclamation No. 1395/2025 — 3% on services/goods) ----------
export function useWhtSummary(companyId?: string, period?: string) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (period) params.set('period', period);
      const url = '/ovds/wht/summary' + (params.toString() ? `?${params}` : '');
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setSummary(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { summary, loading, refetch: fetch };
}

// -- NBE Compliance Summary ----------------------------------------------------
export function useNBECompliance(companyId?: string, dateFrom?: string, dateTo?: string) {
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const url = '/ovds/payments/nbe-compliance' + (params.toString() ? `?${params}` : '');
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setCompliance(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);
  return { compliance, loading, refetch: fetch };
}

// -- Payment Integration Stats -------------------------------------------------
export function usePaymentIntegrationStats(companyId?: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = '/ovds/payments/integration-stats' + (companyId ? `?companyId=${companyId}` : '');
      const res = await api.get(url, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setStats(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, refetch: fetch };
}

// -- Tax Automation Status -----------------------------------------------------
// Surfaces the state of automated tax jobs so the Tax Filing page can show
// whether the current period has been auto-computed, needs a zero declaration,
// or has an overdue filing that was flagged by the scheduler.

export interface TaxAutomationStatus {
  period: string;
  vatAutoComputed: boolean;
  vatFilingStatus: 'NONE' | 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'FILED' | 'PAID' | 'OVERDUE' | 'ZERO_DECLARATION';
  isZeroDeclaration: boolean;
  totApplicable: boolean;
  totFilingStatus: 'NONE' | 'DRAFT' | 'PENDING' | 'PAID' | 'FILED' | 'OVERDUE';
  vatThresholdPct: number;       // 0–100 — how close to ETB 2M threshold
  overdueCount: number;
  nextDeadlines: Array<{
    type: 'VAT' | 'TOT' | 'WHT' | 'BIT' | 'DRRF' | 'BIT_Q1' | 'BIT_Q2' | 'BIT_Q3' | 'BIT_Q4';
    label: string;
    deadline: string;            // ISO date string
    daysLeft: number;
    isOverdue: boolean;
  }>;
}

/**
 * Hook: real-time tax automation status for the current period.
 *
 * Calls the dedicated GET /tax/automation-status endpoint which
 * aggregates scheduler state, VAT filing status, TOT applicability,
 * threshold proximity, overdue count, and next deadlines in one call.
 *
 * Falls back to aggregating from 3 endpoints if the dedicated endpoint
 * is unavailable (graceful degradation for older deployments).
 */
export function useTaxAutomationStatus(companyId?: string) {
  const [status, setStatus] = useState<TaxAutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const cq = companyId ? `?companyId=${companyId}` : '';

      // Try the dedicated endpoint first
      const dedicated = await api
        .get(`/tax/automation-status${cq}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => null);

      if (dedicated?.data) {
        const d = dedicated.data?.data ?? dedicated.data;
        setStatus({
          period:            d.currentPeriod ?? d.period,
          vatAutoComputed:   d.vatAutoCompute ?? d.vatAutoComputed ?? !!(d.hasCurrentDraft || d.vatFilingStatus !== 'NONE'),
          vatFilingStatus:   d.vatFilingStatus ?? (d.hasCurrentDraft ? 'DRAFT' : 'NONE'),
          isZeroDeclaration: d.isZeroDeclaration ?? false,
          totApplicable:     d.totApplicable ?? false,
          totFilingStatus:   d.totFilingStatus ?? 'NONE',
          vatThresholdPct:   d.vatThresholdPct ?? d.thresholdPct ?? 0,
          overdueCount:      d.overdueCount ?? 0,
          nextDeadlines:     d.nextDeadlines ?? [],
        });
        return;
      }

      // Fallback: aggregate from 3 existing endpoints
      const period = new Date().toISOString().slice(0, 7);
      const [dashRes, taxpayerRes, filingsRes] = await Promise.allSettled([
        api.get(`/tax/dashboard${cq}`, { headers: { 'x-background': '1' } } as any),
        api.get(`/ovds/taxpayer/status${cq}`, { headers: { 'x-background': '1' } } as any),
        api.get('/vat/filings', { headers: { 'x-background': '1' } } as any),
      ]);

      const dash     = dashRes.status === 'fulfilled' ? (dashRes.value.data?.data ?? dashRes.value.data) : null;
      const taxpayer = taxpayerRes.status === 'fulfilled' ? (taxpayerRes.value.data?.data ?? taxpayerRes.value.data) : null;
      const filings  = filingsRes.status === 'fulfilled' ? (filingsRes.value.data?.data ?? filingsRes.value.data ?? []) : [];

      const currentFiling = Array.isArray(filings)
        ? filings.find((f: any) => f.period === period)
        : null;

      const vatFilingStatus: TaxAutomationStatus['vatFilingStatus'] = currentFiling
        ? (currentFiling.notes?.includes('ZERO_DECLARATION') ? 'ZERO_DECLARATION' : currentFiling.status)
        : 'NONE';

      const annualRevenue   = Number(dash?.annualRevenue ?? taxpayer?.annualRevenue ?? 0);
      const VAT_THRESHOLD   = ETH_TAX.VAT_REGISTRATION_THRESHOLD;
      const totApplicable   = annualRevenue > 0 && annualRevenue < VAT_THRESHOLD;
      const vatThresholdPct = Math.min(100, Math.round((annualRevenue / VAT_THRESHOLD) * 100));

      const now = new Date();
      const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
      const daysToVat   = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);
      const bitDeadline = new Date(now.getFullYear(), 10, 7);
      const daysToBit   = Math.ceil((bitDeadline.getTime() - now.getTime()) / 86_400_000);
      const quarterEndMonths = [3, 6, 9, 12];
      const nextQEnd = quarterEndMonths.find(m => m >= now.getMonth() + 1) ?? 12;
      const drrfDeadline = new Date(now.getFullYear(), nextQEnd - 1, 15);
      const daysToDrrf   = Math.ceil((drrfDeadline.getTime() - now.getTime()) / 86_400_000);

      const nextDeadlines: TaxAutomationStatus['nextDeadlines'] = [
        { type: 'VAT' as const,  label: `VAT Return — ${period}`,          deadline: vatDeadline.toISOString().slice(0, 10),  daysLeft: daysToVat,  isOverdue: daysToVat < 0 },
        ...(totApplicable ? [{ type: 'TOT' as const, label: `TOT Return — ${period}`, deadline: vatDeadline.toISOString().slice(0, 10), daysLeft: daysToVat, isOverdue: daysToVat < 0 }] : []),
        { type: 'WHT' as const,  label: `WHT Remittance — ${period}`,      deadline: vatDeadline.toISOString().slice(0, 10),  daysLeft: daysToVat,  isOverdue: daysToVat < 0 },
        { type: 'DRRF' as const, label: `DRRF Quarterly Levy`,              deadline: drrfDeadline.toISOString().slice(0, 10), daysLeft: daysToDrrf, isOverdue: daysToDrrf < 0 },
        { type: 'BIT' as const,  label: `BIT Annual — Nov 7, ${now.getFullYear()}`, deadline: bitDeadline.toISOString().slice(0, 10), daysLeft: daysToBit, isOverdue: daysToBit < 0 },
      ].sort((a, b) => a.daysLeft - b.daysLeft);

      setStatus({
        period,
        vatAutoComputed:   vatFilingStatus !== 'NONE',
        vatFilingStatus,
        isZeroDeclaration: vatFilingStatus === 'ZERO_DECLARATION',
        totApplicable,
        totFilingStatus:   'NONE',
        vatThresholdPct,
        overdueCount: Number(dash?.overdueFilings ?? 0),
        nextDeadlines,
      });
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { status, loading, refetch: fetch };
}

// -- TOT (Turnover Tax) — Category B taxpayers --------------------------------
// Proclamation No. 1395/2025: 2% on goods, 10% on services

export interface TotCalculation {
  period: string;
  goodsAmount: number;
  servicesAmount: number;
  totGoods: number;
  totServices: number;
  netPayable: number;
}

export interface TotFiling extends TotCalculation {
  id: string;
  paid: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'FILED' | 'OVERDUE';
  filedAt?: string;
  dueDate?: string;
  eTaxReference?: string;
  notes?: string;
  createdAt: string;
}

/** Hook: list all recorded TOT filings */
export function useTotFilings(period?: string) {
  const [filings, setFilings] = useState<TotFiling[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = period ? `?period=${period}` : '';
      const res = await api
        .get(`/tax/tot-filings${params}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => ({ data: [] }));
      setFilings(res.data?.data ?? res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { filings, loading, refetch: fetch };
}

// -- Compliance Status (all 10 phases) ----------------------------------------
// Phase-by-phase compliance check against MoR filing obligations.
export function useTaxComplianceStatus(companyId?: string, period?: string) {
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (period)    params.set('period', period);
      const q = params.toString() ? `?${params}` : '';
      const res = await api
        .get(`/tax/compliance-status${q}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => ({ data: null }));
      setStatus(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { status, loading, refetch: fetch };
}

// -- DRRF Levies (Phase 6) ----------------------------------------------------
// GET /tax/drrf-levies/:period
export function useDrrfLevies(period: string, companyId?: string) {
  const [levies, setLevies] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!period) return;
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api
        .get(`/tax/drrf-levies/${period}${q}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => ({ data: null }));
      setLevies(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [period, companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { levies, loading, refetch: fetch };
}

// -- WHT Report (Phase 5) -----------------------------------------------------
// GET /tax/withholding/:period
export function useWhtReport(period: string, companyId?: string) {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!period) return;
    setLoading(true);
    try {
      const res = await api
        .get(`/tax/withholding/${period}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => ({ data: null }));
      setReport(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [period, companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, refetch: fetch };
}

// -- Overdue Summary ----------------------------------------------------------
export function useOverdueSummary(companyId?: string) {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api
        .get(`/tax/overdue-summary${q}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => ({ data: null }));
      setSummary(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { summary, loading, refetch: fetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Universal Tax Config API — /tax/universal/*
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the canonical universal tax rules (all industries). */
export function useUniversalTaxRules() {
  const [rules, setRules] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/universal/rules', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setRules(res.data?.data ?? res.data ?? null);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { rules, loading, refetch: fetch };
}

/** Fetch rules filtered by Ethiopian sector with exemption flags. */
export function useUniversalTaxRulesBySector(sector: string) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    if (!sector) return;
    setLoading(true);
    try {
      const res = await api.get(`/tax/universal/rules/sector/${sector}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setRules(res.data?.data ?? res.data ?? []);
    } finally { setLoading(false); }
  }, [sector]);
  useEffect(() => { fetch(); }, [fetch]);
  return { rules, loading, refetch: fetch };
}

/** Fetch the company tax profile. */
export function useCompanyTaxProfile(companyId?: string) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api.get(`/tax/universal/profile${q}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setProfile(res.data?.data ?? res.data ?? null);
    } finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { profile, loading, refetch: fetch };
}

/** Full compliance health check — all active taxes vs filing status. */
export function useComplianceHealth(companyId?: string) {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api.get(`/tax/universal/compliance-health${q}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setHealth(res.data?.data ?? res.data ?? null);
    } finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { health, loading, refetch: fetch };
}

/** Upcoming filing deadlines (next 90 days). */
export function useFilingDeadlines(companyId?: string) {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const res = await api.get(`/tax/universal/deadlines${q}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null }));
      setDeadlines(res.data?.data ?? res.data ?? []);
    } finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { deadlines, loading, refetch: fetch };
}

/** Rule engine — resolve applicable taxes for a transaction. */

