/**
 * @ovds/contracts — Custom Fields oRPC Router Contract
 *
 * Manages per-company custom field definitions and their values
 * across any entity (invoice, customer, item, vendor, account, transfer).
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "customFieldsContract", {
    enumerable: true,
    get: function() {
        return customFieldsContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _customfields = require("../schemas/custom-fields");
const _common = require("../schemas/common");
// ── Field definition procedures ───────────────────────────────────────────────
const fieldProcedures = {
    /** List all field definitions for a company, optionally filtered by feature */ list: _contract.oc.input(_customfields.ListCustomFieldsQuerySchema).output((0, _common.PaginatedResultSchema)(_customfields.CustomFieldSchema)),
    /** Get a single field definition */ get: _contract.oc.input(_common.IdParamSchema).output(_customfields.CustomFieldSchema),
    /** Create a new field definition */ create: _contract.oc.input(_customfields.CreateCustomFieldSchema).output(_customfields.CustomFieldSchema),
    /** Update a field definition (label, options, hint, etc.) */ update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _customfields.UpdateCustomFieldSchema
    }))).output(_customfields.CustomFieldSchema),
    /** Delete a field definition (also deletes all values) */ remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    /** Reorder fields for a feature */ reorder: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        feature: _customfields.CustomFieldFeatureSchema,
        order: _zod.z.array(_zod.z.object({
            id: _zod.z.string(),
            sortOrder: _zod.z.number().int()
        }))
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Field value procedures ────────────────────────────────────────────────────
const valueProcedures = {
    /** Get all field definitions + current values for an entity */ getForEntity: _contract.oc.input(_zod.z.object({
        entityId: _zod.z.string(),
        feature: _customfields.CustomFieldFeatureSchema,
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_customfields.CustomFieldWithValueSchema)),
    /** Save (upsert) values for an entity — pass the full map of fieldId → value */ save: _contract.oc.input(_customfields.SaveCustomFieldValuesSchema).output(_zod.z.object({
        saved: _zod.z.number()
    }))
};
const customFieldsContract = _contract.oc.router({
    fields: _contract.oc.router(fieldProcedures),
    values: _contract.oc.router(valueProcedures)
});
