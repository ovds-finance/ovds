/**
 * @ovds/dto/inventory/zod-bridge — Zod schemas for the inventory domain
 *
 * Provides Zod versions of the inventory DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── Item Status / Type enums ──────────────────────────────────────────────────

export const ItemStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']);
export const ItemTypeSchema = z.enum(['PRODUCT', 'SERVICE', 'DIGITAL']);

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

export const CreateItemVariantSchema = ItemVariantSchema.omit({
  id: true,
  itemId: true,
  createdAt: true,
  updatedAt: true,
});

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
});

export const CreateItemSchema = ItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
  variants: z.array(CreateItemVariantSchema).optional(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const ListItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  companyId: z.string().optional(),
  category: z.string().optional(),
  status: ItemStatusSchema.optional(),
  warehouseId: z.string().optional(),
  groupId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
});

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

export const CreateItemGroupSchema = ItemGroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
});

export const CreateWarehouseSchema = WarehouseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ── StockTransaction ──────────────────────────────────────────────────────────

export const StockTransactionTypeSchema = z.enum([
  'PURCHASE', 'SALE', 'RETURN_IN', 'RETURN_OUT', 'ADJUSTMENT', 'TRANSFER', 'OPENING', 'SCRAP',
]);

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

export const CreateStockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  reason: z.string().optional(),
  reference: z.string().optional(),
  companyId: z.string().optional(),
  warehouseId: z.string().optional(),
});

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
