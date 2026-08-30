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
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  ItemSchema,
  CreateItemSchema,
  UpdateItemSchema,
  ListItemsQuerySchema,
  ItemGroupSchema,
  CreateItemGroupSchema,
  WarehouseSchema,
  CreateWarehouseSchema,
  StockTransactionSchema,
  StockSummarySchema,
  InventoryAdjustmentSchema,
  CreateStockAdjustmentSchema,
} from '../schemas/inventory';
import { IdParamSchema, PaginatedResultSchema } from '../schemas/common';

// ── Item procedures ───────────────────────────────────────────────────────────

const itemProcedures = {
  list: oc
    .input(ListItemsQuerySchema)
    .output(PaginatedResultSchema(ItemSchema)),

  get: oc
    .input(IdParamSchema)
    .output(ItemSchema),

  create: oc
    .input(CreateItemSchema)
    .output(ItemSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateItemSchema })))
    .output(ItemSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  adjustStock: oc
    .input(CreateStockAdjustmentSchema)
    .output(ItemSchema),
};

// ── ItemGroup procedures ──────────────────────────────────────────────────────

const itemGroupProcedures = {
  list: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.array(ItemGroupSchema)),

  create: oc
    .input(CreateItemGroupSchema)
    .output(ItemGroupSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Warehouse procedures ──────────────────────────────────────────────────────

const warehouseProcedures = {
  list: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.array(WarehouseSchema)),

  get: oc
    .input(IdParamSchema)
    .output(WarehouseSchema),

  create: oc
    .input(CreateWarehouseSchema)
    .output(WarehouseSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({
      data: z.object({
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        country: z.string().default('Ethiopia').nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        manager: z.string().nullable().optional(),
        companyId: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        customFields: z.array(z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          value: z.string().optional(),
        })).optional(),
      }),
    })))
    .output(WarehouseSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Stock transaction / adjustment procedures ─────────────────────────────────

const stockProcedures = {
  transactions: oc
    .input(z.object({
      itemId: z.string().optional(),
      companyId: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(200).default(20),
    }))
    .output(PaginatedResultSchema(StockTransactionSchema)),

  adjustments: oc
    .input(z.object({
      companyId: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(200).default(20),
    }))
    .output(PaginatedResultSchema(InventoryAdjustmentSchema)),

  summary: oc
    .input(z.object({
      companyId: z.string().optional(),
      warehouseId: z.string().optional(),
    }))
    .output(z.array(StockSummarySchema)),
};

// ── Inventory router contract ─────────────────────────────────────────────────

export const inventoryContract = oc.router({
  items:      oc.router(itemProcedures),
  groups:     oc.router(itemGroupProcedures),
  warehouses: oc.router(warehouseProcedures),
  stock:      oc.router(stockProcedures),
});

export type InventoryContract = typeof inventoryContract;
