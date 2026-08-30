/**
 * useTaxDashboard — aggregates key tax KPIs for the tax overview page.
 * useVatSummary — VAT-specific KPI hook.
 */
import { useState, useEffect, useCallback } from 'react';
import { taxDashboardApi, vatApi } from '../services/taxApi';

// ── useTaxDashboard ───────────────────────────────────────────────────────────

export function useTaxDashboard(companyId?: string | null) {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await taxDashboardApi.overview(companyId);
      setData(overview);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load tax dashboard');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useVatSummary ─────────────────────────────────────────────────────────────

export function useVatSummary(companyId?: string | null) {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await vatApi.summary(companyId);
      setSummary(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load VAT summary');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refetch: fetch };
}

// ── useVatFilings ─────────────────────────────────────────────────────────────

export function useVatFilings(companyId?: string | null, period?: string) {
  const [filings, setFilings] = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await vatApi.filings({ companyId, period });
      if (Array.isArray(res)) {
        setFilings(res);
        setTotal(res.length);
      } else {
        setFilings(res.data ?? []);
        setTotal(res.total ?? 0);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load VAT filings');
    } finally {
      setLoading(false);
    }
  }, [companyId, period]);

  useEffect(() => { fetch(); }, [fetch]);

  return { filings, total, loading, error, refetch: fetch };
}
