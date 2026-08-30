/**
 * useDepartments — department list with create / update / delete mutations.
 *
 * Usage:
 *   import { useDepartments } from '@ovds/features/hr';
 *   const { departments, create, update, remove } = useDepartments({ companyId });
 */
import { useState, useEffect, useCallback } from 'react';
import { departmentsApi } from '../services/hrApi';

export interface UseDepartmentsResult {
  departments: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export function useDepartments(params: { companyId?: string } = {}): UseDepartmentsResult {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await departmentsApi.list(params);
      const rows = (res as any)?.data ?? (res as any) ?? [];
      setDepartments(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [params.companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (data: any) => {
    setSaving(true);
    setError(null);
    try {
      const dept = await departmentsApi.create(data);
      await fetchAll();
      return dept;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create department');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchAll]);

  const update = useCallback(async (id: string, data: any) => {
    setSaving(true);
    setError(null);
    try {
      const dept = await departmentsApi.update(id, data);
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...dept } : d));
      return dept;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update department');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await departmentsApi.remove(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete department');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { departments, loading, saving, error, create, update, remove, refetch: fetchAll };
}
