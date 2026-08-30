/**
 * @ovds/contracts — Master Compliance Schemas
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
    get MasterComplianceChecklistSchema () {
        return MasterComplianceChecklistSchema;
    },
    get MasterComplianceItemSchema () {
        return MasterComplianceItemSchema;
    },
    get MasterComplianceSummarySchema () {
        return MasterComplianceSummarySchema;
    },
    get MasterComplianceTemplateSchema () {
        return MasterComplianceTemplateSchema;
    }
});
const _zod = require("zod");
const MasterComplianceChecklistSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string(),
    title: _zod.z.string(),
    status: _zod.z.enum([
        'DRAFT',
        'IN_PROGRESS',
        'COMPLETED'
    ]),
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
    testerSignature: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const MasterComplianceItemSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    checklistId: _zod.z.string().uuid(),
    sectionKey: _zod.z.string(),
    itemKey: _zod.z.string(),
    itemText: _zod.z.string(),
    status: _zod.z.enum([
        'PENDING',
        'PASS',
        'FAIL',
        'NOT_APPLICABLE'
    ]),
    resultData: _zod.z.string().optional(),
    remarks: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const MasterComplianceSummarySchema = _zod.z.object({
    totalChecklists: _zod.z.number().int(),
    draftChecklists: _zod.z.number().int(),
    inProgressChecklists: _zod.z.number().int(),
    completedChecklists: _zod.z.number().int(),
    totalItems: _zod.z.number().int(),
    pendingItems: _zod.z.number().int(),
    passItems: _zod.z.number().int(),
    failItems: _zod.z.number().int(),
    complianceScore: _zod.z.number().int(),
    itemsBySection: _zod.z.array(_zod.z.object({
        sectionKey: _zod.z.string(),
        count: _zod.z.number().int()
    }))
});
const MasterComplianceTemplateSchema = _zod.z.object({
    id: _zod.z.string(),
    sectionKey: _zod.z.string(),
    itemKey: _zod.z.string(),
    itemText: _zod.z.string()
});
