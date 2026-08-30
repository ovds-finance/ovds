/**
 * useInvoices — paginated invoice list with filters, stats, and CRUD mutations.
 *
 * Usage:
 *   import { useInvoices } from '@ovds/features/invoice';
 *   const { data, stats, loading, filters, setFilters, create, update, void: voidInvoice } = useInvoices();
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { invoicesApi } from '../services/invoicesApi';
import type { InvoiceListParams } from '../services/invoicesApi';

export interface UseInvoicesResult {
  data: any[];
  total: number;
  page: number;
  totalPages: number;
  stats: any | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  filters: InvoiceListParams;
  setFilters: (f: Partial<InvoiceListParams>) => void;
  goToPage: (n: number) => void;
  refetch: () => void;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<boolean>;
  send:   (id: string) => Promise<any>;
  void:   (id: string, reason: string, category?: string) => Promise<any>;
  archive:(id: string) => Promise<any>;
  creditNote: (id: string) => Promise<any>;
}

export function useInvoices(initial: InvoiceListParams = {}): UseInvoicesResult {
  const [filters, setFiltersState] = useState<InvoiceListParams>({
    page: 1, limit: 20, sortBy: 'date', sortOrder: 'desc', ...initial,
  });
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [stats, setStats]     = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const abortRef              = useRef<AbortController | null>(null);

  const fetchList = useCallback(async (f: InvoiceListParams) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        invoicesApi.list(f),
        f.companyId ? invoicesApi.stats(f.companyId) : Promise.resolve(null),
      ]);
      const rows  = (listRes as any)?.data?.data ?? (listRes as any)?.data ?? listRes ?? [];
      const count = (listRes as any)?.data?.total ?? (listRes as any)?.total ?? rows.length;
      setData(Array.isArray(rows) ? rows : []);
      setTotal(count);
      setStats(statsRes ? ((statsRes as any)?.data ?? statsRes) : null);
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError(err?.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(filters); }, [fetchList, filters]);

  const setFilters = useCallback((f: Partial<InvoiceListParams>) => {
    setFiltersState(prev => ({ ...prev, ...f, page: 1 }));
  }, []);

  const goToPage = useCallback((n: number) => {
    setFiltersState(prev => ({ ...prev, page: n }));
  }, []);

  async function mutate<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true);
    setError(null);
    try {
      const result = await fn();
      await fetchList(filters);
      return result;
    } catch (err: any) {
      setError(err?.message ?? 'Operation failed');
      return null;
    } finally {
      setSaving(false);
    }
  }

  const limit = filters.limit ?? 20;
  return {
    data, total,
    page: filters.page ?? 1,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats, loading, saving, error, filters,
    setFilters, goToPage,
    refetch: () => fetchList(filters),
    create:     (data: any) => mutate(() => invoicesApi.create(data)) as Promise<any>,
    update:     (id, data) => mutate(() => invoicesApi.update(id, data)) as Promise<any>,
    remove:     async (id) => { await mutate(() => invoicesApi.remove(id)); return true; },
    send:       (id) => mutate(() => invoicesApi.send(id)) as Promise<any>,
    void:       (id, reason, category) => mutate(() => invoicesApi.void(id, reason, category)) as Promise<any>,
    archive:    (id) => mutate(() => invoicesApi.archive(id)) as Promise<any>,
    creditNote: (id) => mutate(() => invoicesApi.creditNote(id)) as Promise<any>,
  };
}
