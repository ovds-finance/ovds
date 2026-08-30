/**
 * useItems — paginated items list with filters.
 * useItemStats — low-stock / total counts KPI.
 * useInventoryValuation — FIFO/WA/LIFO valuation hook.
 */
import { useState, useEffect, useCallback } from 'react';
import { itemsApi, inventoryValuationApi, type ItemListParams } from '../services/inventoryApi';

// ── useItems ──────────────────────────────────────────────────────────────────

export function useItems(params: ItemListParams & { enabled?: boolean } = {}) {
  const { enabled = true, ...queryParams } = params;
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await itemsApi.list(queryParams);
      if (Array.isArray(res)) {
        setData(res);
        setTotal(res.length);
      } else {
        setData(res.data ?? []);
        setTotal(res.total ?? res.pagination?.total ?? 0);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [enabled, JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

// ── useItemStats ──────────────────────────────────────────────────────────────

export function useItemStats(companyId?: string | null) {
  const [stats, setStats]     = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setStats(await itemsApi.stats(companyId));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load item stats');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}

// ── useInventoryValuation ─────────────────────────────────────────────────────

export type ValuationMethod = 'WA' | 'FIFO' | 'LIFO';

export function useInventoryValuation(
  companyId?: string | null,
  method: ValuationMethod = 'WA',
) {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await inventoryValuationApi.summary(companyId, method));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load inventory valuation');
    } finally {
      setLoading(false);
    }
  }, [companyId, method]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useItemMutations ──────────────────────────────────────────────────────────

export function useItemMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true);
    setError(null);
    try {
      const result = await fn();
      onSuccess?.();
      return result;
    } catch (e: any) {
      setError(e?.message ?? 'Operation failed');
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    saving, error,
    create:      (data: any) => run(() => itemsApi.create(data)),
    update:      (id: string, data: any) => run(() => itemsApi.update(id, data)),
    remove:      (id: string) => run(() => itemsApi.remove(id)),
    adjustStock: (id: string, delta: number, reason?: string) =>
      run(() => itemsApi.adjustStock(id, delta, reason)),
  };
}
