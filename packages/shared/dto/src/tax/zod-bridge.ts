/**
 * @ovds/dto/tax/zod-bridge — Zod schemas for the tax domain
 *
 * Provides Zod versions of the tax DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

export const PeriodSchema = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
export type Period = z.infer<typeof PeriodSchema>;

// ── VAT Dashboard ─────────────────────────────────────────────────────────────

export const VatDashboardSchema = z.object({
  totalOutputVat: z.number(),
  totalInputVat: z.number(),
  claimableInputVat: z.number(),
  totalWithheld: z.number(),
  unremittedWithholding: z.number(),
  totalReverseCharge: z.number(),
  pendingRefunds: z.number(),
  netPayable: z.number(),
});

// ── VAT Filing ────────────────────────────────────────────────────────────────

export const VatFilingSchema = z.object({
  id: z.string(),
  period: z.string(),
  companyId: z.string().nullable().optional(),
  outputVat: z.number(),
  inputVat: z.number(),
  netPayable: z.number(),
  status: z.string(),
  dueDate: z.coerce.date().nullable().optional(),
  filedAt: z.coerce.date().nullable().optional(),
  eTaxReference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ── VAT Ledger Entry ──────────────────────────────────────────────────────────

export const VatLedgerEntrySchema = z.object({
  id: z.string(),
  companyId: z.string().nullable().optional(),
  supplier: z.string().optional(),
  Customer: z.string().optional(),
  category: z.string(),
  invoiceNo: z.string(),
  date: z.coerce.date(),
  netAmount: z.number(),
  vatAmount: z.number(),
  claimable: z.boolean().optional(),
  period: z.string().nullable().optional(),
});

export const CreateVatInputEntrySchema = z.object({
  supplier: z.string(),
  category: z.string(),
  invoiceNo: z.string(),
  date: z.string(),
  netAmount: z.number().nonnegative(),
  vatAmount: z.number().nonnegative(),
  claimable: z.boolean().default(true),
  period: PeriodSchema.optional(),
});

export const CreateVatOutputEntrySchema = z.object({
  Customer: z.string(),
  category: z.string(),
  invoiceNo: z.string(),
  date: z.string(),
  netAmount: z.number().nonnegative(),
  vatAmount: z.number().nonnegative(),
  period: PeriodSchema.optional(),
});

// ── VAT Reverse Charge ────────────────────────────────────────────────────────

export const VatReverseChargeSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable().optional(),
  supplier: z.string(),
  service: z.string(),
  invoiceDate: z.coerce.date(),
  amountETB: z.number(),
  vatDue: z.number(),
  period: z.string().nullable().optional(),
});

export const CreateReverseChargeSchema = z.object({
  supplier: z.string().min(1),
  service: z.string().min(1),
  invoiceDate: z.string(),
  amountETB: z.number().positive(),
  period: PeriodSchema.optional(),
});

// ── VAT Refund Claims ─────────────────────────────────────────────────────────

export const VatRefundClaimSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable().optional(),
  ref: z.string(),
  period: z.string(),
  submittedDate: z.coerce.date(),
  amount: z.number(),
  status: z.string(),
  notes: z.string().nullable().optional(),
});

export const CreateVatRefundClaimSchema = z.object({
  amount: z.number().positive(),
  period: PeriodSchema.optional(),
  submittedDate: z.string().optional(),
  notes: z.string().optional(),
});

// ── VAT Notes ─────────────────────────────────────────────────────────────────

export const VatNoteSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable().optional(),
  date: z.coerce.date(),
  type: z.string(),
  subject: z.string(),
  body: z.string(),
});

export const CreateVatNoteSchema = z.object({
  date: z.string(),
  type: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

// ── WHT Certificates ──────────────────────────────────────────────────────────

export const WhtTypeSchema = z.enum([
  'GOODS', 'SERVICES', 'SERVICES_NR', 'RENT', 'DIVIDEND', 'INTEREST',
]);

export const WhtCertificateSchema = z.object({
  id: z.string(),
  certNo: z.string(),
  companyId: z.string().nullable().optional(),
  whtType: z.string(),
  issueDate: z.coerce.date(),
  period: z.string(),
  agentName: z.string(),
  agentTin: z.string().nullable().optional(),
  supplierName: z.string(),
  supplierTin: z.string().nullable().optional(),
  grossAmount: z.number(),
  whtRate: z.number(),
  whtAmount: z.number(),
  netPayable: z.number(),
  billId: z.string().nullable().optional(),
  remitted: z.boolean(),
  status: z.string(),
  notes: z.string().nullable().optional(),
});

export const CreateWhtCertificateSchema = z.object({
  whtType: WhtTypeSchema,
  period: PeriodSchema,
  agentName: z.string().min(1),
  agentTin: z.string().optional(),
  supplierName: z.string().min(1),
  supplierTin: z.string().optional(),
  grossAmount: z.number().positive(),
  billId: z.string().optional(),
  notes: z.string().optional(),
  companyId: z.string().optional(),
});

// ── Tax Profile ───────────────────────────────────────────────────────────────

export const TaxProfileSchema = z.object({
  companyId: z.string(),
  tin: z.string(),
  vatNumber: z.string().optional(),
  sector: z.string(),
  entityType: z.string(),
  vatTotBand: z.enum(['A', 'B', 'C']),
  incomeTaxSchedule: z.enum(['A', 'B', 'C']),
  isVatRegistered: z.boolean(),
  isTotApplicable: z.boolean(),
  annualTurnoverEtb: z.number(),
  taxes: z.record(z.string(), z.unknown()),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  etaxAutoSubmit: z.boolean(),
});

export const UpdateTaxProfileSchema = TaxProfileSchema.partial().omit({ companyId: true });

// ── Compliance Health ─────────────────────────────────────────────────────────

export const ComplianceCheckSchema = z.object({
  taxCode: z.string(),
  label: z.string(),
  applicable: z.boolean(),
  status: z.string(),
  period: z.string(),
  dueDate: z.string().optional(),
});

export const ComplianceHealthSchema = z.object({
  companyId: z.string(),
  checks: z.array(ComplianceCheckSchema),
  complianceScore: z.number().int().min(0).max(100),
  overdueCount: z.number().int(),
});

// ── MoR Acknowledgement Receipt ───────────────────────────────────────────────

export const MorAcknowledgementReceiptSchema = z.object({
  id: z.string(),
  companyId: z.string().optional(),
  submissionRecordId: z.string().optional(),
  submissionType: z.string(),
  receiptNumber: z.string().optional(),
  receiptDate: z.string().optional(),
  period: z.string().optional(),
  verificationStatus: z.string(),
  downloadUrl: z.string().optional(),
  submittedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateMorAcknowledgementReceiptSchema = z.object({
  companyId: z.string().optional(),
  submissionRecordId: z.string().optional(),
  submissionType: z.string().default('VAT_RETURN'),
  receiptNumber: z.string().optional(),
  receiptDate: z.string().optional(),
  period: z.string().optional(),
  verificationStatus: z.string().default('PENDING'),
  downloadUrl: z.string().optional(),
  submittedBy: z.string().optional(),
});
