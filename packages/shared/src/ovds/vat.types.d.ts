import { z } from 'zod';
/** VAT registration threshold — raised to ETB 2,000,000/year by Regulation No. 570/2025 */
export declare const VAT_THRESHOLD_ETB: 2000000;
/** Standard VAT rate: 15% (unchanged) */
export declare const VAT_RATE: 0.15;
export declare enum TaxDeclarationStatus {
    DRAFT = "DRAFT",
    VALIDATING = "VALIDATING",
    SUBMITTED = "SUBMITTED",
    AMENDED = "AMENDED",
    REJECTED = "REJECTED"
}
export declare enum VatRateCategory {
    STANDARD = "STANDARD",
    REDUCED = "REDUCED",
    ZERO = "ZERO",
    EXEMPT = "EXEMPT"
}
export declare const VatLineItemSchema: z.ZodObject<{
    invoiceReference: z.ZodString;
    rateCategory: z.ZodEnum<typeof VatRateCategory>;
    percentage: z.ZodString;
    netAmount: z.ZodString;
}, z.core.$strip>;
export declare const VatDeclarationSchema: z.ZodObject<{
    companyId: z.ZodString;
    taxPeriod: z.ZodString;
    countryCode: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        invoiceReference: z.ZodString;
        rateCategory: z.ZodEnum<typeof VatRateCategory>;
        percentage: z.ZodString;
        netAmount: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type VatDeclarationInput = z.infer<typeof VatDeclarationSchema>;
/** VAT Filing from /api/ovds/vat/filings */
export interface VatFiling {
    id: string;
    period: string;
    collected: number;
    paid: number;
    netPayable: number;
    status: 'PENDING' | 'FILED' | 'PAID';
    dueDate: string;
    filedAt?: string;
    createdAt?: string;
}
/** VAT Declaration — MoR-compliant multi-jurisdictional filing */
export interface VatDeclaration {
    id: string;
    companyId: string;
    taxPeriod: string;
    countryCode: string;
    status: 'DRAFT' | 'VALIDATING' | 'SUBMITTED' | 'AMENDED' | 'REJECTED';
    version: number;
    totalNetSales: string;
    totalVatDue: string;
    totalVatDeductible: string;
    netVatPayable: string;
    lineItems: VatLineItem[];
    createdAt: string;
    updatedAt: string;
}
export interface VatLineItem {
    id: string;
    declarationId: string;
    invoiceReference?: string;
    rateCategory: 'STANDARD' | 'REDUCED' | 'ZERO' | 'EXEMPT';
    percentage: string;
    netAmount: string;
    vatAmount: string;
    isDeductible: boolean;
}
export interface TaxAuditLog {
    id: string;
    declarationId: string;
    userId: string;
    action: string;
    previousPayload?: string;
    currentPayload?: string;
    digitalSignature?: string;
    timestamp: string;
}
/** VAT Summary from /api/ovds/vat/summary */
export interface VatSummary {
    period: string;
    totalSales: number;
    totalPurchases: number;
    outputVat: number;
    inputVat: number;
    netVat: number;
    invoiceCount: number;
    billCount: number;
    ytdOutputVat?: number;
    ytdInputVat?: number;
    annualRevenue?: number;
    vatThreshold?: number;
    vatThresholdStatus?: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
    vatThresholdPct?: number;
    taxpayerCategory?: 'A' | 'B';
    totPayable?: number;
    totRate?: number;
    whtPayable?: number;
    filingDeadline?: string;
    latePenaltyPerDay?: number;
}
/** VAT Dashboard from /api/ovds/vat/dashboard */
export interface VatDashboard {
    totalOutputVat: number;
    totalInputVat: number;
    claimableInputVat: number;
    netPayable: number;
    totalWithheld: number;
    unremittedWithholding: number;
    totalReverseCharge: number;
    pendingRefunds: number;
}
/** Input VAT Ledger Entry */
export interface InputVatEntry {
    id: string;
    supplier: string;
    category: 'goods' | 'services' | 'capital' | 'digital';
    invoiceNo: string;
    date: string;
    netAmount: number;
    vatAmount: number;
    claimable: boolean;
    period?: string;
    sourceRef?: string;
}
/** Output VAT Ledger Entry */
export interface OutputVatEntry {
    id: string;
    customer: string;
    category: 'goods' | 'services' | 'export' | 'exempt';
    invoiceNo: string;
    date: string;
    netAmount: number;
    vatAmount: number;
    period?: string;
    sourceRef?: string;
}
/** Withholding Entry */
export interface WithholdingEntry {
    id: string;
    supplier: string;
    tin: string;
    invoiceDate: string;
    invoiceAmount: number;
    withheldVat: number;
    remitted: boolean;
    period?: string;
}
/** Reverse-Charge Entry */
export interface ReverseChargeEntry {
    id: string;
    supplier: string;
    service: string;
    invoiceDate: string;
    amountETB: number;
    vatDue: number;
    period?: string;
}
/** Refund Claim */
export interface RefundClaim {
    id: string;
    ref: string;
    period: string;
    submittedDate: string;
    amount: number;
    status: 'submitted' | 'under_review' | 'approved' | 'paid' | 'rejected';
    notes?: string;
}
/** VAT Note */
export interface VatNote {
    id: string;
    date: string;
    /** 'erca_notice' kept as-is for DB compatibility — issued by MoR (formerly ERCA) */
    type: 'internal' | 'erca_notice' | 'audit' | 'correspondence';
    subject: string;
    body: string;
    pinned?: boolean;
}
/** Export Evidence */
export interface ExportEvidence {
    id: string;
    invoiceNo: string;
    customer: string;
    exportDate: string;
    amountETB: number;
    customsDecl: 'missing' | 'partial' | 'complete';
    billOfLading: 'missing' | 'partial' | 'complete';
    bankReceipt: 'missing' | 'partial' | 'complete';
}
/** eTax Portal Submission record — submitted to Ministry of Revenues (MoR) via etax.mor.gov.et */
export interface EtaxSubmission {
    id: string;
    period: string;
    type: 'VAT_RETURN' | 'WHT_RETURN' | 'BIT_DECLARATION' | 'DRRF_LEVY';
    status: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'FAILED';
    submittedAt?: string;
    /** MoR reference number — field kept as ercaReferenceNo for DB backward-compatibility */
    ercaReferenceNo?: string;
    totalAmount: number;
    notes?: string;
    createdAt: string;
}
/** Withholding Tax Certificate */
export interface WhtCertificate {
    id: string;
    certNo: string;
    issueDate: string;
    withholdingAgent: string;
    supplierName: string;
    supplierTin?: string;
    billReference: string;
    grossAmount: number;
    whtRate: number;
    whtAmount: number;
    period: string;
    remitted: boolean;
}
/** Business Income Tax Declaration */
export interface BitDeclaration {
    id: string;
    filingYear: string;
    taxpayerType: 'corporate' | 'individual';
    grossIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    grossTax: number;
    whtCredits: number;
    provisionalPaid: number;
    netTaxDue: number;
    effectiveRate: number;
    status: 'DRAFT' | 'FILED' | 'PAID';
    filingDeadline: string;
    submittedAt?: string;
    /** MoR reference number for this BIT declaration (kept as ercaRef for DB compat) */
    ercaRef?: string;
}
/** Disaster Fund Levy record */
export interface DrrfLevy {
    id: string;
    category: string;
    baseAmount: number;
    levyAmount: number;
    period: string;
    status: 'COLLECTED' | 'REMITTED' | 'OVERDUE';
    remittedAt?: string;
    referenceNo?: string;
}
/** Tax Liability Summary (consolidated view) */
export interface TaxLiabilitySummary {
    period: string;
    vatPayable: number;
    vatRefundable: number;
    whtUnremitted: number;
    drrfPending: number;
    bitEstimate: number;
    totalLiability: number;
    nextDeadline: string;
    nextDeadlineType: string;
}
/** VAT Return PDF metadata — for display and download */
export interface VatReturnPdf {
    period: string;
    generatedAt: string;
    outputVat: number;
    inputVat: number;
    netPayable: number;
    filingDeadline: string;
    /** MoR reference number (kept as ercaRef for DB compat) */
    ercaRef?: string;
}
//# sourceMappingURL=vat.types.d.ts.map