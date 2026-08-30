/**
 * @ovds/features/items — local frontend types.
 *
 * Frontend-only view models and UI state shapes.
 * Canonical API shapes (Item, ItemGroup, Warehouse, …) are re-exported from
 * the shared Zod contracts in @ovds/contracts/schemas/inventory so that the
 * item catalogue stays in lock-step with the NestJS handler and the Prisma
 * schema.
 */
import type {
  Item as ApiItem,
  ItemType as ApiItemType,
  ItemStatus as ApiItemStatus,
  CreateItem as ApiCreateItem,
  UpdateItem as ApiUpdateItem,
  ItemGroup as ApiItemGroup,
  CreateItemGroup as ApiCreateItemGroup,
  ItemVariant as ApiItemVariant,
  Warehouse as ApiWarehouse,
  CreateWarehouse as ApiCreateWarehouse,
  StockTransaction as ApiStockTransaction,
  InventoryAdjustment as ApiInventoryAdjustment,
  StockSummary as ApiStockSummary,
} from '@ovds/contracts/schemas/inventory';

// ── Canonical re-exports (single source of truth) ───────────────────────────────

export type Item               = ApiItem;
export type ItemType           = ApiItemType;
export type ItemStatus         = ApiItemStatus;
export type CreateItem         = ApiCreateItem;
export type UpdateItem         = ApiUpdateItem;
export type ItemGroup          = ApiItemGroup;
export type CreateItemGroup    = ApiCreateItemGroup;
export type ItemVariant        = ApiItemVariant;
export type Warehouse          = ApiWarehouse;
export type CreateWarehouse    = ApiCreateWarehouse;
export type StockTransaction   = ApiStockTransaction;
export type InventoryAdjustment = ApiInventoryAdjustment;
export type StockSummary       = ApiStockSummary;

export interface ItemLookupResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  salePrice: number;
  costPrice: number;
  vatRate: number;
  itemType: ItemType;
  unit: string | null;
  barcode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  status: ItemStatus;
  group: { id: string; name: string } | null;
  category: { id: string; name: string; type: string } | null;
}

export const ITEM_TYPES: ReadonlyArray<{ value: ItemType; label: string; description: string }> = [
  { value: 'PRODUCT',  label: 'Product',  description: 'Physical goods tracked in stock' },
  { value: 'SERVICE',  label: 'Service',  description: 'Billable labour / time — no stock tracking' },
  { value: 'DIGITAL',  label: 'Digital',  description: 'Intangible, downloadable or SaaS' },
];

export const ITEM_STATUSES: ReadonlyArray<{ value: ItemStatus; label: string }> = [
  { value: 'ACTIVE',       label: 'Active' },
  { value: 'INACTIVE',     label: 'Inactive' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
];

export const ITEM_TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Product',
  SERVICE: 'Service',
  DIGITAL: 'Digital',
  GOOD: 'Good',
  MATERIAL: 'Material',
};

export const ITEM_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DISCONTINUED: 'Discontinued',
};

// ── Compact view models ─────────────────────────────────────────────────────────

/** Compact item row used in tables and "add line item" dropdowns. */
export interface ItemRow {
  id: string;
  name: string;
  code?: string | null;
  sku?: string | null;
  itemType?: ItemType | string | null;
  category?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  salePrice: number;
  costPrice?: number | null;
  vatRate?: number | null;
  stock?: number | null;
  reorderLevel?: number | null;
  unit?: string | null;
  isActive?: boolean | null;
  status?: ItemStatus | string | null;
  imageUrl?: string | null;
  description?: string | null;
}

export interface ItemLookupResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  salePrice: number;
  costPrice: number;
  vatRate: number;
  itemType: ItemType;
  unit: string | null;
  barcode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  status: ItemStatus;
  group: { id: string; name: string } | null;
  category: { id: string; name: string; type: string } | null;
}

/** A category bucket — maps to an ItemGroup for reporting / GL mapping. */
export interface ItemCategoryOption {
  id: string;
  name: string;
  description?: string | null;
  itemCount?: number | null;
  isActive?: boolean | null;
}

/** Dashboard stats returned by GET /ovds/inventory/stats. */
export interface ItemStats {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCount: number;
}

/** Stock-status badge kind derived from current stock vs reorder level. */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';

/** Generic paginated envelope. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/** Query params for listing items (mirrors the backend PaginationQueryDto). */

/** Body for a single stock adjustment (POST /ovds/inventory/adjust). */

/** Form values for the "New Item" / "Edit Item" drawer — mirrors CreateItem. */
export interface CreateItemFormValues {
  name: string;
  code?: string;
  sku?: string;
  itemType: ItemType;
  category?: string;
  groupId?: string;
  warehouseId?: string;
  description?: string;
  unit?: string;
  salePrice: number;
  costPrice?: number;
  vatRate?: number;
  stock?: number;
  reorderLevel?: number;
  trackInventory?: boolean;
  isActive?: boolean;
  imageUrl?: string;
  barcode?: string;
  customFields?: Record<string, string | null>;
}

export type UpdateItemFormValues = Partial<CreateItemFormValues>;
