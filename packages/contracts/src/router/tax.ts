/**
 * @ovds/contracts — Tax oRPC Router Contract
 *
 * Covers the entire Ethiopian tax compliance surface:
 *   vat.*          — VAT ledgers, filings, reverse-charge, withholding, refunds, IRN, eTax
 *   wht.*          — WHT certificates (Proc. 1395/2025)
 *   tot.*          — Turnover Tax filings
 *   bit.*          — Business Income Tax (Proc. 979/2016)
 *   profile.*      — CompanyTaxProfile management
 *   dashboard      — Tax KPI summary
 *   compliance     — Health check + upcoming deadlines
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  PeriodSchema,
  SuccessSchema,
  VatDashboardSchema,
  VatFilingSchema,
  PaginatedVatLedgerSchema,
  CreateVatInputEntrySchema,
  UpdateVatInputEntrySchema,
  CreateVatOutputEntrySchema,
  UpdateVatOutputEntrySchema,
  VatReverseChargeSchema,
  CreateReverseChargeSchema,
  VatRefundClaimSchema,
  CreateVatRefundClaimSchema,
  VatNoteSchema,
  CreateVatNoteSchema,
  VatWithholdingSchema,
  CreateVatWithholdingSchema,
  EtaxSubmissionSchema,
  CreateEtaxSubmissionSchema,
  VatPeriodQuerySchema,
  ApportionmentResultSchema,
  AutoApportionmentResultSchema,
  IrnResultSchema,
  WhtCertificateSchema,
  CreateWhtCertificateSchema,
  WhtSummarySchema,
  TotFilingSchema,
  IncomeTaxFilingSchema,
  TaxDashboardSchema,
  TaxProfileSchema,
  UpdateTaxProfileSchema,
  ComplianceHealthSchema,
  MorAcknowledgementReceiptSchema,
  CreateMorAcknowledgementReceiptSchema,
  UpdateMorAcknowledgementReceiptSchema,
  AckReceiptQuerySchema,
} from '../schemas/tax';
import { IdParamSchema } from '../schemas/common';

const CompanyQuery = z.object({ companyId: z.string().optional() });

// ── VAT procedures ────────────────────────────────────────────────────────────

const vatProcedures = {
  // Dashboard
  dashboard: oc
    .input(CompanyQuery.extend({ period: PeriodSchema.optional() }))
    .output(VatDashboardSchema),

  // Filings
  filings: oc.router({
    list: oc
      .input(CompanyQuery)
      .output(z.array(VatFilingSchema)),

    calculate: oc
      .input(z.object({
        companyId: z.string().optional(),
        startDate: z.string(),
        endDate:   z.string(),
        period:    PeriodSchema,
      }))
      .output(z.record(z.string(), z.unknown())),

    autoCompute: oc
      .input(z.object({ companyId: z.string().optional(), period: PeriodSchema }))
      .output(z.record(z.string(), z.unknown())),

    zeroDeclaration: oc
      .input(z.object({ companyId: z.string().optional(), period: PeriodSchema }))
      .output(z.record(z.string(), z.unknown())),

    updateStatus: oc
      .input(IdParamSchema.extend({
        status: z.enum(['PENDING', 'FILED', 'PAID']),
      }))
      .output(z.record(z.string(), z.unknown())),

    remove: oc
      .input(IdParamSchema)
      .output(SuccessSchema),

    lock: oc
      .input(IdParamSchema)
      .output(z.record(z.string(), z.unknown())),

    getApportionment: oc
      .input(IdParamSchema)
      .output(ApportionmentResultSchema),

    setApportionment: oc
      .input(IdParamSchema.extend({ apportionmentPct: z.number().min(0).max(1) }))
      .output(z.record(z.string(), z.unknown())),

    /** Auto-compute apportionment ratio from live sales data (Proc. 1341/2024 Art. 26) */
    autoComputeApportionment: oc
      .input(z.object({ companyId: z.string().optional(), period: PeriodSchema }))
      .output(AutoApportionmentResultSchema),
  }),

  // Input VAT Ledger
  inputLedger: oc.router({
    list:   oc.input(VatPeriodQuerySchema).output(PaginatedVatLedgerSchema),
    create: oc.input(CreateVatInputEntrySchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    update: oc.input(IdParamSchema.merge(z.object({ data: UpdateVatInputEntrySchema }))).output(z.record(z.string(), z.unknown())),
    remove: oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // Output VAT Ledger
  outputLedger: oc.router({
    list:   oc.input(VatPeriodQuerySchema).output(PaginatedVatLedgerSchema),
    create: oc.input(CreateVatOutputEntrySchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    update: oc.input(IdParamSchema.merge(z.object({ data: UpdateVatOutputEntrySchema }))).output(z.record(z.string(), z.unknown())),
    remove: oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // Reverse Charge
  reverseCharges: oc.router({
    list:   oc.input(VatPeriodQuerySchema).output(z.object({ data: z.array(VatReverseChargeSchema), meta: z.record(z.string(), z.unknown()) })),
    create: oc.input(CreateReverseChargeSchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    remove: oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // Refund Claims
  refundClaims: oc.router({
    list:         oc.input(CompanyQuery).output(z.array(VatRefundClaimSchema)),
    create:       oc.input(CreateVatRefundClaimSchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    updateStatus: oc.input(IdParamSchema.extend({ status: z.string(), notes: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    remove:       oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // VAT Notes
  notes: oc.router({
    list:   oc.input(CompanyQuery).output(z.array(VatNoteSchema)),
    create: oc.input(CreateVatNoteSchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    remove: oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // Withholding Register
  withholding: oc.router({
    list:          oc.input(VatPeriodQuerySchema).output(z.object({ data: z.array(VatWithholdingSchema), meta: z.record(z.string(), z.unknown()) })),
    create:        oc.input(CreateVatWithholdingSchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    toggleRemitted:oc.input(IdParamSchema).output(z.object({ id: z.string(), remitted: z.boolean() })),
    remove:        oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // Export Evidence
  exportEvidence: oc.router({
    list:        oc.input(CompanyQuery).output(z.array(z.record(z.string(), z.unknown()))),
    create:      oc.input(z.object({ companyId: z.string().optional(), invoiceNo: z.string(), Customer: z.string(), exportDate: z.string(), amountETB: z.number() })).output(z.record(z.string(), z.unknown())),
    cycleStatus: oc.input(IdParamSchema.extend({ field: z.enum(['customsDecl', 'billOfLading', 'bankReceipt']) })).output(z.record(z.string(), z.unknown())),
    remove:      oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // eTax Submissions
  etaxSubmissions: oc.router({
    list:   oc.input(CompanyQuery.extend({ period: PeriodSchema.optional() })).output(z.array(EtaxSubmissionSchema)),
    create: oc.input(CreateEtaxSubmissionSchema.extend({ companyId: z.string().optional() })).output(z.record(z.string(), z.unknown())),
    remove: oc.input(IdParamSchema).output(SuccessSchema),
  }),

  // IRN
  irn: oc.router({
    generate: oc.input(z.object({
      companyId:     z.string().optional(),
      invoiceId:     z.string(),
      invoiceNumber: z.string(),
      invoiceDate:   z.string(),
      grossAmount:   z.number(),
      tin:           z.string().optional(),
    })).output(IrnResultSchema),

    get: oc.input(z.object({ invoiceId: z.string(), companyId: z.string().optional() })).output(IrnResultSchema),
  }),

  // Period summary
  periodSummary: oc
    .input(z.object({ period: PeriodSchema, companyId: z.string().optional() }))
    .output(VatDashboardSchema),
};

// ── WHT Certificate procedures ────────────────────────────────────────────────

const whtProcedures = {
  list:       oc.input(CompanyQuery.extend({ period: PeriodSchema.optional(), status: z.string().optional() })).output(z.array(WhtCertificateSchema)),
  get:        oc.input(IdParamSchema).output(WhtCertificateSchema),
  create:     oc.input(CreateWhtCertificateSchema).output(WhtCertificateSchema),
  issue:      oc.input(IdParamSchema).output(WhtCertificateSchema),
  remit:      oc.input(IdParamSchema.extend({ ercaReference: z.string().min(1) })).output(WhtCertificateSchema),
  cancel:     oc.input(IdParamSchema).output(WhtCertificateSchema),
  summary:    oc.input(CompanyQuery.extend({ period: PeriodSchema.optional() })).output(WhtSummarySchema),
  autoGenerate: oc.input(z.object({ companyId: z.string(), period: PeriodSchema })).output(z.object({ generated: z.number().int(), certificates: z.array(z.record(z.string(), z.unknown())) })),
};

// ── TOT procedures ────────────────────────────────────────────────────────────

const totProcedures = {
  list:        oc.input(CompanyQuery).output(z.array(TotFilingSchema)),
  calculate:   oc.input(z.object({ companyId: z.string().optional(), period: PeriodSchema })).output(z.record(z.string(), z.unknown())),
  autoCompute: oc.input(z.object({ companyId: z.string().optional(), period: PeriodSchema })).output(z.record(z.string(), z.unknown())),
  updateStatus:oc.input(IdParamSchema.extend({ status: z.string() })).output(TotFilingSchema),
};

// ── BIT / Income Tax procedures ───────────────────────────────────────────────

const bitProcedures = {
  list:      oc.input(CompanyQuery).output(z.array(IncomeTaxFilingSchema)),
  calculate: oc.input(z.object({ companyId: z.string().optional(), year: z.number().int() })).output(z.record(z.string(), z.unknown())),
  record:    oc.input(z.object({
    companyId:          z.string().optional(),
    year:               z.number().int(),
    amount:             z.number().nonnegative(),
    grossIncome:        z.number().optional(),
    taxableIncome:      z.number().optional(),
    whtCredits:         z.number().optional(),
    provisionalPaid:    z.number().optional(),
    permanentAddBacks:  z.number().optional(),
    permanentDeductions:z.number().optional(),
    timingDifferences:  z.number().optional(),
    notes:              z.string().optional(),
  })).output(z.record(z.string(), z.unknown())),
  reports:   oc.input(z.object({ companyId: z.string().optional(), period: PeriodSchema.optional() })).output(z.record(z.string(), z.unknown())),
};

// ── Tax Profile procedures ────────────────────────────────────────────────────

const profileProcedures = {
  get:    oc.input(CompanyQuery).output(TaxProfileSchema),
  update: oc.input(z.object({ companyId: z.string().optional(), data: UpdateTaxProfileSchema })).output(TaxProfileSchema),
  rules:  oc.input(z.object({ sector: z.string().optional() })).output(z.array(z.record(z.string(), z.unknown()))),
};

// ── Acknowledgement Receipt Vault procedures ───────────────────────────────────

const ackVaultProcedures = {
  list:   oc.input(AckReceiptQuerySchema).output(z.array(MorAcknowledgementReceiptSchema)),
  get:    oc.input(IdParamSchema).output(MorAcknowledgementReceiptSchema),
  create: oc.input(CreateMorAcknowledgementReceiptSchema).output(MorAcknowledgementReceiptSchema),
  update: oc.input(IdParamSchema.extend({ data: UpdateMorAcknowledgementReceiptSchema })).output(MorAcknowledgementReceiptSchema),
  verify: oc.input(IdParamSchema.extend({ method: z.string().optional(), verifiedBy: z.string().optional() })).output(MorAcknowledgementReceiptSchema),
  delete: oc.input(IdParamSchema).output(SuccessSchema),
};

// ── Root tax contract ─────────────────────────────────────────────────────────

export const taxContract = oc.router({
  dashboard:  oc.input(CompanyQuery).output(TaxDashboardSchema),
  compliance: oc.input(CompanyQuery).output(ComplianceHealthSchema),
  deadlines:  oc.input(CompanyQuery).output(z.array(z.record(z.string(), z.unknown()))),
  vat:        oc.router(vatProcedures),
  wht:        oc.router(whtProcedures),
  tot:        oc.router(totProcedures),
  bit:        oc.router(bitProcedures),
  profile:    oc.router(profileProcedures),
  ackVault:   oc.router(ackVaultProcedures),
});

export type TaxContract = typeof taxContract;
