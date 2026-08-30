/**
 * @ovds/contracts — IFRS oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  IfrsTemplateSchema,
  ConsolidatedStatementSchema,
  EclProvisionSchema,
  LeaseSchema,
  IfrsDashboardQuerySchema,
} from '../schemas/ifrs';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const ifrsProcedures = {
  templates: {
    list: oc
      .input(PaginationQuerySchema)
      .output(PaginatedResultSchema(IfrsTemplateSchema)),

    get: oc
      .input(IdParamSchema)
      .output(IfrsTemplateSchema.optional()),

    create: oc
      .input(IfrsTemplateSchema.omit({ id: true, createdAt: true, updatedAt: true }))
      .output(IfrsTemplateSchema),

    update: oc
      .input(IdParamSchema.merge(IfrsTemplateSchema.omit({ id: true, createdAt: true, updatedAt: true })))
      .output(IfrsTemplateSchema),

    delete: oc
      .input(IdParamSchema)
      .output(z.object({ success: z.boolean() })),
  },

  consolidation: {
    list: oc
      .input(PaginationQuerySchema)
      .output(PaginatedResultSchema(ConsolidatedStatementSchema)),

    create: oc
      .input(ConsolidatedStatementSchema.omit({ id: true, createdAt: true, updatedAt: true }))
      .output(ConsolidatedStatementSchema),

    update: oc
      .input(IdParamSchema.merge(ConsolidatedStatementSchema.omit({ id: true, createdAt: true, updatedAt: true })))
      .output(ConsolidatedStatementSchema),
  },

  ecl: {
    list: oc
      .input(z.object({ companyId: z.string().uuid() }).merge(PaginationQuerySchema))
      .output(PaginatedResultSchema(EclProvisionSchema)),

    create: oc
      .input(EclProvisionSchema.omit({ id: true, createdAt: true, updatedAt: true }))
      .output(EclProvisionSchema),
  },

  leases: {
    list: oc
      .input(z.object({ companyId: z.string().uuid() }).merge(PaginationQuerySchema))
      .output(PaginatedResultSchema(LeaseSchema)),

    create: oc
      .input(LeaseSchema.omit({ id: true, createdAt: true, updatedAt: true }))
      .output(LeaseSchema),
  },

  dashboard: oc
    .input(IfrsDashboardQuerySchema)
    .output(z.object({
      templates: z.array(IfrsTemplateSchema),
      statements: z.array(ConsolidatedStatementSchema),
      ecl: z.array(EclProvisionSchema),
      leases: z.array(LeaseSchema),
    })),
};

export const ifrsContract = oc.router({
  templates: oc.router(ifrsProcedures.templates),
  consolidation: oc.router(ifrsProcedures.consolidation),
  ecl: oc.router(ifrsProcedures.ecl),
  leases: oc.router(ifrsProcedures.leases),
  dashboard: ifrsProcedures.dashboard,
});

export type IfrsContract = typeof ifrsContract;
