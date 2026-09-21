import { useCallback } from 'react';


import { useFetchQuery } from '../hooks/useFetchQuery';
import type {
  Item,
  ItemGroup,
  ItemVariant,
  Warehouse,
  TransferOrder,
  InventoryAdjustment,
  InventoryResult,
  WarehouseStockEntry,
  LowStockAlert,
  InventorySummaryReport,
  ProductSalesPerformance,
} from '../types/inventory';

import { apiPost, apiPatch, apiDelete } from './api';

// -- Helpers ------------------------------------------------------------------

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

const toArray = <T>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : []);

// ── Items ─────────────────────────────────────────────────────────────────────
//
// Has create/update/remove/adjustStock mutations so keeps local array state.
// The fetch itself is done via useFetchQuery; mutations update that cache via mutate().

export function useItems(params?: { search?: string; page?: number; limit?: number }) {
  const url = `/ovds/inventory/items${qs({
    search: params?.search,
    page:   params?.page,
    take:   params?.limit,
  })}`;

  const query = useFetchQuery<Item[]>(url, {
    deps: [params?.search, params?.page, params?.limit],
    select: (res) => (Array.isArray(res) ? res : (res?.items ?? [])),
  });

  const create = useCallback(async (dto: Partial<Item>) => {
    const created = await apiPost<Item>('/ovds/inventory/items', dto);
    query.mutate((prev) => [created, ...(prev ?? [])]);
    return created;
  }, [query]);

  const update = useCallback(async (id: string, dto: Partial<Item>) => {
    const updated = await apiPatch<Item>(`/ovds/inventory/items/${id}`, dto);
    query.mutate((prev) => (prev ?? []).map((i) => (i.id === id ? updated : i)));
    return updated;
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/items/${id}`);
    query.mutate((prev) => (prev ?? []).filter((i) => i.id !== id));
  }, [query]);

  const adjustStock = useCallback(async (itemId: string, data: {
    quantity: number; type: 'ADD' | 'SUBTRACT'; reason?: string;
    warehouseId?: string; notes?: string; companyId?: string;
  }) => {
    const res = await apiPost<any>('/ovds/inventory/adjust', { itemId, ...data });
    query.refetch();
    return res;
  }, [query]);

  return { items: query.data ?? [], loading: query.loading, refetch: query.refetch, create, update, remove, adjustStock };
}

// ── Item Groups ───────────────────────────────────────────────────────────────

export function useItemGroups() {
  const query = useFetchQuery<ItemGroup[]>('/ovds/inventory/item-groups', {
    select: (res) => res ?? [],
  });

  const create = useCallback(async (dto: Partial<ItemGroup>) => {
    const created = await apiPost<ItemGroup>('/ovds/inventory/item-groups', dto);
    query.mutate((prev) => [...(prev ?? []), created]);
    return created;
  }, [query]);

  const update = useCallback(async (id: string, dto: Partial<ItemGroup>) => {
    const updated = await apiPatch<ItemGroup>(`/ovds/inventory/item-groups/${id}`, dto);
    query.mutate((prev) => (prev ?? []).map((g) => (g.id === id ? updated : g)));
    return updated;
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/item-groups/${id}`);
    query.mutate((prev) => (prev ?? []).filter((g) => g.id !== id));
  }, [query]);

  return { groups: query.data ?? [], loading: query.loading, refetch: query.refetch, create, update, remove };
}

// ── Item Variants ─────────────────────────────────────────────────────────────

export function useItemVariants(itemId: string) {
  const query = useFetchQuery<ItemVariant[]>(
    `/ovds/inventory/items/${itemId}/variants`,
    { enabled: !!itemId, deps: [itemId], select: (res) => res ?? [] },
  );

  const create = useCallback(async (dto: Partial<ItemVariant>) => {
    const created = await apiPost<ItemVariant>(`/ovds/inventory/items/${itemId}/variants`, dto);
    query.mutate((prev) => [...(prev ?? []), created]);
    return created;
  }, [itemId, query]);

  const update = useCallback(async (id: string, dto: Partial<ItemVariant>) => {
    const updated = await apiPatch<ItemVariant>(`/ovds/inventory/variants/${id}`, dto);
    query.mutate((prev) => (prev ?? []).map((v) => (v.id === id ? updated : v)));
    return updated;
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/variants/${id}`);
    query.mutate((prev) => (prev ?? []).filter((v) => v.id !== id));
  }, [query]);

  return { variants: query.data ?? [], loading: query.loading, refetch: query.refetch, create, update, remove };
}

// ── Warehouses ────────────────────────────────────────────────────────────────
//
// Has a 404-silent error path; useFetchQuery's suppressToast handles that since
// it suppresses all error toasts — the 404 will set error.statusCode = 404
// which callers can inspect if needed, but the empty array fallback is identical.

export function useWarehouses() {
  const query = useFetchQuery<Warehouse[]>('/ovds/inventory/warehouses', {
    select: (res) => {
      const arr = Array.isArray(res) ? res : (res?.data ?? res?.items ?? res?.warehouses ?? []);
      return Array.isArray(arr) ? arr : [];
    },
  });

  const create = useCallback(async (dto: Partial<Warehouse>) => {
    const created = await apiPost<Warehouse>('/ovds/inventory/warehouses', dto);
    query.mutate((prev) => [...(prev ?? []), created]);
    return created;
  }, [query]);

  const update = useCallback(async (id: string, dto: Partial<Warehouse>) => {
    const updated = await apiPatch<Warehouse>(`/ovds/inventory/warehouses/${id}`, dto);
    query.mutate((prev) => (prev ?? []).map((w) => (w.id === id ? updated : w)));
    return updated;
  }, [query]);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/warehouses/${id}`);
    query.mutate((prev) => (prev ?? []).filter((w) => w.id !== id));
  }, [query]);

  return { warehouses: query.data ?? [], loading: query.loading, refetch: query.refetch, create, update, remove };
}

// ── Inventory Valuation ───────────────────────────────────────────────────────

export function useInventoryValuation(method: 'FIFO' | 'LIFO' | 'WA' = 'WA') {
  return useFetchQuery<InventoryResult>(`/ovds/inventory?method=${method}`, {
    deps: [method],
  });
}

// ── Inventory History (Adjustments) ───────────────────────────────────────────

export function useInventoryHistory(params?: { itemId?: string; companyId?: string; page?: number; limit?: number }) {
  const url = `/ovds/inventory/adjustments${qs({
    itemId:    params?.itemId,
    companyId: params?.companyId,
    page:      params?.page,
    limit:     params?.limit,
  })}`;

  const query = useFetchQuery<{ data: InventoryAdjustment[]; total: number }>(url, {
    deps: [params?.itemId, params?.companyId, params?.page, params?.limit],
    select: (res) => ({
      data:  Array.isArray(res) ? res : (res?.data ?? []),
      total: res?.total ?? (Array.isArray(res) ? res.length : 0),
    }),
  });

  return {
    history: query.data?.data ?? [],
    total:   query.data?.total ?? 0,
    loading: query.loading,
    refetch: query.refetch,
  };
}

// ── Inventory Adjust — pure mutation hook (no auto-fetch) ─────────────────────

export function useInventoryAdjust() {
  const adjust = useCallback(async (itemId: string, data: {
    quantity: number;
    type: 'ADD' | 'SUBTRACT' | 'DAMAGE' | 'RETURN';
    reason?: string;
    notes?: string;
    warehouseId?: string;
    companyId?: string;
  }) => {
    return apiPost<any>('/ovds/inventory/adjust', { itemId, ...data });
  }, []);
  return { adjust };
}

// ── Transfer Orders ───────────────────────────────────────────────────────────

export function useTransferOrders() {
  const query = useFetchQuery<TransferOrder[]>('/ovds/inventory/transfer-orders', {
    select: (res) => {
      const arr = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
      return Array.isArray(arr) ? arr : [];
    },
  });

  const create = useCallback(async (dto: any) => {
    const created = await apiPost<TransferOrder>('/ovds/inventory/transfer-orders', dto);
    query.mutate((prev) => [created, ...(prev ?? [])]);
    return created;
  }, [query]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const updated = await apiPatch<TransferOrder>(`/ovds/inventory/transfer-orders/${id}/status`, { status });
    query.mutate((prev) => (prev ?? []).map((t) => (t.id === id ? updated : t)));
    return updated;
  }, [query]);

  return { transfers: query.data ?? [], loading: query.loading, refetch: query.refetch, create, updateStatus };
}

// ── Warehouse Stock ───────────────────────────────────────────────────────────

export function useWarehouseStock(itemId: string) {
  return useFetchQuery<WarehouseStockEntry[]>(
    `/ovds/inventory/warehouse-stock/${itemId}`,
    { enabled: !!itemId, deps: [itemId], select: (r) => r ?? [] },
  );
}

export function useAllWarehouseStock() {
  return useFetchQuery<WarehouseStockEntry[]>('/ovds/inventory/warehouse-stock', {
    select: (r) => r ?? [],
  });
}

// ── Stock Alerts ──────────────────────────────────────────────────────────────

export function useLowStockAlerts() {
  const result = useFetchQuery<LowStockAlert[]>('/ovds/inventory/alerts/low-stock', {
    select: (r) => r ?? [],
  });
  return { ...result, alerts: result.data ?? [] };
}

export function useOutOfStockAlerts() {
  const result = useFetchQuery<LowStockAlert[]>('/ovds/inventory/alerts/out-of-stock', {
    select: (r) => r ?? [],
  });
  return { ...result, alerts: result.data ?? [] };
}

// ── Inventory Summary Report ──────────────────────────────────────────────────

export function useInventorySummary(params?: { companyId?: string; dateFrom?: string; dateTo?: string }) {
  return useFetchQuery<InventorySummaryReport>(
    params?.companyId
      ? `/ovds/inventory/reports/summary${qs({ companyId: params.companyId, dateFrom: params.dateFrom, dateTo: params.dateTo })}`
      : '',
    {
      enabled: !!params?.companyId,
      deps: [params?.companyId, params?.dateFrom, params?.dateTo],
    },
  );
}

// ── Product Sales Performance ─────────────────────────────────────────────────

export function useProductSalesPerformance(params?: { companyId?: string; dateFrom?: string; dateTo?: string }) {
  return useFetchQuery<ProductSalesPerformance[]>(
    params?.companyId
      ? `/ovds/inventory/reports/sales-performance${qs({ companyId: params.companyId, dateFrom: params.dateFrom, dateTo: params.dateTo })}`
      : '',
    {
      enabled: !!params?.companyId,
      deps: [params?.companyId, params?.dateFrom, params?.dateTo],
      select: toArray,
    },
  );
}

// ── Pipeline — pure mutation hook (no auto-fetch) ─────────────────────────────

export function useInventoryPipeline() {
  const triggerInvoice = useCallback(async (data: {
    invoiceId: string;
    invoiceNumber: string;
    items: Array<{ itemId: string; quantity: number }>;
    companyId?: string;
  }) => {
    return apiPost('/ovds/inventory/pipeline/invoice', data);
  }, []);

  const triggerBill = useCallback(async (data: {
    billId: string;
    billNumber: string;
    items: Array<{ itemId: string; quantity: number; unitCost?: number }>;
    warehouseId?: string;
    companyId?: string;
  }) => {
    return apiPost('/ovds/inventory/pipeline/bill', data);
  }, []);

  return { triggerInvoice, triggerBill };
}

// ── Batch Adjustment — pure mutation hook (no auto-fetch) ─────────────────────

export function useBatchAdjust() {
  const adjust = useCallback(async (data: {
    adjustments: Array<{ itemId: string; delta: number; reason?: string; warehouseId?: string; type?: string; notes?: string }>;
    companyId?: string;
  }) => {
    return apiPost('/ovds/inventory/batch-adjust', data);
  }, []);
  return { adjust };
}

// ── Stock Movements ───────────────────────────────────────────────────────────

export function useStockMovements(params?: {
  companyId?: string; itemId?: string; warehouseId?: string; type?: string;
  dateFrom?: string; dateTo?: string; page?: number; limit?: number;
}) {
  const query = useFetchQuery<any>(
    `/ovds/inventory/stock-movements${qs({
      companyId:   params?.companyId,
      itemId:      params?.itemId,
      warehouseId: params?.warehouseId,
      type:        params?.type,
      dateFrom:    params?.dateFrom,
      dateTo:      params?.dateTo,
      page:        params?.page,
      limit:       params?.limit,
    })}`,
    {
      deps: [params?.companyId, params?.itemId, params?.warehouseId, params?.type,
             params?.dateFrom, params?.dateTo, params?.page, params?.limit],
      select: (r) => r ?? { data: [], total: 0, page: 1, pages: 1 },
    },
  );
  // Spread the result shape so callers can destructure .data, .total, .page, .pages directly
  const result = query.data ?? { data: [], total: 0, page: 1, pages: 1 };
  return { ...result, loading: query.loading, refetch: query.refetch };
}

// ── Inventory Aging ───────────────────────────────────────────────────────────

export function useInventoryAging(companyId?: string) {
  return useFetchQuery<any[]>(
    companyId ? `/ovds/inventory/reports/aging?companyId=${companyId}` : '',
    { enabled: !!companyId, deps: [companyId], select: toArray },
  );
}

// ── Reorder Suggestions ───────────────────────────────────────────────────────

export function useReorderSuggestions(companyId?: string) {
  return useFetchQuery<any[]>(
    companyId ? `/ovds/inventory/reorder-suggestions?companyId=${companyId}` : '',
    { enabled: !!companyId, deps: [companyId], select: toArray },
  );
}

// ── All Alerts ────────────────────────────────────────────────────────────────

export function useAllAlerts(companyId?: string) {
  const query = useFetchQuery<any>(
    companyId ? `/ovds/inventory/alerts/all?companyId=${companyId}` : '',
    {
      enabled: !!companyId,
      deps: [companyId],
      select: (r) => r ?? { lowStock: [], outOfStock: [], total: 0, critical: 0, warning: 0 },
    },
  );
  const result = query.data ?? { lowStock: [], outOfStock: [], total: 0, critical: 0, warning: 0 };
  return { ...result, loading: query.loading, refetch: query.refetch };
}

// ── Send Alert Notifications — pure mutation hook (no auto-fetch) ─────────────

export function useAlertNotifications() {
  const notify = useCallback(async (data: { companyId?: string; severity?: 'ALL' | 'LOW' | 'OUT' }) => {
    return apiPost<any>('/ovds/inventory/alerts/notify', data);
  }, []);
  return { notify };
}

// ── Demand Forecasting ───────────────────────────────────────────────────────

export function useDemandForecast(companyId?: string, daysBack = 90, daysForward = 30) {
  return useFetchQuery<any[]>(
    companyId
      ? `/ovds/inventory/reports/forecast?companyId=${companyId}&daysBack=${daysBack}&daysForward=${daysForward}`
      : '',
    { enabled: !!companyId, deps: [companyId, daysBack, daysForward], select: toArray },
  );
}

// ── Supplier Performance ──────────────────────────────────────────────────────

export function useSupplierPerformance(companyId?: string, dateFrom?: string, dateTo?: string) {
  return useFetchQuery<any[]>(
    companyId
      ? `/ovds/inventory/reports/supplier-performance${qs({ companyId, dateFrom, dateTo })}`
      : '',
    { enabled: !!companyId, deps: [companyId, dateFrom, dateTo], select: toArray },
  );
}
