/**
 * @ovds/contracts — CRM oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  LeadSchema,
  OpportunitySchema,
  ActivitySchema,
  PipelineStageSchema,
} from '../schemas/crm';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const leadProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional(), assignedTo: z.string().optional() })))
    .output(PaginatedResultSchema(LeadSchema)),

  get: oc
    .input(IdParamSchema)
    .output(LeadSchema),

  create: oc
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.string().optional(),
      status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']),
      assignedTo: z.string().optional(),
      notes: z.string().optional(),
    }))
    .output(LeadSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({
      data: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).optional(),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
      }),
    })))
    .output(LeadSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  convert: oc
    .input(IdParamSchema.merge(z.object({ customerId: z.string().uuid() })))
    .output(z.object({ success: z.boolean() })),
};

const opportunityProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ stage: z.string().optional(), assignedTo: z.string().optional() })))
    .output(PaginatedResultSchema(OpportunitySchema)),

  get: oc
    .input(IdParamSchema)
    .output(OpportunitySchema),

  create: oc
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      value: z.number().nonnegative(),
      currencyCode: z.string().default('ETB'),
      stage: z.string(),
      probability: z.number().int().min(0).max(100).default(0),
      expectedCloseDate: z.string().optional(),
      customerId: z.string().uuid().optional(),
      assignedTo: z.string().optional(),
    }))
    .output(OpportunitySchema),

  update: oc
    .input(IdParamSchema.merge(z.object({
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        value: z.number().nonnegative().optional(),
        currencyCode: z.string().optional(),
        stage: z.string().optional(),
        probability: z.number().int().min(0).max(100).optional(),
        expectedCloseDate: z.string().optional(),
        customerId: z.string().uuid().optional(),
        assignedTo: z.string().optional(),
      }),
    })))
    .output(OpportunitySchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  convertToInvoice: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean(), invoiceId: z.string().uuid().optional() })),
};

const activityProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ relatedId: z.string().uuid().optional(), type: z.string().optional() })))
    .output(PaginatedResultSchema(ActivitySchema)),

  create: oc
    .input(z.object({
      type: z.enum(['call', 'email', 'meeting', 'task', 'note']),
      subject: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      assignedTo: z.string().optional(),
      relatedId: z.string().uuid().optional(),
    }))
    .output(ActivitySchema),

  complete: oc
    .input(IdParamSchema)
    .output(ActivitySchema),
};

const pipelineProcedures = {
  stages: oc
    .input(z.object({}))
    .output(z.array(PipelineStageSchema)),

  move: oc
    .input(z.object({ opportunityId: z.string().uuid(), stageId: z.string() }))
    .output(OpportunitySchema),
};

export const crmContract = oc.router({
  leads: oc.router(leadProcedures),
  opportunities: oc.router(opportunityProcedures),
  activities: oc.router(activityProcedures),
  pipeline: oc.router(pipelineProcedures),
});

export type CrmContract = typeof crmContract;
