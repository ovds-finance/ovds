import { useState, useEffect, useCallback } from 'react';
import { paymentsApi } from '../services/paymentsApi';

export function usePayments(params: { companyId?: string | null; page?: number; limit?: number; status?: string; enabled?: boolean } = {}) {
  const { enabled = true, ...query } = params;
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try {
      const res = await paymentsApi.list(query);
      if (Array.isArray(res)) { setData(res); setTotal(res.length); }
      else { setData(res.data ?? []); setTotal(res.total ?? 0); }
    } catch (e: any) { setError(e?.message ?? 'Failed to load payments'); }
    finally { setLoading(false); }
  }, [enabled, JSON.stringify(query)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, [fetch]);
  return { data, total, loading, error, refetch: fetch };
}
