/**
 * @ovds/features/items — frontend type re-exports.
 *
 * All canonical shapes come from @ovds/contracts/schemas/inventory.
 * This file is a thin re-export layer so feature-internal imports stay short.
 *
 * DO NOT define types here — edit packages/contracts/src/schemas/inventory.ts
 * or packages/features/inventory/src/types/index.ts instead.
 */

// ── Canonical shapes from contracts ─────────────────────────────────────────

export type {
  Item,
  ItemType,
  ItemStatus,
  CreateItem,
  UpdateItem,
  ItemGroup,
  CreateItemGroup,
  ItemVariant,
  Warehouse,
  CreateWarehouse,
  StockTransaction,
  InventoryAdjustment,
  StockSummary,
} from '@ovds/contracts/schemas/inventory';

// ── Canonical pagination — single source of truth ────────────────────────────
// The old `{ pages: number }` variant is replaced by `{ totalPages: number }`.
// All consumers must migrate to totalPages (matches contracts schema + backend).
export type { PaginatedResult } from '@ovds/contracts/schemas/common';

// ── Feature-local view models and runtime constants ──────────────────────────
// These are frontend-only shapes and values not present in the contracts layer.

export type {
  ItemRow,
  ItemLookupResult,
  ItemCategoryOption,
  ItemStats,
  StockStatus,
  CreateItemFormValues,
  UpdateItemFormValues,
} from '@ovds/features/inventory';

export {
  ITEM_TYPES,
  ITEM_STATUSES,
  ITEM_TYPE_LABELS,
  ITEM_STATUS_LABELS,
} from '@ovds/features/inventory';
