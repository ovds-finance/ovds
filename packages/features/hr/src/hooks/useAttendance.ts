/**
 * useAttendance — daily attendance records and check-in / check-out mutations.
 *
 * Usage:
 *   import { useAttendance } from '@ovds/features/hr';
 *   const { records, checkIn, checkOut, summary } = useAttendance({ companyId });
 */
import { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../services/hrApi';

export interface AttendanceSummary {
  date: string;
  totalEmployees: number;
  checkedIn: number;
  absent: number;
  notRecorded: number;
  attendanceRate: number;
}

export interface UseAttendanceFilters {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  companyId?: string;
}

export interface UseAttendanceResult {
  records: any[];
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  checkIn: (employeeId: string, method?: string, location?: { latitude?: number; longitude?: number }) => Promise<any>;
  checkOut: (employeeId: string, method?: string) => Promise<any>;
  refetch: () => void;
}

export function useAttendance(filters: UseAttendanceFilters = {}): UseAttendanceResult {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.list(filters);
      const rows = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
      setRecords(Array.isArray(rows) ? rows : []);
      setTotal((res as any)?.data?.total ?? (res as any)?.total ?? rows.length);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const checkIn = useCallback(async (
    employeeId: string,
    method = 'MANUAL',
    location?: { latitude?: number; longitude?: number },
  ) => {
    setSaving(true);
    setError(null);
    try {
      const record = await attendanceApi.checkIn({ employeeId, method, ...location });
      await fetchAll();
      return record;
    } catch (err: any) {
      setError(err?.message ?? 'Check-in failed');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const checkOut = useCallback(async (employeeId: string, method = 'MANUAL') => {
    setSaving(true);
    setError(null);
    try {
      const record = await attendanceApi.checkOut({ employeeId, method });
      await fetchAll();
      return record;
    } catch (err: any) {
      setError(err?.message ?? 'Check-out failed');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  return { records, total, loading, saving, error, checkIn, checkOut, refetch: fetchAll };
}
