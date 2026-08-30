import { useState, useEffect, useCallback } from 'react';
import { leasesApi } from '../services/ifrsApi';

export function useLeases(params: { companyId?: string | null; status?: string; page?: number; limit?: number; enabled?: boolean } = {}) {
  const { enabled = true, ...query } = params;
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try {
      const res = await leasesApi.list(query);
      if (Array.isArray(res)) { setData(res); setTotal(res.length); }
      else { setData(res.data ?? []); setTotal(res.total ?? 0); }
    } catch (e: any) { setError(e?.message ?? 'Failed to load leases'); }
    finally { setLoading(false); }
  }, [enabled, JSON.stringify(query)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, [fetch]);
  return { data, total, loading, error, refetch: fetch };
}

export function useLeaseSummary(companyId?: string | null) {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setSummary(await leasesApi.summary(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load lease summary'); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { summary, loading, error, refetch: fetch };
}
