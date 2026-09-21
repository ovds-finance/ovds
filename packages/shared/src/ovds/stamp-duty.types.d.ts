/**
 * Stamp Duty — Ethiopia
 * Based on: Stamp Duty Proclamation No. 110/1998 (as amended)
 * Administered by: Regional/City Revenue Bureaus
 *
 * Stamp duty is levied on specific legal documents and instruments.
 */
export type StampDutyDocumentType = 'MEMORANDUM_OF_ASSOCIATION' | 'ARTICLES_OF_ASSOCIATION' | 'SHARE_CERTIFICATE' | 'SHARE_TRANSFER' | 'DEBENTURE' | 'LEASE_AGREEMENT' | 'PROPERTY_TRANSFER' | 'POWER_OF_ATTORNEY' | 'PROMISSORY_NOTE' | 'BILL_OF_EXCHANGE' | 'CONTRACT' | 'INSURANCE_POLICY' | 'LOAN_AGREEMENT' | 'RECEIPT' | 'OTHER';
/** Stamp duty rates per document type */
export declare const STAMP_DUTY_RATES: Record<StampDutyDocumentType, {
    type: 'FIXED' | 'PERCENTAGE';
    rate?: number;
    fixedAmount?: number;
    notes: string;
}>;
export interface StampDutyRecord {
    id: string;
    companyId: string;
    documentType: StampDutyDocumentType;
    documentDescription: string;
    documentDate: string;
    transactionValue?: number;
    stampDutyAmount: number;
    status: 'DRAFT' | 'PAID' | 'EXEMPT' | 'PENDING';
    paymentDate?: string;
    paymentReference?: string;
    municipality?: string;
    notes?: string;
    createdAt: string;
}
export declare function calculateStampDuty(documentType: StampDutyDocumentType, transactionValue?: number): number;
//# sourceMappingURL=stamp-duty.types.d.ts.map