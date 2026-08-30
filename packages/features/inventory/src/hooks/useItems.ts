/**
 * useItems — paginated items list with filters.
 * useItem   — single-item fetch by id (with lazy refetch).
 * useItemMutations — create / update / delete / adjustStock mutators.
 * useItemGroups   — list item groups (categories) for the active company.
 * useItemStats    — dashboard KPIs (total / low / out-of-stock / categories).
 *
 * All hooks live in @ovds/features/items so the app page shell stays thin.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  itemsApi,
  itemStatsApi,
  itemGroupsApi,
  stockAdjustmentApi,
} from '../services/itemsApi';
import type { Item, ItemGroup, ItemLookupResult, ItemStats } from '../types';
import type { ItemListParams } from '../services/inventoryApi';

// ── useItems (paginated list) ──────────────────────────────────────────────────

export interface UseItemsResult {
  data: Item[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: ItemListParams;
  setFilters: (f: Partial<ItemListParams>) => void;
  goToPage: (n: number) => void;
  refetch: () => void;
}

export function useItems(initial: ItemListParams = {}): UseItemsResult {
  const [filters, setFiltersState] = useState<ItemListParams>({
    page: 1,
    limit: 50,
    ...initial,
  });
  const [data, setData]       = useState<Item[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (f: ItemListParams) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await itemsApi.list(f);
      const rows = (res as any)?.data ?? (Array.isArray(res) ? res : []);
      const count = (res as any)?.total ?? (Array.isArray(res) ? res.length : 0);
      const pages = (res as any)?.totalPages ?? (res as any)?.pages ?? 1;
      setData(Array.isArray(rows) ? rows : []);
      setTotal(count);
      return { pages } as any;
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = abortRef.current;
    fetch(filters);
    return () => ctrl?.abort();
  }, [fetch, filters]);

  const setFilters = useCallback((f: Partial<ItemListParams>) => {
    setFiltersState((prev) => ({ ...prev, ...f, page: 1 }));
  }, []);

  const goToPage = useCallback((n: number) => {
    setFiltersState((prev) => ({ ...prev, page: n }));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / (filters.limit ?? 50)));

  return {
    data,
    total,
    page: filters.page ?? 1,
    totalPages,
    loading,
    error,
    filters,
    setFilters,
    goToPage,
    refetch: () => fetch(filters),
  };
}

// ── useItem (single) ────────────────────────────────────────────────────────────

export interface UseItemResult {
  item: Item | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useItem(id?: string): UseItemResult {
  const [item, setItem]     = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setItem(await itemsApi.get(id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load item');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { item, loading, error, refetch: fetch };
}

// ── useItemMutations ────────────────────────────────────────────────────────────

export interface UseItemMutationsResult {
  saving: boolean;
  error: string | null;
  create: (data: any) => Promise<Item | null>;
  update: (id: string, data: any) => Promise<Item | null>;
  remove: (id: string) => Promise<boolean>;
  adjustStock: (id: string, delta: number, reason?: string) => Promise<any | null>;
}

export function useItemMutations(onSuccess?: (action: string) => void): UseItemMutationsResult {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>, action: string): Promise<T | null> {
    setSaving(true);
    setError(null);
    try {
      const result = await fn();
      onSuccess?.(action);
      return result;
    } catch (e: any) {
      setError(e?.message ?? 'Operation failed');
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    error,
    create:      (data: any) => run(() => itemsApi.create(data), 'create'),
    update:      (id, data)  => run(() => itemsApi.update(id, data), 'update'),
    remove:      async (id)  => { await run(() => itemsApi.remove(id), 'delete'); return true; },
    adjustStock: (id, delta, reason) =>
      run(() => stockAdjustmentApi.adjust({ itemId: id, delta, reason }), 'adjustStock'),
  };
}

// ── useItemGroups ───────────────────────────────────────────────────────────────

export function useItemGroups(companyId?: string | null) {
  const [data, setData]       = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await itemGroupsApi.list(companyId));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load item groups');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useItemStats ────────────────────────────────────────────────────────────────

export function useItemStats(companyId?: string | null) {
  const [stats, setStats]       = useState<ItemStats | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await itemStatsApi.get(companyId);
      setStats((res as any)?.stats ?? res ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load item stats');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}

export interface UseItemLookupResult {
  item: ItemLookupResult | null;
  loading: boolean;
  error: string | null;
  fetch: (code: string) => Promise<void>;
}

export function useItemLookup(companyId?: string | null): UseItemLookupResult {
  const [item, setItem] = useState<ItemLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (code: string) => {
      if (!code) return;
      setLoading(true);
      setError(null);
      try {
        setItem(await itemsApi.lookup(code, companyId));
      } catch (e: any) {
        setError(e?.message ?? 'Failed to look up item');
      } finally {
        setLoading(false);
      }
    },
    [companyId],
  );

  return { item, loading, error, fetch };
}
