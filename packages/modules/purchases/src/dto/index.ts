/**
 * @ovds/modules/purchases — DTO / contract definitions.
 *
 * Purchases covers bills, purchase orders, vendor payments, and GRNs.
 * Zod contracts live in @ovds/contracts/schemas/purchases.
 * Re-exported here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { BillSchema, PurchaseOrderSchema, VendorSchema } from '@ovds/modules/purchases/dto';
 */

export * from '@ovds/contracts/schemas/purchases';
