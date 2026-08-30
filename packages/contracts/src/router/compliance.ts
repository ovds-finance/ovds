/**
 * @ovds/contracts — Compliance oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  ComplianceChecklistSchema,
  EimsSourceSystemSchema,
  EimsCertificateSchema,
  EimsRegistrationSchema,
  EimsBulkJobSchema,
  TaxReportSchema,
} from '../schemas/compliance';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const checklistProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(ComplianceChecklistSchema)),

  get: oc
    .input(IdParamSchema)
    .output(ComplianceChecklistSchema),

  create: oc
    .input(z.object({
      name: z.string(),
      category: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
      dueDate: z.string().optional(),
      assignee: z.string().optional(),
      notes: z.string().optional(),
    }))
    .output(ComplianceChecklistSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
      dueDate: z.string().optional(),
      completedAt: z.string().optional(),
      assignee: z.string().optional(),
      notes: z.string().optional(),
    }) })))
    .output(ComplianceChecklistSchema),
};

const sourceSystemProcedures = {
  list: oc
    .input(z.object({ tin: z.string().optional() }))
    .output(z.array(EimsSourceSystemSchema)),

  register: oc
    .input(z.object({
      systemNumber: z.string(),
      systemType: z.enum(['ERP', 'POS', 'MANUAL']),
      enterpriseId: z.string().optional(),
      establishmentId: z.string().optional(),
      clientId: z.string(),
      clientSecret: z.string(),
      apiKey: z.string().optional(),
      callbackUrl: z.string().optional(),
    }))
    .output(EimsSourceSystemSchema),

  approve: oc
    .input(IdParamSchema)
    .output(EimsSourceSystemSchema),

  updateCredentials: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({ clientId: z.string().optional(), clientSecret: z.string().optional(), apiKey: z.string().optional() }) })))
    .output(EimsSourceSystemSchema),
};

const certificateProcedures = {
  list: oc
    .input(z.object({ sourceSystemId: z.string().uuid().optional() }))
    .output(z.array(EimsCertificateSchema)),

  generateCsr: oc
    .input(z.object({
      tin: z.string(),
      systemNumber: z.string(),
      organizationName: z.string(),
      email: z.string().email(),
      organizationalUnitName: z.string().optional(),
      sourceSystemId: z.string().uuid().optional(),
    }))
    .output(EimsCertificateSchema),

  submitCsr: oc
    .input(IdParamSchema.merge(z.object({ csrPem: z.string() })))
    .output(EimsCertificateSchema),

  install: oc
    .input(IdParamSchema.merge(z.object({ certificatePem: z.string() })))
    .output(EimsCertificateSchema),
};

const registrationProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional(), invoiceId: z.string().uuid().optional() })))
    .output(PaginatedResultSchema(EimsRegistrationSchema)),

  register: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean(), irn: z.string().optional() })),

  cancel: oc
    .input(IdParamSchema.merge(z.object({ reasonCode: z.string(), remark: z.string().optional() })))
    .output(z.object({ success: z.boolean() })),

  verify: oc
    .input(IdParamSchema)
    .output(z.object({ status: z.string(), irn: z.string().optional() })),
};

const bulkProcedures = {
  register: oc
    .input(z.object({ invoiceIds: z.array(z.string().uuid()) }))
    .output(z.object({ conversationId: z.string() })),

  cancel: oc
    .input(z.object({ items: z.array(z.object({ invoiceId: z.string().uuid(), reasonCode: z.string(), remark: z.string().optional() })) }))
    .output(z.object({ conversationId: z.string() })),

  jobs: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(EimsBulkJobSchema)),
};

const taxReportProcedures = {
  list: oc
    .input(PaginationQuerySchema)
    .output(PaginatedResultSchema(TaxReportSchema)),

  generate: oc
    .input(z.object({ type: z.string(), period: z.string() }))
    .output(TaxReportSchema),
};

export const complianceContract = oc.router({
  checklists: oc.router(checklistProcedures),
  sourceSystems: oc.router(sourceSystemProcedures),
  certificates: oc.router(certificateProcedures),
  registrations: oc.router(registrationProcedures),
  bulk: oc.router(bulkProcedures),
  taxReports: oc.router(taxReportProcedures),
});

export type ComplianceContract = typeof complianceContract;
