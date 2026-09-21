import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsDate, IsEnum, ValidateNested, IsArray, Min, IsUUID } from 'class-validator';

export enum InvoiceType {
  VAT_INVOICE = 'VAT_INVOICE',
  PROFORMA = 'PROFORMA',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class InvoiceLineItemDto {
  @ApiProperty({ description: 'Line item sequence number', example: 1 })
  @IsNumber()
  @Min(1)
  lineNumber: number;

  @ApiProperty({ description: 'Product/Service description', example: 'VAT Declaration Service Q1 2024' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'HS Code for goods', example: '998311' })
  @IsOptional()
  @IsString()
  hsCode?: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Unit of measure', example: 'EA' })
  @IsString()
  unitOfMeasure: string;

  @ApiProperty({ description: 'Unit price in ETB', example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Line discount percentage', example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @ApiProperty({ description: 'Tax rate percentage', example: 15 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate: number;

  @ApiProperty({ description: 'Tax type', example: 'VAT' })
  @IsString()
  taxType: string;

  @ApiProperty({ description: 'Line total before tax', example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  lineTotal: number;

  @ApiProperty({ description: 'Tax amount', example: 225.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  taxAmount: number;

  @ApiProperty({ description: 'Line total including tax', example: 1725.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  lineTotalWithTax: number;
}

export class InvoicePartyDto {
  @ApiProperty({ description: 'Legal name', example: 'Ethiopia Revenue Authority' })
  @IsString()
  legalName: string;

  @ApiProperty({ description: 'Trade name', example: 'ERA' })
  @IsString()
  tradeName: string;

  @ApiProperty({ description: 'TIN (Tax Identification Number)', example: '0000000001' })
  @IsString()
  tin: string;

  @ApiProperty({ description: 'Address line 1', example: 'Bole Road, Addis Ababa' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City', example: 'Addis Ababa' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Region/State', example: 'Addis Ababa' })
  @IsString()
  region: string;

  @ApiProperty({ description: 'Country', example: 'Ethiopia' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Postal code', example: '1000' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Phone number', example: '+251115551234' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Email address', example: 'info@era.gov.et' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'VAT registration number' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional({ description: 'Contact person' })
  @IsOptional()
  @IsString()
  contactPerson?: string;
}

export class InvoiceTotalsDto {
  @ApiProperty({ description: 'Subtotal before tax', example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  subtotal: number;

  @ApiProperty({ description: 'Total discount amount', example: 0.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  totalDiscount: number;

  @ApiProperty({ description: 'Total tax amount', example: 225.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  totalTax: number;

  @ApiProperty({ description: 'Grand total including tax', example: 1725.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  grandTotal: number;

  @ApiProperty({ description: 'Amount paid', example: 0.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  amountPaid: number;

  @ApiProperty({ description: 'Amount due', example: 1725.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  amountDue: number;

  @ApiProperty({ description: 'Rounding adjustment', example: 0.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  roundingAdjustment: number;
}

export class FiscalInvoiceDto {
  @ApiProperty({ description: 'Invoice UUID', example: 'uuid-v4' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Invoice number (sequential)', example: 'INV-2024-001234' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ enum: InvoiceType })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiProperty({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({ description: 'Invoice date', example: '2024-01-15' })
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @ApiProperty({ description: 'Due date', example: '2024-02-14' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty({ description: 'Currency code', example: 'ETB' })
  @IsString()
  currency: string;

  @ApiProperty({ type: InvoicePartyDto, description: 'Seller (issuer) information' })
  @ValidateNested()
  @Type(() => InvoicePartyDto)
  seller: InvoicePartyDto;

  @ApiProperty({ type: InvoicePartyDto, description: 'Buyer (customer) information' })
  @ValidateNested()
  @Type(() => InvoicePartyDto)
  buyer: InvoicePartyDto;

  @ApiProperty({ type: [InvoiceLineItemDto], description: 'Invoice line items' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsArray()
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ type: InvoiceTotalsDto })
  @ValidateNested()
  @Type(() => InvoiceTotalsDto)
  totals: InvoiceTotalsDto;

  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'VAT Declaration for Q1 2024' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Reference to original invoice (for credit/debit notes)' })
  @IsOptional()
  @IsString()
  referenceInvoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Fiscal device serial number' })
  @IsOptional()
  @IsString()
  fiscalDeviceSerial?: string;

  @ApiPropertyOptional({ description: 'Fiscal receipt number' })
  @IsOptional()
  @IsString()
  fiscalReceiptNumber?: string;

  @ApiPropertyOptional({ description: 'QR code data for verification' })
  @IsOptional()
  @IsString()
  qrCodeData?: string;

  @ApiPropertyOptional({ description: 'Digital signature' })
  @IsOptional()
  @IsString()
  digitalSignature?: string;

  @ApiPropertyOptional({ description: 'Signed at timestamp' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  signedAt?: Date;
}

export class GenerateInvoiceRequestDto {
  @ApiProperty({ description: 'Transaction ID to generate invoice for' })
  @IsString()
  @IsUUID()
  transactionId: string;

  @ApiProperty({ enum: InvoiceType })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiPropertyOptional({ description: 'Override default payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateInvoiceResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiPropertyOptional()
  pdfUrl?: string;

  @ApiPropertyOptional()
  message?: string;
}

export class InvoiceVerificationDto {
  @ApiProperty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty()
  @IsString()
  verificationCode: string;
}

export class InvoiceVerificationResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  status: InvoiceStatus;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  buyerName: string;

  @ApiProperty()
  grandTotal: number;

  @ApiPropertyOptional()
  message?: string;
}