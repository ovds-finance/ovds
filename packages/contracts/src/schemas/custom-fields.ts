/**
 * @ovds/contracts — Custom Fields Schemas
 *
 * Zod schemas for the Custom Fields system.
 * Supports TEXT, TEXTAREA, NUMBER, DATE, TIME, DATETIME,
 * SELECT, MULTISELECT, CHECKBOX, EMAIL, PHONE, URL field types
 * across all Ovds features.
 */
import { z } from 'zod';
import { PaginationQuerySchema } from './common';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const CustomFieldTypeSchema = z.enum([
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
  'URL',
]);
export type CustomFieldType = z.infer<typeof CustomFieldTypeSchema>;

export const CustomFieldFeatureSchema = z.enum([
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
  'company-module',
]);
export type CustomFieldFeature = z.infer<typeof CustomFieldFeatureSchema>;

// ── Custom Field definition ───────────────────────────────────────────────────

export const CustomFieldSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable().optional(),
  feature: CustomFieldFeatureSchema,
  label: z.string().min(1, 'Label is required'),
  type: CustomFieldTypeSchema,
  options: z.string().nullable().optional(), // JSON array string for SELECT/MULTISELECT
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  placeholder: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
  defaultValue: z.string().nullable().optional(),
  width: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

export const CreateCustomFieldSchema = CustomFieldSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});
export type CreateCustomField = z.infer<typeof CreateCustomFieldSchema>;

export const UpdateCustomFieldSchema = CreateCustomFieldSchema.partial();
export type UpdateCustomField = z.infer<typeof UpdateCustomFieldSchema>;

export const ListCustomFieldsQuerySchema = PaginationQuerySchema.merge(
  z.object({
    companyId: z.string().optional(),
    feature: CustomFieldFeatureSchema.optional(),
    isActive: z.coerce.boolean().optional(),
  }),
);
export type ListCustomFieldsQuery = z.infer<typeof ListCustomFieldsQuerySchema>;

// ── Custom Field Value ────────────────────────────────────────────────────────

export const CustomFieldValueSchema = z.object({
  id: z.string(),
  customFieldId: z.string(),
  entityId: z.string(),
  value: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // Optionally include the field definition
  customField: CustomFieldSchema.optional(),
});
export type CustomFieldValue = z.infer<typeof CustomFieldValueSchema>;

/** One entry per field: fieldId → value */
export const CustomFieldValuesMapSchema = z.record(z.string(), z.string().nullable());
export type CustomFieldValuesMap = z.infer<typeof CustomFieldValuesMapSchema>;

/** Request to save values for a given entity */
export const SaveCustomFieldValuesSchema = z.object({
  entityId: z.string(),
  feature: CustomFieldFeatureSchema,
  companyId: z.string().optional(),
  values: CustomFieldValuesMapSchema,
});
export type SaveCustomFieldValues = z.infer<typeof SaveCustomFieldValuesSchema>;

/** Response from getValues — array with field metadata included */
export const CustomFieldWithValueSchema = CustomFieldSchema.extend({
  value: z.string().nullable().optional(),
  valueId: z.string().nullable().optional(),
});
export type CustomFieldWithValue = z.infer<typeof CustomFieldWithValueSchema>;
