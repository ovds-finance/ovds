import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import toast from 'react-hot-toast';
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

// ── Items ─────────────────────────────────────────────────────────────────────

export function useItems(params?: { search?: string; page?: number; limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', params.page.toString());
      if (params?.limit) q.set('take', params.limit.toString());

      const res = await apiGet<any>(`/ovds/inventory/items?${q}`);
      const arr: Item[] = Array.isArray(res) ? res : (res?.items ?? []);
      setItems(arr);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.page, params?.limit]);

  const create = useCallback(async (dto: Partial<Item>) => {
    const created = await apiPost<Item>('/ovds/inventory/items', dto);
    setItems(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, dto: Partial<Item>) => {
    const updated = await apiPatch<Item>(`/ovds/inventory/items/${id}`, dto);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/items/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const adjustStock = useCallback(async (itemId: string, data: { quantity: number; type: 'ADD' | 'SUBTRACT'; reason?: string; warehouseId?: string; notes?: string; companyId?: string }) => {
    const res = await apiPost<any>('/ovds/inventory/adjust', { itemId, ...data });
    fetch();
    return res;
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch, create, update, remove, adjustStock };
}

// ── Item Groups ───────────────────────────────────────────────────────────────

export function useItemGroups() {
  const [groups, setGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<ItemGroup[]>('/ovds/inventory/item-groups');
      setGroups(res ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load item groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: Partial<ItemGroup>) => {
    const created = await apiPost<ItemGroup>('/ovds/inventory/item-groups', dto);
    setGroups(prev => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, dto: Partial<ItemGroup>) => {
    const updated = await apiPatch<ItemGroup>(`/ovds/inventory/item-groups/${id}`, dto);
    setGroups(prev => prev.map(g => g.id === id ? updated : g));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/item-groups/${id}`);
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { groups, loading, refetch: fetch, create, update, remove };
}

// ── Item Variants ─────────────────────────────────────────────────────────────

export function useItemVariants(itemId: string) {
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await apiGet<ItemVariant[]>(`/ovds/inventory/items/${itemId}/variants`);
      setVariants(res ?? []);
    } catch {
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  const create = useCallback(async (dto: Partial<ItemVariant>) => {
    const created = await apiPost<ItemVariant>(`/ovds/inventory/items/${itemId}/variants`, dto);
    setVariants(prev => [...prev, created]);
    return created;
  }, [itemId]);

  const update = useCallback(async (id: string, dto: Partial<ItemVariant>) => {
    const updated = await apiPatch<ItemVariant>(`/ovds/inventory/variants/${id}`, dto);
    setVariants(prev => prev.map(v => v.id === id ? updated : v));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/variants/${id}`);
    setVariants(prev => prev.filter(v => v.id !== id));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { variants, loading, refetch: fetch, create, update, remove };
}

// ── Warehouses ────────────────────────────────────────────────────────────────

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>('/ovds/inventory/warehouses');
      const arr: Warehouse[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? res?.warehouses ?? []);
      setWarehouses(Array.isArray(arr) ? arr : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: Partial<Warehouse>) => {
    const created = await apiPost<Warehouse>('/ovds/inventory/warehouses', dto);
    setWarehouses(prev => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, dto: Partial<Warehouse>) => {
    const updated = await apiPatch<Warehouse>(`/ovds/inventory/warehouses/${id}`, dto);
    setWarehouses(prev => prev.map(w => w.id === id ? updated : w));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/ovds/inventory/warehouses/${id}`);
    setWarehouses(prev => prev.filter(w => w.id !== id));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { warehouses, loading, refetch: fetch, create, update, remove };
}

// ── Inventory Valuation ───────────────────────────────────────────────────────

export function useInventoryValuation(method: 'FIFO' | 'LIFO' | 'WA' = 'WA') {
  const [data, setData] = useState<InventoryResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<InventoryResult>(`/ovds/inventory?method=${method}`);
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load inventory valuation');
    } finally {
      setLoading(false);
    }
  }, [method]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ── Inventory History (Adjustments) ───────────────────────────────────────────

export function useInventoryHistory(params?: { itemId?: string; companyId?: string; page?: number; limit?: number }) {
  const [history, setHistory] = useState<InventoryAdjustment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (params?.itemId) q.set('itemId', params.itemId);
      if (params?.companyId) q.set('companyId', params.companyId);
      if (params?.page) q.set('page', params.page.toString());
      if (params?.limit) q.set('limit', params.limit.toString());

      const res = await apiGet<any>(`/ovds/inventory/adjustments?${q}`);
      const arr: InventoryAdjustment[] = Array.isArray(res) ? res : (res?.data ?? []);
      setHistory(Array.isArray(arr) ? arr : []);
      setTotal(res?.total ?? arr.length);
    } catch {
      toast.error('Failed to load inventory adjustments');
    } finally {
      setLoading(false);
    }
  }, [params?.itemId, params?.companyId, params?.page, params?.limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { history, total, loading, refetch: fetch };
}

// ── Inventory Adjust ──────────────────────────────────────────────────────────

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
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>('/ovds/inventory/transfer-orders');
      const arr: TransferOrder[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
      setTransfers(Array.isArray(arr) ? arr : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load transfer orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: any) => {
    const created = await apiPost<TransferOrder>('/ovds/inventory/transfer-orders', dto);
    setTransfers(prev => [created, ...prev]);
    return created;
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const updated = await apiPatch<TransferOrder>(`/ovds/inventory/transfer-orders/${id}/status`, { status });
    setTransfers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { transfers, loading, refetch: fetch, create, updateStatus };
}

// ── Warehouse Stock ───────────────────────────────────────────────────────────

export function useWarehouseStock(itemId: string) {
  const [stock, setStock] = useState<WarehouseStockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await apiGet<WarehouseStockEntry[]>(`/ovds/inventory/warehouse-stock/${itemId}`);
      setStock(res ?? []);
    } catch {
      toast.error('Failed to load warehouse stock');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stock, loading, refetch: fetch };
}

export function useAllWarehouseStock() {
  const [stock, setStock] = useState<WarehouseStockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<WarehouseStockEntry[]>('/ovds/inventory/warehouse-stock');
      setStock(res ?? []);
    } catch {
      toast.error('Failed to load warehouse stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stock, loading, refetch: fetch };
}

// ── Low-Stock Alerts ──────────────────────────────────────────────────────────

export function useLowStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<LowStockAlert[]>('/ovds/inventory/alerts/low-stock');
      setAlerts(res ?? []);
    } catch {
      toast.error('Failed to load low-stock alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { alerts, loading, refetch: fetch };
}

export function useOutOfStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<LowStockAlert[]>('/ovds/inventory/alerts/out-of-stock');
      setAlerts(res ?? []);
    } catch {
      toast.error('Failed to load out-of-stock alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { alerts, loading, refetch: fetch };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useInventorySummary(params?: { companyId?: string; dateFrom?: string; dateTo?: string }) {
  const [data, setData] = useState<InventorySummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!params?.companyId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('companyId', params.companyId);
      if (params.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params.dateTo) q.set('dateTo', params.dateTo);
      const res = await apiGet<InventorySummaryReport>(`/ovds/inventory/reports/summary?${q}`);
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load inventory summary');
    } finally {
      setLoading(false);
    }
  }, [params?.companyId, params?.dateFrom, params?.dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useProductSalesPerformance(params?: { companyId?: string; dateFrom?: string; dateTo?: string }) {
  const [data, setData] = useState<ProductSalesPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!params?.companyId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('companyId', params.companyId);
      if (params.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params.dateTo) q.set('dateTo', params.dateTo);
      const res = await apiGet<ProductSalesPerformance[]>(`/ovds/inventory/reports/sales-performance?${q}`);
      setData(res ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load sales performance');
    } finally {
      setLoading(false);
    }
  }, [params?.companyId, params?.dateFrom, params?.dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

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

// ── Batch Adjustment ──────────────────────────────────────────────────────────

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

export function useStockMovements(params?: { companyId?: string; itemId?: string; warehouseId?: string; type?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
  const [data, setData] = useState<any>({ data: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (params?.companyId) q.set('companyId', params.companyId);
      if (params?.itemId) q.set('itemId', params.itemId);
      if (params?.warehouseId) q.set('warehouseId', params.warehouseId);
      if (params?.type) q.set('type', params.type);
      if (params?.dateFrom) q.set('dateFrom', params.dateFrom);
      if (params?.dateTo) q.set('dateTo', params.dateTo);
      if (params?.page) q.set('page', params.page.toString());
      if (params?.limit) q.set('limit', params.limit.toString());

      const res = await apiGet<any>(`/ovds/inventory/stock-movements?${q}`);
      setData(res ?? { data: [], total: 0, page: 1, pages: 1 });
    } catch {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  }, [params?.companyId, params?.itemId, params?.warehouseId, params?.type, params?.dateFrom, params?.dateTo, params?.page, params?.limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, refetch: fetch };
}

// ── Inventory Aging ───────────────────────────────────────────────────────────

export function useInventoryAging(companyId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await apiGet<any[]>(`/ovds/inventory/reports/aging?companyId=${companyId}`);
      setData(res ?? []);
    } catch {
      toast.error('Failed to load inventory aging');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ── Reorder Suggestions ───────────────────────────────────────────────────────

export function useReorderSuggestions(companyId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await apiGet<any[]>(`/ovds/inventory/reorder-suggestions?companyId=${companyId}`);
      setData(res ?? []);
    } catch {
      toast.error('Failed to load reorder suggestions');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ── All Alerts ────────────────────────────────────────────────────────────────

export function useAllAlerts(companyId?: string) {
  const [data, setData] = useState<any>({ lowStock: [], outOfStock: [], total: 0, critical: 0, warning: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await apiGet<any>(`/ovds/inventory/alerts/all?companyId=${companyId}`);
      setData(res ?? { lowStock: [], outOfStock: [], total: 0, critical: 0, warning: 0 });
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, refetch: fetch };
}

// ── Send Alert Notifications ──────────────────────────────────────────────────

export function useAlertNotifications() {
  const notify = useCallback(async (data: { companyId?: string; severity?: 'ALL' | 'LOW' | 'OUT' }) => {
    return apiPost<any>('/ovds/inventory/alerts/notify', data);
  }, []);
  return { notify };
}

// ── Demand Forecasting ───────────────────────────────────────────────────────

export function useDemandForecast(companyId?: string, daysBack = 90, daysForward = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await apiGet<any[]>(`/ovds/inventory/reports/forecast?companyId=${companyId}&daysBack=${daysBack}&daysForward=${daysForward}`);
      setData(res ?? []);
    } catch {
      toast.error('Failed to load demand forecast');
    } finally {
      setLoading(false);
    }
  }, [companyId, daysBack, daysForward]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ── Supplier Performance ──────────────────────────────────────────────────────

export function useSupplierPerformance(companyId?: string, dateFrom?: string, dateTo?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('companyId', companyId);
      if (dateFrom) q.set('dateFrom', dateFrom);
      if (dateTo) q.set('dateTo', dateTo);
      const res = await apiGet<any[]>(`/ovds/inventory/reports/supplier-performance?${q}`);
      setData(res ?? []);
    } catch {
      toast.error('Failed to load supplier performance');
    } finally {
      setLoading(false);
    }
  }, [companyId, dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}
