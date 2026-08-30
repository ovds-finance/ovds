/**
 * @ovds/contracts — Custom Fields Schemas
 *
 * Zod schemas for the Custom Fields system.
 * Supports TEXT, TEXTAREA, NUMBER, DATE, TIME, DATETIME,
 * SELECT, MULTISELECT, CHECKBOX, EMAIL, PHONE, URL field types
 * across all Ovds features.
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
    get CreateCustomFieldSchema () {
        return CreateCustomFieldSchema;
    },
    get CustomFieldFeatureSchema () {
        return CustomFieldFeatureSchema;
    },
    get CustomFieldSchema () {
        return CustomFieldSchema;
    },
    get CustomFieldTypeSchema () {
        return CustomFieldTypeSchema;
    },
    get CustomFieldValueSchema () {
        return CustomFieldValueSchema;
    },
    get CustomFieldValuesMapSchema () {
        return CustomFieldValuesMapSchema;
    },
    get CustomFieldWithValueSchema () {
        return CustomFieldWithValueSchema;
    },
    get ListCustomFieldsQuerySchema () {
        return ListCustomFieldsQuerySchema;
    },
    get SaveCustomFieldValuesSchema () {
        return SaveCustomFieldValuesSchema;
    },
    get UpdateCustomFieldSchema () {
        return UpdateCustomFieldSchema;
    }
});
const _zod = require("zod");
const _common = require("./common");
const CustomFieldTypeSchema = _zod.z.enum([
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'DATE',
    'TIME',
    'DATETIME',
    'SELECT',
    'MULTISELECT',
    'CHECKBOX',
    'TOGGLE',
    'EMAIL',
    'PHONE',
    'URL'
]);
const CustomFieldFeatureSchema = _zod.z.enum([
    'invoice',
    'customer',
    'item',
    'vendor',
    'account',
    'transfer',
    'bill',
    'purchase-order',
    'sales-order',
    'quotation',
    'deal',
    'expense-claim',
    'project',
    'project-task',
    'project-milestone',
    'project-timesheet',
    'employee',
    'department',
    'shift',
    'attendance',
    'leave',
    'payroll-record',
    'payroll-line',
    'inventory-item',
    'warehouse',
    'stock-transaction',
    'grn',
    'ticket',
    'manufacturing-order',
    'bom',
    'loan-request',
    'business-loan',
    'lease',
    'contract',
    'bank-account',
    'cost-center',
    'compliance-record',
    'ifrs-schedule',
    'fund-transfer',
    'payment',
    'revenue',
    'debit-note',
    'credit-note',
    'journal-entry',
    'ledger-entry',
    'customer-interaction',
    'customer-loyalty',
    'company',
    'user',
    'role',
    'setting',
    'notification',
    'websocket-session',
    'device',
    'iot-telemetry',
    'sync-queue',
    'audit-log',
    'release',
    'feature-flag',
    'module',
    'company-module'
]);
const CustomFieldSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    feature: CustomFieldFeatureSchema,
    label: _zod.z.string().min(1, 'Label is required'),
    type: CustomFieldTypeSchema,
    options: _zod.z.string().nullable().optional(),
    isRequired: _zod.z.boolean().default(false),
    sortOrder: _zod.z.number().int().default(0),
    isActive: _zod.z.boolean().default(true),
    placeholder: _zod.z.string().nullable().optional(),
    hint: _zod.z.string().nullable().optional(),
    defaultValue: _zod.z.string().nullable().optional(),
    width: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateCustomFieldSchema = CustomFieldSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).extend({
    companyId: _zod.z.string().optional()
});
const UpdateCustomFieldSchema = CreateCustomFieldSchema.partial();
const ListCustomFieldsQuerySchema = _common.PaginationQuerySchema.merge(_zod.z.object({
    companyId: _zod.z.string().optional(),
    feature: CustomFieldFeatureSchema.optional(),
    isActive: _zod.z.coerce.boolean().optional()
}));
const CustomFieldValueSchema = _zod.z.object({
    id: _zod.z.string(),
    customFieldId: _zod.z.string(),
    entityId: _zod.z.string(),
    value: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    // Optionally include the field definition
    customField: CustomFieldSchema.optional()
});
const CustomFieldValuesMapSchema = _zod.z.record(_zod.z.string(), _zod.z.string().nullable());
const SaveCustomFieldValuesSchema = _zod.z.object({
    entityId: _zod.z.string(),
    feature: CustomFieldFeatureSchema,
    companyId: _zod.z.string().optional(),
    values: CustomFieldValuesMapSchema
});
const CustomFieldWithValueSchema = CustomFieldSchema.extend({
    value: _zod.z.string().nullable().optional(),
    valueId: _zod.z.string().nullable().optional()
});
