import { useState, useEffect, useCallback } from 'react';
import { releaseApi } from '../services/releaseApi';

export function useLatestRelease() {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await releaseApi.latest()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load release'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
