/**
 * @ovds/features/items — public API
 *
 * The Items module is the central catalogue for everything a business buys or
 * sells. It holds goods (Product) and services/digital offerings, pre-configures
 * pricing (sale + cost), VAT rates, item groups (categories), warehouses and
 * variants so invoice/bill lines populate instantly.
 *
 * Import everything from here in app page shells:
 *   import { useItems, itemsApi, ItemTable } from '@ovds/features/items';
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  itemsApi,
  catalogItemsApi,
  itemStatsApi,
  stockAdjustmentApi,
  itemGroupsApi,
  itemVariantsApi,
  warehousesApi,
  stockMovementsApi,
  inventoryAdjustmentsApi,
  priceListsApi,
} from './services/itemsApi';

export type {
  PriceListEntry,
  PriceList,
} from './services/itemsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useItems,
  useItem,
  useItemMutations,
  useItemGroups,
  useItemStats,
  useItemLookup,
} from './hooks/useItems';

export type {
  UseItemsResult,
  UseItemResult,
  UseItemMutationsResult,
  UseItemLookupResult,
} from './hooks/useItems';

// ── Components ─────────────────────────────────────────────────────────────────
export {
  ItemStatusBadge,
  ItemTypeBadge,
  ItemTable,
  ItemFilterBar,
  ItemStatsBar,
} from './components/index';

// ── Page shells (reference templates) ──────────────────────────────────────────
export { ItemsPageContent } from './pages/index';

// ── Types ──────────────────────────────────────────────────────────────────────
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
   ItemRow,
  ItemCategoryOption,
  ItemStats,
  ItemLookupResult,
  PaginatedResult,
  CreateItemFormValues,
  UpdateItemFormValues,
} from './types';

export type { ItemListParams, StockAdjustment } from '@ovds/features/inventory';

// ── Utils ──────────────────────────────────────────────────────────────────────
export {
  fmtPrice,
  fmtQty,
  calcLineTotal,
  calcVatAmount,
  calcMargin,
  calcMarkup,
  getStockStatus,
  isLowStock,
  itemTypeLabel,
  itemStatusLabel,
  generateItemCode,
  type StockStatus,
} from './utils';
