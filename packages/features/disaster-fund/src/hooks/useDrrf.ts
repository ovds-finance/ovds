import { useState, useEffect, useCallback } from 'react';
import { drrfApi } from '../services/disasterFundApi';

export function useDrrf(params: { companyId?: string | null; period?: string; enabled?: boolean } = {}) {
  const { enabled = true, companyId, period } = params;
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setData(await drrfApi.summary(companyId, period)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load data'); }
    finally { setLoading(false); }
  }, [enabled, companyId, period]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
