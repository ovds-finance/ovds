/**
 * @ovds/contracts — Cyber Audit Schemas
 */
import { z } from 'zod';

export const CyberAuditSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  conductedBy: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CyberAuditMetricSchema = z.object({
  id: z.string().uuid(),
  auditId: z.string().uuid(),
  areaNumber: z.string(),
  areaName: z.string(),
  metricNumber: z.string(),
  metricName: z.string(),
  requirement: z.string(),
  explanation: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE', 'PARTIAL']),
  evidence: z.string().optional(),
  remarks: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CyberAuditFindingSchema = z.object({
  id: z.string().uuid(),
  auditId: z.string().uuid(),
  metricId: z.string().uuid().optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  title: z.string(),
  description: z.string(),
  remediation: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK']),
  assignedTo: z.string().optional(),
  resolvedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CyberAuditSummarySchema = z.object({
  totalAudits: z.number().int(),
  activeAudits: z.number().int(),
  totalMetrics: z.number().int(),
  compliantMetrics: z.number().int(),
  nonCompliantMetrics: z.number().int(),
  totalFindings: z.number().int(),
  openFindings: z.number().int(),
  criticalFindings: z.number().int(),
  complianceScore: z.number().int(),
  findingsBySeverity: z.array(z.object({ severity: z.string(), count: z.number().int() })),
  findingsByArea: z.array(z.object({ areaNumber: z.string(), areaName: z.string(), count: z.number().int() })),
});

export const CyberAuditChecklistTemplateSchema = z.object({
  id: z.string(),
  areaNumber: z.string(),
  areaName: z.string(),
  metricNumber: z.string(),
  metricName: z.string(),
  requirement: z.string(),
  explanation: z.string(),
});
