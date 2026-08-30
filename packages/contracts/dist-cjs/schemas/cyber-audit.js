/**
 * @ovds/contracts — Cyber Audit Schemas
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CyberAuditChecklistTemplateSchema () {
        return CyberAuditChecklistTemplateSchema;
    },
    get CyberAuditFindingSchema () {
        return CyberAuditFindingSchema;
    },
    get CyberAuditMetricSchema () {
        return CyberAuditMetricSchema;
    },
    get CyberAuditSchema () {
        return CyberAuditSchema;
    },
    get CyberAuditSummarySchema () {
        return CyberAuditSummarySchema;
    }
});
const _zod = require("zod");
const CyberAuditSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string(),
    title: _zod.z.string(),
    description: _zod.z.string().optional(),
    status: _zod.z.enum([
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'FAILED'
    ]),
    conductedBy: _zod.z.string().optional(),
    startedAt: _zod.z.string().optional(),
    completedAt: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const CyberAuditMetricSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    auditId: _zod.z.string().uuid(),
    areaNumber: _zod.z.string(),
    areaName: _zod.z.string(),
    metricNumber: _zod.z.string(),
    metricName: _zod.z.string(),
    requirement: _zod.z.string(),
    explanation: _zod.z.string().optional(),
    status: _zod.z.enum([
        'PENDING',
        'COMPLIANT',
        'NON_COMPLIANT',
        'NOT_APPLICABLE',
        'PARTIAL'
    ]),
    evidence: _zod.z.string().optional(),
    remarks: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const CyberAuditFindingSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    auditId: _zod.z.string().uuid(),
    metricId: _zod.z.string().uuid().optional(),
    severity: _zod.z.enum([
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW',
        'INFO'
    ]),
    title: _zod.z.string(),
    description: _zod.z.string(),
    remediation: _zod.z.string().optional(),
    status: _zod.z.enum([
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'ACCEPTED_RISK'
    ]),
    assignedTo: _zod.z.string().optional(),
    resolvedAt: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const CyberAuditSummarySchema = _zod.z.object({
    totalAudits: _zod.z.number().int(),
    activeAudits: _zod.z.number().int(),
    totalMetrics: _zod.z.number().int(),
    compliantMetrics: _zod.z.number().int(),
    nonCompliantMetrics: _zod.z.number().int(),
    totalFindings: _zod.z.number().int(),
    openFindings: _zod.z.number().int(),
    criticalFindings: _zod.z.number().int(),
    complianceScore: _zod.z.number().int(),
    findingsBySeverity: _zod.z.array(_zod.z.object({
        severity: _zod.z.string(),
        count: _zod.z.number().int()
    })),
    findingsByArea: _zod.z.array(_zod.z.object({
        areaNumber: _zod.z.string(),
        areaName: _zod.z.string(),
        count: _zod.z.number().int()
    }))
});
const CyberAuditChecklistTemplateSchema = _zod.z.object({
    id: _zod.z.string(),
    areaNumber: _zod.z.string(),
    areaName: _zod.z.string(),
    metricNumber: _zod.z.string(),
    metricName: _zod.z.string(),
    requirement: _zod.z.string(),
    explanation: _zod.z.string()
});
