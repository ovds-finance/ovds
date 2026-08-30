import { useState, useEffect, useCallback } from 'react';
import { workflowApi } from '../services/workflowApi';

export function useWorkflowCatalog(companyId?: string | null, period?: string) {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try { setData(await workflowApi.catalog(companyId, period)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load workflow catalog'); }
    finally { setLoading(false); }
  }, [companyId, period]);
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useWorkflowSummary(companyId?: string | null, period?: string) {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!companyId || !period) return;
    setLoading(true); setError(null);
    try { setData(await workflowApi.summary(companyId, period)); }
    catch (e: any) { setError(e?.message ?? 'Failed to load workflow summary'); }
    finally { setLoading(false); }
  }, [companyId, period]);
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
