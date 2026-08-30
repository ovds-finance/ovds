/**
 * missingFeaturesApi — typed client for the 7 newly-implemented accounting automation endpoints.
 *
 * Backend routes added in MissingFeaturesService / ovds.controller.ts:
 *
 *   POST /ovds/leases/post-monthly-entries          — IFRS 16 ROU amortisation
 *   POST /tax/bit-quarterly-prepayment         — BIT quarterly instalment
 *   POST /ovds/journal-entries/post-recurring       — Recurring JE posting
 *   POST /ovds/budgets/refresh-actuals              — Budget vs actual feed
 *   POST /ovds/bills/:id/debit-note                 — AP Debit Note creation
 *   POST /ovds/loans/repayments/:id/post-gl         — Loan repayment GL
 *   POST /ovds/revenue/recognise-deferred           — IFRS 15 deferred revenue
 */
import { useState, useCallback } from 'react';
import api from './api';
import toast from 'react-hot-toast';

// -- Shared result types --------------------------------------------------------

export interface BatchJobResult {
  period:    string;
  processed: number;
  posted:    number;
  skipped:   number;
  errors:    number;
}

export interface PostResult {
  posted:  boolean;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. IFRS 16 — ROU Amortisation + Lease Liability Reduction
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Manually trigger IFRS 16 monthly ROU depreciation + lease liability reduction.
 * Idempotent — safe to call multiple times for the same period.
 */
export async function postMonthlyLeaseEntries(period?: string): Promise<BatchJobResult> {
  const res = await api.post('/ovds/leases/post-monthly-entries', {
    period: period ?? new Date().toISOString().slice(0, 7),
  });
  return res.data?.data ?? res.data;
}

export function usePostMonthlyLeaseEntries() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (period?: string) => {
    setLoading(true);
    try {
      const result = await postMonthlyLeaseEntries(period);
      if (result.errors > 0) {
        toast.error(`IFRS 16: ${result.posted} posted, ${result.errors} errors`);
      } else if (result.posted > 0) {
        toast.success(`IFRS 16: ${result.posted} lease entr${result.posted === 1 ? 'y' : 'ies'} posted for ${result.period}`);
      } else {
        toast(`IFRS 16: No leases to post for ${result.period}`, { icon: 'ℹ️' });
      }
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'IFRS 16 posting failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BIT Quarterly Prepayments — Proclamation No. 1395/2025 Art. 93
// ═══════════════════════════════════════════════════════════════════════════════

export interface BitPrepaymentResult {
  posted:     boolean;
  amount:     number;
  message:    string;
}

/**
 * Post a quarterly BIT prepayment instalment for a company.
 * Safe harbour = 25% of prior-year BIT.
 */
export async function postBitQuarterlyPrepayment(
  quarter: 1 | 2 | 3 | 4,
  companyId?: string,
  fiscalYear?: number,
): Promise<BitPrepaymentResult> {
  const res = await api.post('/tax/bit-quarterly-prepayment', {
    quarter,
    companyId,
    fiscalYear,
  });
  return res.data?.data ?? res.data;
}

export function usePostBitPrepayment() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (quarter: 1 | 2 | 3 | 4, companyId?: string, fiscalYear?: number) => {
    setLoading(true);
    try {
      const result = await postBitQuarterlyPrepayment(quarter, companyId, fiscalYear);
      if (result.posted) {
        toast.success(`BIT Q${quarter} prepayment ETB ${result.amount.toLocaleString('en-ET')} posted`);
      } else {
        toast(result.message, { icon: 'ℹ️' });
      }
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'BIT prepayment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Recurring Journal Entries
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Post all RECURRING: template journal entries for a period.
 * Idempotent — skips entries already posted for the period.
 */
export async function postRecurringJournalEntries(period?: string): Promise<BatchJobResult> {
  const now   = new Date();
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const res = await api.post('/ovds/journal-entries/post-recurring', {
    period: period ?? prior.toISOString().slice(0, 7),
  });
  return res.data?.data ?? res.data;
}

export function usePostRecurringJEs() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (period?: string) => {
    setLoading(true);
    try {
      const result = await postRecurringJournalEntries(period);
      if (result.errors > 0) {
        toast.error(`Recurring JEs: ${result.posted} posted, ${result.errors} errors for ${result.period}`);
      } else if (result.posted > 0) {
        toast.success(`${result.posted} recurring journal entr${result.posted === 1 ? 'y' : 'ies'} posted for ${result.period}`);
      } else {
        toast(`No recurring journal entries due for ${result.period}`, { icon: 'ℹ️' });
      }
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Recurring JE posting failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Budget Actuals Refresh
// ═══════════════════════════════════════════════════════════════════════════════

export interface BudgetActualsResult {
  updated: number;
}

/**
 * Refresh budget vs actual data from posted journal lines for a period.
 * Used by BudgetVariance page to pull live data without a manual journal entry export.
 */
export async function refreshBudgetActuals(
  period?: string,
  companyId?: string,
): Promise<BudgetActualsResult> {
  const now   = new Date();
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const res = await api.post('/ovds/budgets/refresh-actuals', {
    period:    period    ?? prior.toISOString().slice(0, 7),
    companyId,
  });
  return res.data?.data ?? res.data;
}

export function useRefreshBudgetActuals() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (period?: string, companyId?: string) => {
    setLoading(true);
    try {
      const result = await refreshBudgetActuals(period, companyId);
      toast.success(`Budget actuals refreshed — ${result.updated} line${result.updated !== 1 ? 's' : ''} updated`);
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Budget refresh failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. AP Debit Notes (Credit Notes for Bills)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateDebitNoteDto {
  reason:           string;
  amount?:          number;   // partial debit note; omit for full bill amount
  vendorReference?: string;
}

export interface DebitNoteResult {
  id:         string;
  billNumber: string;
  total:      number;
  status:     string;
  notes:      string;
}

/**
 * Create a Debit Note (AP credit) against an existing bill.
 * Automatically posts GL: Dr AP / Cr Expense.
 */
export async function createDebitNote(
  billId: string,
  dto: CreateDebitNoteDto,
): Promise<DebitNoteResult> {
  if (!dto.reason?.trim()) throw new Error('reason is required for a debit note');
  const res = await api.post(`/ovds/bills/${billId}/debit-note`, dto);
  return res.data?.data ?? res.data;
}

export function useCreateDebitNote() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (billId: string, dto: CreateDebitNoteDto) => {
    setLoading(true);
    try {
      const result = await createDebitNote(billId, dto);
      toast.success(`Debit note ${result.billNumber} created`);
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Debit note creation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Loan Repayment GL Posting
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Manually post the GL journal for an existing loan repayment.
 * Useful for repayments created before auto-posting was enabled.
 */
export async function postLoanRepaymentGl(repaymentId: string): Promise<PostResult> {
  const res = await api.post(`/ovds/loans/repayments/${repaymentId}/post-gl`);
  return res.data?.data ?? res.data;
}

export function usePostLoanRepaymentGl() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (repaymentId: string) => {
    setLoading(true);
    try {
      const result = await postLoanRepaymentGl(repaymentId);
      if (result.posted) {
        toast.success('Loan repayment GL posted');
      } else {
        toast(result.message, { icon: 'ℹ️' });
      }
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Loan GL posting failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. IFRS 15 Deferred Revenue Recognition
// ═══════════════════════════════════════════════════════════════════════════════

export interface DeferredRevenueResult {
  period:      string;
  processed:   number;
  recognised:  number;
  skipped:     number;
  errors:      number;
}

/**
 * Recognise monthly deferred revenue for all IFRS 15 contracts in a period.
 * Dr Deferred Revenue / Cr Revenue for each eligible invoice.
 * Idempotent — skips invoices already recognised for the period.
 */
export async function recogniseDeferredRevenue(
  period?: string,
  companyId?: string,
): Promise<DeferredRevenueResult> {
  const res = await api.post('/ovds/revenue/recognise-deferred', {
    period:    period    ?? new Date().toISOString().slice(0, 7),
    companyId,
  });
  return res.data?.data ?? res.data;
}

export function useRecogniseDeferredRevenue() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (period?: string, companyId?: string) => {
    setLoading(true);
    try {
      const result = await recogniseDeferredRevenue(period, companyId);
      if (result.errors > 0) {
        toast.error(`IFRS 15: ${result.recognised} recognised, ${result.errors} errors for ${result.period}`);
      } else if (result.recognised > 0) {
        toast.success(`IFRS 15: ${result.recognised} revenue entr${result.recognised === 1 ? 'y' : 'ies'} recognised for ${result.period}`);
      } else {
        toast(`IFRS 15: No deferred revenue to recognise for ${result.period}`, { icon: 'ℹ️' });
      }
      return result;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Deferred revenue recognition failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Combined namespace export for convenience
// ═══════════════════════════════════════════════════════════════════════════════

export const missingFeaturesApi = {
  postMonthlyLeaseEntries,
  postBitQuarterlyPrepayment,
  postRecurringJournalEntries,
  refreshBudgetActuals,
  createDebitNote,
  postLoanRepaymentGl,
  recogniseDeferredRevenue,
} as const;

