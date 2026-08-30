/**
 * useOvdsSummary — Real-time OVDS KPI hook.
 * Moved from apps/frontend/src/hooks/useOvdsSummary.ts to @ovds/features/accounting.
 *
 * Usage:
 *   import { useOvdsSummary } from '@ovds/features/accounting';
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ovdsSummaryApi } from '../services/ovdsApi';
import type { ovdsSummary, InvoiceStats, VatSummary, TaxpayerStatus } from '@ovds/ui';

export interface UseOvdsSummaryResult {
  summary: ovdsSummary | null;
  invoiceStats: InvoiceStats | null;
  vatSummary: VatSummary | null;
  taxpayerStatus: TaxpayerStatus | null;
  revenueTrend: Array<{ label: string; revenue: number; expenses: number }>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useOvdsSummary(
  companyId?: string | null,
  pollMs = 0,
): UseOvdsSummaryResult {
  const [summary, setSummary]               = useState<ovdsSummary | null>(null);
  const [invoiceStats, setInvoiceStats]     = useState<InvoiceStats | null>(null);
  const [vatSummary, setVatSummary]         = useState<VatSummary | null>(null);
  const [taxpayerStatus, setTaxpayerStatus] = useState<TaxpayerStatus | null>(null);
  const [revenueTrend, setRevenueTrend]     = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);
  const pollRef                             = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, is, vs, ts, rt] = await Promise.allSettled([
        ovdsSummaryApi.summary(companyId),
        ovdsSummaryApi.invoiceStats(companyId),
        ovdsSummaryApi.vatSummary(companyId),
        ovdsSummaryApi.taxpayerStatus(companyId),
        ovdsSummaryApi.revenueTrend(companyId),
      ]);
      if (s.status  === 'fulfilled') setSummary(s.value as ovdsSummary);
      if (is.status === 'fulfilled') setInvoiceStats(is.value as InvoiceStats);
      if (vs.status === 'fulfilled') setVatSummary(vs.value as VatSummary);
      if (ts.status === 'fulfilled') setTaxpayerStatus(ts.value as TaxpayerStatus);
      if (rt.status === 'fulfilled') setRevenueTrend((rt.value as any[]) ?? []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load OVDS summary');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (pollMs > 0) {
      pollRef.current = setInterval(fetchData, pollMs);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollMs, fetchData]);

  return { summary, invoiceStats, vatSummary, taxpayerStatus, revenueTrend, loading, error, refetch: fetchData, lastUpdated };
}
