/**
 * @ovds/contracts — Inventory oRPC Router Contract
 *
 * Defines the type-safe API contract for the Inventory domain.
 * Both NestJS (implements it) and React (calls it) import from here.
 * No business logic lives here — only input/output shapes.
 *
 * Usage — Backend (NestJS):
 *   import { appContract } from '@ovds/contracts/router';
 *   // InventoryController implements the inventory sub-router
 *
 * Usage — Frontend (React):
 *   import { orpc } from '../lib/orpc';
 *   const { data } = orpc.inventory.items.list.useQuery({ companyId });
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "inventoryContract", {
    enumerable: true,
    get: function() {
        return inventoryContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _inventory = require("../schemas/inventory");
const _common = require("../schemas/common");
// ── Item procedures ───────────────────────────────────────────────────────────
const itemProcedures = {
    list: _contract.oc.input(_inventory.ListItemsQuerySchema).output((0, _common.PaginatedResultSchema)(_inventory.ItemSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_inventory.ItemSchema),
    create: _contract.oc.input(_inventory.CreateItemSchema).output(_inventory.ItemSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _inventory.UpdateItemSchema
    }))).output(_inventory.ItemSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    adjustStock: _contract.oc.input(_inventory.CreateStockAdjustmentSchema).output(_inventory.ItemSchema)
};
// ── ItemGroup procedures ──────────────────────────────────────────────────────
const itemGroupProcedures = {
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_inventory.ItemGroupSchema)),
    create: _contract.oc.input(_inventory.CreateItemGroupSchema).output(_inventory.ItemGroupSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Warehouse procedures ──────────────────────────────────────────────────────
const warehouseProcedures = {
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_inventory.WarehouseSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_inventory.WarehouseSchema),
    create: _contract.oc.input(_inventory.CreateWarehouseSchema).output(_inventory.WarehouseSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            name: _zod.z.string().min(1).optional(),
            code: _zod.z.string().min(1).optional(),
            address: _zod.z.string().nullable().optional(),
            city: _zod.z.string().nullable().optional(),
            country: _zod.z.string().default('Ethiopia').nullable().optional(),
            phone: _zod.z.string().nullable().optional(),
            email: _zod.z.string().email().nullable().optional(),
            manager: _zod.z.string().nullable().optional(),
            companyId: _zod.z.string().nullable().optional(),
            isActive: _zod.z.boolean().optional(),
            isDefault: _zod.z.boolean().optional(),
            customFields: _zod.z.array(_zod.z.object({
                id: _zod.z.string().optional(),
                name: _zod.z.string().optional(),
                value: _zod.z.string().optional()
            })).optional()
        })
    }))).output(_inventory.WarehouseSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Stock transaction / adjustment procedures ─────────────────────────────────
const stockProcedures = {
    transactions: _contract.oc.input(_zod.z.object({
        itemId: _zod.z.string().optional(),
        companyId: _zod.z.string().optional(),
        page: _zod.z.coerce.number().int().min(1).default(1),
        limit: _zod.z.coerce.number().int().min(1).max(200).default(20)
    })).output((0, _common.PaginatedResultSchema)(_inventory.StockTransactionSchema)),
    adjustments: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        page: _zod.z.coerce.number().int().min(1).default(1),
        limit: _zod.z.coerce.number().int().min(1).max(200).default(20)
    })).output((0, _common.PaginatedResultSchema)(_inventory.InventoryAdjustmentSchema)),
    summary: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        warehouseId: _zod.z.string().optional()
    })).output(_zod.z.array(_inventory.StockSummarySchema))
};
const inventoryContract = _contract.oc.router({
    items: _contract.oc.router(itemProcedures),
    groups: _contract.oc.router(itemGroupProcedures),
    warehouses: _contract.oc.router(warehouseProcedures),
    stock: _contract.oc.router(stockProcedures)
});
