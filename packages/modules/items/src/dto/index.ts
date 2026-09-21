/**
 * @ovds/modules/items — DTO / contract definitions.
 *
 * Items covers the product catalogue, inventory, warehouses, and stock operations.
 * Zod contracts live in @ovds/contracts/schemas/inventory.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { ItemSchema, WarehouseSchema, StockTransactionSchema } from '@ovds/modules/items/dto';
 */

export * from '@ovds/contracts/schemas/inventory';
