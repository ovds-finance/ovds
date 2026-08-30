/**
 * useJournalEntries — paginated journal entry list with filters and mutations.
 *
 * Usage:
 *   import { useJournalEntries } from '@ovds/features/accounting';
 *   const { data, loading, filters, setFilters, create } = useJournalEntries({ companyId });
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { journalEntriesApi } from '../services/ovdsApi';

export interface JournalFilters {
  companyId?: string;
  search?:    string;
  dateFrom?:  string;
  dateTo?:    string;
  status?:    string;
  page?:      number;
  limit?:     number;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseJournalEntriesResult {
  data:       any[];
  total:      number;
  page:       number;
  totalPages: number;
  loading:    boolean;
  saving:     boolean;
  error:      string | null;
  filters:    JournalFilters;
  setFilters: (f: Partial<JournalFilters>) => void;
  goToPage:   (n: number) => void;
  refetch:    () => void;
  create:     (data: any) => Promise<any>;
  update:     (id: string, data: any) => Promise<any>;
  remove:     (id: string) => Promise<boolean>;
}

export function useJournalEntries(initial: JournalFilters = {}): UseJournalEntriesResult {
  const [filters, setFiltersState] = useState<JournalFilters>({
    page: 1, limit: 20, sortBy: 'date', sortOrder: 'desc', ...initial,
  });
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const abortRef              = useRef<AbortController | null>(null);

  const fetchList = useCallback(async (f: JournalFilters) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res   = await journalEntriesApi.list(f as any);
      const rows  = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
      const count = (res as any)?.data?.total ?? (res as any)?.total ?? rows.length;
      setData(Array.isArray(rows) ? rows : []);
      setTotal(count);
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError(err?.message ?? 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(filters); }, [fetchList, filters]);

  const setFilters = useCallback((f: Partial<JournalFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f, page: 1 }));
  }, []);

  const goToPage = useCallback((n: number) => {
    setFiltersState(prev => ({ ...prev, page: n }));
  }, []);

  async function mutate<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true); setError(null);
    try { const r = await fn(); await fetchList(filters); return r; }
    catch (err: any) { setError(err?.message ?? 'Operation failed'); return null; }
    finally { setSaving(false); }
  }

  const limit = filters.limit ?? 20;
  return {
    data, total,
    page: filters.page ?? 1,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    loading, saving, error, filters, setFilters, goToPage,
    refetch: () => fetchList(filters),
    create:  (d)     => mutate(() => journalEntriesApi.create(d))        as Promise<any>,
    update:  (id, d) => mutate(() => journalEntriesApi.update(id, d))    as Promise<any>,
    remove:  async (id) => { await mutate(() => journalEntriesApi.remove(id)); return true; },
  };
}
