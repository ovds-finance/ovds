/**
 * @ovds/contracts — EIMS oRPC Router Contract (Ethiopia e-Invoice Management System)
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  EimsAuthRequestSchema,
  EimsAuthResponseSchema,
  EimsInvoiceRegisterSchema,
  EimsCancelRequestSchema,
  EimsVerifyRequestSchema,
  EimsSalesReceiptSchema,
  EimsWithholdingReceiptSchema,
  EimsRegisterResponseSchema,
  EimsBulkResponseSchema,
} from '../schemas/eims';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const authProcedures = {
  login: oc
    .input(EimsAuthRequestSchema)
    .output(EimsAuthResponseSchema),

  refreshToken: oc
    .input(z.object({ refreshToken: z.string() }))
    .output(EimsAuthResponseSchema),
};

const registerProcedures = {
  single: oc
    .input(EimsInvoiceRegisterSchema)
    .output(EimsRegisterResponseSchema),

  bulk: oc
    .input(z.object({ items: z.array(EimsInvoiceRegisterSchema) }))
    .output(z.object({ conversationId: z.string() })),
};

const cancelProcedures = {
  single: oc
    .input(EimsCancelRequestSchema)
    .output(z.object({ success: z.boolean(), cancellationDate: z.string().optional() })),

  bulk: oc
    .input(z.object({ items: z.array(EimsCancelRequestSchema) }))
    .output(z.object({ conversationId: z.string() })),
};

const verifyProcedures = {
  byIrn: oc
    .input(EimsVerifyRequestSchema)
    .output(z.object({ status: z.string(), irn: z.string().optional(), details: z.any().optional() })),
};

const receiptProcedures = {
  sales: oc
    .input(EimsSalesReceiptSchema)
    .output(EimsRegisterResponseSchema),

  withholding: oc
    .input(EimsWithholdingReceiptSchema)
    .output(EimsRegisterResponseSchema),
};

const bulkProcedures = {
  register: oc
    .input(z.object({ items: z.array(z.string()) }))
    .output(z.object({ conversationId: z.string() })),

  cancel: oc
    .input(z.object({ items: z.array(z.object({ irn: z.string(), reasonCode: z.string(), remark: z.string().optional() })) }))
    .output(z.object({ conversationId: z.string() })),

  jobs: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(z.object({
      id: z.string().uuid(),
      conversationId: z.string(),
      type: z.string(),
      status: z.string(),
      totalItems: z.number().int(),
      processedItems: z.number().int(),
      successCount: z.number().int(),
      failureCount: z.number().int(),
      createdAt: z.string(),
    }))),
};

export const eimsContract = oc.router({
  auth: oc.router(authProcedures),
  register: oc.router(registerProcedures),
  cancel: oc.router(cancelProcedures),
  verify: oc.router(verifyProcedures),
  receipts: oc.router(receiptProcedures),
  bulk: oc.router(bulkProcedures),
});

export type EimsContract = typeof eimsContract;
