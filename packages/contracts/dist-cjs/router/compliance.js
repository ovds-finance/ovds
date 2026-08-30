/**
 * @ovds/contracts — Compliance oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "complianceContract", {
    enumerable: true,
    get: function() {
        return complianceContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _compliance = require("../schemas/compliance");
const _common = require("../schemas/common");
const checklistProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_compliance.ComplianceChecklistSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_compliance.ComplianceChecklistSchema),
    create: _contract.oc.input(_zod.z.object({
        name: _zod.z.string(),
        category: _zod.z.string(),
        status: _zod.z.enum([
            'pending',
            'in_progress',
            'completed',
            'failed'
        ]),
        dueDate: _zod.z.string().optional(),
        assignee: _zod.z.string().optional(),
        notes: _zod.z.string().optional()
    })).output(_compliance.ComplianceChecklistSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            name: _zod.z.string().optional(),
            category: _zod.z.string().optional(),
            status: _zod.z.enum([
                'pending',
                'in_progress',
                'completed',
                'failed'
            ]).optional(),
            dueDate: _zod.z.string().optional(),
            completedAt: _zod.z.string().optional(),
            assignee: _zod.z.string().optional(),
            notes: _zod.z.string().optional()
        })
    }))).output(_compliance.ComplianceChecklistSchema)
};
const sourceSystemProcedures = {
    list: _contract.oc.input(_zod.z.object({
        tin: _zod.z.string().optional()
    })).output(_zod.z.array(_compliance.EimsSourceSystemSchema)),
    register: _contract.oc.input(_zod.z.object({
        systemNumber: _zod.z.string(),
        systemType: _zod.z.enum([
            'ERP',
            'POS',
            'MANUAL'
        ]),
        enterpriseId: _zod.z.string().optional(),
        establishmentId: _zod.z.string().optional(),
        clientId: _zod.z.string(),
        clientSecret: _zod.z.string(),
        apiKey: _zod.z.string().optional(),
        callbackUrl: _zod.z.string().optional()
    })).output(_compliance.EimsSourceSystemSchema),
    approve: _contract.oc.input(_common.IdParamSchema).output(_compliance.EimsSourceSystemSchema),
    updateCredentials: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            clientId: _zod.z.string().optional(),
            clientSecret: _zod.z.string().optional(),
            apiKey: _zod.z.string().optional()
        })
    }))).output(_compliance.EimsSourceSystemSchema)
};
const certificateProcedures = {
    list: _contract.oc.input(_zod.z.object({
        sourceSystemId: _zod.z.string().uuid().optional()
    })).output(_zod.z.array(_compliance.EimsCertificateSchema)),
    generateCsr: _contract.oc.input(_zod.z.object({
        tin: _zod.z.string(),
        systemNumber: _zod.z.string(),
        organizationName: _zod.z.string(),
        email: _zod.z.string().email(),
        organizationalUnitName: _zod.z.string().optional(),
        sourceSystemId: _zod.z.string().uuid().optional()
    })).output(_compliance.EimsCertificateSchema),
    submitCsr: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        csrPem: _zod.z.string()
    }))).output(_compliance.EimsCertificateSchema),
    install: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        certificatePem: _zod.z.string()
    }))).output(_compliance.EimsCertificateSchema)
};
const registrationProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional(),
        invoiceId: _zod.z.string().uuid().optional()
    }))).output((0, _common.PaginatedResultSchema)(_compliance.EimsRegistrationSchema)),
    register: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean(),
        irn: _zod.z.string().optional()
    })),
    cancel: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        reasonCode: _zod.z.string(),
        remark: _zod.z.string().optional()
    }))).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    verify: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        status: _zod.z.string(),
        irn: _zod.z.string().optional()
    }))
};
const bulkProcedures = {
    register: _contract.oc.input(_zod.z.object({
        invoiceIds: _zod.z.array(_zod.z.string().uuid())
    })).output(_zod.z.object({
        conversationId: _zod.z.string()
    })),
    cancel: _contract.oc.input(_zod.z.object({
        items: _zod.z.array(_zod.z.object({
            invoiceId: _zod.z.string().uuid(),
            reasonCode: _zod.z.string(),
            remark: _zod.z.string().optional()
        }))
    })).output(_zod.z.object({
        conversationId: _zod.z.string()
    })),
    jobs: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_compliance.EimsBulkJobSchema))
};
const taxReportProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_compliance.TaxReportSchema)),
    generate: _contract.oc.input(_zod.z.object({
        type: _zod.z.string(),
        period: _zod.z.string()
    })).output(_compliance.TaxReportSchema)
};
const complianceContract = _contract.oc.router({
    checklists: _contract.oc.router(checklistProcedures),
    sourceSystems: _contract.oc.router(sourceSystemProcedures),
    certificates: _contract.oc.router(certificateProcedures),
    registrations: _contract.oc.router(registrationProcedures),
    bulk: _contract.oc.router(bulkProcedures),
    taxReports: _contract.oc.router(taxReportProcedures)
});
