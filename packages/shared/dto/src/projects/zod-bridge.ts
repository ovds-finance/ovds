/**
 * @ovds/dto/projects/zod-bridge — Zod schemas for the projects domain
 *
 * Provides Zod versions of the projects DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── Project Status ────────────────────────────────────────────────────────────

export const ProjectStatusSchema = z.enum([
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]);

// ── Project Schemas ──────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  description: z.string().optional(),
  status: ProjectStatusSchema,
  budget: z.number().nonnegative().optional(),
  spent: z.number().nonnegative().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  manager: z.string().max(200).optional(),
  teamSize: z.number().int().min(1).optional(),
  companyId: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateProjectSchema = z.object({
  name: z.string().max(200),
  description: z.string().optional(),
  status: ProjectStatusSchema.optional(),
  budget: z.number().nonnegative().optional(),
  spent: z.number().nonnegative().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  manager: z.string().max(200).optional(),
  teamSize: z.number().int().min(1).optional(),
  companyId: z.string().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  companyId: z.string().optional(),
  status: ProjectStatusSchema.optional(),
});

// ── Task Schemas ──────────────────────────────────────────────────────────────

export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateTaskSchema = z.object({
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

// ── Activity Schemas ──────────────────────────────────────────────────────────

export const ProjectActivityTypeSchema = z.enum([
  'TASK_CREATED',
  'TASK_UPDATED',
  'TIMER_STARTED',
  'TIMER_STOPPED',
  'TIMESHEET_CREATED',
  'COMMENT_ADDED',
  'FILE_ATTACHED',
  'FINANCIAL_LINKED',
  'MILESTONE_UPDATED',
  'STATUS_CHANGED',
  'BILLING_UPDATED',
]);

export const ProjectActivitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  activityType: ProjectActivityTypeSchema,
  description: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.coerce.date(),
});

export const CreateProjectActivitySchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  activityType: ProjectActivityTypeSchema,
  description: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ── Comment Schemas ───────────────────────────────────────────────────────────

export const ProjectCommentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  taskId: z.string().optional(),
  content: z.string(),
  userId: z.string(),
  userName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateProjectCommentSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  content: z.string().min(1),
});

// ── Attachment Schemas ────────────────────────────────────────────────────────

export const ProjectAttachmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  taskId: z.string().optional(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string().optional(),
  fileSize: z.number().nonnegative().optional(),
  uploadedBy: z.string(),
  createdAt: z.coerce.date(),
});

export const CreateProjectAttachmentSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string().optional(),
  fileSize: z.number().nonnegative().optional(),
});

// ── Timer Schemas ─────────────────────────────────────────────────────────────

export const ProjectTimerSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  taskId: z.string().optional(),
  userId: z.string(),
  startedAt: z.coerce.date(),
  stoppedAt: z.coerce.date().nullable().optional(),
  durationMinutes: z.number().int().nonnegative().default(0),
  description: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const CreateProjectTimerSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  description: z.string().optional(),
});

export const StopProjectTimerSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
});

// ── Financial Link Schemas ────────────────────────────────────────────────────

export const ProjectFinancialLinkSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  invoiceId: z.string().optional(),
  billId: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number(),
  currencyCode: z.string().default('ETB'),
  linkType: z.enum(['INVOICE', 'BILL', 'TRANSFER', 'EXPENSE']),
  createdAt: z.coerce.date(),
});

export const CreateProjectFinancialLinkSchema = z.object({
  projectId: z.string(),
  invoiceId: z.string().optional(),
  billId: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number(),
  currencyCode: z.string().default('ETB'),
  linkType: z.enum(['INVOICE', 'BILL', 'TRANSFER', 'EXPENSE']),
});

// ── Profitability Schemas ─────────────────────────────────────────────────────

export const ProjectProfitabilitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  period: z.string(),
  revenue: z.number(),
  cost: z.number(),
  profit: z.number(),
  marginPercentage: z.number(),
  currencyCode: z.string().default('ETB'),
  calculatedAt: z.coerce.date(),
});
