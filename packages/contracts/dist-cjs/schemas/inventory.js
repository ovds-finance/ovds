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
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateItemGroupSchema () {
        return CreateItemGroupSchema;
    },
    get CreateItemSchema () {
        return CreateItemSchema;
    },
    get CreateItemVariantSchema () {
        return CreateItemVariantSchema;
    },
    get CreateStockAdjustmentSchema () {
        return CreateStockAdjustmentSchema;
    },
    get CreateWarehouseSchema () {
        return CreateWarehouseSchema;
    },
    get InventoryAdjustmentSchema () {
        return InventoryAdjustmentSchema;
    },
    get ItemGroupSchema () {
        return ItemGroupSchema;
    },
    get ItemSchema () {
        return ItemSchema;
    },
    get ItemStatusSchema () {
        return ItemStatusSchema;
    },
    get ItemTypeSchema () {
        return ItemTypeSchema;
    },
    get ItemVariantSchema () {
        return ItemVariantSchema;
    },
    get ListItemsQuerySchema () {
        return ListItemsQuerySchema;
    },
    get StockSummarySchema () {
        return StockSummarySchema;
    },
    get StockTransactionSchema () {
        return StockTransactionSchema;
    },
    get StockTransactionTypeSchema () {
        return StockTransactionTypeSchema;
    },
    get UpdateItemSchema () {
        return UpdateItemSchema;
    },
    get WarehouseSchema () {
        return WarehouseSchema;
    }
});
const _zod = require("zod");
const _common = require("./common");
const _customfields = require("./custom-fields");
const ItemStatusSchema = _zod.z.enum([
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED'
]);
const ItemTypeSchema = _zod.z.enum([
    'PRODUCT',
    'SERVICE',
    'DIGITAL'
]);
const ItemVariantSchema = _zod.z.object({
    id: _zod.z.string(),
    itemId: _zod.z.string(),
    name: _zod.z.string(),
    sku: _zod.z.string(),
    price: _zod.z.number().nonnegative(),
    costPrice: _zod.z.number().nonnegative().default(0),
    stock: _zod.z.number().int().default(0),
    attributes: _zod.z.string().nullable().optional(),
    imageUrl: _zod.z.string().url().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateItemVariantSchema = ItemVariantSchema.omit({
    id: true,
    itemId: true,
    createdAt: true,
    updatedAt: true
});
const ItemSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string().min(1, 'Name is required'),
    code: _zod.z.string().min(1, 'Code is required'),
    category: _zod.z.string(),
    categoryId: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    salePrice: _zod.z.number().nonnegative(),
    costPrice: _zod.z.number().nonnegative().default(0),
    vatRate: _zod.z.number().nonnegative().default(15),
    stock: _zod.z.number().int().default(0),
    reorderLevel: _zod.z.number().int().default(5),
    itemType: ItemTypeSchema.default('PRODUCT'),
    status: ItemStatusSchema.default('ACTIVE'),
    description: _zod.z.string().nullable().optional(),
    unit: _zod.z.string().default('UNIT').nullable().optional(),
    barcode: _zod.z.string().nullable().optional(),
    imageUrl: _zod.z.string().url().nullable().optional(),
    warehouseId: _zod.z.string().nullable().optional(),
    groupId: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    minOrderQty: _zod.z.number().int().default(1),
    maxOrderQty: _zod.z.number().int().nullable().optional(),
    variants: _zod.z.array(ItemVariantSchema).optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateItemSchema = ItemSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional(),
    variants: _zod.z.array(CreateItemVariantSchema).optional()
});
const UpdateItemSchema = CreateItemSchema.partial();
const ListItemsQuerySchema = _common.PaginationQuerySchema.merge(_zod.z.object({
    companyId: _zod.z.string().optional(),
    category: _zod.z.string().optional(),
    status: ItemStatusSchema.optional(),
    warehouseId: _zod.z.string().optional(),
    groupId: _zod.z.string().optional(),
    lowStock: _zod.z.coerce.boolean().optional()
}));
const ItemGroupSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string().min(1),
    description: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateItemGroupSchema = ItemGroupSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
const WarehouseSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string().min(1),
    code: _zod.z.string().min(1),
    address: _zod.z.string().nullable().optional(),
    city: _zod.z.string().nullable().optional(),
    country: _zod.z.string().default('Ethiopia').nullable().optional(),
    phone: _zod.z.string().nullable().optional(),
    email: _zod.z.string().email().nullable().optional(),
    manager: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    isDefault: _zod.z.boolean().default(false),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateWarehouseSchema = WarehouseSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
});
const StockTransactionTypeSchema = _zod.z.enum([
    'PURCHASE',
    'SALE',
    'RETURN_IN',
    'RETURN_OUT',
    'ADJUSTMENT',
    'TRANSFER',
    'OPENING',
    'SCRAP'
]);
const StockTransactionSchema = _zod.z.object({
    id: _zod.z.string(),
    itemId: _zod.z.string(),
    type: _zod.z.string(),
    quantity: _zod.z.number().int(),
    unitCost: _zod.z.number().nonnegative(),
    reference: _zod.z.string().nullable().optional(),
    date: _zod.z.coerce.date(),
    createdAt: _zod.z.coerce.date()
});
const CreateStockAdjustmentSchema = _zod.z.object({
    itemId: _zod.z.string().uuid(),
    quantity: _zod.z.number().int(),
    type: _zod.z.enum([
        'ADD',
        'REMOVE',
        'SET'
    ]),
    reason: _zod.z.string().optional(),
    reference: _zod.z.string().optional(),
    companyId: _zod.z.string().optional(),
    warehouseId: _zod.z.string().optional()
});
const InventoryAdjustmentSchema = _zod.z.object({
    id: _zod.z.string(),
    reference: _zod.z.string(),
    itemId: _zod.z.string(),
    quantity: _zod.z.number().int(),
    type: _zod.z.string(),
    reason: _zod.z.string().nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    adjustedBy: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    warehouseId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date()
});
const StockSummarySchema = _zod.z.object({
    itemId: _zod.z.string(),
    itemName: _zod.z.string(),
    itemCode: _zod.z.string(),
    totalStock: _zod.z.number().int(),
    reorderLevel: _zod.z.number().int(),
    isLowStock: _zod.z.boolean(),
    lastTransactionDate: _zod.z.coerce.date().nullable().optional(),
    estimatedValue: _zod.z.number().nonnegative().optional()
});
