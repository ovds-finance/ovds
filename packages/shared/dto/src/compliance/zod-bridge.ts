/**
 * @ovds/dto/compliance/zod-bridge — Zod schemas for the compliance domain
 *
 * Provides Zod versions of the compliance DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── Compliance Framework ──────────────────────────────────────────────────────

export const ComplianceFrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  isActive: z.boolean().default(true),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateComplianceFrameworkSchema = ComplianceFrameworkSchema.omit({
  id: true, createdAt: true, updatedAt: true,
});

// ── Compliance Control ────────────────────────────────────────────────────────

export const ControlTypeSchema = z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE']);
export const ControlStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'UNDER_REVIEW']);

export const ComplianceControlSchema = z.object({
  id: z.string(),
  frameworkId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  controlType: ControlTypeSchema,
  status: ControlStatusSchema.default('ACTIVE'),
  frequency: z.string().optional(),
  owner: z.string().optional(),
  evidenceRequired: z.boolean().default(false),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateComplianceControlSchema = ComplianceControlSchema.omit({
  id: true, createdAt: true, updatedAt: true,
});

// ── Compliance Risk ───────────────────────────────────────────────────────────

export const RiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const RiskStatusSchema = z.enum(['OPEN', 'MITIGATING', 'CLOSED', 'ACCEPTED']);

export const ComplianceRiskSchema = z.object({
  id: z.string(),
  controlId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  riskLevel: RiskLevelSchema,
  status: RiskStatusSchema.default('OPEN'),
  mitigationPlan: z.string().optional(),
  residualRisk: RiskLevelSchema.optional(),
  owner: z.string().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateComplianceRiskSchema = ComplianceRiskSchema.omit({
  id: true, createdAt: true, updatedAt: true,
});

// ── Compliance Incident ───────────────────────────────────────────────────────

export const IncidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const IncidentStatusSchema = z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']);

export const ComplianceIncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: IncidentSeveritySchema,
  status: IncidentStatusSchema.default('REPORTED'),
  reportedBy: z.string(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
  companyId: z.string().nullable().optional(),
  reportedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateComplianceIncidentSchema = ComplianceIncidentSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  reportedAt: true, resolvedAt: true,
});

// ── Audit Trail ───────────────────────────────────────────────────────────────

export const AuditActionSchema = z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'IMPORT']);

export const ComplianceAuditTrailSchema = z.object({
  id: z.string(),
  action: AuditActionSchema,
  entityType: z.string(),
  entityId: z.string(),
  userId: z.string(),
  userName: z.string(),
  changes: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  companyId: z.string().nullable().optional(),
  timestamp: z.coerce.date(),
});
