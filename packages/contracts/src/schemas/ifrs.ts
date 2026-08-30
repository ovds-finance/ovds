/**
 * @ovds/contracts — IFRS Schemas
 */
import { z } from 'zod';

export const IfrsStandardSchema = z.enum([
  'IFRS_15',
  'IFRS_16',
  'IFRS_9',
  'IFRS_10',
  'IFRS_12',
  'IFRS_13',
  'IFRS_18',
]);

export const IfrsTemplateSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  type: IfrsStandardSchema,
  name: z.string(),
  period: z.string().optional(),
  isIfrs: z.boolean().default(true),
  templateJson: z.string(),
  previewHtml: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConsolidatedStatementSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  statementType: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  currency: z.string().default('ETB'),
  data: z.record(z.string(), z.any()),
  status: z.enum(['DRAFT', 'REVIEWED', 'APPROVED', 'PUBLISHED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EclProvisionSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  stage: z.number().int().min(1).max(3),
  category: z.string(),
  grossCarryingAmount: z.number().nonnegative(),
  expectedCreditLoss: z.number().nonnegative(),
  provisionBalance: z.number().nonnegative(),
  asOfDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LeaseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  lessorName: z.string().optional(),
  leaseStartDate: z.string(),
  leaseEndDate: z.string(),
  monthlyPayment: z.number().nonnegative(),
  discountRate: z.number().nonnegative(),
  rouAsset: z.number().nonnegative(),
  leaseLiability: z.number().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const IfrsDashboardQuerySchema = z.object({
  standard: IfrsStandardSchema.optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export type IfrsStandard = z.infer<typeof IfrsStandardSchema>;
export type IfrsTemplate = z.infer<typeof IfrsTemplateSchema>;
export type ConsolidatedStatement = z.infer<typeof ConsolidatedStatementSchema>;
export type EclProvision = z.infer<typeof EclProvisionSchema>;
export type Lease = z.infer<typeof LeaseSchema>;
export type IfrsDashboardQuery = z.infer<typeof IfrsDashboardQuerySchema>;
