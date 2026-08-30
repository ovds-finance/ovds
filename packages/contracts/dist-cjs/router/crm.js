/**
 * @ovds/contracts — CRM oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "crmContract", {
    enumerable: true,
    get: function() {
        return crmContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _crm = require("../schemas/crm");
const _common = require("../schemas/common");
const leadProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional(),
        assignedTo: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_crm.LeadSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_crm.LeadSchema),
    create: _contract.oc.input(_zod.z.object({
        firstName: _zod.z.string(),
        lastName: _zod.z.string(),
        email: _zod.z.string().email().optional(),
        phone: _zod.z.string().optional(),
        company: _zod.z.string().optional(),
        source: _zod.z.string().optional(),
        status: _zod.z.enum([
            'new',
            'contacted',
            'qualified',
            'unqualified',
            'converted'
        ]),
        assignedTo: _zod.z.string().optional(),
        notes: _zod.z.string().optional()
    })).output(_crm.LeadSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            firstName: _zod.z.string().optional(),
            lastName: _zod.z.string().optional(),
            email: _zod.z.string().email().optional(),
            phone: _zod.z.string().optional(),
            company: _zod.z.string().optional(),
            source: _zod.z.string().optional(),
            status: _zod.z.enum([
                'new',
                'contacted',
                'qualified',
                'unqualified',
                'converted'
            ]).optional(),
            assignedTo: _zod.z.string().optional(),
            notes: _zod.z.string().optional()
        })
    }))).output(_crm.LeadSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    convert: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        customerId: _zod.z.string().uuid()
    }))).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
const opportunityProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        stage: _zod.z.string().optional(),
        assignedTo: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_crm.OpportunitySchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_crm.OpportunitySchema),
    create: _contract.oc.input(_zod.z.object({
        title: _zod.z.string(),
        description: _zod.z.string().optional(),
        value: _zod.z.number().nonnegative(),
        currencyCode: _zod.z.string().default('ETB'),
        stage: _zod.z.string(),
        probability: _zod.z.number().int().min(0).max(100).default(0),
        expectedCloseDate: _zod.z.string().optional(),
        customerId: _zod.z.string().uuid().optional(),
        assignedTo: _zod.z.string().optional()
    })).output(_crm.OpportunitySchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            title: _zod.z.string().optional(),
            description: _zod.z.string().optional(),
            value: _zod.z.number().nonnegative().optional(),
            currencyCode: _zod.z.string().optional(),
            stage: _zod.z.string().optional(),
            probability: _zod.z.number().int().min(0).max(100).optional(),
            expectedCloseDate: _zod.z.string().optional(),
            customerId: _zod.z.string().uuid().optional(),
            assignedTo: _zod.z.string().optional()
        })
    }))).output(_crm.OpportunitySchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    convertToInvoice: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean(),
        invoiceId: _zod.z.string().uuid().optional()
    }))
};
const activityProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        relatedId: _zod.z.string().uuid().optional(),
        type: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_crm.ActivitySchema)),
    create: _contract.oc.input(_zod.z.object({
        type: _zod.z.enum([
            'call',
            'email',
            'meeting',
            'task',
            'note'
        ]),
        subject: _zod.z.string(),
        description: _zod.z.string().optional(),
        dueDate: _zod.z.string().optional(),
        assignedTo: _zod.z.string().optional(),
        relatedId: _zod.z.string().uuid().optional()
    })).output(_crm.ActivitySchema),
    complete: _contract.oc.input(_common.IdParamSchema).output(_crm.ActivitySchema)
};
const pipelineProcedures = {
    stages: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_crm.PipelineStageSchema)),
    move: _contract.oc.input(_zod.z.object({
        opportunityId: _zod.z.string().uuid(),
        stageId: _zod.z.string()
    })).output(_crm.OpportunitySchema)
};
const crmContract = _contract.oc.router({
    leads: _contract.oc.router(leadProcedures),
    opportunities: _contract.oc.router(opportunityProcedures),
    activities: _contract.oc.router(activityProcedures),
    pipeline: _contract.oc.router(pipelineProcedures)
});
