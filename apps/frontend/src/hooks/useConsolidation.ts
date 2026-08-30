/**
 * useConsolidation — IFRS 10 group consolidation hooks
 *
 * Provides data-fetching and mutation hooks for:
 *   - Consolidated financial summary per EntityGroup
 *   - Intercompany elimination management
 *   - Ledger hash-chain integrity verification (AABE immutable audit trail)
 *
 * Usage:
 *   const { summary, loading } = useConsolidatedSummary(entityGroupId, period);
 *   const { run, running } = useRunEliminations();
 *   const { result, verify } = useLedgerIntegrity(companyId);
 */
import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../services/api';
import type { ConsolidatedSummary } from '@ovds/contracts/schemas';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Elimination {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  intercompanyTxId?: string | null;
  period: string;
  eliminationType: string;
  amount: number;
  journalEntryId?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export interface UnmatchedBalance {
  transactionId: string;
  fromCompanyId: string;
  toCompanyId: string;
  amount: number;
  type: string;
  description?: string | null;
}

export interface RunEliminationsResult {
  period: string;
  posted: number;
  skipped: number;
  failed: number;
  results: Elimination[];
  errors: Array<{ transactionId: string; error: string }>;
}

export interface LedgerIntegrityResult {
  companyId: string;
  intact: boolean;
  verified: number;
  violations: number;
  details: Array<{
    sourceId: string;
    storedHash: string;
    expectedHash: string;
    verifiedAt: string;
  }>;
}

export interface AutoApportionmentResult {
  period: string;
  taxableSales: number;
  exemptSales: number;
  totalSales: number;
  apportionmentPct: number;
  nonRecoverableVat: number;
}

// ── Consolidated summary ──────────────────────────────────────────────────────

export interface UseConsolidatedSummaryResult {
  summary: ConsolidatedSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch the consolidated financial summary for an EntityGroup after
 * IFRS 10 eliminations. Refreshes automatically when period changes.
 *
 * @param entityGroupId - The EntityGroup to consolidate
 * @param period - YYYY-MM period
 */
export function useConsolidatedSummary(
  entityGroupId: string | undefined,
  period: string | undefined,
): UseConsolidatedSummaryResult {
  const [summary, setSummary] = useState<ConsolidatedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!entityGroupId || !period) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ConsolidatedSummary>(
        `/reporting/consolidation/summary/${entityGroupId}?period=${period}`,
      );
      setSummary(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load consolidated summary');
    } finally {
      setLoading(false);
    }
  }, [entityGroupId, period]);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refetch: fetch };
}

// ── Eliminations list ─────────────────────────────────────────────────────────

export interface UseEliminationsResult {
  eliminations: Elimination[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * List intercompany eliminations with optional filters.
 */
export function useEliminations(params: {
  fromCompanyId?: string;
  toCompanyId?: string;
  period?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): UseEliminationsResult {
  const [eliminations, setEliminations] = useState<Elimination[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params.fromCompanyId) qs.set('fromCompanyId', params.fromCompanyId);
      if (params.toCompanyId) qs.set('toCompanyId', params.toCompanyId);
      if (params.period) qs.set('period', params.period);
      if (params.status) qs.set('status', params.status);
      if (params.page) qs.set('page', String(params.page));
      if (params.pageSize) qs.set('pageSize', String(params.pageSize));

      const res = await apiGet<{ data: Elimination[]; meta: { total: number } }>(
        `/reporting/consolidation/eliminations?${qs.toString()}`,
      );
      setEliminations(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load eliminations');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.fromCompanyId, params.toCompanyId, params.period, params.status, params.page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { eliminations, total, loading, error, refetch: fetch };
}

// ── Detect unmatched balances ─────────────────────────────────────────────────

export interface UseUnmatchedBalancesResult {
  unmatched: UnmatchedBalance[];
  count: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUnmatchedBalances(period: string | undefined): UseUnmatchedBalancesResult {
  const [unmatched, setUnmatched] = useState<UnmatchedBalance[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!period) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ unmatched: UnmatchedBalance[]; count: number }>(
        `/reporting/consolidation/unmatched?period=${period}`,
      );
      setUnmatched(data.unmatched ?? []);
      setCount(data.count ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to detect unmatched balances');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetch(); }, [fetch]);

  return { unmatched, count, loading, error, refetch: fetch };
}

// ── Run period eliminations (bulk close) ──────────────────────────────────────

export interface UseRunEliminationsResult {
  result: RunEliminationsResult | null;
  running: boolean;
  error: string | null;
  run: (period: string) => Promise<RunEliminationsResult | null>;
}

/**
 * Mutation hook — bulk-post all unmatched IC eliminations for a period.
 * Call `run(period)` on period-close. Safe to re-run (idempotent).
 */
export function useRunEliminations(): UseRunEliminationsResult {
  const [result, setResult] = useState<RunEliminationsResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (period: string) => {
    setRunning(true);
    setError(null);
    try {
      const data = await apiPost<RunEliminationsResult>(
        '/reporting/consolidation/run',
        { period },
      );
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to run eliminations');
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  return { result, running, error, run };
}

// ── Reverse single elimination ────────────────────────────────────────────────

export interface UseReverseEliminationResult {
  reversing: boolean;
  error: string | null;
  reverse: (id: string) => Promise<Elimination | null>;
}

export function useReverseElimination(): UseReverseEliminationResult {
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverse = useCallback(async (id: string) => {
    setReversing(true);
    setError(null);
    try {
      const data = await apiDelete<Elimination>(
        `/reporting/consolidation/eliminations/${id}`,
      );
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reverse elimination');
      return null;
    } finally {
      setReversing(false);
    }
  }, []);

  return { reversing, error, reverse };
}

// ── Ledger integrity ──────────────────────────────────────────────────────────

export interface UseLedgerIntegrityResult {
  result: LedgerIntegrityResult | null;
  verifying: boolean;
  error: string | null;
  verify: () => Promise<LedgerIntegrityResult | null>;
}

/**
 * Verify the SHA-256 hash chain over all posted journal entries for a company.
 * Call `verify()` on demand — e.g. from an "Audit Readiness" button.
 *
 * `result.intact === false` means tampering was detected — escalate immediately.
 */
export function useLedgerIntegrity(companyId: string | undefined): UseLedgerIntegrityResult {
  const [result, setResult] = useState<LedgerIntegrityResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    if (!companyId) return null;
    setVerifying(true);
    setError(null);
    try {
      const data = await apiGet<LedgerIntegrityResult>(
        `/double-entry/ledger-integrity/verify?companyId=${companyId}`,
      );
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to verify ledger integrity');
      return null;
    } finally {
      setVerifying(false);
    }
  }, [companyId]);

  return { result, verifying, error, verify };
}

// ── Auto-compute VAT apportionment ────────────────────────────────────────────

export interface UseAutoApportionmentResult {
  result: AutoApportionmentResult | null;
  computing: boolean;
  error: string | null;
  compute: (period: string) => Promise<AutoApportionmentResult | null>;
}

/**
 * Auto-compute input VAT pro-rata apportionment from live sales data.
 * Call `compute(period)` before VAT filing to get the correct ratio.
 *
 * Returns `nonRecoverableVat` — the portion of input VAT that must be
 * expensed to P&L instead of being claimed (partial exemption, Art. 26).
 */
export function useAutoApportionment(companyId: string | undefined): UseAutoApportionmentResult {
  const [result, setResult] = useState<AutoApportionmentResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async (period: string) => {
    if (!companyId) return null;
    setComputing(true);
    setError(null);
    try {
      const data = await apiPost<AutoApportionmentResult>(
        '/vat/filings/apportionment/auto-compute',
        { companyId, period },
      );
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to compute apportionment');
      return null;
    } finally {
      setComputing(false);
    }
  }, [companyId]);

  return { result, computing, error, compute };
}
