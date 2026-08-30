/**
 * @ovds/contracts — Master Compliance Schemas
 */
import { z } from 'zod';

export const MasterComplianceChecklistSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string(),
  title: z.string(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']),
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
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MasterComplianceItemSchema = z.object({
  id: z.string().uuid(),
  checklistId: z.string().uuid(),
  sectionKey: z.string(),
  itemKey: z.string(),
  itemText: z.string(),
  status: z.enum(['PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE']),
  resultData: z.string().optional(),
  remarks: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MasterComplianceSummarySchema = z.object({
  totalChecklists: z.number().int(),
  draftChecklists: z.number().int(),
  inProgressChecklists: z.number().int(),
  completedChecklists: z.number().int(),
  totalItems: z.number().int(),
  pendingItems: z.number().int(),
  passItems: z.number().int(),
  failItems: z.number().int(),
  complianceScore: z.number().int(),
  itemsBySection: z.array(z.object({ sectionKey: z.string(), count: z.number().int() })),
});

export const MasterComplianceTemplateSchema = z.object({
  id: z.string(),
  sectionKey: z.string(),
  itemKey: z.string(),
  itemText: z.string(),
});
