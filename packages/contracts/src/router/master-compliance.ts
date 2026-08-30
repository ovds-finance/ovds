/**
 * @ovds/contracts — Master Compliance oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  MasterComplianceChecklistSchema,
  MasterComplianceItemSchema,
  MasterComplianceSummarySchema,
  MasterComplianceTemplateSchema,
} from '../schemas/master-compliance';
import { PaginationQuerySchema, PaginatedResultSchema, IdParamSchema } from '../schemas/common';

const checklistProcedures = {
  list: oc
    .input(PaginationQuerySchema.merge(z.object({ status: z.string().optional() })))
    .output(PaginatedResultSchema(MasterComplianceChecklistSchema)),

  get: oc
    .input(IdParamSchema)
    .output(MasterComplianceChecklistSchema),

  create: oc
    .input(z.object({
      title: z.string(),
      bspName: z.string().optional(),
      bspTin: z.string().optional(),
      testingLocation: z.string().optional(),
      systemType: z.string().optional(),
      systemName: z.string().optional(),
      hostingType: z.string().optional(),
      versionBuild: z.string().optional(),
      testedEnv: z.string().optional(),
      testDate: z.string().optional(),
      releaseDate: z.string().optional(),
      testerName: z.string().optional(),
      testerSignature: z.string().optional(),
    }))
    .output(MasterComplianceChecklistSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      title: z.string().optional(),
      status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).optional(),
      bspName: z.string().optional(),
      bspTin: z.string().optional(),
      testingLocation: z.string().optional(),
      systemType: z.string().optional(),
      systemName: z.string().optional(),
      hostingType: z.string().optional(),
      versionBuild: z.string().optional(),
      testedEnv: z.string().optional(),
      testDate: z.string().optional(),
      releaseDate: z.string().optional(),
      testerName: z.string().optional(),
      testerSignature: z.string().optional(),
    }) })))
    .output(MasterComplianceChecklistSchema),

  delete: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

const itemProcedures = {
  list: oc
    .input(IdParamSchema)
    .output(z.array(MasterComplianceItemSchema)),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: z.object({
      status: z.enum(['PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE']).optional(),
      resultData: z.string().optional(),
      remarks: z.string().optional(),
    }) })))
    .output(MasterComplianceItemSchema),
};

export const masterComplianceContract = {
  ...checklistProcedures,
  ...itemProcedures,
  template: oc
    .input(z.object({}))
    .output(z.array(MasterComplianceTemplateSchema)),

  summary: oc
    .input(z.object({}))
    .output(MasterComplianceSummarySchema),
};

export type MasterComplianceContract = typeof masterComplianceContract;
