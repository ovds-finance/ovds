/**
 * Inventory domain API client — @ovds/features/inventory
 *
 * Covers: Items, Item Groups, Item Variants, Warehouses, Stock Movements,
 * Inventory Valuation, Purchase Receipts, Goods Received Notes,
 * Landed Costs, Stock Adjustments.
 *
 * No imports from apps/. Types from @ovds/contracts/schemas.
 */
import type { Item } from '@ovds/contracts/schemas/inventory';

// ── HTTP primitives ──────────────────────────────────────────────────────────

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  return h;
}

async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}

function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get   = <T>(url: string) => req<T>(url);
const post  = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);
const del   = <T>(url: string) => req<T>(url, 'DELETE');

// ── Item types ────────────────────────────────────────────────────────────────

export interface ItemListParams {
  companyId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  lowStock?: boolean;
}

export interface StockAdjustment {
  itemId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason?: string;
  companyId?: string;
  warehouseId?: string;
  unitCost?: number;
}

// ── Items ─────────────────────────────────────────────────────────────────────

export const itemsApi = {
  list:         (params: ItemListParams = {}) =>
    get<any>(`/inventory/items${qs({ ...params, page: params.page ?? 1, limit: params.limit ?? 50 })}`),
  get:          (id: string) => get<Item>(`/inventory/items/${id}`),
  create:       (data: Partial<Item>) => post<Item>('/inventory/items', data),
  update:       (id: string, data: Partial<Item>) => patch<Item>(`/inventory/items/${id}`, data),
  remove:       (id: string) => del<void>(`/inventory/items/${id}`),
  adjustStock:  (id: string, delta: number, reason?: string, warehouseId?: string) =>
    post<any>(`/inventory/items/${id}/adjust-stock`, { delta, reason, warehouseId }),
  bulkAdjust:   (adjustments: StockAdjustment[]) =>
    post<any>('/inventory/items/bulk-adjust', { adjustments }),
  lowStock:     (companyId?: string | null, threshold?: number) =>
    get<any[]>(`/inventory/items/low-stock${qs({ companyId, threshold })}`),
  stats:        (companyId?: string | null) => get<any>(`/inventory/items/stats${qs({ companyId })}`),
};

// ── Item Groups ───────────────────────────────────────────────────────────────

export const itemGroupsApi = {
  list:   (companyId?: string | null) => get<any[]>(`/inventory/item-groups${qs({ companyId })}`),
  get:    (id: string) => get<any>(`/inventory/item-groups/${id}`),
  create: (data: any) => post<any>('/inventory/item-groups', data),
  update: (id: string, data: any) => patch<any>(`/inventory/item-groups/${id}`, data),
  remove: (id: string) => del<void>(`/inventory/item-groups/${id}`),
};

// ── Item Variants ─────────────────────────────────────────────────────────────

export const itemVariantsApi = {
  list:   (itemId: string) => get<any[]>(`/inventory/items/${itemId}/variants`),
  create: (itemId: string, data: any) => post<any>(`/inventory/items/${itemId}/variants`, data),
  update: (itemId: string, id: string, data: any) =>
    patch<any>(`/inventory/items/${itemId}/variants/${id}`, data),
  remove: (itemId: string, id: string) =>
    del<void>(`/inventory/items/${itemId}/variants/${id}`),
};

// ── Warehouses ────────────────────────────────────────────────────────────────

export const warehousesApi = {
  list:    (companyId?: string | null) => get<any[]>(`/inventory/warehouses${qs({ companyId })}`),
  get:     (id: string) => get<any>(`/inventory/warehouses/${id}`),
  create:  (data: any) => post<any>('/inventory/warehouses', data),
  update:  (id: string, data: any) => patch<any>(`/inventory/warehouses/${id}`, data),
  remove:  (id: string) => del<void>(`/inventory/warehouses/${id}`),
  stock:   (id: string) => get<any>(`/inventory/warehouses/${id}/stock`),
  transfer:(data: { fromWarehouseId: string; toWarehouseId: string; items: any[] }) =>
    post<any>('/inventory/warehouses/transfer', data),
};

// ── Stock Movements ───────────────────────────────────────────────────────────

export const stockMovementsApi = {
  list:    (params: { companyId?: string | null; itemId?: string; warehouseId?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/inventory/stock-movements${qs(params)}`),
  get:     (id: string) => get<any>(`/inventory/stock-movements/${id}`),
  adjust:  (data: StockAdjustment) => post<any>('/inventory/stock-adjustments', data),
};

// ── Inventory Valuation ───────────────────────────────────────────────────────

export const inventoryValuationApi = {
  summary:   (companyId?: string | null, method?: 'WA' | 'FIFO' | 'LIFO') =>
    get<any>(`/inventory/valuation${qs({ companyId, method })}`),
  byItem:    (itemId: string, method?: 'WA' | 'FIFO' | 'LIFO') =>
    get<any>(`/inventory/valuation/${itemId}${qs({ method })}`),
  history:   (itemId?: string, companyId?: string | null) =>
    get<any[]>(`/inventory/history${itemId ? `/${itemId}` : ''}${qs({ companyId })}`),
  adjustOvds:(data: { itemId: string; quantity: number; type: string; reason?: string; companyId?: string }) =>
    post<any>('/ovds/inventory/adjust', data),
};

// ── Purchase Receipts & GRN ───────────────────────────────────────────────────

export const purchaseReceiptsApi = {
  list:   (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/inventory/purchase-receipts${qs(params)}`),
  get:    (id: string) => get<any>(`/inventory/purchase-receipts/${id}`),
  create: (data: any) => post<any>('/inventory/purchase-receipts', data),
  update: (id: string, data: any) => patch<any>(`/inventory/purchase-receipts/${id}`, data),
  receive:(id: string) => post<any>(`/inventory/purchase-receipts/${id}/receive`),
};

export const goodsReceivedNotesApi = {
  list:   (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/inventory/grn${qs(params)}`),
  get:    (id: string) => get<any>(`/inventory/grn/${id}`),
  create: (data: any) => post<any>('/inventory/grn', data),
  approve:(id: string) => post<any>(`/inventory/grn/${id}/approve`),
};

// ── Landed Costs ──────────────────────────────────────────────────────────────

export const landedCostsApi = {
  list:      (companyId?: string | null) => get<any[]>(`/inventory/landed-costs${qs({ companyId })}`),
  get:       (id: string) => get<any>(`/inventory/landed-costs/${id}`),
  create:    (data: any) => post<any>('/inventory/landed-costs', data),
  update:    (id: string, data: any) => patch<any>(`/inventory/landed-costs/${id}`, data),
  allocate:  (id: string) => post<any>(`/inventory/landed-costs/${id}/allocate`),
};

// ── Manufacturing / BOM ───────────────────────────────────────────────────────

export const manufacturingApi = {
  orders:    (params: { companyId?: string | null; page?: number; status?: string } = {}) =>
    get<any>(`/manufacturing/orders${qs(params)}`),
  getOrder:  (id: string) => get<any>(`/manufacturing/orders/${id}`),
  create:    (data: any) => post<any>('/manufacturing/orders', data),
  update:    (id: string, data: any) => patch<any>(`/manufacturing/orders/${id}`, data),
  start:     (id: string) => post<any>(`/manufacturing/orders/${id}/start`),
  complete:  (id: string) => post<any>(`/manufacturing/orders/${id}/complete`),
  bom:       (itemId: string) => get<any>(`/manufacturing/bom/${itemId}`),
  createBom: (data: any) => post<any>('/manufacturing/bom', data),
};

