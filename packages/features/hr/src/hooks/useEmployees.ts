/**
 * useEmployees — paginated employee list with search / filter.
 *
 * Usage:
 *   import { useEmployees } from '@ovds/features/hr';
 *   const { data, loading, filters, setFilters, goToPage } = useEmployees();
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { employeesApi } from '../services/hrApi';
import type { Employee } from '../services/hrApi';

export interface EmployeeFilters {
  companyId?: string;
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UseEmployeesResult {
  data: Employee[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: EmployeeFilters;
  setFilters: (f: Partial<EmployeeFilters>) => void;
  goToPage: (n: number) => void;
  refetch: () => void;
}

export function useEmployees(initial: EmployeeFilters = {}): UseEmployeesResult {
  const [filters, setFiltersState] = useState<EmployeeFilters>({
    page: 1,
    limit: 25,
    ...initial,
  });
  const [data, setData]     = useState<Employee[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const abortRef            = useRef<AbortController | null>(null);

  const fetch = useCallback(async (f: EmployeeFilters) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await employeesApi.list(f);
      const rows  = (res as any)?.data?.data ?? (res as any)?.data ?? (res as any) ?? [];
      const count = (res as any)?.data?.total ?? (res as any)?.total ?? rows.length;
      setData(Array.isArray(rows) ? rows : []);
      setTotal(count);
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError(err?.message ?? 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(filters); }, [fetch, filters]);

  const setFilters = useCallback((f: Partial<EmployeeFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f, page: 1 }));
  }, []);

  const goToPage = useCallback((n: number) => {
    setFiltersState(prev => ({ ...prev, page: n }));
  }, []);

  const limit = filters.limit ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data, total, page: filters.page ?? 1, totalPages,
    loading, error, filters,
    setFilters, goToPage,
    refetch: () => fetch(filters),
  };
}
