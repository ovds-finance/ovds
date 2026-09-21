import { ETH_TAX } from '@ovds/shared';
import { useState, useEffect, useCallback } from 'react';

import { useFetchQuery } from '../hooks/useFetchQuery';
import type {
  TaxDashboard, VatReconciliation, IncomeTaxReport,
  TaxReport,
} from '../types/tax';

import api, { bgConfig } from './api';

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

// -- Helpers ------------------------------------------------------------------

/** Build a URLSearchParams string from an object, omitting undefined values. */
function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// -- Tax Dashboard -------------------------------------------------------------

/**
 * Fetches the tax dashboard and normalises legacy field names from older
 * backend deployments (overdueVat/overdueDrrf → overdueFilings, etc.).
 *
 * The normalisation is kept in a `select` transform so the hook stays
 * pure and the shape is always the same for consumers regardless of which
 * backend version is deployed.
 */
export function useTaxDashboard() {
  const result = useFetchQuery<TaxDashboard>('/tax/dashboard', {
    select: (raw) => {
      if (!raw) {
        return {
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
        };
      }
      return {
        ...raw,
        overdueFilings: raw.overdueFilings ?? (raw.overdueVat ?? 0) + (raw.overdueDrrf ?? 0),
        drrfPending:    raw.drrfPending ?? raw.drrfPendingYear ?? raw.drrfCurrent ?? 0,
        taxpayerCategory:        raw.taxpayerCategory        ?? raw.incomeTaxSchedule ?? 'A',
        vatTotComplianceBand:    raw.vatTotComplianceBand    ?? (raw.vatRegistrationRequired ? 'A' : raw.taxpayerCategory ?? 'A'),
        matPayable:              raw.matPayable              ?? 0,
        matApplies:              raw.matApplies              ?? false,
        annualRevenue:           raw.annualRevenue           ?? 0,
        vatRegistrationRequired: raw.vatRegistrationRequired ?? false,
      } as TaxDashboard;
    },
  });
  return { ...result, dashboard: result.data };
}

// -- VAT Reconciliation --------------------------------------------------------

export function useVatReconciliation(period?: string) {
  const p = period ?? new Date().toISOString().slice(0, 7);
  const result = useFetchQuery<VatReconciliation | null>(`/tax/vat-reconciliation/${p}`, {
    deps: [p],
    select: (d) => d ? {
      period: p,
      outputVat:  d.totalOutputVat ?? d.outputVat  ?? 0,
      inputVat:   d.totalInputVat  ?? d.inputVat   ?? 0,
      netPayable: d.netPayable ?? (d.totalOutputVat ?? 0) - (d.totalInputVat ?? 0),
    } : null,
  });
  return { ...result, recon: result.data ?? null };
}

// -- Income Tax ----------------------------------------------------------------

export function useIncomeTax(year?: number) {
  const y = year ?? new Date().getFullYear();
  const result = useFetchQuery<IncomeTaxReport>(`/tax/income-tax/${y}`, {
    deps: [y],
    select: (d) => d ?? { year: y, netProfit: 0, rate: 0.3, taxPayable: 0 },
  });
  return { ...result, report: result.data ?? null };
}

// -- Tax Reports list ----------------------------------------------------------

export function useTaxReports() {
  const result = useFetchQuery<TaxReport[]>('/tax/reports', {
    select: (d) => Array.isArray(d) ? d : [],
  });
  return { ...result, reports: result.data ?? [] };
}

// -- Taxpayer Status -----------------------------------------------------------

export function useTaxpayerStatus(companyId?: string) {
  const result = useFetchQuery<any>(`/ovds/taxpayer/status${qs({ companyId })}`, {
    deps: [companyId],
  });
  return { ...result, status: result.data };
}

export function useWhtSummary(companyId?: string, period?: string) {
  return useFetchQuery<any>(`/ovds/wht/summary${qs({ companyId, period })}`, {
    deps: [companyId, period],
  });
}

// -- NBE Compliance Summary ----------------------------------------------------

export function useNBECompliance(companyId?: string, dateFrom?: string, dateTo?: string) {
  return useFetchQuery<any>(`/ovds/payments/nbe-compliance${qs({ companyId, dateFrom, dateTo })}`, {
    deps: [companyId, dateFrom, dateTo],
  });
}

// -- Payment Integration Stats -------------------------------------------------

export function usePaymentIntegrationStats(companyId?: string) {
  return useFetchQuery<any>(`/ovds/payments/integration-stats${qs({ companyId })}`, {
    deps: [companyId],
  });
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
  vatThresholdPct: number;
  overdueCount: number;
  nextDeadlines: Array<{
    type: 'VAT' | 'TOT' | 'WHT' | 'BIT' | 'DRRF' | 'BIT_Q1' | 'BIT_Q2' | 'BIT_Q3' | 'BIT_Q4';
    label: string;
    deadline: string;
    daysLeft: number;
    isOverdue: boolean;
  }>;
}

/**
 * Hook: real-time tax automation status for the current period.
 *
 * This hook contains non-trivial fallback aggregation logic (combining 3
 * endpoints when the dedicated /tax/automation-status is unavailable), so it
 * cannot be reduced to a plain useFetchQuery call. It keeps its own
 * useState/useCallback/useEffect triad but delegates the simple sub-fetches
 * inside the fallback path to direct api.get() calls.
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
        .get(`/tax/automation-status${cq}`, bgConfig())
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
        api.get(`/tax/dashboard${cq}`,             bgConfig()),
        api.get(`/ovds/taxpayer/status${cq}`,       bgConfig()),
        api.get('/vat/filings',                     bgConfig()),
      ]);

      const dash     = dashRes.status     === 'fulfilled' ? (dashRes.value.data?.data     ?? dashRes.value.data)     : null;
      const taxpayer = taxpayerRes.status === 'fulfilled' ? (taxpayerRes.value.data?.data ?? taxpayerRes.value.data) : null;
      const filings  = filingsRes.status  === 'fulfilled' ? (filingsRes.value.data?.data  ?? filingsRes.value.data ?? []) : [];

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
      const vatDeadline  = new Date(now.getFullYear(), now.getMonth() + 1, 30);
      const daysToVat    = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);
      const bitDeadline  = new Date(now.getFullYear(), 10, 7);
      const daysToBit    = Math.ceil((bitDeadline.getTime() - now.getTime()) / 86_400_000);
      const quarterEndMonths = [3, 6, 9, 12];
      const nextQEnd     = quarterEndMonths.find(m => m >= now.getMonth() + 1) ?? 12;
      const drrfDeadline = new Date(now.getFullYear(), nextQEnd - 1, 15);
      const daysToDrrf   = Math.ceil((drrfDeadline.getTime() - now.getTime()) / 86_400_000);

      const nextDeadlines: TaxAutomationStatus['nextDeadlines'] = [
        { type: 'VAT'  as const, label: `VAT Return — ${period}`,                    deadline: vatDeadline.toISOString().slice(0, 10),  daysLeft: daysToVat,  isOverdue: daysToVat < 0 },
        ...(totApplicable ? [{ type: 'TOT' as const, label: `TOT Return — ${period}`, deadline: vatDeadline.toISOString().slice(0, 10), daysLeft: daysToVat,  isOverdue: daysToVat < 0 }] : []),
        { type: 'WHT'  as const, label: `WHT Remittance — ${period}`,                deadline: vatDeadline.toISOString().slice(0, 10),  daysLeft: daysToVat,  isOverdue: daysToVat < 0 },
        { type: 'DRRF' as const, label: `DRRF Quarterly Levy`,                        deadline: drrfDeadline.toISOString().slice(0, 10), daysLeft: daysToDrrf, isOverdue: daysToDrrf < 0 },
        { type: 'BIT'  as const, label: `BIT Annual — Nov 7, ${now.getFullYear()}`,   deadline: bitDeadline.toISOString().slice(0, 10),  daysLeft: daysToBit,  isOverdue: daysToBit < 0 },
      ].sort((a, b) => a.daysLeft - b.daysLeft);

      setStatus({
        period,
        vatAutoComputed:   vatFilingStatus !== 'NONE',
        vatFilingStatus,
        isZeroDeclaration: vatFilingStatus === 'ZERO_DECLARATION',
        totApplicable,
        totFilingStatus:   'NONE',
        vatThresholdPct,
        overdueCount:      Number(dash?.overdueFilings ?? 0),
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

export function useTotFilings(period?: string) {
  const result = useFetchQuery<TotFiling[]>(`/tax/tot-filings${qs({ period })}`, {
    deps: [period],
    select: (d) => Array.isArray(d) ? d : (d ?? []),
  });
  return { ...result, filings: result.data ?? [] };
}

// -- Compliance Status (all phases) -------------------------------------------

export function useTaxComplianceStatus(companyId?: string, period?: string) {
  return useFetchQuery<any>(`/tax/compliance-status${qs({ companyId, period })}`, {
    deps: [companyId, period],
  });
}

// -- DRRF Levies ---------------------------------------------------------------

export function useDrrfLevies(period: string, companyId?: string) {
  return useFetchQuery<any>(`/tax/drrf-levies/${period}${qs({ companyId })}`, {
    enabled: !!period,
    deps: [period, companyId],
  });
}

// -- WHT Report ----------------------------------------------------------------

export function useWhtReport(period: string, companyId?: string) {
  return useFetchQuery<any>(`/tax/withholding/${period}`, {
    enabled: !!period,
    // companyId is included as a dep but the endpoint reads it from the JWT
    deps: [period, companyId],
  });
}

// -- Overdue Summary ----------------------------------------------------------

export function useOverdueSummary(companyId?: string) {
  return useFetchQuery<any>(`/tax/overdue-summary${qs({ companyId })}`, {
    deps: [companyId],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Universal Tax Config API — /tax/universal/*
// ─────────────────────────────────────────────────────────────────────────────

export function useUniversalTaxRules() {
  const result = useFetchQuery<any>('/tax/universal/rules');
  return { ...result, rules: result.data };
}

export function useUniversalTaxRulesBySector(sector: string) {
  const result = useFetchQuery<any[]>(`/tax/universal/rules/sector/${sector}`, {
    enabled: !!sector,
    deps: [sector],
    select: (d) => Array.isArray(d) ? d : [],
  });
  return { ...result, rules: result.data };
}

export function useCompanyTaxProfile(companyId?: string) {
  const result = useFetchQuery<any>(`/tax/universal/profile${qs({ companyId })}`, {
    deps: [companyId],
  });
  return { ...result, profile: result.data };
}

export function useComplianceHealth(companyId?: string) {
  const result = useFetchQuery<any>(`/tax/universal/compliance-health${qs({ companyId })}`, {
    deps: [companyId],
  });
  return { ...result, health: result.data };
}

export function useFilingDeadlines(companyId?: string) {
  const result = useFetchQuery<any[]>(`/tax/universal/deadlines${qs({ companyId })}`, {
    deps: [companyId],
    select: (d) => Array.isArray(d) ? d : [],
  });
  return { ...result, deadlines: result.data ?? [] };
}
