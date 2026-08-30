/**
 * useLeaves — leave requests management hook.
 *
 * Usage:
 *   import { useLeaves } from '@ovds/features/hr';
 *   const { requests, apply, approve, reject } = useLeaves({ companyId });
 */
import { useState, useEffect, useCallback } from 'react';
import { leavesApi } from '../services/hrApi';
import type { LeaveRequest } from '../services/hrApi';

export interface UseLeaveFilters {
  employeeId?: string;
  status?: string;
  companyId?: string;
}

export interface UseLeavesResult {
  requests: LeaveRequest[];
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  apply: (data: Partial<LeaveRequest>) => Promise<LeaveRequest | null>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useLeaves(filters: UseLeaveFilters = {}): UseLeavesResult {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leavesApi.list(filters);
      const rows = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
      setRequests(Array.isArray(rows) ? rows : []);
      setTotal((res as any)?.data?.total ?? (res as any)?.total ?? rows.length);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const apply = useCallback(async (data: Partial<LeaveRequest>) => {
    setSaving(true);
    setError(null);
    try {
      const leave = await leavesApi.apply(data);
      await fetchAll();
      return leave;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to apply for leave');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const approve = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await leavesApi.approve(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to approve leave');
    } finally {
      setSaving(false);
    }
  }, []);

  const reject = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await leavesApi.reject(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reject leave');
    } finally {
      setSaving(false);
    }
  }, []);

  return { requests, total, loading, saving, error, apply, approve, reject, refetch: fetchAll };
}
