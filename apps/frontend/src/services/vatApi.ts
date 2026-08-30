import { useState, useEffect, useCallback } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { ETH_TAX } from '@ovds/shared';
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

/** Custom hook: VAT Filings + Summary (main dashboard data) */
export function useVatFilings() {
  const [filings, setFilings] = useState<VatFiling[]>([]);
  const [summary, setSummary] = useState<VatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filingsRes, summaryRes] = await Promise.all([
        api.get('/vat/filings', { headers: { 'x-background': '1' } } as any),
        api.get('/vat/summary', { headers: { 'x-background': '1' } } as any),
      ]);
      setFilings(Array.isArray(filingsRes.data?.data) ? filingsRes.data.data : Array.isArray(filingsRes.data) ? filingsRes.data : []);
      setSummary(summaryRes.data.data ?? summaryRes.data ?? null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to load VAT data';
      setError(msg);
      // Only show toast on explicit user-triggered fetch, not background
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateFiling = useCallback(async (period: string, startDate: string, endDate: string) => {
    try {
      await api.post('/vat/filings/calculate', { period, startDate, endDate });
      await fetch(); // Refresh
      toast.success('VAT filing calculated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Calculation failed');
      throw err;
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { filings, summary, loading, error, refetch: fetch, calculateFiling };
}

/** Custom hook: VAT Dashboard aggregates */
export function useVatDashboard(period?: string) {
  const [data, setData] = useState<VatDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/vat/dashboard' + (p ? `?period=${p}` : ''), { headers: { 'x-background': '1' } } as any);
      setData(res.data.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { data, loading, refetch: () => fetch(period) };
}

/** Input VAT Ledger */
export function useInputLedger(period?: string) {
  const [entries, setEntries] = useState<InputVatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/vat/input-ledger' + (p ? `?period=${p}` : ''));
      const raw = res.data?.data ?? res.data;
      setEntries(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/input-ledger/${id}`);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { entries, loading, refetch: () => fetch(period), remove };
}

/** Output VAT Ledger */
export function useOutputLedger(period?: string) {
  const [entries, setEntries] = useState<OutputVatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/vat/output-ledger' + (p ? `?period=${p}` : ''));
      const raw = res.data?.data ?? res.data;
      setEntries(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/output-ledger/${id}`);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { entries, loading, refetch: () => fetch(period), remove };
}

/** Withholding Register */
export function useWithholding(period?: string) {
  const [entries, setEntries] = useState<WithholdingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/vat/withholding' + (p ? `?period=${p}` : ''));
      const raw = res.data?.data ?? res.data;
      setEntries(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRemitted = useCallback(async (id: string) => {
    const res = await api.patch(`/vat/withholding/${id}/toggle-remitted`);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, remitted: res.data.data?.remitted ?? !e.remitted } : e));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/withholding/${id}`);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { entries, loading, refetch: () => fetch(period), toggleRemitted, remove };
}

/** Reverse-Charge Register */
export function useReverseCharges(period?: string) {
  const [entries, setEntries] = useState<ReverseChargeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/vat/reverse-charges' + (p ? `?period=${p}` : ''));
      const raw = res.data?.data ?? res.data;
      setEntries(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: Omit<ReverseChargeEntry, 'id' | 'vatDue'>) => {
    const res = await api.post('/vat/reverse-charges', dto);
    setEntries(prev => [res.data.data ?? res.data, ...prev]);
    return res.data.data ?? res.data;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/reverse-charges/${id}`);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { entries, loading, refetch: () => fetch(period), create, remove };
}

/** Refund Claims */
export function useRefundClaims() {
  const [claims, setClaims] = useState<RefundClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vat/refund-claims');
      const raw = res.data?.data ?? res.data;
      setClaims(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: Omit<RefundClaim, 'id' | 'ref' | 'status'>) => {
    const res = await api.post('/vat/refund-claims', dto);
    setClaims(prev => [res.data.data ?? res.data, ...prev]);
    return res.data.data ?? res.data;
  }, []);

  const updateStatus = useCallback(async (id: string, status: RefundClaim['status'], notes?: string) => {
    await api.patch(`/vat/refund-claims/${id}/status`, { status, notes });
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status, notes } : c));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/refund-claims/${id}`);
    setClaims(prev => prev.filter(c => c.id !== id));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { claims, loading, refetch: fetch, create, updateStatus, remove };
}

/** VAT Notes */
export function useVatNotes() {
  const [notes, setNotes] = useState<VatNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vat/notes');
      const raw = res.data?.data ?? res.data;
      setNotes(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: Omit<VatNote, 'id'>) => {
    const res = await api.post('/vat/notes', dto);
    setNotes(prev => [res.data.data ?? res.data, ...prev]);
    return res.data.data ?? res.data;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/notes/${id}`);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { notes, loading, refetch: fetch, create, remove };
}

/** Export Evidence */
export function useExportEvidence() {
  const [evidence, setEvidence] = useState<ExportEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vat/export-evidence');
      const raw = res.data?.data ?? res.data;
      setEvidence(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: Omit<ExportEvidence, 'id' | 'customsDecl' | 'billOfLading' | 'bankReceipt'>) => {
    const res = await api.post('/vat/export-evidence', dto);
    setEvidence(prev => [res.data.data ?? res.data, ...prev]);
    return res.data.data ?? res.data;
  }, []);

  const cycleStatus = useCallback(async (id: string, field: 'customsDecl' | 'billOfLading' | 'bankReceipt') => {
    const res = await api.patch(`/vat/export-evidence/${id}/cycle/${field}`);
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, [field]: res.data.data?.[field] ?? 'partial' } : e));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/vat/export-evidence/${id}`);
    setEvidence(prev => prev.filter(e => e.id !== id));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { evidence, loading, refetch: fetch, create, cycleStatus, remove };
}

/** Combined hook for entire VAT page */
export function useVatPage() {
  return {
    filings: useVatFilings(),
    dashboard: useVatDashboard(),
    inputLedger: useInputLedger(),
    outputLedger: useOutputLedger(),
    withholding: useWithholding(),
    reverseCharges: useReverseCharges(),
    refunds: useRefundClaims(),
    notes: useVatNotes(),
    exportEvidence: useExportEvidence(),
  };
}


// -- eTax Portal Submission ----------------------------------------------------

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

/** Hook: track eTax portal submissions */
export function useEtaxSubmissions() {
  const [submissions, setSubmissions] = useState<EtaxSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vat/etax-submissions');
      const raw = res.data?.data ?? res.data;
      setSubmissions(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      // Degrade gracefully — don't show error toast for background load failures
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /** Submit a VAT return to ERCA eTax portal */
  const submitVatReturn = useCallback(async (period: string, netPayable: number, notes?: string) => {
    setSubmitting(true);
    try {
      const submitRes = await api.post('/vat/etax-submissions', {
        period, type: 'VAT_RETURN', totalAmount: netPayable, notes,
      });
      const saved: EtaxSubmissionRecord = submitRes.data?.data ?? submitRes.data;
      setSubmissions(prev => [saved, ...prev]);
      toast.success(`VAT return for ${period} submitted — Ref: ${saved.ercaReferenceNo ?? saved.id}`);
      return saved;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'eTax VAT submission failed');
      throw err;
    } finally { setSubmitting(false); }
  }, []);

  /** Submit WHT return */
  const submitWhtReturn = useCallback(async (period: string, totalWht: number) => {
    setSubmitting(true);
    try {
      const submitRes = await api.post('/vat/etax-submissions', {
        period, type: 'WHT_RETURN', totalAmount: totalWht,
      });
      const saved: EtaxSubmissionRecord = submitRes.data?.data ?? submitRes.data;
      setSubmissions(prev => [saved, ...prev]);
      toast.success(`WHT return for ${period} submitted — Ref: ${saved.ercaReferenceNo ?? saved.id}`);
      return saved;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'eTax WHT submission failed');
      throw err;
    } finally { setSubmitting(false); }
  }, []);

  return { submissions, loading, submitting, refetch: fetch, submitVatReturn, submitWhtReturn };
}

/** Generate ERCA-compliant VAT return summary for a period */
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
      const d = new Date(y, m, 30); // 30th of following month
      return d.toLocaleDateString('en-ET');
    })(),
  };
}

// ── Period Lock ────────────────────────────────────────────────────────────

/**
 * Lock a VAT filing period — prevents further mutations after MoR submission.
 * POST /vat/filings/:id/lock
 */
export async function lockVatPeriod(filingId: string): Promise<any> {
  const res = await api.post(`/vat/filings/${filingId}/lock`);
  return res.data?.data ?? res.data;
}

// ── Input VAT Apportionment ────────────────────────────────────────────────

/**
 * Set the input VAT apportionment % for a filing period.
 * Required for mixed-use businesses (taxable + exempt supplies).
 * Proclamation 1341/2024 Art. 26 — partial exemption method.
 *
 * apportionmentPct: 0.0–1.0 (e.g. 0.75 = 75% of input VAT is claimable)
 * PATCH /vat/filings/:id/apportionment
 */
export async function setVatApportionment(
  filingId: string,
  apportionmentPct: number,
): Promise<{
  apportionmentPct: number;
  claimableInputVat: number;
  nonClaimableInputVat: number;
}> {
  const res = await api.patch(`/vat/filings/${filingId}/apportionment`, {
    apportionmentPct,
  });
  return res.data?.data ?? res.data;
}

/**
 * Hook: get the current apportionment % and claimable breakdown for a filing.
 * Fetches from the VAT filings list and finds the matching period.
 */
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

// ── VAT Reconciliation Discrepancy Check ──────────────────────────────────

/**
 * Compare ledger totals against the VatFiling record for a period.
 * Returns discrepancies between ledger entries and the recorded filing.
 * Useful before locking a period.
 */
export async function checkVatReconciliationDiscrepancies(
  period: string,
  filingOutputVat: number,
  filingInputVat: number,
  ledgerOutputVat: number,
  ledgerInputVat: number,
): Promise<{
  hasDiscrepancies: boolean;
  outputVatDiff: number;
  inputVatDiff: number;
  message: string;
}> {
  const outputVatDiff = Math.abs(filingOutputVat - ledgerOutputVat);
  const inputVatDiff  = Math.abs(filingInputVat - ledgerInputVat);
  const hasDiscrepancies = outputVatDiff > 1 || inputVatDiff > 1; // ETB 1 tolerance

  return {
    hasDiscrepancies,
    outputVatDiff: Math.round(outputVatDiff * 100) / 100,
    inputVatDiff:  Math.round(inputVatDiff * 100) / 100,
    message: hasDiscrepancies
      ? `Period ${period}: Output VAT diff ETB ${outputVatDiff.toFixed(2)}, Input VAT diff ETB ${inputVatDiff.toFixed(2)}. Reconcile before locking.`
      : `Period ${period}: Ledger matches filing — ready to lock.`,
  };
}
