/**
 * @ovds/modules/sales — DTO / contract definitions.
 *
 * The Sales module covers invoices, estimates, credit notes, customers,
 * vendors, bills, and bank accounts. Zod contracts span two schema files.
 *
 * Usage (backend):
 *   import { InvoiceSchema, CustomerSchema } from '@ovds/modules/sales/dto';
 *   import { BillSchema, VendorSchema } from '@ovds/modules/sales/dto';
 */

// Invoice, Customer, Vendor, Bill, BankAccount schemas
export * from '@ovds/contracts/schemas/ovds';
// Revenue, Estimate, CreditNote schemas
export * from '@ovds/contracts/schemas/sales';
