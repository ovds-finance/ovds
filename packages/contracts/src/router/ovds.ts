/**
 * @ovds/contracts — ovds oRPC Router Contract
 *
 * Defines the type-safe API contract for the ovds domain.
 * Both NestJS (implements it) and React (calls it) import from here.
 * No business logic lives here — only shapes.
 */
import { oc } from '@orpc/contract';
import { oz } from '@orpc/zod';
import { z } from 'zod';
import {
  CustomerSchema,
  CreateCustomerSchema,
  UpdateCustomerSchema,
  ListCustomersQuerySchema,
  VendorSchema,
  CreateVendorSchema,
  UpdateVendorSchema,
  InvoiceSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  ListInvoicesQuerySchema,
  BillSchema,
  CreateBillSchema,
  UpdateBillSchema,
  BillPaymentSchema,
  CreateBillPaymentSchema,
  BankAccountSchema,
  CreateBankAccountSchema,
  AccountSchema,
} from '../schemas/ovds';
import { IdParamSchema, PaginationQuerySchema } from '../schemas/common';
import { PaginatedResultSchema } from '../schemas/common';

// ── Customer procedures ───────────────────────────────────────────────────────

const customerProcedures = {
  list: oc
    .input(ListCustomersQuerySchema)
    .output(PaginatedResultSchema(CustomerSchema)),

  get: oc
    .input(IdParamSchema)
    .output(CustomerSchema),

  create: oc
    .input(CreateCustomerSchema)
    .output(CustomerSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateCustomerSchema })))
    .output(CustomerSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Vendor procedures ─────────────────────────────────────────────────────────

const vendorProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ companyId: z.string().optional() })))
    .output(PaginatedResultSchema(VendorSchema)),

  get: oc
    .input(IdParamSchema)
    .output(VendorSchema),

  create: oc
    .input(CreateVendorSchema)
    .output(VendorSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateVendorSchema })))
    .output(VendorSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Invoice procedures ────────────────────────────────────────────────────────

const invoiceProcedures = {
  list: oc
    .input(ListInvoicesQuerySchema)
    .output(PaginatedResultSchema(InvoiceSchema)),

  get: oc
    .input(IdParamSchema)
    .output(InvoiceSchema),

  create: oc
    .input(CreateInvoiceSchema)
    .output(InvoiceSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateInvoiceSchema })))
    .output(InvoiceSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  markPaid: oc
    .input(IdParamSchema.merge(z.object({
      method: z.string().default('CASH'),
      amount: z.number().positive(),
      reference: z.string().optional(),
      paidAt: z.coerce.date().optional(),
    })))
    .output(InvoiceSchema),
};

// ── Bill procedures ───────────────────────────────────────────────────────────

const billProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({
      companyId: z.string().optional(),
      status: z.string().optional(),
    })))
    .output(PaginatedResultSchema(BillSchema)),

  get: oc
    .input(IdParamSchema)
    .output(BillSchema),

  create: oc
    .input(CreateBillSchema)
    .output(BillSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateBillSchema })))
    .output(BillSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  payments: {
    list: oc
      .input(IdParamSchema)
      .output(z.array(BillPaymentSchema)),

    create: oc
      .input(IdParamSchema.merge(z.object({ data: CreateBillPaymentSchema })))
      .output(BillPaymentSchema),

    remove: oc
      .input(z.object({ billId: z.string(), paymentId: z.string() }))
      .output(z.object({ success: z.boolean() })),
  },
};

// ── Bank Account procedures ───────────────────────────────────────────────────

const bankAccountProcedures = {
  list: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.array(BankAccountSchema)),

  get: oc
    .input(IdParamSchema)
    .output(BankAccountSchema),

  create: oc
    .input(CreateBankAccountSchema)
    .output(BankAccountSchema),
};

// ── Account (Chart of Accounts) procedures ────────────────────────────────────

const accountProcedures = {
  list: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.array(AccountSchema)),

  get: oc
    .input(IdParamSchema)
    .output(AccountSchema),
};

// ── ovds router contract ───────────────────────────────────────────────────

export const ovdsContract = oc.router({
  customers:    oc.router(customerProcedures),
  vendors:      oc.router(vendorProcedures),
  invoices:     oc.router(invoiceProcedures),
  bills:        oc.router(billProcedures),
  bankAccounts: oc.router(bankAccountProcedures),
  accounts:     oc.router(accountProcedures),
});

export type OvdsContract = typeof ovdsContract;
