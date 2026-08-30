/**
 * Stamp Duty — Ethiopia
 * Based on: Stamp Duty Proclamation No. 110/1998 (as amended)
 * Administered by: Regional/City Revenue Bureaus
 *
 * Stamp duty is levied on specific legal documents and instruments.
 */

export type StampDutyDocumentType =
  | 'MEMORANDUM_OF_ASSOCIATION'
  | 'ARTICLES_OF_ASSOCIATION'
  | 'SHARE_CERTIFICATE'
  | 'SHARE_TRANSFER'
  | 'DEBENTURE'
  | 'LEASE_AGREEMENT'
  | 'PROPERTY_TRANSFER'
  | 'POWER_OF_ATTORNEY'
  | 'PROMISSORY_NOTE'
  | 'BILL_OF_EXCHANGE'
  | 'CONTRACT'
  | 'INSURANCE_POLICY'
  | 'LOAN_AGREEMENT'
  | 'RECEIPT'
  | 'OTHER';

/** Stamp duty rates per document type */
export const STAMP_DUTY_RATES: Record<StampDutyDocumentType, {
  type: 'FIXED' | 'PERCENTAGE';
  rate?: number;         // percentage of transaction value
  fixedAmount?: number;  // ETB fixed amount
  notes: string;
}> = {
  MEMORANDUM_OF_ASSOCIATION:  { type: 'FIXED',      fixedAmount: 1_000, notes: 'ETB 1,000 on Memorandum of Association' },
  ARTICLES_OF_ASSOCIATION:    { type: 'FIXED',      fixedAmount: 500,   notes: 'ETB 500 on Articles of Association' },
  SHARE_CERTIFICATE:          { type: 'PERCENTAGE', rate: 0.001,        notes: '0.1% of face value per certificate' },
  SHARE_TRANSFER:             { type: 'PERCENTAGE', rate: 0.005,        notes: '0.5% of transfer consideration' },
  DEBENTURE:                  { type: 'PERCENTAGE', rate: 0.001,        notes: '0.1% of face value' },
  LEASE_AGREEMENT:            { type: 'PERCENTAGE', rate: 0.005,        notes: '0.5% of total annual rent' },
  PROPERTY_TRANSFER:          { type: 'PERCENTAGE', rate: 0.02,         notes: '2% of property transfer value' },
  POWER_OF_ATTORNEY:          { type: 'FIXED',      fixedAmount: 100,   notes: 'ETB 100 flat' },
  PROMISSORY_NOTE:            { type: 'PERCENTAGE', rate: 0.001,        notes: '0.1% of face value, min ETB 10' },
  BILL_OF_EXCHANGE:           { type: 'PERCENTAGE', rate: 0.001,        notes: '0.1% of face value' },
  CONTRACT:                   { type: 'PERCENTAGE', rate: 0.005,        notes: '0.5% of contract value' },
  INSURANCE_POLICY:           { type: 'PERCENTAGE', rate: 0.001,        notes: '0.1% of premium amount' },
  LOAN_AGREEMENT:             { type: 'PERCENTAGE', rate: 0.001,        notes: '0.1% of loan amount' },
  RECEIPT:                    { type: 'FIXED',      fixedAmount: 1,     notes: 'ETB 1 flat per receipt above ETB 10' },
  OTHER:                      { type: 'FIXED',      fixedAmount: 50,    notes: 'ETB 50 default' },
};

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

export function calculateStampDuty(documentType: StampDutyDocumentType, transactionValue = 0): number {
  const config = STAMP_DUTY_RATES[documentType];
  if (config.type === 'FIXED') return config.fixedAmount ?? 0;
  return transactionValue * (config.rate ?? 0);
}
