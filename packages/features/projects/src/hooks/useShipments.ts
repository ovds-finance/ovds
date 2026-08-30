import { useState, useEffect, useCallback } from 'react';
import { shipmentsApi } from '../services/tradeApi';

export function useShipments(params: { companyId?: string | null; status?: string; page?: number; limit?: number; enabled?: boolean } = {}) {
  const { enabled = true, companyId, status, page, limit } = params;
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setData(await shipmentsApi.list({ companyId, status, page, limit })); }
    catch (e: any) { setError(e?.message ?? 'Failed to load data'); }
    finally { setLoading(false); }
  }, [enabled, companyId, status, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
