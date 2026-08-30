/**
 * Items domain API client — @ovds/features/items
 *
 * The Items module is the central catalogue for everything a business buys or
 * sells. On the backend it is served by the InventoryController
 * (@Controller("ovds/inventory")) — every items/group/warehouse/variant route
 * below maps 1:1 to a real endpoint in apps/backend/src/inventory/inventory.controller.ts.
 *
 * Canonical request/response shapes come from @ovds/contracts/schemas/inventory
 * (the Zod contracts), so the client never drifts from the NestJS handler.
 */
import type {
  Item,
  CreateItem,
  UpdateItem,
  ItemGroup,
  CreateItemGroup,
  ItemVariant,
  CreateItemVariant,
  Warehouse,
  CreateWarehouse,
  StockTransaction,
  StockSummary,
  InventoryAdjustment,
} from '@ovds/contracts/schemas/inventory';
import type { ItemLookupResult } from '../types';

export interface ItemListParams {
  companyId?: string | null;
  search?: string;
  category?: string;
  type?: string;
  status?: string;
  groupId?: string;
  warehouseId?: string;
  lowStock?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface StockAdjustment {
  itemId: string;
  delta: number;
  quantity?: number;
  type?: 'ADD' | 'SUBTRACT' | 'SET';
  reason?: string;
  notes?: string;
  reference?: string;
  warehouseId?: string;
  companyId?: string;
}

// ── HTTP primitives ─────────────────────────────────────────────────────────────

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
  const locale = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  if (locale) {
    h['x-locale'] = locale;
    h['Accept-Language'] = locale;
  }
  return h;
}

/**
 * Stripping request — returns `json.data ?? json`. Good for single-entity
 * endpoints (create/get/update) where the backend returns the object directly
 * OR an enveloped `{ data }` shape.
 */
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

/**
 * Raw request — returns the full JSON envelope. Used for list endpoints where
 * we need the `total` / `totalPages` pagination metadata, which the stripping
 * `req` would discard.
 */
async function reqRaw<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
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
  return (res.status === 204 ? null : await res.json()) as T;
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

// ── Items ───────────────────────────────────────────────────────────────────────

export const itemsApi = {
  /**
   * List items for a company — paginated + searchable.
   * Returns the full paginated envelope so callers can read `total` / `totalPages`.
   */
  list: (params: ItemListParams = {}) =>
    reqRaw<any>(
      `/ovds/inventory/items${qs({ ...params, page: params.page ?? 1, limit: params.limit ?? 50 })}`,
    ),

  get: (id: string) => get<Item>(`/ovds/inventory/items/${id}`),
  create: (data: CreateItem) => post<Item>('/ovds/inventory/items', data),
  update: (id: string, data: UpdateItem) => patch<Item>(`/ovds/inventory/items/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/inventory/items/${id}`),

  lookup: (code: string, companyId?: string | null) =>
    get<ItemLookupResult>(
      `/ovds/inventory/items/lookup${qs({ code, companyId })}`,
    ),

  /** IAS 2 — write an item down to Net Realisable Value (see inventory.controller.ts:600). */
  nrvWriteDown: (
    id: string,
    nrvAmount: number,
    reason?: string,
    notes?: string,
  ) =>
    post<any>(`/ovds/inventory/items/${id}/nrv-writedown`, { nrvAmount, reason, notes }),

  /** Low-stock alerts (items at or below their reorder level). */
  lowStock: (companyId?: string | null) =>
    get<any[]>(`/ovds/inventory/alerts/low-stock${qs({ companyId })}`),

  /** Out-of-stock alerts (items with zero or negative stock). */
  outOfStock: (companyId?: string | null) =>
    get<any[]>(`/ovds/inventory/alerts/out-of-stock${qs({ companyId })}`),
};

/**
 * @deprecated Renamed to `itemsApi`. Kept for backward compatibility — delegates
 * to the split clients (itemsApi / itemStatsApi / stockAdjustmentApi) so callers
 * that still import `catalogItemsApi` keep working.
 */
export const catalogItemsApi = {
  list:    itemsApi.list,
  get:     itemsApi.get,
  create:  itemsApi.create,
  update:  itemsApi.update,
  remove:  itemsApi.remove,
  adjustStock: (id: string, delta: number, reason?: string) =>
    stockAdjustmentApi.adjust({ itemId: id, delta, reason }),
  stats: (companyId?: string | null) => itemStatsApi.get(companyId),
  bulkImport: (items: CreateItem[]) =>
    post<any>('/ovds/inventory/items/bulk-import', { items }),
};

// ── Stock statistics & adjustments ──────────────────────────────────────────────

/** GET /ovds/inventory/stats — dashboard KPIs. */
export const itemStatsApi = {
  get: (companyId?: string | null) =>
    get<any>(`/ovds/inventory/stats${qs({ companyId })}`),
};

/** POST /ovds/inventory/adjust — single-line stock adjustment (writes InventoryAdjustment + StockTransaction). */
export const stockAdjustmentApi = {
  adjust: (data: StockAdjustment) => post<any>('/ovds/inventory/adjust', data),

  /** POST /ovds/inventory/items/batch-adjust — adjust many items atomically-per-line. */
  batch: (adjustments: Array<StockAdjustment & { notes?: string }>) =>
    post<any>('/ovds/inventory/batch-adjust', { adjustments }),

  /** POST /ovds/inventory/stocktake — physical count session with variance posting. */
  stocktake: (data: {
    countDate: string;
    counts: Array<{ itemId: string; physicalQty: number; notes?: string }>;
    postAdjustments?: boolean;
    companyId?: string;
  }) => post<any>('/ovds/inventory/stocktake', data),
};

// ── Item Groups (categories) ────────────────────────────────────────────────────

export const itemGroupsApi = {
  list: (companyId?: string | null) =>
    get<ItemGroup[]>(`/ovds/inventory/item-groups${qs({ companyId })}`),
  get: (id: string) => get<ItemGroup>(`/ovds/inventory/item-groups/${id}`),
  create: (data: CreateItemGroup & { companyId?: string }) =>
    post<ItemGroup>('/ovds/inventory/item-groups', data),
  update: (id: string, data: Partial<CreateItemGroup>) =>
    patch<ItemGroup>(`/ovds/inventory/item-groups/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/inventory/item-groups/${id}`),
};

// ── Item Variants ───────────────────────────────────────────────────────────────

export const itemVariantsApi = {
  list: (itemId: string) => get<ItemVariant[]>(`/ovds/inventory/items/${itemId}/variants`),
  create: (itemId: string, data: Omit<CreateItemVariant, 'itemId'>) =>
    post<ItemVariant>(`/ovds/inventory/items/${itemId}/variants`, data),
  update: (id: string, data: Partial<CreateItemVariant>) =>
    patch<ItemVariant>(`/ovds/inventory/variants/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/inventory/variants/${id}`),
};

// ── Warehouses ───────────────────────────────────────────────────────────────────

export const warehousesApi = {
  list: (companyId?: string | null) =>
    get<Warehouse[]>(`/ovds/inventory/warehouses${qs({ companyId })}`),
  get: (id: string) => get<Warehouse>(`/ovds/inventory/warehouses/${id}`),
  create: (data: CreateWarehouse & { companyId?: string }) =>
    post<Warehouse>('/ovds/inventory/warehouses', data),
  update: (id: string, data: Partial<CreateWarehouse>) =>
    patch<Warehouse>(`/ovds/inventory/warehouses/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/inventory/warehouses/${id}`),

  /** GET /ovds/inventory/warehouse-stock/:itemId — per-warehouse stock breakdown. */
  stock: (itemId: string) => get<any[]>(`/ovds/inventory/warehouse-stock/${itemId}`),

  /** GET /ovds/inventory/alerts/all — low stock + out of stock combined. */
  alerts: {
    all: (companyId?: string | null) =>
      get<any>(`/ovds/inventory/alerts/all${qs({ companyId })}`),
    low: (companyId?: string | null) =>
      get<any[]>(`/ovds/inventory/alerts/low-stock${qs({ companyId })}`),
    out: (companyId?: string | null) =>
      get<any[]>(`/ovds/inventory/alerts/out-of-stock${qs({ companyId })}`),
  },
};

// ── Stock Movements ─────────────────────────────────────────────────────────────

export const stockMovementsApi = {
  list: (params: {
    companyId?: string | null;
    itemId?: string;
    warehouseId?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}) =>
    get<any>(`/ovds/inventory/stock-movements${qs(params)}`),
  get: (id: string) => get<StockTransaction>(`/ovds/inventory/stock-movements/${id}`),
  create: (data: {
    itemId: string;
    type: string;
    quantity: number;
    unitCost?: number;
    reference?: string;
    warehouseFrom?: string;
    warehouseTo?: string;
    notes?: string;
    companyId?: string;
  }) => post<any>('/ovds/inventory/stock-movements', data),
};

// ── Inventory Adjustments (audit trail) ──────────────────────────────────────────

export const inventoryAdjustmentsApi = {
  list: (params: { companyId?: string | null; itemId?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/ovds/inventory/adjustments${qs(params)}`),
  get: (id: string) => get<InventoryAdjustment>(`/ovds/inventory/adjustments/${id}`),
};

// ── Price Lists (catalog-level standard prices per currency) ───────────────────
// NOTE: Price lists are a planned extension of the Items catalogue. The endpoints
// below are wired behind the ovds pipeline controller and will be activated with
// the multi-currency pricing feature flag.

export interface PriceListEntry {
  currencyCode: string;
  salePrice: number;
  costPrice?: number | null;
}

export interface PriceList {
  id: string;
  name: string;
  companyId?: string | null;
  isDefault?: boolean | null;
  entries: PriceListEntry[];
  createdAt?: string | Date;
  updatedAt?: string | Date | null;
}

export const priceListsApi = {
  list: (companyId?: string | null) =>
    get<PriceList[]>(`/ovds/price-lists${qs({ companyId })}`),
  get: (id: string) => get<PriceList>(`/ovds/price-lists/${id}`),
  create: (data: Partial<PriceList>) => post<PriceList>('/ovds/price-lists', data),
  update: (id: string, data: Partial<PriceList>) =>
    patch<PriceList>(`/ovds/price-lists/${id}`, data),
  remove: (id: string) => del<void>(`/ovds/price-lists/${id}`),
};

// ── Re-exported types ───────────────────────────────────────────────────────────

export type {
  Item,
  CreateItem,
  UpdateItem,
  ItemGroup,
  CreateItemGroup,
  ItemVariant,
  CreateItemVariant,
  Warehouse,
  CreateWarehouse,
  StockTransaction,
  StockSummary,
  InventoryAdjustment,
} from '@ovds/contracts/schemas/inventory';
