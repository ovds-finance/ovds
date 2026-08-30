/**
 * useCustomers — customer registry with search and CRUD mutations.
 *
 * Usage:
 *   import { useCustomers } from '@ovds/features/invoice';
 *   const { customers, create, update } = useCustomers({ companyId });
 */
import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../services/invoicesApi';

export interface UseCustomersResult {
  customers: any[];
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  refetch: () => void;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<boolean>;
}

export function useCustomers(params: { companyId?: string } = {}): UseCustomersResult {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.list({ ...params, search: search || undefined });
      const rows  = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
      const count = (res as any)?.data?.total ?? (res as any)?.total ?? rows.length;
      setCustomers(Array.isArray(rows) ? rows : []);
      setTotal(count);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [params.companyId, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function mutate<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true); setError(null);
    try { const r = await fn(); await fetchAll(); return r; }
    catch (err: any) { setError(err?.message ?? 'Operation failed'); return null; }
    finally { setSaving(false); }
  }

  return {
    customers, total, loading, saving, error, search, setSearch,
    refetch: fetchAll,
    create: (data) => mutate(() => customersApi.create(data)) as Promise<any>,
    update: (id, data) => mutate(() => customersApi.update(id, data)) as Promise<any>,
    remove: async (id) => { await mutate(() => customersApi.remove(id)); return true; },
  };
}
