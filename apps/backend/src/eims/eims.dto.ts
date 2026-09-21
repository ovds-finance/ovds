/**
 * EIMS controller DTOs.
 *
 * Every TIN-bearing field enforces the statutory Ethiopian TIN format
 * (/^\d{10}$/) at the request boundary via class-validator, so a malformed
 * TIN never reaches the MoR client (which would otherwise reject it with a
 * SCHEMA ERROR and abort the whole batch).
 */
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  Min,
} from 'class-validator';

export const TIN_REGEX = /^\d{10}$/;
export const TIN_MESSAGE = 'TIN must be exactly 10 digits';

/** A single invoice line, as supplied by the OVDS frontend. */
export class InvoiceLineDto {
  @IsString() @IsNotEmpty() itemCode: string;
  @IsString() @IsNotEmpty() productDescription: string;
  @IsString() @IsNotEmpty() natureOfSupplies: 'Goods' | 'Services';
  @IsString() @IsNotEmpty() unit: string;
  @IsInt() @Min(1) quantity: number;
  @IsDecimal() unitPrice: string;
  @IsDecimal() preTaxValue: string;
  @IsDecimal() taxAmount: string;
  @IsDecimal() totalLineAmount: string;
  @IsDecimal() discount: string;
  @IsDecimal() exciseTaxValue: string;
  @IsString() @IsNotEmpty() taxCode: string;
  @IsString() @IsOptional() harmonizationCode?: string | null;
  @IsInt() @Min(1) lineNumber: number;
}

export class PartyDetailsDto {
  @Matches(TIN_REGEX, { message: TIN_MESSAGE }) tin: string;
  @IsString() @IsNotEmpty() legalName: string;
  @IsString() @IsNotEmpty() vatNumber: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() region: string;
  @IsString() @IsNotEmpty() wereda: string;
  @IsString() @IsOptional() houseNumber?: string | null;
  @IsString() @IsOptional() subCity?: string | null;
  @IsString() @IsOptional() locality?: string | null;
  @IsString() @IsOptional() idNumber?: string;
  @IsString() @IsOptional() idType?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() zone?: string;
  @IsString() @IsOptional() kebele?: string;
}

export class RegisterInvoiceDto {
  @IsString() @IsNotEmpty() invoiceId: string;
  @IsString() @IsNotEmpty() documentNumber: string;
  @IsString() @IsNotEmpty() date: string;
  @IsEnum(['INV', 'CRN', 'DBN']) documentType: 'INV' | 'CRN' | 'DBN';
  @ValidateNested() @Type(() => PartyDetailsDto) seller: PartyDetailsDto;
  @ValidateNested() @Type(() => PartyDetailsDto) buyer: PartyDetailsDto;
  @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceLineDto) lines: InvoiceLineDto[];
  @IsEnum(['B2B', 'B2C', 'B2G', 'EXP', 'IMP']) transactionType: 'B2B' | 'B2C' | 'B2G' | 'EXP' | 'IMP';
  @IsDecimal() totalValue: string;
  @IsDecimal() taxValue: string;
  @IsDecimal() exciseValue: string;
  @IsDecimal() incomeWithholdValue: string;
  @IsDecimal() transactionWithholdValue: string;
  @IsDecimal() discount: string;
  @IsString() @IsNotEmpty() invoiceCurrency: string;
  @IsString() @IsNotEmpty() systemNumber: string;
  @IsEnum(['ERP', 'POS', 'MANUAL']) systemType: 'ERP' | 'POS' | 'MANUAL';
  @IsString() @IsOptional() salesPersonName?: string;
  @IsString() @IsOptional() cashierName?: string;
  @IsString() @IsOptional() paymentTerm?: string;
  @IsString() @IsOptional() paymentMode?: string;
  @IsString() @IsOptional() previousIrn?: string;
  @IsString() @IsOptional() relatedDocument?: string | null;
  @IsString() @IsOptional() version?: string;
}

export class CancelInvoiceDto {
  @IsString() @IsNotEmpty() reasonCode: string;
  @IsString() @IsOptional() remark?: string;
}

export class VerifyInvoiceDto {
  @IsString() @IsNotEmpty() irn: string;
}

/**
 * Lightweight body for `POST /eims/invoices/:id/register`. The frontend only
 * sends the OVDS invoice id (the `:id` path param); the backend resolves the
 * full MoR payload from the invoice aggregate via the data-mapping registry.
 * `systemNumber`/`salesPersonName`/`cashierName` are optional overrides.
 */
export class RegisterInvoiceInputDto {
  @IsOptional() @IsEnum(['INV', 'CRN', 'DBN']) source?: 'INV' | 'CRN' | 'DBN';
  @IsString() @IsOptional() systemNumber?: string;
  @IsString() @IsOptional() salesPersonName?: string;
  @IsString() @IsOptional() cashierName?: string;
}

export class BulkRegisterDto {
  @IsArray() @IsString({ each: true }) invoiceIds: string[];
}

export class BulkCancelItemDto {
  @IsString() @IsNotEmpty() invoiceId: string;
  @IsString() @IsNotEmpty() reasonCode: string;
  @IsString() @IsOptional() remark?: string;
}

export class BulkCancelDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => BulkCancelItemDto) items: BulkCancelItemDto[];
}

export class SalesReceiptDto {
  @IsString() @IsNotEmpty() invoiceId: string;
  @IsString() @IsNotEmpty() receiptNumber: string;
  @IsDecimal() collectedAmount: string;
  @IsString() @IsOptional() paymentMode?: string;
  @IsString() @IsOptional() collectorName?: string;
  @IsString() @IsOptional() reason?: string;
  @IsEnum(['FULL', 'PARTIAL']) paymentCoverage: 'FULL' | 'PARTIAL';
  @IsString() @IsOptional() chequeNumber?: string;
  @IsString() @IsOptional() cpoNumber?: string;
}

export class WithholdingReceiptDto {
  @IsString() @IsNotEmpty() invoiceId: string;
  @IsString() @IsNotEmpty() receiptNumber: string;
  @IsEnum(['TWHT', 'IWHT']) withholdType: 'TWHT' | 'IWHT';
  @IsDecimal() preTaxAmount: string;
  @IsDecimal() withholdingAmount: string;
  @IsString() @IsOptional() reason?: string;
}

export class InvoiceSummaryReportItemDto {
  @IsString() @IsNotEmpty() irn: string;
  @IsString() @IsNotEmpty() documentNumber: string;
  @IsDecimal() invoiceValue: string;
  @IsDecimal() taxValue: string;
  @IsString() @IsNotEmpty() invoiceDate: string;
}

export class SubmitInvoiceSummaryReportDto {
  @IsEnum(['DAILY', 'MONTHLY', 'QUARTERLY']) reportType: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
  @IsString() @IsNotEmpty() periodStart: string;
  @IsString() @IsNotEmpty() periodEnd: string;

  // Seller identity and every reported figure are resolved server-side from the
  // tenant's own records and the OVDS ledger (see EimsService.compileInvoiceSummary).
  // These fields are optional and accepted only as a reconciliation checksum:
  // when supplied they must match the ledger exactly or the filing is rejected
  // with 422. They are never used to build the payload sent to the MoR.
  @IsOptional() @Matches(TIN_REGEX, { message: TIN_MESSAGE }) sellerTin?: string;
  @IsOptional() @IsString() sellerLegalName?: string;
  @IsOptional() @IsInt() @Min(0) totalInvoiceCount?: number;
  @IsOptional() @IsDecimal() totalInvoiceValue?: string;
  @IsOptional() @IsDecimal() totalTaxValue?: string;
  @IsOptional() @IsDecimal() totalValueWithTax?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceSummaryReportItemDto) invoices?: InvoiceSummaryReportItemDto[];
}

export class RegisterSourceSystemDto {
  @IsString() @IsNotEmpty() systemNumber: string;
  @IsEnum(['ERP', 'POS', 'MANUAL']) systemType: 'ERP' | 'POS' | 'MANUAL';
  @Matches(TIN_REGEX, { message: TIN_MESSAGE }) tin: string;
  @IsString() @IsOptional() enterpriseId?: string;
  @IsString() @IsOptional() establishmentId?: string;
  @IsString() @IsOptional() clientId?: string;
  @IsString() @IsOptional() clientSecret?: string;
  @IsString() @IsOptional() apiKey?: string;
  @IsString() @IsOptional() callbackUrl?: string;
}

export class BulkCallbackDto {
  @IsString() @IsNotEmpty() conversationId: string;
  @IsString() @IsNotEmpty() status: string;
  @IsOptional() results?: unknown[];
}

/** The handful of payment modes the MoR accepts on a sales receipt. */
export const MOR_PAYMENT_MODES = [
  'CASH',
  'CHEQUE',
  'CPO',
  'Local Bank Transfer',
  'SWIFT',
  'Wire Transfer',
  'Letter of Credit',
  'Card',
] as const;

export function normalizePaymentMode(mode?: string, defaultMode?: string): (typeof MOR_PAYMENT_MODES)[number] {
  const fallback = (defaultMode as (typeof MOR_PAYMENT_MODES)[number]) ?? 'CASH';
  if (!mode) return fallback;
  const upper = mode.toUpperCase().replace(/[_ ]/g, ' ');
  const found = MOR_PAYMENT_MODES.find((m) => m.toUpperCase() === upper);
  return found ?? fallback;
}
