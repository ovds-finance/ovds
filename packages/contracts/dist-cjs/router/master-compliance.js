/**
 * @ovds/contracts — Master Compliance oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "masterComplianceContract", {
    enumerable: true,
    get: function() {
        return masterComplianceContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _mastercompliance = require("../schemas/master-compliance");
const _common = require("../schemas/common");
const checklistProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_mastercompliance.MasterComplianceChecklistSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_mastercompliance.MasterComplianceChecklistSchema),
    create: _contract.oc.input(_zod.z.object({
        title: _zod.z.string(),
        bspName: _zod.z.string().optional(),
        bspTin: _zod.z.string().optional(),
        testingLocation: _zod.z.string().optional(),
        systemType: _zod.z.string().optional(),
        systemName: _zod.z.string().optional(),
        hostingType: _zod.z.string().optional(),
        versionBuild: _zod.z.string().optional(),
        testedEnv: _zod.z.string().optional(),
        testDate: _zod.z.string().optional(),
        releaseDate: _zod.z.string().optional(),
        testerName: _zod.z.string().optional(),
        testerSignature: _zod.z.string().optional()
    })).output(_mastercompliance.MasterComplianceChecklistSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            title: _zod.z.string().optional(),
            status: _zod.z.enum([
                'DRAFT',
                'IN_PROGRESS',
                'COMPLETED'
            ]).optional(),
            bspName: _zod.z.string().optional(),
            bspTin: _zod.z.string().optional(),
            testingLocation: _zod.z.string().optional(),
            systemType: _zod.z.string().optional(),
            systemName: _zod.z.string().optional(),
            hostingType: _zod.z.string().optional(),
            versionBuild: _zod.z.string().optional(),
            testedEnv: _zod.z.string().optional(),
            testDate: _zod.z.string().optional(),
            releaseDate: _zod.z.string().optional(),
            testerName: _zod.z.string().optional(),
            testerSignature: _zod.z.string().optional()
        })
    }))).output(_mastercompliance.MasterComplianceChecklistSchema),
    delete: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
const itemProcedures = {
    list: _contract.oc.input(_common.IdParamSchema).output(_zod.z.array(_mastercompliance.MasterComplianceItemSchema)),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            status: _zod.z.enum([
                'PENDING',
                'PASS',
                'FAIL',
                'NOT_APPLICABLE'
            ]).optional(),
            resultData: _zod.z.string().optional(),
            remarks: _zod.z.string().optional()
        })
    }))).output(_mastercompliance.MasterComplianceItemSchema)
};
const masterComplianceContract = {
    ...checklistProcedures,
    ...itemProcedures,
    template: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_mastercompliance.MasterComplianceTemplateSchema)),
    summary: _contract.oc.input(_zod.z.object({})).output(_mastercompliance.MasterComplianceSummarySchema)
};
