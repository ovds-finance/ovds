/**
 * @file vat-declaration.dto.ts
 * Public-facing DTOs for the VAT Declaration API.
 * Zod schemas are the source of truth; class shapes derive from them.
 */

import { z } from 'zod';

// ─── Calculate ────────────────────────────────────────────────────────────────

export const CalculateVatSchema = z.object({
  countryCode:     z.string().length(2).toUpperCase(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  subtotal:        z.number().min(0),
  currency:        z.string().length(3).toUpperCase(),
  hsCode:          z.string().max(20).optional(),
  isExport:        z.boolean().optional(),
  isImport:        z.boolean().optional(),
  reverseCharge:   z.boolean().optional(),
  meta:            z.record(z.string(), z.unknown()).optional(),
});
export type CalculateVatDto = z.infer<typeof CalculateVatSchema>;

// ─── Build return ─────────────────────────────────────────────────────────────

export const BuildReturnSchema = z.object({
  countryCode: z.string().length(2).toUpperCase(),
  periodKey:   z.string().min(4).max(10),
  currency:    z.string().length(3).toUpperCase(),
});
export type BuildReturnDto = z.infer<typeof BuildReturnSchema>;

// ─── Render report ────────────────────────────────────────────────────────────

export const RenderReportSchema = z.object({
  templateId: z.string().min(1),
  format:     z.enum(['PDF', 'XLSX', 'XML', 'JSON', 'CSV']),
  periodKey:  z.string().min(4).max(10),
  meta: z.object({
    companyName:   z.string(),
    tin:           z.string(),
    periodLabel:   z.string(),
    preparedBy:    z.string(),
    authorityName: z.string(),
    currency:      z.string().length(3),
    countryCode:   z.string().length(2).optional(),
  }).passthrough(),
});
export type RenderReportDto = z.infer<typeof RenderReportSchema>;

// ─── Module activation ────────────────────────────────────────────────────────

export const ActivateModulesSchema = z.object({
  countryCodes: z.array(z.string().length(2).toUpperCase()).min(1),
});
export type ActivateModulesDto = z.infer<typeof ActivateModulesSchema>;

export const DeactivateModulesSchema = z.object({
  countryCodes: z.array(z.string().length(2).toUpperCase()).min(1),
});
export type DeactivateModulesDto = z.infer<typeof DeactivateModulesSchema>;

// ─── Periods ──────────────────────────────────────────────────────────────────

export const GetPeriodsSchema = z.object({
  countryCode: z.string().length(2).toUpperCase(),
  year:        z.coerce.number().int().min(2000).max(2100),
  frequency:   z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).optional(),
});
export type GetPeriodsDto = z.infer<typeof GetPeriodsSchema>;

// ─── Filing status enum ───────────────────────────────────────────────────────

export const VAT_FILING_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
  'AMENDED',
] as const;
export type VatFilingStatus = typeof VAT_FILING_STATUSES[number];

// ─── Save filing (create / update a DRAFT) ────────────────────────────────────
//
// The client sends the assembled VatReturnDraft (from POST /vat/returns/build)
// back to the server for durable persistence.  Idempotent: calling save twice
// for the same (tenantId, countryCode, periodKey) updates the existing DRAFT row.

export const SaveFilingSchema = z.object({
  countryCode:    z.string().length(2).toUpperCase(),
  periodKey:      z.string().min(4).max(10),
  currency:       z.string().length(3).toUpperCase(),
  /** Serialised VatReturnDraft from the rule engine */
  returnDraft:    z.record(z.string(), z.unknown()),
  outputVat:      z.number().min(0),
  inputVat:       z.number().min(0),
  netVatPayable:  z.number(),
  dueDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes:          z.string().max(2000).optional(),
  /** Optional compliance result (from POST /vat/validate) */
  complianceResult: z.record(z.string(), z.unknown()).optional(),
});
export type SaveFilingDto = z.infer<typeof SaveFilingSchema>;

// ─── List filings ─────────────────────────────────────────────────────────────

export const ListFilingsSchema = z.object({
  countryCode: z.string().length(2).toUpperCase().optional(),
  status:      z.enum(VAT_FILING_STATUSES).optional(),
  year:        z.coerce.number().int().min(2000).max(2100).optional(),
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(100).default(20),
});
export type ListFilingsDto = z.infer<typeof ListFilingsSchema>;

// ─── Get single filing ────────────────────────────────────────────────────────

export const GetFilingSchema = z.object({
  id: z.string().uuid(),
});
export type GetFilingDto = z.infer<typeof GetFilingSchema>;

// ─── Submit filing ────────────────────────────────────────────────────────────
//
// Transitions the filing from DRAFT/PENDING_REVIEW → SUBMITTED.
// Optional channel selects how it reaches the authority
// (API_DIRECT = live e-filing, PORTAL_UPLOAD = attach XML for manual upload).

export const SubmitFilingSchema = z.object({
  /** Optional: override channel from the module default */
  channel: z.enum(['API_DIRECT', 'PORTAL_UPLOAD', 'EMAIL', 'MANUAL']).optional(),
  /** Freetext notes for the submission */
  notes:   z.string().max(1000).optional(),
});
export type SubmitFilingDto = z.infer<typeof SubmitFilingSchema>;

// ─── Amend filing ─────────────────────────────────────────────────────────────
//
// Creates a NEW VatFilingRecord with status DRAFT that references the
// original filing id via `amendmentOf`.

export const AmendFilingSchema = z.object({
  reason: z.string().min(1).max(500),
  notes:  z.string().max(2000).optional(),
});
export type AmendFilingDto = z.infer<typeof AmendFilingSchema>;

// ─── Record acknowledgement (internal / webhook use) ─────────────────────────

export const RecordAckSchema = z.object({
  ackNumber:      z.string().min(1).max(200),
  status:         z.enum(['ACCEPTED', 'REJECTED']),
  ackPayload:     z.record(z.string(), z.unknown()).optional(),
  rejectionReason: z.string().max(1000).optional(),
});
export type RecordAckDto = z.infer<typeof RecordAckSchema>;
