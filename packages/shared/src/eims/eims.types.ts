import type { MorSourceRegistrationStep } from './mor-onboarding-checklist';

/**
 * EIMS (Electronic Invoice Management System) — MoR/INSA compliance types.
 * Based on: EIMS_compliance_Draft.pdf, certificate_guideline.pdf
 */

/** Top-level signed request envelope sent to all EIMS endpoints */
export interface EimsSignedRequest<T = unknown> {
  request: T;
  signature: string;
  certificate: string;
}

/** Authentication login request body (inside signed envelope) */
export interface EimsAuthRequest {
  clientId: string;
  clientSecret: string;
  apikey: string;
  tin: string;
}

/** Successful auth / token refresh response */
export interface EimsAuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    encryptionKey: string | null;
    expiresIn: number;
  };
  status: string;
}

/** Token refresh request */
export interface EimsRefreshRequest {
  refreshToken: string;
}

/** Encrypted payload wrapper for non-auth EIMS calls */
export interface EimsEncryptedPayload {
  data: string;
}

/** Buyer / seller party details per EIMS schema */
export interface EimsPartyDetails {
  City: string | null;
  Email: string;
  HouseNumber: string | null;
  LegalName: string;
  Phone: string;
  Region: string;
  SubCity?: string | null;
  Locality?: string | null;
  Tin: string;
  VatNumber: string;
  Wereda: string;
  /** Buyer-only fields */
  IdNumber?: string;
  IdType?: string;
  Country?: string;
  Zone?: string;
  Kebele?: string;
}

export interface EimsDocumentDetails {
  DocumentNumber: string;
  Date: string;
  Type: 'INV' | 'CRN' | 'DBN';
}

export interface EimsItemLine {
  Discount: number;
  ExciseTaxValue: number;
  HarmonizationCode: string | null;
  NatureOfSupplies: 'Goods' | 'Services';
  ItemCode: string;
  ProductDescription: string;
  PreTaxValue: number;
  Quantity: number;
  LineNumber: number;
  TaxAmount: number;
  TaxCode: string;
  TotalLineAmount: number;
  Unit: string;
  UnitPrice: number;
}

export interface EimsPaymentDetails {
  Mode: string;
  PaymentTerm: string;
}

export interface EimsReferenceDetails {
  PreviousIrn: string;
  RelatedDocument: string | null;
}

export interface EimsSourceSystem {
  CashierName: string;
  InvoiceCounter: number;
  SalesPersonName: string;
  SystemNumber: string;
  SystemType: 'ERP' | 'POS' | 'MANUAL';
  enterpriseId?: string;
  registrationStep?: MorSourceRegistrationStep;
}

export interface EimsValueDetails {
  Discount?: number | null;
  ExciseValue: number;
  IncomeWithholdValue: number;
  TaxValue: number;
  TotalValue: number;
  TransactionWithholdValue: number;
  InvoiceCurrency: string;
}

/** Full invoice registration request (the `request` object before signing) */
export interface EimsInvoiceRegistrationRequest {
  BuyerDetails: EimsPartyDetails;
  DocumentDetails: EimsDocumentDetails;
  ItemList: EimsItemLine[];
  PaymentDetails: EimsPaymentDetails;
  ReferenceDetails: EimsReferenceDetails;
  SellerDetails: EimsPartyDetails;
  SourceSystem: EimsSourceSystem;
  TransactionType: 'B2B' | 'B2C' | 'B2G' | 'EXP' | 'IMP';
  ValueDetails: EimsValueDetails;
  Version: string;
}

/** Successful registration response body */
export interface EimsRegistrationResponseBody {
  irn: string;
  ackDate: string;
  signedQR: string;
  status: string;
  documentNumber: string;
  signedInvoice: string;
  invoiceSignature?: string;
}

export interface EimsRegistrationResponse {
  statusCode: number;
  message: string;
  body: EimsRegistrationResponseBody;
}

/** Schema validation error item */
export interface EimsSchemaError {
  type: string;
  code: string;
  message: string;
  instanceLocation: string;
  property: string;
  evaluationPath: string;
  schemaLocation: string;
  messageKey: string;
  arguments: string[];
}

export interface EimsErrorResponse {
  statusCode: number;
  message: string;
  body?: EimsSchemaError[] | string[];
  code?: string | number;
  details?: Array<{ field?: string; errorMessage: string }>;
}

/** Cancellation request */
export interface EimsCancellationRequest {
  irn: string;
  reasonCode: string;
  remark?: string;
}

export interface EimsCancellationResponse {
  statusCode: number;
  message: string;
  body: {
    cancellationDate: string;
  };
}

/** Bulk registration async response */
export interface EimsBulkRegistrationResponse {
  conversationId: string;
  status: number;
}

/** Invoice verification request (POST /v1/verify) */
export interface EimsVerifyRequest {
  irn: string;
}

export interface EimsVerifyResponse {
  statusCode: number;
  message: string;
  body: {
    status: 'ACTIVE' | 'CANCELLED' | 'NOT_REGISTERED' | string;
    irn?: string;
    invoice?: EimsInvoiceRegistrationRequest;
  };
}

/** Bulk cancellation item */
export interface EimsBulkCancellationItem {
  Irn: string;
  ReasonCode: string;
  Remark?: string;
}

/** Sales receipt registration (EIMS Section 6 / Annex 1) */
export interface EimsSalesReceiptRequest {
  ReceiptNumber: string;
  ReceiptType: 'Sales Receipts' | 'Withholding Receipts';
  Reason: string;
  ReceiptDate: string;
  ReceiptCounter: string;
  ManualReceiptNumber?: string;
  SourceSystemType: string;
  SourceSystemNumber: string;
  ReceiptCurrency: string;
  ExchangeRate?: number | null;
  CollectedAmount: number;
  SellerTIN: string;
  Invoices: Array<{
    InvoiceIRN: string;
    PaymentCoverage: 'FULL' | 'PARTIAL';
    InvoicePaidAmount: number;
    DiscountAmount?: number | null;
    RemainingAmount?: number | null;
    TotalAmount: number;
  }>;
  TransactionDetails: {
    ModeOfPayment: 'CASH' | 'CHEQUE' | 'CPO' | 'Local Bank Transfer' | 'SWIFT' | 'Wire Transfer' | 'Letter of Credit' | 'Card';
    ChequeNumber?: string | null;
    CPONumber?: string | null;
    DocumentNumber?: string | null;
    CollectorName?: string;
    PaymentServiceProvider?: string | null;
    OtherPaymentServiceProviderName?: string | null;
    AccountNumber?: string | null;
    TransactionNumber?: string | null;
  };
}

/** Withholding receipt registration */
export interface EimsWithholdingReceiptRequest {
  ReceiptNumber: string;
  Reason: string;
  ReceiptCounter: string;
  ManualReceiptNumber?: string;
  SourceSystemType: string;
  SourceSystemNumber: string;
  InvoiceDetail: {
    InvoiceIRN: string;
    Currency: string;
    ExchangeRate?: number | null;
  };
  WithholdDetail: {
    Type: 'TWHT' | 'IWHT';
    Rate?: number | null;
    PreTaxAmount: number;
    WithholdingAmount: number;
  };
}

export interface EimsReceiptResponse {
  statusCode: number;
  message: string;
  body?: {
    receiptIrn?: string;
    ackDate?: string;
    signedQR?: string;
    status?: string;
    rrn?: string;
    qr?: string;
  };
}

export interface EimsSummaryReportResponse {
  statusCode: number;
  message: string;
  body: {
    reportReference: string;
    status: string;
    ackDate: string;
  };
}

export interface EimsSummaryReportItem {
  Irn: string;
  DocumentNumber: string;
  InvoiceValue: number;
  TaxValue: number;
  InvoiceDate: string;
}

export interface EimsSummaryReportRequest {
  ReportType: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
  PeriodStart: string;
  PeriodEnd: string;
  SellerDetails: {
    Tin: string;
    LegalName: string;
  };
  Summary: {
    TotalInvoiceCount: number;
    TotalInvoiceValue: number;
    TotalTaxValue: number;
    TotalValueWithTax: number;
  };
  Invoices: EimsSummaryReportItem[];
}

/** Bulk async callback payload from MoR */
export interface EimsBulkCallbackPayload {
  conversationId: string;
  status: number;
  results?: Array<{
    irn?: string;
    documentNumber?: string;
    status?: string;
    error?: string;
  }>;
}

/** Source system registration status (MoR portal) */
export type EimsSourceSystemStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface EimsEnterprise {
  id: string;
  name: string;
  tin: string;
}

export interface EimsEstablishment {
  id: string;
  enterpriseId: string;
  name: string;
  address?: string;
}

/** Certificate lifecycle status */
export type EimsCertificateStatus =
  | 'PENDING_CSR'
  | 'CSR_SUBMITTED'
  | 'ISSUED'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'REVOKED';

/** EIMS registration status on an invoice */
export type EimsInvoiceStatus =
  | 'NOT_REGISTERED'
  | 'PENDING'
  | 'REGISTERED'
  | 'FAILED'
  | 'CANCELLED';

/** Company EIMS integration config (stored in systemsetting or env) */
export interface EimsIntegrationConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  tin: string;
  systemNumber: string;
  systemType: EimsSourceSystem['SystemType'];
  callbackUrl?: string;
  sandbox: boolean;
  timeout?: number;
}

/** CSR configuration for INSA certificate request */
export interface EimsCsrConfig {
  countryName: string;
  stateOrProvince: string;
  locality: string;
  organizationName: string;
  organizationalUnitName: string;
  commonName: string; // TIN
  serialNumber: string; // System Number
  emailAddress: string;
}

/** INSA Cybersecurity Audit compliance area */
export interface InsaComplianceItem {
  id: string;
  area: string;
  metric: string;
  requirement: string;
  explanation: string;
  /** Whether OVDS implements this control */
  implemented: boolean;
  evidence?: string;
}
