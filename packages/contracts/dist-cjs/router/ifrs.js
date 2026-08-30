/**
 * @ovds/contracts — IFRS oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ifrsContract", {
    enumerable: true,
    get: function() {
        return ifrsContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _ifrs = require("../schemas/ifrs");
const _common = require("../schemas/common");
const ifrsProcedures = {
    templates: {
        list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_ifrs.IfrsTemplateSchema)),
        get: _contract.oc.input(_common.IdParamSchema).output(_ifrs.IfrsTemplateSchema.optional()),
        create: _contract.oc.input(_ifrs.IfrsTemplateSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        })).output(_ifrs.IfrsTemplateSchema),
        update: _contract.oc.input(_common.IdParamSchema.merge(_ifrs.IfrsTemplateSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        }))).output(_ifrs.IfrsTemplateSchema),
        delete: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
            success: _zod.z.boolean()
        }))
    },
    consolidation: {
        list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_ifrs.ConsolidatedStatementSchema)),
        create: _contract.oc.input(_ifrs.ConsolidatedStatementSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        })).output(_ifrs.ConsolidatedStatementSchema),
        update: _contract.oc.input(_common.IdParamSchema.merge(_ifrs.ConsolidatedStatementSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        }))).output(_ifrs.ConsolidatedStatementSchema)
    },
    ecl: {
        list: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().uuid()
        }).merge(_common.PaginationQuerySchema)).output((0, _common.PaginatedResultSchema)(_ifrs.EclProvisionSchema)),
        create: _contract.oc.input(_ifrs.EclProvisionSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        })).output(_ifrs.EclProvisionSchema)
    },
    leases: {
        list: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().uuid()
        }).merge(_common.PaginationQuerySchema)).output((0, _common.PaginatedResultSchema)(_ifrs.LeaseSchema)),
        create: _contract.oc.input(_ifrs.LeaseSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        })).output(_ifrs.LeaseSchema)
    },
    dashboard: _contract.oc.input(_ifrs.IfrsDashboardQuerySchema).output(_zod.z.object({
        templates: _zod.z.array(_ifrs.IfrsTemplateSchema),
        statements: _zod.z.array(_ifrs.ConsolidatedStatementSchema),
        ecl: _zod.z.array(_ifrs.EclProvisionSchema),
        leases: _zod.z.array(_ifrs.LeaseSchema)
    }))
};
const ifrsContract = _contract.oc.router({
    templates: _contract.oc.router(ifrsProcedures.templates),
    consolidation: _contract.oc.router(ifrsProcedures.consolidation),
    ecl: _contract.oc.router(ifrsProcedures.ecl),
    leases: _contract.oc.router(ifrsProcedures.leases),
    dashboard: ifrsProcedures.dashboard
});
