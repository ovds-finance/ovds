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
    get AckReceiptQuerySchema () {
        return AckReceiptQuerySchema;
    },
    get ApportionmentResultSchema () {
        return ApportionmentResultSchema;
    },
    get AutoApportionmentResultSchema () {
        return AutoApportionmentResultSchema;
    },
    get ComplianceCheckSchema () {
        return ComplianceCheckSchema;
    },
    get ComplianceHealthSchema () {
        return ComplianceHealthSchema;
    },
    get CreateEtaxSubmissionSchema () {
        return CreateEtaxSubmissionSchema;
    },
    get CreateMorAcknowledgementReceiptSchema () {
        return CreateMorAcknowledgementReceiptSchema;
    },
    get CreateReverseChargeSchema () {
        return CreateReverseChargeSchema;
    },
    get CreateVatInputEntrySchema () {
        return CreateVatInputEntrySchema;
    },
    get CreateVatNoteSchema () {
        return CreateVatNoteSchema;
    },
    get CreateVatOutputEntrySchema () {
        return CreateVatOutputEntrySchema;
    },
    get CreateVatRefundClaimSchema () {
        return CreateVatRefundClaimSchema;
    },
    get CreateVatWithholdingSchema () {
        return CreateVatWithholdingSchema;
    },
    get CreateWhtCertificateSchema () {
        return CreateWhtCertificateSchema;
    },
    get EtaxSubmissionSchema () {
        return EtaxSubmissionSchema;
    },
    get IncomeTaxFilingSchema () {
        return IncomeTaxFilingSchema;
    },
    get IrnResultSchema () {
        return IrnResultSchema;
    },
    get MorAcknowledgementReceiptSchema () {
        return MorAcknowledgementReceiptSchema;
    },
    get PaginatedVatLedgerSchema () {
        return PaginatedVatLedgerSchema;
    },
    get PeriodSchema () {
        return PeriodSchema;
    },
    get SubmitVatDeclarationSchema () {
        return SubmitVatDeclarationSchema;
    },
    get SuccessSchema () {
        return SuccessSchema;
    },
    get TaxAuditLogSchema () {
        return TaxAuditLogSchema;
    },
    get TaxDashboardSchema () {
        return TaxDashboardSchema;
    },
    get TaxProfileSchema () {
        return TaxProfileSchema;
    },
    get TotFilingSchema () {
        return TotFilingSchema;
    },
    get UpdateMorAcknowledgementReceiptSchema () {
        return UpdateMorAcknowledgementReceiptSchema;
    },
    get UpdateTaxProfileSchema () {
        return UpdateTaxProfileSchema;
    },
    get UpdateVatInputEntrySchema () {
        return UpdateVatInputEntrySchema;
    },
    get UpdateVatOutputEntrySchema () {
        return UpdateVatOutputEntrySchema;
    },
    get VatDashboardSchema () {
        return VatDashboardSchema;
    },
    get VatDeclarationSchema () {
        return VatDeclarationSchema;
    },
    get VatFilingSchema () {
        return VatFilingSchema;
    },
    get VatLedgerEntrySchema () {
        return VatLedgerEntrySchema;
    },
    get VatLineItemSchema () {
        return VatLineItemSchema;
    },
    get VatNoteSchema () {
        return VatNoteSchema;
    },
    get VatPeriodQuerySchema () {
        return VatPeriodQuerySchema;
    },
    get VatRateCategorySchema () {
        return VatRateCategorySchema;
    },
    get VatRefundClaimSchema () {
        return VatRefundClaimSchema;
    },
    get VatReverseChargeSchema () {
        return VatReverseChargeSchema;
    },
    get VatWithholdingSchema () {
        return VatWithholdingSchema;
    },
    get WhtCertificateSchema () {
        return WhtCertificateSchema;
    },
    get WhtSummarySchema () {
        return WhtSummarySchema;
    },
    get WhtTypeSchema () {
        return WhtTypeSchema;
    }
});
const _zod = require("zod");
const PeriodSchema = _zod.z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
const SuccessSchema = _zod.z.object({
    success: _zod.z.boolean()
});
const VatDashboardSchema = _zod.z.object({
    totalOutputVat: _zod.z.number(),
    totalInputVat: _zod.z.number(),
    claimableInputVat: _zod.z.number(),
    totalWithheld: _zod.z.number(),
    unremittedWithholding: _zod.z.number(),
    totalReverseCharge: _zod.z.number(),
    pendingRefunds: _zod.z.number(),
    netPayable: _zod.z.number(),
    reverseCharge: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    refundClaims: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    withholding: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    inputLedger: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    outputLedger: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
});
const VatFilingSchema = _zod.z.object({
    id: _zod.z.string(),
    period: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    outputVat: _zod.z.number(),
    inputVat: _zod.z.number(),
    netPayable: _zod.z.number(),
    inputCreditCarryForward: _zod.z.number().optional(),
    inputApportionmentPct: _zod.z.number().optional(),
    collected: _zod.z.number().optional(),
    paid: _zod.z.number().optional(),
    projected: _zod.z.number().optional(),
    status: _zod.z.string(),
    dueDate: _zod.z.coerce.date().nullable().optional(),
    filedAt: _zod.z.coerce.date().nullable().optional(),
    eTaxReference: _zod.z.string().nullable().optional(),
    periodLockedAt: _zod.z.coerce.date().nullable().optional(),
    periodLockedBy: _zod.z.string().nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const VatLedgerEntrySchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    supplier: _zod.z.string().optional(),
    Customer: _zod.z.string().optional(),
    category: _zod.z.string(),
    invoiceNo: _zod.z.string(),
    date: _zod.z.coerce.date(),
    netAmount: _zod.z.number(),
    vatAmount: _zod.z.number(),
    claimable: _zod.z.boolean().optional(),
    period: _zod.z.string().nullable().optional(),
    sourceRef: _zod.z.string().nullable().optional(),
    supplierVatRegNo: _zod.z.string().nullable().optional(),
    buyerVatRegNo: _zod.z.string().nullable().optional(),
    importDeclNo: _zod.z.string().nullable().optional(),
    hsCode: _zod.z.string().nullable().optional(),
    apportionmentPct: _zod.z.number().optional()
});
const PaginatedVatLedgerSchema = _zod.z.object({
    data: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    meta: _zod.z.object({
        total: _zod.z.number(),
        page: _zod.z.number(),
        limit: _zod.z.number(),
        totalPages: _zod.z.number()
    })
});
const CreateVatInputEntrySchema = _zod.z.object({
    supplier: _zod.z.string(),
    category: _zod.z.string(),
    invoiceNo: _zod.z.string(),
    date: _zod.z.string(),
    netAmount: _zod.z.number().nonnegative(),
    vatAmount: _zod.z.number().nonnegative(),
    claimable: _zod.z.boolean().default(true),
    period: PeriodSchema.optional(),
    supplierVatRegNo: _zod.z.string().optional(),
    importDeclNo: _zod.z.string().optional(),
    hsCode: _zod.z.string().optional(),
    apportionmentPct: _zod.z.number().min(0).max(1).optional()
});
const UpdateVatInputEntrySchema = CreateVatInputEntrySchema.partial();
const CreateVatOutputEntrySchema = _zod.z.object({
    Customer: _zod.z.string(),
    category: _zod.z.string(),
    invoiceNo: _zod.z.string(),
    date: _zod.z.string(),
    netAmount: _zod.z.number().nonnegative(),
    vatAmount: _zod.z.number().nonnegative(),
    period: PeriodSchema.optional(),
    buyerVatRegNo: _zod.z.string().optional(),
    sourceRef: _zod.z.string().optional()
});
const UpdateVatOutputEntrySchema = CreateVatOutputEntrySchema.partial();
const VatReverseChargeSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    supplier: _zod.z.string(),
    service: _zod.z.string(),
    invoiceDate: _zod.z.coerce.date(),
    amountETB: _zod.z.number(),
    vatDue: _zod.z.number(),
    period: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date().optional(),
    updatedAt: _zod.z.coerce.date().optional()
});
const CreateReverseChargeSchema = _zod.z.object({
    supplier: _zod.z.string().min(1),
    service: _zod.z.string().min(1),
    invoiceDate: _zod.z.string(),
    amountETB: _zod.z.number().positive(),
    period: PeriodSchema.optional()
});
const VatRefundClaimSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    ref: _zod.z.string(),
    period: _zod.z.string(),
    submittedDate: _zod.z.coerce.date(),
    amount: _zod.z.number(),
    status: _zod.z.string(),
    notes: _zod.z.string().nullable().optional(),
    invoiceNumber: _zod.z.string().nullable().optional(),
    customerName: _zod.z.string().nullable().optional(),
    type: _zod.z.string().nullable().optional(),
    reason: _zod.z.string().nullable().optional(),
    refundNumber: _zod.z.string().optional()
});
const CreateVatRefundClaimSchema = _zod.z.object({
    amount: _zod.z.number().positive(),
    period: PeriodSchema.optional(),
    submittedDate: _zod.z.string().optional(),
    notes: _zod.z.string().optional(),
    invoiceNumber: _zod.z.string().optional(),
    invoiceId: _zod.z.string().optional(),
    customerName: _zod.z.string().optional(),
    type: _zod.z.string().optional(),
    reason: _zod.z.string().optional()
});
const VatNoteSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    date: _zod.z.coerce.date(),
    type: _zod.z.string(),
    subject: _zod.z.string(),
    body: _zod.z.string(),
    createdAt: _zod.z.coerce.date().optional(),
    updatedAt: _zod.z.coerce.date().optional()
});
const CreateVatNoteSchema = _zod.z.object({
    date: _zod.z.string(),
    type: _zod.z.string(),
    subject: _zod.z.string().min(1),
    body: _zod.z.string().min(1)
});
const VatWithholdingSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    supplier: _zod.z.string(),
    tin: _zod.z.string(),
    invoiceDate: _zod.z.coerce.date(),
    invoiceAmount: _zod.z.number(),
    withheldVat: _zod.z.number(),
    remitted: _zod.z.boolean(),
    period: _zod.z.string().nullable().optional(),
    supplierVatRegNo: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date().optional(),
    updatedAt: _zod.z.coerce.date().optional()
});
const CreateVatWithholdingSchema = _zod.z.object({
    supplier: _zod.z.string().min(1),
    tin: _zod.z.string().min(1),
    invoiceDate: _zod.z.string(),
    invoiceAmount: _zod.z.number().positive(),
    period: PeriodSchema.optional(),
    supplierVatRegNo: _zod.z.string().optional()
});
const EtaxSubmissionSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    period: _zod.z.string().nullable().optional(),
    type: _zod.z.string(),
    status: _zod.z.string(),
    submittedAt: _zod.z.coerce.date().nullable().optional(),
    ercaReferenceNo: _zod.z.string().nullable().optional(),
    totalAmount: _zod.z.number().optional(),
    notes: _zod.z.string().nullable().optional(),
    submittedBy: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date().optional(),
    updatedAt: _zod.z.coerce.date().optional()
});
const CreateEtaxSubmissionSchema = _zod.z.object({
    period: _zod.z.string().optional(),
    type: _zod.z.string().default('VAT_RETURN'),
    ercaReferenceNo: _zod.z.string().optional(),
    totalAmount: _zod.z.number().nonnegative().optional(),
    notes: _zod.z.string().optional()
});
const VatPeriodQuerySchema = _zod.z.object({
    companyId: _zod.z.string().optional(),
    period: PeriodSchema.optional(),
    page: _zod.z.coerce.number().int().min(1).default(1),
    take: _zod.z.coerce.number().int().min(1).max(500).default(50)
});
const ApportionmentResultSchema = _zod.z.object({
    filingId: _zod.z.string(),
    period: _zod.z.string(),
    apportionmentPct: _zod.z.number(),
    totalInputVat: _zod.z.number(),
    claimableInputVat: _zod.z.number(),
    nonClaimable: _zod.z.number()
});
const AutoApportionmentResultSchema = _zod.z.object({
    period: _zod.z.string(),
    taxableSales: _zod.z.number(),
    exemptSales: _zod.z.number(),
    totalSales: _zod.z.number(),
    apportionmentPct: _zod.z.number(),
    nonRecoverableVat: _zod.z.number(),
    filing: _zod.z.record(_zod.z.string(), _zod.z.unknown())
});
const IrnResultSchema = _zod.z.object({
    invoiceId: _zod.z.string(),
    invoiceNumber: _zod.z.string(),
    irn: _zod.z.string(),
    irnQrData: _zod.z.string().optional(),
    generatedAt: _zod.z.coerce.date().optional()
});
const WhtTypeSchema = _zod.z.enum([
    'GOODS',
    'SERVICES',
    'SERVICES_NR',
    'RENT',
    'DIVIDEND',
    'INTEREST'
]);
const WhtCertificateSchema = _zod.z.object({
    id: _zod.z.string(),
    certNo: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    whtType: _zod.z.string(),
    issueDate: _zod.z.coerce.date(),
    period: _zod.z.string(),
    agentName: _zod.z.string(),
    agentTin: _zod.z.string().nullable().optional(),
    supplierName: _zod.z.string(),
    supplierTin: _zod.z.string().nullable().optional(),
    grossAmount: _zod.z.number(),
    whtRate: _zod.z.number(),
    whtAmount: _zod.z.number(),
    netPayable: _zod.z.number(),
    billId: _zod.z.string().nullable().optional(),
    billReference: _zod.z.string().nullable().optional(),
    remitted: _zod.z.boolean(),
    remittedAt: _zod.z.coerce.date().nullable().optional(),
    ercaReference: _zod.z.string().nullable().optional(),
    status: _zod.z.string(),
    notes: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateWhtCertificateSchema = _zod.z.object({
    whtType: WhtTypeSchema,
    period: PeriodSchema,
    agentName: _zod.z.string().min(1),
    agentTin: _zod.z.string().optional(),
    supplierName: _zod.z.string().min(1),
    supplierTin: _zod.z.string().optional(),
    grossAmount: _zod.z.number().positive(),
    billId: _zod.z.string().optional(),
    billReference: _zod.z.string().optional(),
    notes: _zod.z.string().optional(),
    issueDate: _zod.z.string().optional(),
    companyId: _zod.z.string().optional()
});
const WhtSummarySchema = _zod.z.object({
    period: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    totalCertificates: _zod.z.number().int(),
    totalGrossAmount: _zod.z.number(),
    totalWhtDeducted: _zod.z.number(),
    totalRemitted: _zod.z.number(),
    totalUnremitted: _zod.z.number(),
    byType: _zod.z.record(_zod.z.string(), _zod.z.unknown())
});
const TotFilingSchema = _zod.z.object({
    id: _zod.z.string(),
    period: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    goodsAmount: _zod.z.number(),
    servicesAmount: _zod.z.number(),
    totGoods: _zod.z.number(),
    totServices: _zod.z.number(),
    netPayable: _zod.z.number(),
    paid: _zod.z.number().optional(),
    status: _zod.z.string(),
    dueDate: _zod.z.coerce.date().nullable().optional(),
    filedAt: _zod.z.coerce.date().nullable().optional(),
    eTaxReference: _zod.z.string().nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const IncomeTaxFilingSchema = _zod.z.object({
    id: _zod.z.string(),
    year: _zod.z.number().int(),
    fiscalYear: _zod.z.number().int(),
    companyId: _zod.z.string().nullable().optional(),
    netProfit: _zod.z.number(),
    grossIncome: _zod.z.number().optional(),
    taxableIncome: _zod.z.number().optional(),
    taxRate: _zod.z.number(),
    taxPayable: _zod.z.number(),
    whtCredits: _zod.z.number().optional(),
    provisionalPaid: _zod.z.number().optional(),
    permanentAddBacks: _zod.z.number().optional(),
    permanentDeductions: _zod.z.number().optional(),
    timingDifferences: _zod.z.number().optional(),
    paid: _zod.z.number().optional(),
    balanceDue: _zod.z.number(),
    status: _zod.z.string(),
    dueDate: _zod.z.coerce.date().nullable().optional(),
    filedAt: _zod.z.coerce.date().nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const TaxDashboardSchema = _zod.z.object({
    year: _zod.z.number().int(),
    vatCurrent: _zod.z.number(),
    incomeTaxDue: _zod.z.number(),
    drrfPending: _zod.z.number(),
    overdueFilings: _zod.z.number().int(),
    nextDue: _zod.z.object({
        vat: _zod.z.string(),
        drrf: _zod.z.string()
    }),
    complianceScore: _zod.z.number().int().min(0).max(100),
    totApplicable: _zod.z.boolean(),
    matPayable: _zod.z.number(),
    matApplies: _zod.z.boolean(),
    taxpayerCategory: _zod.z.enum([
        'A',
        'B',
        'C'
    ]),
    incomeTaxSchedule: _zod.z.string(),
    vatTotComplianceBand: _zod.z.string(),
    annualRevenue: _zod.z.number(),
    vatRegistrationRequired: _zod.z.boolean()
});
const TaxProfileSchema = _zod.z.object({
    companyId: _zod.z.string(),
    tin: _zod.z.string(),
    vatNumber: _zod.z.string().optional(),
    sector: _zod.z.string(),
    entityType: _zod.z.string(),
    vatTotBand: _zod.z.enum([
        'A',
        'B',
        'C'
    ]),
    incomeTaxSchedule: _zod.z.enum([
        'A',
        'B',
        'C'
    ]),
    isVatRegistered: _zod.z.boolean(),
    isTotApplicable: _zod.z.boolean(),
    annualTurnoverEtb: _zod.z.number(),
    taxes: _zod.z.record(_zod.z.string(), _zod.z.unknown()),
    rateOverrides: _zod.z.record(_zod.z.string(), _zod.z.number()).optional(),
    fiscalYearStartMonth: _zod.z.number().int().min(1).max(12),
    etaxAutoSubmit: _zod.z.boolean(),
    srmIntegrated: _zod.z.boolean(),
    enableDeferredTax: _zod.z.boolean()
});
const UpdateTaxProfileSchema = TaxProfileSchema.partial().omit({
    companyId: true
});
const ComplianceCheckSchema = _zod.z.object({
    taxCode: _zod.z.string(),
    label: _zod.z.string(),
    applicable: _zod.z.boolean(),
    status: _zod.z.string(),
    period: _zod.z.string(),
    dueDate: _zod.z.string().optional()
});
const ComplianceHealthSchema = _zod.z.object({
    companyId: _zod.z.string(),
    profile: _zod.z.record(_zod.z.string(), _zod.z.unknown()),
    checks: _zod.z.array(ComplianceCheckSchema),
    complianceScore: _zod.z.number().int().min(0).max(100),
    overdueCount: _zod.z.number().int(),
    upcomingDeadlines: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
});
const MorAcknowledgementReceiptSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string().optional(),
    submissionRecordId: _zod.z.string().optional(),
    submissionType: _zod.z.string(),
    receiptNumber: _zod.z.string().optional(),
    receiptDate: _zod.z.string().optional(),
    period: _zod.z.string().optional(),
    ackXml: _zod.z.string().optional(),
    ackPdf: _zod.z.string().optional(),
    verificationStatus: _zod.z.string(),
    verificationMethod: _zod.z.string().optional(),
    documentHash: _zod.z.string().optional(),
    downloadUrl: _zod.z.string().optional(),
    submittedBy: _zod.z.string().optional(),
    verifiedAt: _zod.z.string().optional(),
    verifiedBy: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const CreateMorAcknowledgementReceiptSchema = _zod.z.object({
    companyId: _zod.z.string().optional(),
    submissionRecordId: _zod.z.string().optional(),
    submissionType: _zod.z.string().default('VAT_RETURN'),
    receiptNumber: _zod.z.string().optional(),
    receiptDate: _zod.z.string().optional(),
    period: _zod.z.string().optional(),
    ackXml: _zod.z.string().optional(),
    ackPdf: _zod.z.string().optional(),
    verificationStatus: _zod.z.string().default('PENDING'),
    verificationMethod: _zod.z.string().optional(),
    documentHash: _zod.z.string().optional(),
    downloadUrl: _zod.z.string().optional(),
    submittedBy: _zod.z.string().optional()
});
const UpdateMorAcknowledgementReceiptSchema = CreateMorAcknowledgementReceiptSchema.partial();
const AckReceiptQuerySchema = _zod.z.object({
    page: _zod.z.number().int().positive().default(1),
    limit: _zod.z.number().int().positive().max(100).default(20),
    period: _zod.z.string().optional(),
    submissionType: _zod.z.string().optional(),
    verificationStatus: _zod.z.string().optional(),
    search: _zod.z.string().optional()
});
const VatRateCategorySchema = _zod.z.enum([
    'STANDARD',
    'REDUCED',
    'ZERO',
    'EXEMPT'
]);
const VatLineItemSchema = _zod.z.object({
    id: _zod.z.string(),
    declarationId: _zod.z.string(),
    invoiceReference: _zod.z.string().optional(),
    rateCategory: VatRateCategorySchema,
    percentage: _zod.z.number(),
    netAmount: _zod.z.number(),
    vatAmount: _zod.z.number(),
    isDeductible: _zod.z.boolean()
});
const VatDeclarationSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string(),
    taxPeriod: _zod.z.string(),
    countryCode: _zod.z.string(),
    status: _zod.z.string(),
    version: _zod.z.number().int(),
    totalNetSales: _zod.z.number(),
    totalVatDue: _zod.z.number(),
    totalVatDeductible: _zod.z.number(),
    netVatPayable: _zod.z.number(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    lineItems: _zod.z.array(VatLineItemSchema),
    auditLogs: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
});
const SubmitVatDeclarationSchema = _zod.z.object({
    companyId: _zod.z.string(),
    taxPeriod: _zod.z.string().regex(/^\d{4}-(Q[1-4]|M[0-1][0-2])$/, 'Period must match YYYY-QX or YYYY-MM'),
    countryCode: _zod.z.string().regex(/^[A-Z]{2}$/, 'Country code must be a valid 2-letter ISO standard'),
    lineItems: _zod.z.array(_zod.z.object({
        invoiceReference: _zod.z.string(),
        rateCategory: VatRateCategorySchema,
        percentage: _zod.z.string().regex(/^\d+(\.\d{1,4})?$/, 'Percentage must be a stringified precision decimal'),
        netAmount: _zod.z.string().regex(/^-?\d+(\.\d{1,4})?$/, 'NetAmount must be a stringified precision decimal')
    }))
});
const TaxAuditLogSchema = _zod.z.object({
    id: _zod.z.string(),
    declarationId: _zod.z.string(),
    userId: _zod.z.string(),
    action: _zod.z.string(),
    previousPayload: _zod.z.string().optional(),
    currentPayload: _zod.z.string().optional(),
    digitalSignature: _zod.z.string().optional(),
    timestamp: _zod.z.coerce.date()
});
