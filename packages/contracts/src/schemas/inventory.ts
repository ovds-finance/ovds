/**
 * @ovds/contracts — Inventory Schemas
 *
 * Zod schemas for Item, ItemGroup, ItemVariant, Warehouse, StockTransaction.
 * These are the single source of truth for inventory request/response contracts —
 * both the NestJS handler and the React client use the same types from here.
 *
 * Type-safety chain:
 *   schema.prisma (Item, Warehouse, StockTransaction)
 *     └─ prisma-zod/  (auto-generated Zod + TS types)
 *           └─ schemas/inventory.ts  (hand-crafted API shapes)
 *                 └─ router/inventory.ts  (oRPC contract)
 *                       ├─ Backend: implements via InventoryController
 *                       └─ Frontend: calls via orpc.inventory.*
 */
import { z } from 'zod';
import { PaginationQuerySchema } from './common';
import { CustomFieldWithValueSchema, CustomFieldValuesMapSchema } from './custom-fields';

// ── Item Status / Type enums ──────────────────────────────────────────────────

export const ItemStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const ItemTypeSchema = z.enum(['PRODUCT', 'SERVICE', 'DIGITAL']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

// ── Item Variant ──────────────────────────────────────────────────────────────

export const ItemVariantSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  stock: z.number().int().default(0),
  attributes: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ItemVariant = z.infer<typeof ItemVariantSchema>;

export const CreateItemVariantSchema = ItemVariantSchema.omit({
  id: true,
  itemId: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateItemVariant = z.infer<typeof CreateItemVariantSchema>;

// ── Item ─────────────────────────────────────────────────────────────────────

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  category: z.string(),
  categoryId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  salePrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  vatRate: z.number().nonnegative().default(15),
  stock: z.number().int().default(0),
  reorderLevel: z.number().int().default(5),
  itemType: ItemTypeSchema.default('PRODUCT'),
  status: ItemStatusSchema.default('ACTIVE'),
  description: z.string().nullable().optional(),
  unit: z.string().default('UNIT').nullable().optional(),
  barcode: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  warehouseId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  minOrderQty: z.number().int().default(1),
  maxOrderQty: z.number().int().nullable().optional(),
  variants: z.array(ItemVariantSchema).optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Item = z.infer<typeof ItemSchema>;

export const CreateItemSchema = ItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  customFields: true,
}).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
  variants: z.array(CreateItemVariantSchema).optional(),
});
export type CreateItem = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItem = z.infer<typeof UpdateItemSchema>;

export const ListItemsQuerySchema = PaginationQuerySchema.merge(
  z.object({
    companyId: z.string().optional(),
    category: z.string().optional(),
    status: ItemStatusSchema.optional(),
    warehouseId: z.string().optional(),
    groupId: z.string().optional(),
    lowStock: z.coerce.boolean().optional(),
  }),
);
export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

// ── ItemGroup ─────────────────────────────────────────────────────────────────

export const ItemGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ItemGroup = z.infer<typeof ItemGroupSchema>;

export const CreateItemGroupSchema = ItemGroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateItemGroup = z.infer<typeof CreateItemGroupSchema>;

// ── Warehouse ─────────────────────────────────────────────────────────────────

export const WarehouseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().default('Ethiopia').nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  manager: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
   isDefault: z.boolean().default(false),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Warehouse = z.infer<typeof WarehouseSchema>;

export const CreateWarehouseSchema = WarehouseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  customFields: true,
});
export type CreateWarehouse = z.infer<typeof CreateWarehouseSchema>;

// ── StockTransaction ──────────────────────────────────────────────────────────

export const StockTransactionTypeSchema = z.enum([
  'PURCHASE',
  'SALE',
  'RETURN_IN',
  'RETURN_OUT',
  'ADJUSTMENT',
  'TRANSFER',
  'OPENING',
  'SCRAP',
]);
export type StockTransactionType = z.infer<typeof StockTransactionTypeSchema>;

export const StockTransactionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: z.string(),
  quantity: z.number().int(),
  unitCost: z.number().nonnegative(),
  reference: z.string().nullable().optional(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type StockTransaction = z.infer<typeof StockTransactionSchema>;

export const CreateStockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  reason: z.string().optional(),
  reference: z.string().optional(),
  companyId: z.string().optional(),
  warehouseId: z.string().optional(),
});
export type CreateStockAdjustment = z.infer<typeof CreateStockAdjustmentSchema>;

// ── Inventory Adjustment ──────────────────────────────────────────────────────

export const InventoryAdjustmentSchema = z.object({
  id: z.string(),
  reference: z.string(),
  itemId: z.string(),
  quantity: z.number().int(),
  type: z.string(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  adjustedBy: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  warehouseId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;

// ── Stock Summary (read-only aggregate) ───────────────────────────────────────

export const StockSummarySchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  itemCode: z.string(),
  totalStock: z.number().int(),
  reorderLevel: z.number().int(),
  isLowStock: z.boolean(),
  lastTransactionDate: z.coerce.date().nullable().optional(),
  estimatedValue: z.number().nonnegative().optional(),
});

export type StockSummary = z.infer<typeof StockSummarySchema>;
