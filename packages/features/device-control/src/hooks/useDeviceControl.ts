import { useState, useEffect, useCallback } from 'react';
import { deviceControlApi } from '../services/deviceControlApi';

export function useDeviceControl(params: { companyId?: string | null; enabled?: boolean } = {}) {
  const { enabled = true, companyId } = params;
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setData(await deviceControlApi.status(companyId)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load data'); }
    finally { setLoading(false); }
  }, [enabled, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
