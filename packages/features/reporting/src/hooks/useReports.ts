 /**
 * useFinancialBundle — loads all four IFRS statements in one call.
 * useAgingReport — AR or AP aging report.
 * usePendingApprovals — pending approval requests.
 */
import { useState, useEffect, useCallback } from 'react';
import { financialStatementsApi, agingApi, approvalApi } from '../services/reportingApi';

// ── useFinancialBundle ────────────────────────────────────────────────────────

export function useFinancialBundle(params: {
  companyId?: string;
  startDate?: string;
  endDate?: string;
  comparePriorYear?: boolean;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params;
  const [bundle, setBundle]   = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled || !params.companyId) return;
    setLoading(true);
    setError(null);
    try {
      setBundle(await financialStatementsApi.bundle(queryParams));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load financial statements');
    } finally {
      setLoading(false);
    }
  }, [enabled, JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  return { bundle, loading, error, refetch: fetch };
}

// ── useAgingReport ────────────────────────────────────────────────────────────

export function useAgingReport(
  type: 'AR' | 'AP',
  companyId?: string,
  date?: string,
) {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = type === 'AR'
        ? await agingApi.arAging(companyId, date)
        : await agingApi.apAging(companyId, date);
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load aging report');
    } finally {
      setLoading(false);
    }
  }, [type, companyId, date]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── usePendingApprovals ───────────────────────────────────────────────────────

export function usePendingApprovals(companyId?: string) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setRequests(await approvalApi.pending(companyId));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { requests, loading, error, refetch: fetch };
}
