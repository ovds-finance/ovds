import { useState, useEffect, useCallback } from 'react';
import { customFieldsApi } from '../services/customFieldsApi';

export function useCustomFields(params: { companyId?: string | null; entity?: string; enabled?: boolean } = {}) {
  const { enabled = true, companyId, entity } = params;
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setData(await customFieldsApi.list({ companyId, entity })); }
    catch (e: any) { setError(e?.message ?? 'Failed to load data'); }
    finally { setLoading(false); }
  }, [enabled, companyId, entity]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
