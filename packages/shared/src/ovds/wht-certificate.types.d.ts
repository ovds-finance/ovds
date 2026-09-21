/**
 * WHT Certificate Types — @ovds/shared (extended)
 * Extends the basic WhtCertificate from vat.types.ts with full DB-backed fields.
 * Federal Income Tax Proclamation No. 979/2016 — MoR Withholding Tax Certificates.
 * Authority: Ministry of Revenues (MoR), formerly ERCA. Portal: etax.mor.gov.et
 *
 * NOTE: WhtType is already exported from ./tax-calc (re-used here via import).
 * NOTE: WhtCertificate (basic display) is in ./vat.types — this file adds
 *       WhtCertificateRecord (full DB record) and helper functions.
 */
import type { WhtType } from './tax-calc';
export type { WhtType };
export type WhtCertStatus = 'DRAFT' | 'ISSUED' | 'REMITTED' | 'CANCELLED';
/**
 * WHT rates per Procurement & AP rules (Proclamation No. 1395/2025).
 * Eligible supplier payments: 3% on goods ≥ ETB 10,000 and
 * 3% on services ≥ ETB 500. Raised from 2% to 3% by Proc. 1395/2025 Art. 94.
 */
export declare const WHT_RATES: Record<WhtType, number>;
export declare const WHT_THRESHOLDS: Partial<Record<WhtType, number>>;
export declare const WHT_TYPE_LABELS: Record<WhtType, string>;
/**
 * Full DB-backed WHT certificate record (maps to wht_certificate table).
 * The simpler WhtCertificate interface in vat.types.ts is kept for backward compat.
 */
export interface WhtCertificateRecord {
    id: string;
    certNo: string;
    companyId?: string | null;
    whtType: WhtType;
    issueDate: string;
    period: string;
    agentName: string;
    agentTin?: string | null;
    supplierName: string;
    supplierTin?: string | null;
    grossAmount: number;
    whtRate: number;
    whtAmount: number;
    netPayable: number;
    billId?: string | null;
    billReference?: string | null;
    remitted: boolean;
    remittedAt?: string | null;
    /** MoR reference number for this WHT remittance (field kept as ercaReference for DB compat) */
    ercaReference?: string | null;
    status: WhtCertStatus;
    notes?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface CreateWhtCertificateDto {
    companyId?: string;
    whtType: WhtType;
    issueDate?: string;
    period: string;
    agentName: string;
    agentTin?: string;
    supplierName: string;
    supplierTin?: string;
    grossAmount: number;
    billId?: string;
    billReference?: string;
    notes?: string;
}
export interface WhtCertificateSummary {
    period: string;
    totalCertificates: number;
    totalGrossAmount: number;
    totalWhtDeducted: number;
    totalRemitted: number;
    totalUnremitted: number;
    byType: Record<WhtType, {
        count: number;
        grossAmount: number;
        whtAmount: number;
    }>;
}
/** Calculate WHT for a given amount and type */
export declare function calcWhtCertificate(grossAmount: number, whtType: WhtType): {
    whtRate: number;
    whtAmount: number;
    netPayable: number;
    meetsThreshold: boolean;
};
//# sourceMappingURL=wht-certificate.types.d.ts.map