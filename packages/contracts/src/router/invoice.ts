/**
 * @ovds/contracts — Invoice oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  InvoiceSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  ListInvoicesQuerySchema,
} from '../schemas/ovds';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const invoiceProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(InvoiceSchema)),

  get: oc
    .input(IdParamSchema)
    .output(InvoiceSchema.optional()),

  create: oc
    .input(CreateInvoiceSchema)
    .output(InvoiceSchema),

  update: oc
    .input(UpdateInvoiceSchema)
    .output(InvoiceSchema),

  delete: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  getByNumber: oc
    .input(z.object({ invoiceNumber: z.string() }))
    .output(InvoiceSchema.optional()),

  getByCustomer: oc
    .input(z.object({ customerId: z.string().uuid() }).merge(PaginationQuerySchema))
    .output(PaginatedResultSchema(InvoiceSchema)),

  getOverdue: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(InvoiceSchema)),

  markPaid: oc
    .input(z.object({ id: z.string().uuid(), amount: z.number().nonnegative() }))
    .output(InvoiceSchema),
};

export const invoiceContract = oc.router({
  ...invoiceProcedures,
});

export type InvoiceContract = typeof invoiceContract;
