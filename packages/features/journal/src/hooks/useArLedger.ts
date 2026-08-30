import { useState, useEffect, useCallback } from 'react';
import { subLedgerApi } from '../services/subLedgerApi';

export function useArLedger(params: { companyId?: string | null; page?: number; limit?: number; enabled?: boolean } = {}) {
  const { enabled = true, companyId, page, limit } = params;
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setData(await subLedgerApi.arLedger({ companyId, page, limit })); }
    catch (e: any) { setError(e?.message ?? 'Failed to load data'); }
    finally { setLoading(false); }
  }, [enabled, companyId, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
