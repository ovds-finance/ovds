/**
 * @ovds/contracts — Custom Fields oRPC Router Contract
 *
 * Manages per-company custom field definitions and their values
 * across any entity (invoice, customer, item, vendor, account, transfer).
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  CustomFieldSchema,
  CreateCustomFieldSchema,
  UpdateCustomFieldSchema,
  ListCustomFieldsQuerySchema,
  CustomFieldWithValueSchema,
  SaveCustomFieldValuesSchema,
  CustomFieldFeatureSchema,
} from '../schemas/custom-fields';
import { IdParamSchema, PaginatedResultSchema } from '../schemas/common';

// ── Field definition procedures ───────────────────────────────────────────────

const fieldProcedures = {
  /** List all field definitions for a company, optionally filtered by feature */
  list: oc
    .input(ListCustomFieldsQuerySchema)
    .output(PaginatedResultSchema(CustomFieldSchema)),

  /** Get a single field definition */
  get: oc
    .input(IdParamSchema)
    .output(CustomFieldSchema),

  /** Create a new field definition */
  create: oc
    .input(CreateCustomFieldSchema)
    .output(CustomFieldSchema),

  /** Update a field definition (label, options, hint, etc.) */
  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateCustomFieldSchema })))
    .output(CustomFieldSchema),

  /** Delete a field definition (also deletes all values) */
  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  /** Reorder fields for a feature */
  reorder: oc
    .input(z.object({
      companyId: z.string(),
      feature: CustomFieldFeatureSchema,
      order: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })),
    }))
    .output(z.object({ success: z.boolean() })),
};

// ── Field value procedures ────────────────────────────────────────────────────

const valueProcedures = {
  /** Get all field definitions + current values for an entity */
  getForEntity: oc
    .input(z.object({
      entityId: z.string(),
      feature: CustomFieldFeatureSchema,
      companyId: z.string().optional(),
    }))
    .output(z.array(CustomFieldWithValueSchema)),

  /** Save (upsert) values for an entity — pass the full map of fieldId → value */
  save: oc
    .input(SaveCustomFieldValuesSchema)
    .output(z.object({ saved: z.number() })),
};

// ── Custom fields contract ────────────────────────────────────────────────────

export const customFieldsContract = oc.router({
  fields: oc.router(fieldProcedures),
  values: oc.router(valueProcedures),
});

export type CustomFieldsContract = typeof customFieldsContract;
