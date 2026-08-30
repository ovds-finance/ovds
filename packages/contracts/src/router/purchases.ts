/**
 * @ovds/contracts — Purchases oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  BillSchema,
  VendorSchema,
  PurchaseOrderSchema,
  GoodsReceivedNoteSchema,
  DebitNoteSchema,
  VendorPaymentSchema,
} from '../schemas/purchases';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const billProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional(), vendorId: z.string().uuid().optional() })))
    .output(PaginatedResultSchema(BillSchema)),

  get: oc
    .input(IdParamSchema)
    .output(BillSchema),

  create: oc
    .input(z.object({
      billNumber: z.string(),
      vendorId: z.string().nullable().optional(),
      vendorName: z.string().nullable().optional(),
      category: z.string(),
      amount: z.number().nonnegative(),
      vatAmount: z.number().nonnegative().default(0),
      vatRate: z.number().nonnegative().nullable().optional(),
      total: z.number().nonnegative(),
      status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']),
      dueDate: z.coerce.date(),
      notes: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
      vendorTin: z.string().nullable().optional(),
      whtApplicable: z.boolean().default(false),
      currencyCode: z.string().default('ETB'),
    }))
    .output(BillSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      billNumber: z.string().optional(),
      vendorId: z.string().nullable().optional(),
      vendorName: z.string().nullable().optional(),
      category: z.string().optional(),
      amount: z.number().nonnegative().optional(),
      vatAmount: z.number().nonnegative().optional(),
      vatRate: z.number().nonnegative().nullable().optional(),
      total: z.number().nonnegative().optional(),
      status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']).optional(),
      dueDate: z.coerce.date().optional(),
      notes: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
      vendorTin: z.string().nullable().optional(),
      whtApplicable: z.boolean().optional(),
      currencyCode: z.string().optional(),
    }) })))
    .output(BillSchema),

  markPaid: oc
    .input(IdParamSchema.merge(z.object({ amount: z.number().positive(), paymentDate: z.string(), paymentMethod: z.string() })))
    .output(BillSchema),
};

const vendorProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(VendorSchema)),

  get: oc
    .input(IdParamSchema)
    .output(VendorSchema),

  create: oc
    .input(z.object({
      name: z.string(),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      tin: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      paymentTerms: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
      isActive: z.boolean().default(true),
      notes: z.string().nullable().optional(),
    }))
    .output(VendorSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      name: z.string().optional(),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      tin: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      paymentTerms: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().nullable().optional(),
    }) })))
    .output(VendorSchema),

  statement: oc
    .input(IdParamSchema.merge(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() })))
    .output(z.object({ vendor: VendorSchema, transactions: z.array(z.any()), openingBalance: z.number(), closingBalance: z.number() })),
};

const purchaseOrderProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional(), vendorId: z.string().uuid().optional() })))
    .output(PaginatedResultSchema(PurchaseOrderSchema)),

  get: oc
    .input(IdParamSchema)
    .output(PurchaseOrderSchema),

  create: oc
    .input(z.object({
      poNumber: z.string(),
      vendorId: z.string().uuid().optional(),
      vendorName: z.string().optional(),
      status: z.enum(['draft', 'sent', 'approved', 'received', 'cancelled']),
      expectedDelivery: z.string().optional(),
      totalAmount: z.number().nonnegative(),
      currencyCode: z.string().default('ETB'),
      notes: z.string().optional(),
      items: z.string().optional(),
    }))
    .output(PurchaseOrderSchema),

  approve: oc
    .input(IdParamSchema)
    .output(PurchaseOrderSchema),

  cancel: oc
    .input(IdParamSchema)
    .output(PurchaseOrderSchema),
};

const grnProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(GoodsReceivedNoteSchema)),

  create: oc
    .input(z.object({
      grnNumber: z.string(),
      purchaseOrderId: z.string().uuid().optional(),
      vendorId: z.string().uuid(),
      receivedDate: z.string(),
      status: z.enum(['draft', 'received', 'accepted', 'rejected']),
      items: z.string().optional(),
      notes: z.string().optional(),
    }))
    .output(GoodsReceivedNoteSchema),
};

const vendorPaymentProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ vendorId: z.string().uuid().optional() })))
    .output(PaginatedResultSchema(VendorPaymentSchema)),

  create: oc
    .input(z.object({
      vendorId: z.string().uuid(),
      amount: z.number().positive(),
      currencyCode: z.string().default('ETB'),
      paymentDate: z.string(),
      paymentMethod: z.string(),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .output(VendorPaymentSchema),
};

export const purchasesContract = oc.router({
  bills: oc.router(billProcedures),
  vendors: oc.router(vendorProcedures),
  purchaseOrders: oc.router(purchaseOrderProcedures),
  grn: oc.router(grnProcedures),
  vendorPayments: oc.router(vendorPaymentProcedures),
});

export type PurchasesContract = typeof purchasesContract;
