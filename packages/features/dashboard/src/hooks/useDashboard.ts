/**
 * useDashboardStats — aggregated KPI summary for the main dashboard.
 * useRevenueTrend — monthly revenue array for charts.
 */
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/dashboardApi';

export function useDashboardStats(companyId?: string | null) {
  const [stats, setStats]     = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setStats(await dashboardApi.stats(companyId));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}

export function useRevenueTrend(companyId?: string | null, months?: number) {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.revenueTrend(companyId, months);
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load revenue trend');
    } finally {
      setLoading(false);
    }
  }, [companyId, months]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useActivityFeed(companyId?: string | null, limit = 20) {
  const [items, setItems]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.activityFeed(companyId, limit);
      setItems(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [companyId, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refetch: fetch };
}
