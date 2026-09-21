import { ETH_TAX } from '@ovds/shared';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useFetchQuery } from '../hooks/useFetchQuery';
import type {
  VatFiling,
  VatSummary,
  VatDashboard,
  InputVatEntry,
  OutputVatEntry,
  WithholdingEntry,
  ReverseChargeEntry,
  RefundClaim,
  VatNote,
  ExportEvidence
} from '../types/vat';

import api, { bgConfig } from './api';

// -- Ethiopian VAT Constants — Proclamation No. 1341/2024 · Regulation No. 570/2025 --
/** Standard VAT rate: 15% (unchanged) */
export const VAT_STANDARD_RATE = ETH_TAX.VAT_RATE;
/** VAT registration threshold raised to ETB 2,000,000/year — Regulation No. 570/2025 */
export const VAT_REGISTRATION_THRESHOLD = ETH_TAX.VAT_REGISTRATION_THRESHOLD;
/** Monthly filing deadline: 30th of the following month */
export const VAT_FILING_DAY = 30;
/** Late filing penalty: ETB 500/day */
export const VAT_LATE_PENALTY_PER_DAY = 500;
/** Withholding VAT rate: 3% — Proclamation No. 1395/2025 */
export const VAT_WITHHOLDING_RATE = ETH_TAX.WHT_SERVICE_RATE;

// -- Helpers ------------------------------------------------------------------

const toArray = <T>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : []);

// -- VAT Filings + Summary (main dashboard data) ------------------------------
//
// This hook fetches two endpoints in a single Promise.all and also exposes a
// mutation (calculateFiling), so it keeps its manual implementation rather
// than delegating the fetch to useFetchQuery.

export function useVatFilings() {
  const [filings, setFilings]   = useState<VatFiling[]>([]);
  const [summary, setSummary]   = useState<VatSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filingsRes, summaryRes] = await Promise.all([
        api.get('/vat/filings',  bgConfig()),
        api.get('/vat/summary',  bgConfig()),
      ]);
      setFilings(toArray<VatFiling>(filingsRes.data?.data ?? filingsRes.data));
      setSummary(summaryRes.data?.data ?? summaryRes.data ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load VAT data');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateFiling = useCallback(async (period: string, startDate: string, endDate: string) => {
    try {
      await api.post('/vat/filings/calculate', { period, startDate, endDate });
      await fetch();
      toast.success('VAT filing calculated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Calculation failed');
      throw err;
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);
  return { filings, summary, loading, error, refetch: fetch, calculateFiling };
}

// -- VAT Dashboard ------------------------------------------------------------

export function useVatDashboard(period?: string) {
  return useFetchQuery<VatDashboard>(
    `/vat/dashboard${period ? `?period=${period}` : ''}`,
    { deps: [period] },
  );
}

// -- Input VAT Ledger ---------------------------------------------------------
//
// Has a `remove` mutation so keeps manual state alongside useFetchQuery.

export function useInputLedger(period?: string) {
  const url = `/vat/input-ledger${period ? `?period=${period}` : ''}`;
  const query = useFetchQuery<InputVatEntry[]>(url, {
    deps: [period],
    select: toArray,
  });

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/input-ledger/${id}`);
    query.mutate((prev) => (prev ?? []).filter((e) => e.id !== id));
  }, [query]);

  return { ...query, entries: query.data ?? [], remove };
}

// -- Output VAT Ledger --------------------------------------------------------

export function useOutputLedger(period?: string) {
  const url = `/vat/output-ledger${period ? `?period=${period}` : ''}`;
  const query = useFetchQuery<OutputVatEntry[]>(url, {
    deps: [period],
    select: toArray,
  });

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/output-ledger/${id}`);
    query.mutate((prev) => (prev ?? []).filter((e) => e.id !== id));
  }, [query]);

  return { ...query, entries: query.data ?? [], remove };
}

// -- Withholding Register -----------------------------------------------------

export function useWithholding(period?: string) {
  const url = `/vat/withholding${period ? `?period=${period}` : ''}`;
  const query = useFetchQuery<WithholdingEntry[]>(url, {
    deps: [period],
    select: toArray,
  });

  const toggleRemitted = useCallback(async (id: string) => {
    const res = await api.patch(`/vat/withholding/${id}/toggle-remitted`);
    query.mutate((prev) =>
      (prev ?? []).map((e) =>
        e.id === id ? { ...e, remitted: res.data?.data?.remitted ?? !e.remitted } : e,
      ),
    );
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/withholding/${id}`);
    query.mutate((prev) => (prev ?? []).filter((e) => e.id !== id));
  }, [query]);

  return { ...query, entries: query.data ?? [], toggleRemitted, remove };
}

// -- Reverse-Charge Register --------------------------------------------------

export function useReverseCharges(period?: string) {
  const url = `/vat/reverse-charges${period ? `?period=${period}` : ''}`;
  const query = useFetchQuery<ReverseChargeEntry[]>(url, {
    deps: [period],
    select: toArray,
  });

  const create = useCallback(async (dto: Omit<ReverseChargeEntry, 'id' | 'vatDue'>) => {
    const res = await api.post('/vat/reverse-charges', dto);
    const created = res.data?.data ?? res.data;
    query.mutate((prev) => [created, ...(prev ?? [])]);
    return created;
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/reverse-charges/${id}`);
    query.mutate((prev) => (prev ?? []).filter((e) => e.id !== id));
  }, [query]);

  return { ...query, entries: query.data ?? [], create, remove };
}

// -- Refund Claims ------------------------------------------------------------

export function useRefundClaims() {
  const query = useFetchQuery<RefundClaim[]>('/vat/refund-claims', {
    select: toArray,
  });

  const create = useCallback(async (dto: Omit<RefundClaim, 'id' | 'ref' | 'status'>) => {
    const res = await api.post('/vat/refund-claims', dto);
    const created = res.data?.data ?? res.data;
    query.mutate((prev) => [created, ...(prev ?? [])]);
    return created;
  }, [query]);

  const updateStatus = useCallback(async (id: string, status: RefundClaim['status'], notes?: string) => {
    await api.patch(`/vat/refund-claims/${id}/status`, { status, notes });
    query.mutate((prev) =>
      (prev ?? []).map((c) => (c.id === id ? { ...c, status, notes } : c)),
    );
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/refund-claims/${id}`);
    query.mutate((prev) => (prev ?? []).filter((c) => c.id !== id));
  }, [query]);

  return { ...query, claims: query.data ?? [], create, updateStatus, remove };
}

// -- VAT Notes ----------------------------------------------------------------

export function useVatNotes() {
  const query = useFetchQuery<VatNote[]>('/vat/notes', { select: toArray });

  const create = useCallback(async (dto: Omit<VatNote, 'id'>) => {
    const res = await api.post('/vat/notes', dto);
    const created = res.data?.data ?? res.data;
    query.mutate((prev) => [created, ...(prev ?? [])]);
    return created;
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/notes/${id}`);
    query.mutate((prev) => (prev ?? []).filter((n) => n.id !== id));
  }, [query]);

  return { ...query, notes: query.data ?? [], create, remove };
}

// -- Export Evidence ----------------------------------------------------------

export function useExportEvidence() {
  const query = useFetchQuery<ExportEvidence[]>('/vat/export-evidence', { select: toArray });

  const create = useCallback(
    async (dto: Omit<ExportEvidence, 'id' | 'customsDecl' | 'billOfLading' | 'bankReceipt'>) => {
      const res = await api.post('/vat/export-evidence', dto);
      const created = res.data?.data ?? res.data;
      query.mutate((prev) => [created, ...(prev ?? [])]);
      return created;
    },
    [query],
  );

  const cycleStatus = useCallback(
    async (id: string, field: 'customsDecl' | 'billOfLading' | 'bankReceipt') => {
      const res = await api.patch(`/vat/export-evidence/${id}/cycle/${field}`);
      query.mutate((prev) =>
        (prev ?? []).map((e) =>
          e.id === id ? { ...e, [field]: res.data?.data?.[field] ?? 'partial' } : e,
        ),
      );
    },
    [query],
  );

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/export-evidence/${id}`);
    query.mutate((prev) => (prev ?? []).filter((e) => e.id !== id));
  }, [query]);

  return { ...query, evidence: query.data ?? [], create, cycleStatus, remove };
}

/** Combined hook for entire VAT page */
export function useVatPage() {
  return {
    filings:        useVatFilings(),
    dashboard:      useVatDashboard(),
    inputLedger:    useInputLedger(),
    outputLedger:   useOutputLedger(),
    withholding:    useWithholding(),
    reverseCharges: useReverseCharges(),
    refunds:        useRefundClaims(),
    notes:          useVatNotes(),
    exportEvidence: useExportEvidence(),
  };
}

// -- eTax Portal Submission ---------------------------------------------------
//
// Maintains its own submission state (submitting boolean + mutations) so
// keeps a manual implementation.

export interface EtaxSubmissionRecord {
  id: string;
  period: string;
  type: 'VAT_RETURN' | 'WHT_RETURN' | 'BIT_DECLARATION';
  status: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'FAILED';
  submittedAt?: string;
  ercaReferenceNo?: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export function useEtaxSubmissions() {
  const query = useFetchQuery<EtaxSubmissionRecord[]>('/vat/etax-submissions', {
    select: toArray,
  });
  const [submitting, setSubmitting] = useState(false);

  const submitVatReturn = useCallback(async (period: string, netPayable: number, notes?: string) => {
    setSubmitting(true);
    try {
      const res = await api.post('/vat/etax-submissions', {
        period, type: 'VAT_RETURN', totalAmount: netPayable, notes,
      });
      const saved: EtaxSubmissionRecord = res.data?.data ?? res.data;
      query.mutate((prev) => [saved, ...(prev ?? [])]);
      toast.success(`VAT return for ${period} submitted — Ref: ${saved.ercaReferenceNo ?? saved.id}`);
      return saved;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'eTax VAT submission failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [query]);

  const submitWhtReturn = useCallback(async (period: string, totalWht: number) => {
    setSubmitting(true);
    try {
      const res = await api.post('/vat/etax-submissions', {
        period, type: 'WHT_RETURN', totalAmount: totalWht,
      });
      const saved: EtaxSubmissionRecord = res.data?.data ?? res.data;
      query.mutate((prev) => [saved, ...(prev ?? [])]);
      toast.success(`WHT return for ${period} submitted — Ref: ${saved.ercaReferenceNo ?? saved.id}`);
      return saved;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'eTax WHT submission failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [query]);

  return {
    ...query,
    submissions: query.data ?? [],
    submitting,
    submitVatReturn,
    submitWhtReturn,
  };
}

// -- Pure utility functions ---------------------------------------------------

export function buildVatReturnSummary(
  period: string,
  outputVat: number,
  inputVat: number,
  reverseCharge: number,
  withholding: number,
) {
  const netPayable = outputVat - inputVat + reverseCharge;
  return {
    period,
    outputVat,
    inputVat,
    reverseCharge,
    withholding,
    netPayable,
    isRefund: netPayable < 0,
    filingDeadline: (() => {
      const [y, m] = period.split('-').map(Number);
      const d = new Date(y, m, 30);
      return d.toLocaleDateString('en-ET');
    })(),
  };
}

// ── Period Lock ───────────────────────────────────────────────────────────────

export async function lockVatPeriod(filingId: string): Promise<any> {
  const res = await api.post(`/vat/filings/${filingId}/lock`);
  return res.data?.data ?? res.data;
}

// ── Input VAT Apportionment ──────────────────────────────────────────────────

export async function setVatApportionment(
  filingId: string,
  apportionmentPct: number,
): Promise<{ apportionmentPct: number; claimableInputVat: number; nonClaimableInputVat: number }> {
  const res = await api.patch(`/vat/filings/${filingId}/apportionment`, { apportionmentPct });
  return res.data?.data ?? res.data;
}

export function useVatApportionment(filingId: string | null) {
  const [data, setData] = useState<{
    apportionmentPct: number;
    claimableInputVat: number;
    nonClaimableInputVat: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const update = useCallback(async (pct: number) => {
    if (!filingId) return;
    setLoading(true);
    try {
      const result = await setVatApportionment(filingId, pct);
      setData(result);
      toast.success(`Apportionment set to ${(pct * 100).toFixed(1)}%`);
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to set apportionment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filingId]);

  return { data, loading, update };
}

// ── VAT Reconciliation Discrepancy Check ─────────────────────────────────────

export async function checkVatReconciliationDiscrepancies(
  period: string,
  filingOutputVat: number,
  filingInputVat: number,
  ledgerOutputVat: number,
  ledgerInputVat: number,
): Promise<{ hasDiscrepancies: boolean; outputVatDiff: number; inputVatDiff: number; message: string }> {
  const outputVatDiff = Math.abs(filingOutputVat - ledgerOutputVat);
  const inputVatDiff  = Math.abs(filingInputVat  - ledgerInputVat);
  const hasDiscrepancies = outputVatDiff > 1 || inputVatDiff > 1;

  return {
    hasDiscrepancies,
    outputVatDiff: Math.round(outputVatDiff * 100) / 100,
    inputVatDiff:  Math.round(inputVatDiff  * 100) / 100,
    message: hasDiscrepancies
      ? `Period ${period}: Output VAT diff ETB ${outputVatDiff.toFixed(2)}, Input VAT diff ETB ${inputVatDiff.toFixed(2)}. Reconcile before locking.`
      : `Period ${period}: Ledger matches filing — ready to lock.`,
  };
}
