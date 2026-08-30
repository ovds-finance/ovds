import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  MaxLength,
  IsEmail,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateItemDto {
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(100) sku?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costPrice?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  /** Frontend alias for stock */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) reorderLevel?: number;
  @IsOptional() trackInventory?: boolean;
  /** Frontend alias for vatRate — true = 15%, false = 0% */
  @IsOptional() vatApplicable?: boolean;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() itemType?: string;
  /** Frontend sends type instead of itemType */
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() groupId?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() isActive?: boolean;
  /** Frontend alias for salePrice */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  /** Frontend alias for costPrice */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) purchasePrice?: number;
  @IsOptional() customFields?: Record<string, string | null>;
}

export class UpdateItemDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(100) sku?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) costPrice?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) reorderLevel?: number;
  @IsOptional() trackInventory?: boolean;
  @IsOptional() @IsString() itemType?: string;
  @IsOptional() @IsString() groupId?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() isActive?: boolean;
  @IsOptional() customFields?: Record<string, string | null>;
}

export class InvoiceLineItemDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() itemId?: string;
  @Type(() => Number) @IsNumber() @Min(0) quantity!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() discountValue?: number;
  @IsOptional() @IsString() discountType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() taxRate?: number;
  @IsOptional() exciseCategory?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() createdAt?: string | Date;
  @IsOptional() @IsString() updatedAt?: string | Date;
}

export class CreateInvoiceDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() @MaxLength(50) invoiceNumber?: string;
  /** Invoice status — DRAFT by default */
  @IsOptional() @IsString() status?: string;
  /** Invoice date */
  @IsOptional() @IsString() date?: string;
  /** Payment due date */
  @IsOptional() @IsString() dueDate?: string;
  /** Payment terms e.g. NET30 */
  @IsOptional() @IsString() @MaxLength(50) paymentTerms?: string;
  /** Computed grand total sent from frontend */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totalAmount?: number;
  /** VAT amount computed on the frontend */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatAmount?: number;
  /** Invoice-level discount amount */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
  /** Customer display name — either customer or customerName must be provided */
  @IsOptional() @IsString() @MaxLength(200) customer?: string;
  /** Alias for customer — some callers send customerName directly */
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @Transform(({ value }) => value === '' ? undefined : value) @IsEmail() @MaxLength(200) customerEmail?: string;
  @IsOptional() @IsString() @MaxLength(50) customerPhone?: string;
  @IsOptional() @IsString() @MaxLength(500) customerAddress?: string;
  @IsOptional() @IsString() @MaxLength(50) customerTin?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
  /** DRRF 1% of subtotal */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) drrfAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsBoolean() isVatRegistered?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) exciseAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) exciseRate?: number;
  @IsOptional() @IsString() @MaxLength(50) exciseCategory?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) importSurtaxAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) importBase?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) customsDutyAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) exciseDutyAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) whtAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) whtRate?: number;
  @IsOptional() @IsString() @MaxLength(20) whtType?: string;
  @IsOptional() @IsBoolean() applyWht?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) stampDutyAmount?: number;
  @IsOptional() @IsBoolean() stampDutyRequired?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) matAmount?: number;
  @IsOptional() @IsBoolean() matApplied?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  invoiceDiscount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  lateInterestRate?: number;
  @IsOptional() @IsString() qrData?: string;
  @IsOptional() @IsString() customerNotes?: string;
  @IsOptional() @IsString() @MaxLength(50) paymentSource?: string;
  @IsOptional() @IsString() @MaxLength(100) telecomReceiptRef?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) telecomAmount?: number;
  @IsOptional() @IsString() telecomPaidAt?: string;
  @IsOptional() @IsString() telecomRawData?: string;
  @IsOptional() @IsString() @MaxLength(100) bankName?: string;
  @IsOptional() @IsString() @MaxLength(100) bankAccountNo?: string;
  @IsOptional() @IsString() bankQrRawData?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() receiptImageData?: string;
  @IsOptional() @IsString() bankSlipImageData?: string;
  /** Line items — optional for minimal draft creation (e.g. from capture modal) */
  @IsOptional() items?: InvoiceLineItemDto[];
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() footer?: string;
  @IsOptional() @IsString() @MaxLength(20) discountLocation?: string;
  @IsOptional() @IsString() @MaxLength(20) discountType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountValue?: number;
  @IsOptional() @IsString() @MaxLength(20) recurringInterval?: string;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsString() recurringNextDate?: string;
  @IsOptional() @IsString() @MaxLength(10) invoiceCurrency?: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) currencyRate?: number;
  @IsOptional() @IsString() @MaxLength(100) orderNumber?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsOptional() @IsString() @MaxLength(20) companyTitle?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() customerId?: string;
  // IFRS fields
  @IsOptional() @IsString() ifrsPerformanceObligation?: string;
  @IsOptional() @IsString() ifrsRecognitionTiming?: string;
  @IsOptional() @IsString() ifrsContractRef?: string;
  @IsOptional() @IsString() ifrsVariableConsideration?: string;
  @IsOptional() @IsString() ifrsReceivableClass?: string;
  @IsOptional() @IsString() ifrsCreditRisk?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ifrsEclProvision?: number;
  @IsOptional() @IsString() ifrsMeasurementCategory?: string;
  @IsOptional() @IsBoolean() ifrsHasWarranty?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ifrsWarrantyProvision?: number;
  @IsOptional() @IsString() ifrsContingency?: string;
  // NBE integration type tags (Proclamation No. 1395/2025)
  @IsOptional() @IsString() @MaxLength(50) interactionType?: string;
  @IsOptional() @IsString() @MaxLength(50) archType?: string;
  @IsOptional() @IsString() @MaxLength(50) processType?: string;
  @IsOptional() @IsString() @MaxLength(100) bankAccountName?: string;
  // Email CC/BCC and custom taxes
  @IsOptional() @IsArray() @IsString({ each: true }) ccEmails?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) bccEmails?: string[];
  @IsOptional() @IsArray() taxes?: any[];
  @IsOptional() @IsString() createdAt?: string | Date;
  @IsOptional() @IsString() updatedAt?: string | Date;
}

export class CreateEstimateDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() @MaxLength(50) estimateNumber?: string;
  @IsOptional() @IsString() @MaxLength(50) invoiceNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) customer?: string;
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @IsEmail() @MaxLength(200) customerEmail?: string;
  @IsOptional() @IsString() @MaxLength(50) customerPhone?: string;
  @IsOptional() @IsString() @MaxLength(500) customerAddress?: string;
  @IsOptional() @IsString() @MaxLength(50) customerTin?: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'DRAFT',
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ])
  status?: string;
  @IsOptional() @IsString() date?: string;
  // Frontend alias for date
  @IsOptional() @IsString() estimateDate?: string;
  @IsOptional() @IsString() dueDate?: string;
  // Frontend alias for dueDate
  @IsOptional() @IsString() expiryDate?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totalAmount?: number;
  // Frontend alias for totalAmount
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) total?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatAmount?: number;
  // Frontend field for tax amount
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) invoiceDiscount?: number;
  @IsOptional() @IsString() @MaxLength(3) currencyCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) currencyRate?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() customerNotes?: string;
  @IsOptional() @IsArray() items?: InvoiceLineItemDto[];
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() createdAt?: string | Date;
  @IsOptional() @IsString() updatedAt?: string | Date;
}

export class UpdateEstimateDto extends CreateEstimateDto {}

export class UpdateInvoiceDto {
  @IsOptional() @IsString() @MaxLength(200) customer?: string;
  @IsOptional() @IsEmail() @MaxLength(200) customerEmail?: string;
  @IsOptional() @IsString() @MaxLength(50) customerPhone?: string;
  @IsOptional() @IsString() @MaxLength(500) customerAddress?: string;
  @IsOptional() @IsString() @MaxLength(50) customerTin?: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'DRAFT',
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ])
  status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totalAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) drrfAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsBoolean() isVatRegistered?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) exciseAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) exciseRate?: number;
  @IsOptional() @IsString() @MaxLength(50) exciseCategory?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) importSurtaxAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) importBase?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) customsDutyAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) exciseDutyAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) whtAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) whtRate?: number;
  @IsOptional() @IsString() @MaxLength(20) whtType?: string;
  @IsOptional() @IsBoolean() applyWht?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) stampDutyAmount?: number;
  @IsOptional() @IsBoolean() stampDutyRequired?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) matAmount?: number;
  @IsOptional() @IsBoolean() matApplied?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  invoiceDiscount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lateInterestRate?: number;
  @IsOptional() @IsString() @MaxLength(50) paymentSource?: string;
  @IsOptional() @IsString() @MaxLength(100) telecomReceiptRef?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) telecomAmount?: number;
  @IsOptional() @IsString() telecomPaidAt?: string;
  @IsOptional() @IsString() telecomRawData?: string;
  @IsOptional() @IsString() @MaxLength(100) bankName?: string;
  @IsOptional() @IsString() @MaxLength(100) bankAccountNo?: string;
  @IsOptional() @IsString() bankQrRawData?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() customerNotes?: string;
  @IsOptional() @IsString() receiptImageData?: string;
  @IsOptional() @IsString() bankSlipImageData?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() scheduledSendAt?: string;
  @IsOptional()
  @IsString()
  @IsIn([
    'NET7',
    'NET15',
    'NET30',
    'NET60',
    'NET90',
    'IMMEDIATE',
  ])
  paymentTerms?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() footer?: string;
  @IsOptional() @IsString() @MaxLength(20) discountLocation?: string;
  @IsOptional() @IsString() @MaxLength(20) discountType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountValue?: number;
  @IsOptional() @IsString() @MaxLength(20) recurringInterval?: string;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsString() @MaxLength(10) invoiceCurrency?: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) currencyRate?: number;
  @IsOptional() @IsString() @MaxLength(100) orderNumber?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() ifrsPerformanceObligation?: string;
  @IsOptional() @IsString() ifrsContractRef?: string;
  @IsOptional() @IsString() ifrsReceivableClass?: string;
  @IsOptional() @IsString() ifrsCreditRisk?: string;
  @IsOptional() @Type(() => Number) @IsNumber() ifrsEclProvision?: number;
  // NBE integration type tags (Proclamation No. 1395/2025)
  @IsOptional() @IsString() @MaxLength(50) interactionType?: string;
  @IsOptional() @IsString() @MaxLength(50) archType?: string;
  @IsOptional() @IsString() @MaxLength(50) processType?: string;
  @IsOptional() @IsString() @MaxLength(100) bankAccountName?: string;
  // Email CC/BCC and custom taxes
  @IsOptional() @IsArray() @IsString({ each: true }) ccEmails?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) bccEmails?: string[];
  @IsOptional() @IsArray() taxes?: any[];
  @IsOptional() @IsString() createdAt?: string | Date;
  @IsOptional() @IsString() updatedAt?: string | Date;
}

export class BillLineItemDto {
  @IsString() itemId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @Type(() => Number) @IsNumber() @Min(0) purchasePrice!: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class CreateBillDto {
  @IsString() @MaxLength(50) billNumber!: string;
  @IsString() @MaxLength(200) vendor!: string;
  @IsString() @MaxLength(100) category!: string;
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'PAID', 'OVERDUE'])
  status?: string;
  /** Bill date (ISO string) */
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() dueDate?: string;
  @Type(() => Number) @IsNumber() @Min(0) amount!: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) total?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  /** Frontend alias for notes */
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  /** Display color (hex) for branding — Ovds "Changing the Color of a Bill" */
  @IsOptional() @IsString() @MaxLength(10) color?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) currencyRate?: number;
  /** Vendor TIN — required for WHT certificate generation (ERCA compliance) */
  @IsOptional() @IsString() @MaxLength(15) vendorTin?: string;
  /** Whether 3% WHT applies to this bill (Proclamation No. 1395/2025: services ≥ ETB 10k, goods ≥ ETB 20k) */
  @IsOptional() whtApplicable?: boolean;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsString() @MaxLength(20) recurringInterval?: string;
  @IsOptional() @IsString() recurringNextDate?: string;
  @IsOptional() @IsString() warehouseId?: string;
  /** Line items — for granular inventory tracking (IN) */
  @IsOptional() items?: BillLineItemDto[];
}

export class UpdateBillDto {
  @IsOptional() @IsString() @MaxLength(50) billNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) vendor?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'PAID', 'OVERDUE'])
  status?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) amount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) total?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  /** Frontend alias for notes */
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  /** Display color (hex) for branding — Ovds "Changing the Color of a Bill" */
  @IsOptional() @IsString() @MaxLength(10) color?: string;
  @IsOptional() @IsString() @MaxLength(15) vendorTin?: string;
  @IsOptional() vendorId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) currencyRate?: number;
  @IsOptional() whtApplicable?: boolean;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsString() @MaxLength(20) recurringInterval?: string;
  @IsOptional() @IsString() recurringNextDate?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsOptional() items?: BillLineItemDto[];
}

export class CreateBillPaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @IsOptional()
  @IsString()
  @IsIn(['CASH', 'BANK_TRANSFER', 'TELECOM', 'CHEQUE', 'OTHER'])
  method?: string;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsString() paidAt?: string;
  @IsOptional() @IsString() bankAccountId?: string;
}

export class CreateInvoicePaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @IsOptional()
  @IsString()
  @IsIn(['CASH', 'BANK_TRANSFER', 'TELECOM', 'CHEQUE', 'OTHER'])
  method?: string;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsString() paidAt?: string;
}

export class UniversalLineItemDto {
  @IsOptional() @IsString() @MaxLength(50) itemId?: string;
  @IsString() description!: string;
  @Type(() => Number) @IsNumber() @Min(0) quantity!: number;
  @Type(() => Number) @IsNumber() @Min(0) unitPrice!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsString() discountType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() discountValue?: number;
}

export class CreateUniversalInvoiceDto {
  @IsOptional() @IsString() @MaxLength(50) invoiceNumber?: string;
  @IsOptional() @IsString() @MaxLength(50) billNumber?: string;
  @IsOptional() @IsString() @MaxLength(20) docType?: string;
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @IsString() @MaxLength(200) vendor?: string;
  @IsOptional() @IsEmail() @MaxLength(200) customerEmail?: string;
  @IsOptional() @IsString() @MaxLength(50) customerPhone?: string;
  @IsOptional() @IsString() @MaxLength(500) customerAddress?: string;
  @IsOptional() @IsString() @MaxLength(50) customerTin?: string;
  @IsOptional() @IsString() @MaxLength(15) vendorTin?: string;
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PENDING', 'PAID', 'OVERDUE'])
  status?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) vatAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) totalAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) drrfAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatRate?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional()
  @IsString()
  @IsIn(['ONLINE', 'OFFLINE', 'HYBRID'])
  deliveryMode?: string;
  @IsOptional() @IsBoolean() generateShareLink?: boolean;
  @IsOptional() @IsBoolean() downloadablePdf?: boolean;
  @IsOptional() @IsBoolean() sendEmail?: boolean;
  @IsOptional() @IsString() @MaxLength(20) paymentSource?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() template?: string;
  @IsOptional() @IsString() brandLogo?: string;
  @IsOptional() @IsString() brandColor?: string;
  @IsOptional() paymentInstructions?: any;
  items!: UniversalLineItemDto[];
}

export class InvoiceQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
  /** Alias for limit — some callers use ?take= */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) take?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsString() paymentSource?: string;
  @IsOptional() @IsString() companyId?: string;
  /** Filter by customer TIN — for B2B VAT invoice lookup */
  @IsOptional() @IsString() @MaxLength(50) customerTin?: string;
  /** Filter by customer ID — used by CustomerSummary page */
  @IsOptional() @IsString() customer?: string;
  /** Filter by customer email */
  @IsOptional() @IsString() @MaxLength(200) customerEmail?: string;
  /** Only return overdue invoices */
  @IsOptional() overdueOnly?: boolean | string;
}

export class CreateCustomerDto {
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsEmail() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  /** Alias accepted by some callers */
  @IsOptional() @IsString() @MaxLength(50) rhone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(50) tin?: string;
  @IsOptional() @IsString() @MaxLength(100) paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() companyId?: string;

  @IsOptional() @IsString() @MaxLength(50) businessType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsString() @MaxLength(20) riskLevel?: string;
  @IsOptional() @IsString() @MaxLength(50) vatNumber?: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() customFields?: Record<string, string | null>;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsEmail() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsString() @MaxLength(50) rhone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(50) tin?: string;
  @IsOptional() @IsString() @MaxLength(100) paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() companyId?: string;

  @IsOptional() @IsString() @MaxLength(50) businessType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsString() @MaxLength(20) riskLevel?: string;
  @IsOptional() @IsString() @MaxLength(50) vatNumber?: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() customFields?: Record<string, string | null>;
}
