/**
 * @ovds/dto/crm/zod-bridge — Zod schemas for the CRM domain
 *
 * Provides Zod versions of the CRM DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── CRM Core ──────────────────────────────────────────────────────────────────

export const LeadSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateLeadSchema = LeadSchema.omit({ id: true, createdAt: true, updatedAt: true });

export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().nonnegative(),
  currencyCode: z.string().default('ETB'),
  stage: z.string(),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: z.string().optional(),
  customerId: z.string().uuid().optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateOpportunitySchema = OpportunitySchema.omit({ id: true, createdAt: true, updatedAt: true });

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['call', 'email', 'meeting', 'task', 'note']),
  subject: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  assignedTo: z.string().optional(),
  relatedId: z.string().uuid().optional(),
  createdAt: z.string(),
});

export const CreateActivitySchema = ActivitySchema.omit({ id: true, createdAt: true });

export const PipelineStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int(),
  color: z.string().optional(),
});

export const CreatePipelineStageSchema = PipelineStageSchema.omit({ id: true });
