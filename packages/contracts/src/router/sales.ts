/**
 * @ovds/contracts — Sales oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  InvoiceSchema,
  CreateInvoiceSchema,
  RevenueSchema,
  CustomerSchema,
  EstimateSchema,
  CreditNoteSchema,
  InvoiceStatusSchema,
  InvoiceItemSchema,
  CustomFieldValuesMapSchema,
} from '../schemas/sales';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const invoiceProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional(), customerId: z.string().uuid().optional() })))
    .output(PaginatedResultSchema(InvoiceSchema)),

  get: oc
    .input(IdParamSchema)
    .output(InvoiceSchema),

  create: oc
    .input(CreateInvoiceSchema)
    .output(InvoiceSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({
      data: z.object({
        customerId: z.string().nullable().optional(),
        customerName: z.string().optional(),
        customerEmail: z.string().email().nullable().optional(),
        customerPhone: z.string().nullable().optional(),
        customerAddress: z.string().nullable().optional(),
        customerTin: z.string().nullable().optional(),
        status: InvoiceStatusSchema.optional(),
        date: z.coerce.date().optional(),
        dueDate: z.coerce.date().nullable().optional(),
        subtotal: z.number().nonnegative().optional(),
        discountAmount: z.number().nonnegative().optional(),
        vatAmount: z.number().nonnegative().optional(),
        vatRate: z.number().nonnegative().optional(),
        totalAmount: z.number().nonnegative().optional(),
        notes: z.string().nullable().optional(),
        companyId: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringInterval: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).nullable().optional(),
        items: z.array(InvoiceItemSchema).optional(),
        customFields: CustomFieldValuesMapSchema.optional(),
      }),
    })))
    .output(InvoiceSchema),

  send: oc
    .input(IdParamSchema.merge(z.object({ method: z.string().optional() })))
    .output(z.object({ success: z.boolean() })),

  cancel: oc
    .input(IdParamSchema.merge(z.object({ reason: z.string() })))
    .output(InvoiceSchema),

  markPaid: oc
    .input(IdParamSchema.merge(z.object({ amount: z.number().positive(), paymentDate: z.string() })))
    .output(InvoiceSchema),
};

const revenueProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(RevenueSchema)),

  get: oc
    .input(IdParamSchema)
    .output(RevenueSchema),

  create: oc
    .input(z.object({
      amount: z.number().positive(),
      currencyCode: z.string().default('ETB'),
      category: z.string(),
      description: z.string().optional(),
      receivedAt: z.string(),
      accountId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
    }))
    .output(RevenueSchema),
};

const customerProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(CustomerSchema)),

  get: oc
    .input(IdParamSchema)
    .output(CustomerSchema),

  create: oc
    .input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      taxNumber: z.string().optional(),
      currencyCode: z.string().default('ETB'),
    }))
    .output(CustomerSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      taxNumber: z.string().optional(),
      currencyCode: z.string().optional(),
    }) })))
    .output(CustomerSchema),

  statement: oc
    .input(IdParamSchema.merge(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() })))
    .output(z.object({ customer: CustomerSchema, transactions: z.array(z.any()), openingBalance: z.number(), closingBalance: z.number() })),
};

const estimateProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional() })))
    .output(PaginatedResultSchema(EstimateSchema)),

  get: oc
    .input(IdParamSchema)
    .output(EstimateSchema),

  create: oc
    .input(z.object({
      estimateNumber: z.string(),
      customerId: z.string().uuid(),
      estimateDate: z.string(),
      expiryDate: z.string().optional(),
      status: z.enum(['draft', 'sent', 'approved', 'rejected', 'converted', 'expired']),
      subTotal: z.number(),
      taxTotal: z.number(),
      total: z.number(),
    }))
    .output(EstimateSchema),

  convertToInvoice: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean(), invoiceId: z.string().uuid().optional() })),
};

const creditNoteProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(CreditNoteSchema)),

  create: oc
    .input(z.object({
      creditNoteNumber: z.string(),
      invoiceId: z.string().uuid().optional(),
      customerId: z.string().uuid(),
      amount: z.number().positive(),
      reason: z.string().optional(),
      status: z.enum(['draft', 'issued', 'applied', 'cancelled']),
    }))
    .output(CreditNoteSchema),
};

export const salesContract = oc.router({
  invoices: oc.router(invoiceProcedures),
  revenues: oc.router(revenueProcedures),
  customers: oc.router(customerProcedures),
  estimates: oc.router(estimateProcedures),
  creditNotes: oc.router(creditNoteProcedures),
});

export type SalesContract = typeof salesContract;
