/**
 * @ovds/contracts — Cyber Audit oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  CyberAuditSchema,
  CyberAuditMetricSchema,
  CyberAuditFindingSchema,
  CyberAuditSummarySchema,
  CyberAuditChecklistTemplateSchema,
} from '../schemas/cyber-audit';
import { PaginationQuerySchema, PaginatedResultSchema, IdParamSchema } from '../schemas/common';

const auditProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional() })))
    .output(PaginatedResultSchema(CyberAuditSchema)),

  get: oc
    .input(IdParamSchema)
    .output(CyberAuditSchema),

  create: oc
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      conductedBy: z.string().optional(),
    }))
    .output(CyberAuditSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
      conductedBy: z.string().optional(),
    }) })))
    .output(CyberAuditSchema),

  delete: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  start: oc
    .input(IdParamSchema)
    .output(CyberAuditSchema),

  complete: oc
    .input(IdParamSchema)
    .output(CyberAuditSchema),
};

const metricProcedures = {
  list: oc
    .input(IdParamSchema)
    .output(z.array(CyberAuditMetricSchema)),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      status: z.enum(['PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE', 'PARTIAL']).optional(),
      evidence: z.string().optional(),
      remarks: z.string().optional(),
    }) })))
    .output(CyberAuditMetricSchema),
};

const findingProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({
      severity: z.string().optional(),
      status: z.string().optional(),
      auditId: z.string().uuid().optional(),
    })))
    .output(PaginatedResultSchema(CyberAuditFindingSchema)),

  get: oc
    .input(IdParamSchema)
    .output(CyberAuditFindingSchema),

  create: oc
    .input(z.object({
      auditId: z.string().uuid(),
      metricId: z.string().uuid().optional(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
      title: z.string(),
      description: z.string(),
      remediation: z.string().optional(),
      assignedTo: z.string().optional(),
    }))
    .output(CyberAuditFindingSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      remediation: z.string().optional(),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK']).optional(),
      assignedTo: z.string().optional(),
    }) })))
    .output(CyberAuditFindingSchema),

  delete: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

export const cyberAuditContract = oc.router({
  audits: oc.router(auditProcedures),
  metrics: oc.router(metricProcedures),
  findings: oc.router(findingProcedures),
  checklist: oc.router({
    template: oc.input(z.object({})).output(z.array(CyberAuditChecklistTemplateSchema)),
  }),
  summary: oc.input(z.object({})).output(CyberAuditSummarySchema),
});

export type CyberAuditContract = typeof cyberAuditContract;
