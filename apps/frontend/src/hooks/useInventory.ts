/**
 * useInventory — type-safe inventory data hooks via oRPC + React Query.
 *
 * All input/output types are inferred directly from @ovds/contracts.
 * Changing a Zod schema in packages/contracts/src/schemas/inventory.ts
 * surfaces TypeScript errors here immediately — zero manual sync.
 *
 * Usage:
 *   // List items — fully typed, no generics needed
 *   const { data, isLoading } = useItems({ companyId, page: 1 });
 *   //  data ^? { data: Item[]; total: number; page: number; ... }
 *
 *   // CRUD mutations
 *   const { create, update, remove, isLoading } = useItemMutations();
 *   await create({ name: 'Widget A', code: 'WGT-001', category: 'Electronics', salePrice: 250 });
 *
 *   // Warehouses
 *   const { data: warehouses } = useWarehouses({ companyId });
 *
 *   // Stock summary (low-stock dashboard)
 *   const { data: summary } = useStockSummary({ companyId });
 *   const lowStock = summary?.filter(s => s.isLowStock);
 */
import type {
  ListItemsQuery,
  CreateItem,
  UpdateItem,
  CreateWarehouse,
  CreateItemGroup,
  CreateStockAdjustment,
} from '@ovds/contracts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { orpc } from '../lib/orpc';

// ── Query key factories ───────────────────────────────────────────────────────
// Centralised so invalidation is consistent across all mutations.

export const inventoryKeys = {
  all:          ['inventory'] as const,
  items:        (params?: Partial<ListItemsQuery>) =>
                  ['inventory', 'items', params ?? {}] as const,
  item:         (id: string) => ['inventory', 'items', id] as const,
  groups:       (companyId?: string) => ['inventory', 'groups', companyId] as const,
  warehouses:   (companyId?: string) => ['inventory', 'warehouses', companyId] as const,
  warehouse:    (id: string) => ['inventory', 'warehouses', id] as const,
  transactions: (itemId?: string) => ['inventory', 'transactions', itemId] as const,
  adjustments:  (companyId?: string) => ['inventory', 'adjustments', companyId] as const,
  summary:      (companyId?: string) => ['inventory', 'summary', companyId] as const,
};

// ── Items ─────────────────────────────────────────────────────────────────────

/**
 * List items with pagination, search, and filtering.
 * Output type is inferred from the oRPC contract — no manual generics.
 */
export function useItems(params: Partial<ListItemsQuery> = {}) {
  return useQuery({
    queryKey: inventoryKeys.items(params),
    queryFn:  () => orpc.inventory.items.list({
      page:        params.page        ?? 1,
      limit:       params.limit       ?? 20,
      sortOrder:   params.sortOrder   ?? 'asc',
      companyId:   params.companyId,
      search:      params.search,
      category:    params.category,
      status:      params.status,
      warehouseId: params.warehouseId,
      groupId:     params.groupId,
      lowStock:    params.lowStock,
    }),
  });
}

/**
 * Fetch a single item by id.
 * Skips the query if id is falsy.
 */
export function useItem(id: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.item(id ?? ''),
    queryFn:  () => orpc.inventory.items.get({ id: id! }),
    enabled:  !!id,
  });
}

/**
 * CRUD mutations for items. Automatically invalidates the items list
 * and (on update/delete) the individual item query.
 */
export function useItemMutations() {
  const qc = useQueryClient();

  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: inventoryKeys.all });
    if (id) qc.invalidateQueries({ queryKey: inventoryKeys.item(id) });
  };

  const create = useMutation({
    mutationFn: (data: CreateItem) => orpc.inventory.items.create(data),
    onSuccess:  () => invalidate(),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; data: UpdateItem }) =>
                  orpc.inventory.items.update(vars),
    onSuccess:  (_, vars) => invalidate(vars.id),
  });

  const remove = useMutation({
    mutationFn: (vars: { id: string }) => orpc.inventory.items.remove(vars),
    onSuccess:  (_, vars) => invalidate(vars.id),
  });

  const adjustStock = useMutation({
    mutationFn: (data: CreateStockAdjustment) =>
                  orpc.inventory.items.adjustStock(data),
    onSuccess:  (_, vars) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      qc.invalidateQueries({ queryKey: inventoryKeys.item(vars.itemId) });
    },
  });

  return {
    create:      create.mutateAsync.bind(create),
    update:      update.mutateAsync.bind(update),
    remove:      remove.mutateAsync.bind(remove),
    adjustStock: adjustStock.mutateAsync.bind(adjustStock),
    isLoading:
      create.isPending   ||
      update.isPending   ||
      remove.isPending   ||
      adjustStock.isPending,
    // Raw mutation objects for fine-grained state (error, reset, etc.)
    mutations: { create, update, remove, adjustStock },
  };
}

// ── Item Groups ───────────────────────────────────────────────────────────────

export function useItemGroups(companyId?: string) {
  return useQuery({
    queryKey: inventoryKeys.groups(companyId),
    queryFn:  () => orpc.inventory.groups.list({ companyId }),
  });
}

export function useItemGroupMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['inventory', 'groups'] });

  const create = useMutation({
    mutationFn: (data: CreateItemGroup) => orpc.inventory.groups.create(data),
    onSuccess:  invalidate,
  });

  const remove = useMutation({
    mutationFn: (vars: { id: string }) => orpc.inventory.groups.remove(vars),
    onSuccess:  invalidate,
  });

  return {
    create:    create.mutateAsync.bind(create),
    remove:    remove.mutateAsync.bind(remove),
    isLoading: create.isPending || remove.isPending,
    mutations: { create, remove },
  };
}

// ── Warehouses ────────────────────────────────────────────────────────────────

export function useWarehouses(companyId?: string) {
  return useQuery({
    queryKey: inventoryKeys.warehouses(companyId),
    queryFn:  () => orpc.inventory.warehouses.list({ companyId }),
  });
}

export function useWarehouse(id: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.warehouse(id ?? ''),
    queryFn:  () => orpc.inventory.warehouses.get({ id: id! }),
    enabled:  !!id,
  });
}

export function useWarehouseMutations() {
  const qc = useQueryClient();
  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
    if (id) qc.invalidateQueries({ queryKey: inventoryKeys.warehouse(id) });
  };

  const create = useMutation({
    mutationFn: (data: CreateWarehouse) =>
                  orpc.inventory.warehouses.create(data),
    onSuccess:  () => invalidate(),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; data: Partial<CreateWarehouse> }) =>
                  orpc.inventory.warehouses.update(vars),
    onSuccess:  (_, vars) => invalidate(vars.id),
  });

  const remove = useMutation({
    mutationFn: (vars: { id: string }) =>
                  orpc.inventory.warehouses.remove(vars),
    onSuccess:  (_, vars) => invalidate(vars.id),
  });

  return {
    create:    create.mutateAsync.bind(create),
    update:    update.mutateAsync.bind(update),
    remove:    remove.mutateAsync.bind(remove),
    isLoading: create.isPending || update.isPending || remove.isPending,
    mutations: { create, update, remove },
  };
}

// ── Stock ─────────────────────────────────────────────────────────────────────

/** Full stock movement history for a single item. */
export function useStockTransactions(
  itemId: string | null | undefined,
  opts: { page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: inventoryKeys.transactions(itemId ?? undefined),
    queryFn:  () => orpc.inventory.stock.transactions({
      itemId:  itemId ?? '',
      page:    opts.page  ?? 1,
      limit:   opts.limit ?? 20,
    }),
    enabled: !!itemId,
  });
}

/** All inventory adjustments for a company (for audit log). */
export function useInventoryAdjustments(
  companyId?: string,
  opts: { page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: inventoryKeys.adjustments(companyId),
    queryFn:  () => orpc.inventory.stock.adjustments({
      companyId,
      page:  opts.page  ?? 1,
      limit: opts.limit ?? 20,
    }),
  });
}

/**
 * Stock summary per item — use for the low-stock dashboard widget.
 *
 * @example
 * const { data: summary } = useStockSummary({ companyId });
 * const lowStock = summary?.filter(s => s.isLowStock) ?? [];
 */
export function useStockSummary(
  opts: { companyId?: string; warehouseId?: string } = {},
) {
  return useQuery({
    queryKey: inventoryKeys.summary(opts.companyId),
    queryFn:  () => orpc.inventory.stock.summary(opts),
  });
}

// ── Composite hook — everything a typical inventory page needs ────────────────

/**
 * Single hook for full inventory page state.
 * Combines items list + warehouses + groups in parallel fetches.
 *
 * @example
 * const { items, warehouses, groups, mutations } = useInventoryPage({ companyId });
 */
export function useInventoryPage(params: Partial<ListItemsQuery> = {}) {
  const items      = useItems(params);
  const warehouses = useWarehouses(params.companyId);
  const groups     = useItemGroups(params.companyId);
  const mutations  = useItemMutations();

  return {
    items,
    warehouses,
    groups,
    mutations,
    isLoading: items.isLoading || warehouses.isLoading || groups.isLoading,
    isError:   items.isError   || warehouses.isError   || groups.isError,
  };
}

// ── Re-export types for convenience ──────────────────────────────────────────
export type {
  ListItemsQuery,
  CreateItem,
  UpdateItem,
  CreateWarehouse,
  CreateItemGroup,
  CreateStockAdjustment,
};
