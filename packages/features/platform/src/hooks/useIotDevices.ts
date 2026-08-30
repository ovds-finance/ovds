import { useState, useEffect, useCallback } from 'react';
import { iotDevicesApi } from '../services/iotApi';

export function useIotDevices(params: { companyId?: string | null; status?: string; enabled?: boolean } = {}) {
  const { enabled = true, companyId, status } = params;
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setData(await iotDevicesApi.list({ companyId, status })); }
    catch (e: any) { setError(e?.message ?? 'Failed to load data'); }
    finally { setLoading(false); }
  }, [enabled, companyId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
