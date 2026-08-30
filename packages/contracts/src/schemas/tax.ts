/**
 * @ovds/contracts — Tax Domain Schemas
 *
 * Zod schemas for VAT, WHT, TOT, BIT, and Tax Profile procedures.
 * Single source of truth consumed by both NestJS (implements) and React (calls).
 *
 * Coverage:
 *   - VAT ledger, reverse-charge, withholding, refund claims, notes, eTax submissions
 *   - WHT certificates (Proc. 1395/2025)
 *   - TOT filings (Proc. 1395/2025)
 *   - BIT / Income Tax (Proc. 979/2016)
 *   - CompanyTaxProfile + compliance health
 */
import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

/** YYYY-MM period string */
export const PeriodSchema = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
export type Period = z.infer<typeof PeriodSchema>;

export const SuccessSchema = z.object({ success: z.boolean() });

// ── VAT Dashboard ─────────────────────────────────────────────────────────────

export const VatDashboardSchema = z.object({
  totalOutputVat:       z.number(),
  totalInputVat:        z.number(),
  claimableInputVat:    z.number(),
  totalWithheld:        z.number(),
  unremittedWithholding:z.number(),
  totalReverseCharge:   z.number(),
  pendingRefunds:       z.number(),
  netPayable:           z.number(),
  reverseCharge:        z.array(z.record(z.string(), z.unknown())),
  refundClaims:         z.array(z.record(z.string(), z.unknown())),
  withholding:          z.array(z.record(z.string(), z.unknown())),
  inputLedger:          z.array(z.record(z.string(), z.unknown())),
  outputLedger:         z.array(z.record(z.string(), z.unknown())),
});
export type VatDashboard = z.infer<typeof VatDashboardSchema>;

// ── VAT Filing ────────────────────────────────────────────────────────────────

export const VatFilingSchema = z.object({
  id:                      z.string(),
  period:                  z.string(),
  companyId:               z.string().nullable().optional(),
  outputVat:               z.number(),
  inputVat:                z.number(),
  netPayable:              z.number(),
  inputCreditCarryForward: z.number().optional(),
  inputApportionmentPct:   z.number().optional(),
  collected:               z.number().optional(),
  paid:                    z.number().optional(),
  projected:               z.number().optional(),
  status:                  z.string(),
  dueDate:                 z.coerce.date().nullable().optional(),
  filedAt:                 z.coerce.date().nullable().optional(),
  eTaxReference:           z.string().nullable().optional(),
  periodLockedAt:          z.coerce.date().nullable().optional(),
  periodLockedBy:          z.string().nullable().optional(),
  notes:                   z.string().nullable().optional(),
  createdAt:               z.coerce.date(),
  updatedAt:               z.coerce.date(),
});
export type VatFiling = z.infer<typeof VatFilingSchema>;

// ── VAT Input / Output Ledger ─────────────────────────────────────────────────

export const VatLedgerEntrySchema = z.object({
  id:               z.string(),
  companyId:        z.string().nullable().optional(),
  supplier:         z.string().optional(),
  Customer:         z.string().optional(),
  category:         z.string(),
  invoiceNo:        z.string(),
  date:             z.coerce.date(),
  netAmount:        z.number(),
  vatAmount:        z.number(),
  claimable:        z.boolean().optional(),
  period:           z.string().nullable().optional(),
  sourceRef:        z.string().nullable().optional(),
  supplierVatRegNo: z.string().nullable().optional(),
  buyerVatRegNo:    z.string().nullable().optional(),
  importDeclNo:     z.string().nullable().optional(),
  hsCode:           z.string().nullable().optional(),
  apportionmentPct: z.number().optional(),
});
export type VatLedgerEntry = z.infer<typeof VatLedgerEntrySchema>;

export const PaginatedVatLedgerSchema = z.object({
  data:       z.array(z.record(z.string(), z.unknown())),
  meta:       z.object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() }),
});

export const CreateVatInputEntrySchema = z.object({
  supplier:         z.string(),
  category:         z.string(),
  invoiceNo:        z.string(),
  date:             z.string(),
  netAmount:        z.number().nonnegative(),
  vatAmount:        z.number().nonnegative(),
  claimable:        z.boolean().default(true),
  period:           PeriodSchema.optional(),
  supplierVatRegNo: z.string().optional(),
  importDeclNo:     z.string().optional(),
  hsCode:           z.string().optional(),
  apportionmentPct: z.number().min(0).max(1).optional(),
});

export const UpdateVatInputEntrySchema = CreateVatInputEntrySchema.partial();

export const CreateVatOutputEntrySchema = z.object({
  Customer:      z.string(),
  category:      z.string(),
  invoiceNo:     z.string(),
  date:          z.string(),
  netAmount:     z.number().nonnegative(),
  vatAmount:     z.number().nonnegative(),
  period:        PeriodSchema.optional(),
  buyerVatRegNo: z.string().optional(),
  sourceRef:     z.string().optional(),
});

export const UpdateVatOutputEntrySchema = CreateVatOutputEntrySchema.partial();

// ── VAT Reverse Charge ────────────────────────────────────────────────────────

export const VatReverseChargeSchema = z.object({
  id:         z.string(),
  companyId:  z.string().nullable().optional(),
  supplier:   z.string(),
  service:    z.string(),
  invoiceDate:z.coerce.date(),
  amountETB:  z.number(),
  vatDue:     z.number(),
  period:     z.string().nullable().optional(),
  createdAt:  z.coerce.date().optional(),
  updatedAt:  z.coerce.date().optional(),
});

export const CreateReverseChargeSchema = z.object({
  supplier:    z.string().min(1),
  service:     z.string().min(1),
  invoiceDate: z.string(),
  amountETB:   z.number().positive(),
  period:      PeriodSchema.optional(),
});

// ── VAT Refund Claims ─────────────────────────────────────────────────────────

export const VatRefundClaimSchema = z.object({
  id:             z.string(),
  companyId:      z.string().nullable().optional(),
  ref:            z.string(),
  period:         z.string(),
  submittedDate:  z.coerce.date(),
  amount:         z.number(),
  status:         z.string(),
  notes:          z.string().nullable().optional(),
  invoiceNumber:  z.string().nullable().optional(),
  customerName:   z.string().nullable().optional(),
  type:           z.string().nullable().optional(),
  reason:         z.string().nullable().optional(),
  refundNumber:   z.string().optional(),
});

export const CreateVatRefundClaimSchema = z.object({
  amount:        z.number().positive(),
  period:        PeriodSchema.optional(),
  submittedDate: z.string().optional(),
  notes:         z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceId:     z.string().optional(),
  customerName:  z.string().optional(),
  type:          z.string().optional(),
  reason:        z.string().optional(),
});

// ── VAT Notes ─────────────────────────────────────────────────────────────────

export const VatNoteSchema = z.object({
  id:        z.string(),
  companyId: z.string().nullable().optional(),
  date:      z.coerce.date(),
  type:      z.string(),
  subject:   z.string(),
  body:      z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CreateVatNoteSchema = z.object({
  date:    z.string(),
  type:    z.string(),
  subject: z.string().min(1),
  body:    z.string().min(1),
});

// ── VAT Withholding ───────────────────────────────────────────────────────────

export const VatWithholdingSchema = z.object({
  id:              z.string(),
  companyId:       z.string().nullable().optional(),
  supplier:        z.string(),
  tin:             z.string(),
  invoiceDate:     z.coerce.date(),
  invoiceAmount:   z.number(),
  withheldVat:     z.number(),
  remitted:        z.boolean(),
  period:          z.string().nullable().optional(),
  supplierVatRegNo:z.string().nullable().optional(),
  createdAt:       z.coerce.date().optional(),
  updatedAt:       z.coerce.date().optional(),
});

export const CreateVatWithholdingSchema = z.object({
  supplier:         z.string().min(1),
  tin:              z.string().min(1),
  invoiceDate:      z.string(),
  invoiceAmount:    z.number().positive(),
  period:           PeriodSchema.optional(),
  supplierVatRegNo: z.string().optional(),
});

// ── eTax Submissions ──────────────────────────────────────────────────────────

export const EtaxSubmissionSchema = z.object({
  id:             z.string(),
  companyId:      z.string().nullable().optional(),
  period:         z.string().nullable().optional(),
  type:           z.string(),
  status:         z.string(),
  submittedAt:    z.coerce.date().nullable().optional(),
  ercaReferenceNo:z.string().nullable().optional(),
  totalAmount:    z.number().optional(),
  notes:          z.string().nullable().optional(),
  submittedBy:    z.string().nullable().optional(),
  createdAt:      z.coerce.date().optional(),
  updatedAt:      z.coerce.date().optional(),
});

export const CreateEtaxSubmissionSchema = z.object({
  period:          z.string().optional(),
  type:            z.string().default('VAT_RETURN'),
  ercaReferenceNo: z.string().optional(),
  totalAmount:     z.number().nonnegative().optional(),
  notes:           z.string().optional(),
});

// ── Period Lock / Apportionment ───────────────────────────────────────────────

export const VatPeriodQuerySchema = z.object({
  companyId: z.string().optional(),
  period:    PeriodSchema.optional(),
  page:      z.coerce.number().int().min(1).default(1),
  take:      z.coerce.number().int().min(1).max(500).default(50),
});

export const ApportionmentResultSchema = z.object({
  filingId:          z.string(),
  period:            z.string(),
  apportionmentPct:  z.number(),
  totalInputVat:     z.number(),
  claimableInputVat: z.number(),
  nonClaimable:      z.number(),
});

/** Result from the auto-compute apportionment endpoint (Proc. 1341/2024 Art. 26) */
export const AutoApportionmentResultSchema = z.object({
  period:            z.string(),
  taxableSales:      z.number(),
  exemptSales:       z.number(),
  totalSales:        z.number(),
  apportionmentPct:  z.number(),
  nonRecoverableVat: z.number(),
  filing:            z.record(z.string(), z.unknown()),
});
export type AutoApportionmentResult = z.infer<typeof AutoApportionmentResultSchema>;

// ── IRN ───────────────────────────────────────────────────────────────────────

export const IrnResultSchema = z.object({
  invoiceId:     z.string(),
  invoiceNumber: z.string(),
  irn:           z.string(),
  irnQrData:     z.string().optional(),
  generatedAt:   z.coerce.date().optional(),
});

// ── WHT Certificates ──────────────────────────────────────────────────────────

export const WhtTypeSchema = z.enum([
  'GOODS', 'SERVICES', 'SERVICES_NR', 'RENT', 'DIVIDEND', 'INTEREST',
]);

export const WhtCertificateSchema = z.object({
  id:            z.string(),
  certNo:        z.string(),
  companyId:     z.string().nullable().optional(),
  whtType:       z.string(),
  issueDate:     z.coerce.date(),
  period:        z.string(),
  agentName:     z.string(),
  agentTin:      z.string().nullable().optional(),
  supplierName:  z.string(),
  supplierTin:   z.string().nullable().optional(),
  grossAmount:   z.number(),
  whtRate:       z.number(),
  whtAmount:     z.number(),
  netPayable:    z.number(),
  billId:        z.string().nullable().optional(),
  billReference: z.string().nullable().optional(),
  remitted:      z.boolean(),
  remittedAt:    z.coerce.date().nullable().optional(),
  ercaReference: z.string().nullable().optional(),
  status:        z.string(),
  notes:         z.string().nullable().optional(),
  createdAt:     z.coerce.date(),
  updatedAt:     z.coerce.date(),
});

export const CreateWhtCertificateSchema = z.object({
  whtType:       WhtTypeSchema,
  period:        PeriodSchema,
  agentName:     z.string().min(1),
  agentTin:      z.string().optional(),
  supplierName:  z.string().min(1),
  supplierTin:   z.string().optional(),
  grossAmount:   z.number().positive(),
  billId:        z.string().optional(),
  billReference: z.string().optional(),
  notes:         z.string().optional(),
  issueDate:     z.string().optional(),
  companyId:     z.string().optional(),
});

export const WhtSummarySchema = z.object({
  period:              z.string(),
  companyId:           z.string().nullable().optional(),
  totalCertificates:   z.number().int(),
  totalGrossAmount:    z.number(),
  totalWhtDeducted:    z.number(),
  totalRemitted:       z.number(),
  totalUnremitted:     z.number(),
  byType:              z.record(z.string(), z.unknown()),
});

// ── TOT Filing ────────────────────────────────────────────────────────────────

export const TotFilingSchema = z.object({
  id:             z.string(),
  period:         z.string(),
  companyId:      z.string().nullable().optional(),
  goodsAmount:    z.number(),
  servicesAmount: z.number(),
  totGoods:       z.number(),
  totServices:    z.number(),
  netPayable:     z.number(),
  paid:           z.number().optional(),
  status:         z.string(),
  dueDate:        z.coerce.date().nullable().optional(),
  filedAt:        z.coerce.date().nullable().optional(),
  eTaxReference:  z.string().nullable().optional(),
  notes:          z.string().nullable().optional(),
  createdAt:      z.coerce.date(),
  updatedAt:      z.coerce.date(),
});

// ── BIT / Income Tax Filing ───────────────────────────────────────────────────

export const IncomeTaxFilingSchema = z.object({
  id:                  z.string(),
  year:                z.number().int(),
  fiscalYear:          z.number().int(),
  companyId:           z.string().nullable().optional(),
  netProfit:           z.number(),
  grossIncome:         z.number().optional(),
  taxableIncome:       z.number().optional(),
  taxRate:             z.number(),
  taxPayable:          z.number(),
  whtCredits:          z.number().optional(),
  provisionalPaid:     z.number().optional(),
  permanentAddBacks:   z.number().optional(),
  permanentDeductions: z.number().optional(),
  timingDifferences:   z.number().optional(),
  paid:                z.number().optional(),
  balanceDue:          z.number(),
  status:              z.string(),
  dueDate:             z.coerce.date().nullable().optional(),
  filedAt:             z.coerce.date().nullable().optional(),
  notes:               z.string().nullable().optional(),
  createdAt:           z.coerce.date(),
  updatedAt:           z.coerce.date(),
});

// ── Tax Dashboard ─────────────────────────────────────────────────────────────

export const TaxDashboardSchema = z.object({
  year:                     z.number().int(),
  vatCurrent:               z.number(),
  incomeTaxDue:             z.number(),
  drrfPending:              z.number(),
  overdueFilings:           z.number().int(),
  nextDue:                  z.object({ vat: z.string(), drrf: z.string() }),
  complianceScore:          z.number().int().min(0).max(100),
  totApplicable:            z.boolean(),
  matPayable:               z.number(),
  matApplies:               z.boolean(),
  taxpayerCategory:         z.enum(['A', 'B', 'C']),
  incomeTaxSchedule:        z.string(),
  vatTotComplianceBand:     z.string(),
  annualRevenue:            z.number(),
  vatRegistrationRequired:  z.boolean(),
});

// ── Company Tax Profile ───────────────────────────────────────────────────────

export const TaxProfileSchema = z.object({
  companyId:            z.string(),
  tin:                  z.string(),
  vatNumber:            z.string().optional(),
  sector:               z.string(),
  entityType:           z.string(),
  vatTotBand:           z.enum(['A', 'B', 'C']),
  incomeTaxSchedule:    z.enum(['A', 'B', 'C']),
  isVatRegistered:      z.boolean(),
  isTotApplicable:      z.boolean(),
  annualTurnoverEtb:    z.number(),
  taxes:                z.record(z.string(), z.unknown()),
  rateOverrides:        z.record(z.string(), z.number()).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  etaxAutoSubmit:       z.boolean(),
  srmIntegrated:        z.boolean(),
  enableDeferredTax:    z.boolean(),
});

export const UpdateTaxProfileSchema = TaxProfileSchema.partial().omit({ companyId: true });

// ── Compliance Health ─────────────────────────────────────────────────────────

export const ComplianceCheckSchema = z.object({
  taxCode:    z.string(),
  label:      z.string(),
  applicable: z.boolean(),
  status:     z.string(),
  period:     z.string(),
  dueDate:    z.string().optional(),
});

export const ComplianceHealthSchema = z.object({
  companyId:         z.string(),
  profile:           z.record(z.string(), z.unknown()),
  checks:            z.array(ComplianceCheckSchema),
  complianceScore:   z.number().int().min(0).max(100),
  overdueCount:      z.number().int(),
  upcomingDeadlines: z.array(z.record(z.string(), z.unknown())),
});

// ── MoR Acknowledgement Receipt Vault ─────────────────────────────────────────

export const MorAcknowledgementReceiptSchema = z.object({
  id:                 z.string(),
  companyId:          z.string().optional(),
  submissionRecordId: z.string().optional(),
  submissionType:     z.string(),
  receiptNumber:      z.string().optional(),
  receiptDate:        z.string().optional(),
  period:             z.string().optional(),
  ackXml:             z.string().optional(),
  ackPdf:             z.string().optional(),
  verificationStatus: z.string(),
  verificationMethod: z.string().optional(),
  documentHash:       z.string().optional(),
  downloadUrl:        z.string().optional(),
  submittedBy:        z.string().optional(),
  verifiedAt:         z.string().optional(),
  verifiedBy:         z.string().optional(),
  createdAt:          z.string(),
  updatedAt:          z.string(),
});

export const CreateMorAcknowledgementReceiptSchema = z.object({
  companyId:          z.string().optional(),
  submissionRecordId: z.string().optional(),
  submissionType:     z.string().default('VAT_RETURN'),
  receiptNumber:      z.string().optional(),
  receiptDate:        z.string().optional(),
  period:             z.string().optional(),
  ackXml:             z.string().optional(),
  ackPdf:             z.string().optional(),
  verificationStatus: z.string().default('PENDING'),
  verificationMethod: z.string().optional(),
  documentHash:       z.string().optional(),
  downloadUrl:        z.string().optional(),
  submittedBy:        z.string().optional(),
});

export const UpdateMorAcknowledgementReceiptSchema = CreateMorAcknowledgementReceiptSchema.partial();

export const AckReceiptQuerySchema = z.object({
  page:     z.number().int().positive().default(1),
  limit:    z.number().int().positive().max(100).default(20),
  period:   z.string().optional(),
  submissionType: z.string().optional(),
  verificationStatus: z.string().optional(),
  search:   z.string().optional(),
});

// ── VAT Declaration (MoR-compliant multi-jurisdictional filing) ────────────────

export const VatRateCategorySchema = z.enum(['STANDARD', 'REDUCED', 'ZERO', 'EXEMPT']);

export const VatLineItemSchema = z.object({
  id:               z.string(),
  declarationId:    z.string(),
  invoiceReference: z.string().optional(),
  rateCategory:     VatRateCategorySchema,
  percentage:       z.number(),
  netAmount:        z.number(),
  vatAmount:        z.number(),
  isDeductible:     z.boolean(),
});

export const VatDeclarationSchema = z.object({
  id:               z.string(),
  companyId:        z.string(),
  taxPeriod:        z.string(),
  countryCode:      z.string(),
  status:           z.string(),
  version:          z.number().int(),
  totalNetSales:    z.number(),
  totalVatDue:      z.number(),
  totalVatDeductible: z.number(),
  netVatPayable:    z.number(),
  createdAt:        z.coerce.date(),
  updatedAt:        z.coerce.date(),
  lineItems:        z.array(VatLineItemSchema),
  auditLogs:        z.array(z.record(z.string(), z.unknown())),
});

export const SubmitVatDeclarationSchema = z.object({
  companyId:   z.string(),
  taxPeriod:   z.string().regex(/^\d{4}-(Q[1-4]|M[0-1][0-2])$/, 'Period must match YYYY-QX or YYYY-MM'),
  countryCode: z.string().regex(/^[A-Z]{2}$/, 'Country code must be a valid 2-letter ISO standard'),
  lineItems: z.array(
    z.object({
      invoiceReference: z.string(),
      rateCategory: VatRateCategorySchema,
      percentage: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Percentage must be a stringified precision decimal'),
      netAmount:  z.string().regex(/^-?\d+(\.\d{1,4})?$/, 'NetAmount must be a stringified precision decimal'),
    })
  ),
});

export const TaxAuditLogSchema = z.object({
  id:               z.string(),
  declarationId:    z.string(),
  userId:           z.string(),
  action:           z.string(),
  previousPayload:  z.string().optional(),
  currentPayload:   z.string().optional(),
  digitalSignature: z.string().optional(),
  timestamp:        z.coerce.date(),
});

export type VatDeclaration = z.infer<typeof VatDeclarationSchema>;
export type SubmitVatDeclarationDto = z.infer<typeof SubmitVatDeclarationSchema>;
export type VatLineItem = z.infer<typeof VatLineItemSchema>;
export type TaxAuditLog = z.infer<typeof TaxAuditLogSchema>;
