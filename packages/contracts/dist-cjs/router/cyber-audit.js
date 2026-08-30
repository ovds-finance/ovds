/**
 * @ovds/contracts — Cyber Audit oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cyberAuditContract", {
    enumerable: true,
    get: function() {
        return cyberAuditContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _cyberaudit = require("../schemas/cyber-audit");
const _common = require("../schemas/common");
const auditProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_cyberaudit.CyberAuditSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_cyberaudit.CyberAuditSchema),
    create: _contract.oc.input(_zod.z.object({
        title: _zod.z.string(),
        description: _zod.z.string().optional(),
        conductedBy: _zod.z.string().optional()
    })).output(_cyberaudit.CyberAuditSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            title: _zod.z.string().optional(),
            description: _zod.z.string().optional(),
            status: _zod.z.enum([
                'SCHEDULED',
                'IN_PROGRESS',
                'COMPLETED',
                'FAILED'
            ]).optional(),
            conductedBy: _zod.z.string().optional()
        })
    }))).output(_cyberaudit.CyberAuditSchema),
    delete: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    start: _contract.oc.input(_common.IdParamSchema).output(_cyberaudit.CyberAuditSchema),
    complete: _contract.oc.input(_common.IdParamSchema).output(_cyberaudit.CyberAuditSchema)
};
const metricProcedures = {
    list: _contract.oc.input(_common.IdParamSchema).output(_zod.z.array(_cyberaudit.CyberAuditMetricSchema)),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            status: _zod.z.enum([
                'PENDING',
                'COMPLIANT',
                'NON_COMPLIANT',
                'NOT_APPLICABLE',
                'PARTIAL'
            ]).optional(),
            evidence: _zod.z.string().optional(),
            remarks: _zod.z.string().optional()
        })
    }))).output(_cyberaudit.CyberAuditMetricSchema)
};
const findingProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        severity: _zod.z.string().optional(),
        status: _zod.z.string().optional(),
        auditId: _zod.z.string().uuid().optional()
    }))).output((0, _common.PaginatedResultSchema)(_cyberaudit.CyberAuditFindingSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_cyberaudit.CyberAuditFindingSchema),
    create: _contract.oc.input(_zod.z.object({
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
        assignedTo: _zod.z.string().optional()
    })).output(_cyberaudit.CyberAuditFindingSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            severity: _zod.z.enum([
                'CRITICAL',
                'HIGH',
                'MEDIUM',
                'LOW',
                'INFO'
            ]).optional(),
            title: _zod.z.string().optional(),
            description: _zod.z.string().optional(),
            remediation: _zod.z.string().optional(),
            status: _zod.z.enum([
                'OPEN',
                'IN_PROGRESS',
                'RESOLVED',
                'ACCEPTED_RISK'
            ]).optional(),
            assignedTo: _zod.z.string().optional()
        })
    }))).output(_cyberaudit.CyberAuditFindingSchema),
    delete: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
const cyberAuditContract = _contract.oc.router({
    audits: _contract.oc.router(auditProcedures),
    metrics: _contract.oc.router(metricProcedures),
    findings: _contract.oc.router(findingProcedures),
    checklist: _contract.oc.router({
        template: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_cyberaudit.CyberAuditChecklistTemplateSchema))
    }),
    summary: _contract.oc.input(_zod.z.object({})).output(_cyberaudit.CyberAuditSummarySchema)
});
