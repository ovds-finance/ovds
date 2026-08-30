import { useState, useEffect, useCallback } from 'react';
import { payrollRunsApi } from '../services/payrollApi';

export function usePayrollRun(year: number, month: number, params: { departmentId?: string; companyId?: string | null; enabled?: boolean } = {}) {
  const { enabled = true, ...rest } = params;
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try {
      const res = await payrollRunsApi.list({ year, month, ...rest });
      if (Array.isArray(res)) setData(res);
      else setData(res.data ?? res.payrolls ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load payroll'); }
    finally { setLoading(false); }
  }, [enabled, year, month, JSON.stringify(rest)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function usePayrollDashboard() {
  const [stats, setStats]     = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setStats(await payrollRunsApi.dashboard()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load payroll dashboard'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, error, refetch: fetch };
}
