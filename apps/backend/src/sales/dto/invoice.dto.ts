import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsArray,
  IsIn,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// ── Allowed enum values (single source of truth, shared by Create & Update) ──
const INVOICE_STATUSES = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED'] as const;
const RECURRING_INTERVALS = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'TELECOM',
  'CHEQUE',
  'MOBILE_BANKING',
  'MOBILE_MONEY',   // BUG FIX: frontend RecordPaymentModal emits 'MOBILE_MONEY' for
                    // telebirr/CBE-Birr evidence auto-fills; was rejected by @IsIn validator
  'CREDIT_CARD',
] as const;

/** Buyer details for B2B transactions — mirrors EIMS BuyerDetails structure */
export class BuyerDetailsDto {
  @IsString() @IsOptional() @MaxLength(10)    tin?: string;
  @IsString() @IsOptional() @MaxLength(200)   legalName?: string;
  @IsString() @IsOptional() @MaxLength(200)   name?: string;
  @IsString() @IsOptional() @MaxLength(200)   email?: string;
  @IsString() @IsOptional() @MaxLength(50)    phone?: string;
  @IsString() @IsOptional() @MaxLength(50)    vatNumber?: string;
  @IsString() @IsOptional() @MaxLength(100)   region?: string;
  @IsString() @IsOptional() @MaxLength(100)   zone?: string;
  @IsString() @IsOptional() @MaxLength(100)   kebele?: string;
  @IsString() @IsOptional() @MaxLength(100)   city?: string;
  @IsString() @IsOptional() @MaxLength(100)   houseNumber?: string;
  @IsString() @IsOptional() @MaxLength(50)    subCity?: string;
  @IsString() @IsOptional() @MaxLength(50)    wereda?: string;
  @IsString() @IsOptional() @MaxLength(50)    country?: string;
}

export class CreateInvoiceDto {
  @IsString() @MaxLength(200)                customerName: string;
  @IsString() @IsOptional() @MaxLength(200)  customerEmail?: string;
  @IsString() @IsOptional()                  customerId?: string;
  @IsString() @IsOptional()                  companyId?: string;
  @IsDateString()                            date: string;
  @IsDateString() @IsOptional()              dueDate?: string;
  @IsString() @IsOptional() @MaxLength(3)    currencyCode?: string;
  @IsNumber()  @IsOptional()                 currencyRate?: number;

  /** #7 — guard against arbitrary status strings being persisted */
  @IsIn(INVOICE_STATUSES) @IsOptional()      status?: typeof INVOICE_STATUSES[number];

  @IsString() @IsOptional() @MaxLength(20)   paymentTerms?: string;

  /** #9 — enforce reasonable note length */
  @IsString() @IsOptional() @MaxLength(2000) notes?: string;

  @IsString() @IsOptional() @MaxLength(500)  customerAddress?: string;
  @IsString() @IsOptional() @MaxLength(50)   customerPhone?: string;
  @IsString() @IsOptional() @MaxLength(50)   customerTin?: string;
  @IsBoolean() @IsOptional()                 isRecurring?: boolean;

  /** #8 — guard against free-text interval values */
  @IsIn(RECURRING_INTERVALS) @IsOptional()   recurringInterval?: typeof RECURRING_INTERVALS[number];

  @IsDateString() @IsOptional()              recurringNextDate?: string;
  @IsArray()  @IsOptional()                  items?: any[];
  @IsArray()  @IsOptional()                  taxes?: any[];

  /**
   * #11 — @ValidateNested + @Type so class-validator recurses into BuyerDetailsDto
   * and the per-field @MaxLength / @IsString rules inside it actually run.
   */
  @ValidateNested() @IsOptional()
  @Type(() => BuyerDetailsDto)
  buyerDetails?: BuyerDetailsDto;
}

export class UpdateInvoiceDto {
  @IsString() @IsOptional() @MaxLength(200)  customerName?: string;
  @IsString() @IsOptional() @MaxLength(200)  customerEmail?: string;
  @IsString() @IsOptional()                  customerId?: string;
  @IsString() @IsOptional() @MaxLength(3)    currencyCode?: string;
  @IsNumber()  @IsOptional()                 currencyRate?: number;
  @IsDateString() @IsOptional()              date?: string;
  @IsDateString() @IsOptional()              dueDate?: string;
  @IsString() @IsOptional() @MaxLength(20)   paymentTerms?: string;
  @IsString() @IsOptional() @MaxLength(2000) notes?: string;

  /** #7 — same status guard on updates */
  @IsIn(INVOICE_STATUSES) @IsOptional()      status?: typeof INVOICE_STATUSES[number];

  /** #8 — same interval guard on updates */
  @IsIn(RECURRING_INTERVALS) @IsOptional()   recurringInterval?: typeof RECURRING_INTERVALS[number];

  @IsDateString() @IsOptional()              recurringNextDate?: string;
  @IsBoolean() @IsOptional()                 isRecurring?: boolean;
  @IsArray()  @IsOptional()                  items?: any[];
  @IsArray()  @IsOptional()                  taxes?: any[];

  /** #12 — fields missing from original UpdateInvoiceDto */
  @IsString() @IsOptional() @MaxLength(500)  customerAddress?: string;
  @IsString() @IsOptional() @MaxLength(50)   customerPhone?: string;
  @IsString() @IsOptional() @MaxLength(50)   customerTin?: string;

  /** #11 — deep validation on updates too */
  @ValidateNested() @IsOptional()
  @Type(() => BuyerDetailsDto)
  buyerDetails?: BuyerDetailsDto;
}

export class QueryInvoicesDto {
  @IsString() @IsOptional()  status?: string;
  @IsString() @IsOptional()  customerId?: string;
  @IsString() @IsOptional()  companyId?: string;
  @IsString() @IsOptional()  search?: string;
  @IsDateString() @IsOptional() dateFrom?: string;
  @IsDateString() @IsOptional() dateTo?: string;

  /**
   * #10 — HTTP query params arrive as strings.  @Type(() => Number) tells
   * class-transformer to coerce them before @IsNumber() validates.
   * Requires ValidationPipe({ transform: true }) which is set globally.
   */
  @Type(() => Number) @IsNumber() @IsOptional() page?: number;
  @Type(() => Number) @IsNumber() @IsOptional() limit?: number;

  @IsString() @IsOptional() sortBy?: string;
  @IsString() @IsOptional() sortOrder?: string;

  // pass-through filters used by the frontend
  @IsString() @IsOptional() paymentSource?: string;
  @IsString() @IsOptional() eimsStatus?: string;
}

export class RecordPaymentDto {
  @IsNumber() @Min(0)        amount: number;

  /** #13 — only known payment methods are accepted */
  @IsIn(PAYMENT_METHODS)     method: typeof PAYMENT_METHODS[number];

  @IsString() @IsOptional()  currencyCode?: string;
  @IsNumber() @IsOptional()  currencyRate?: number;
  @IsString() @IsOptional()  reference?: string;
  @IsString() @IsOptional() @MaxLength(2000) notes?: string;
  @IsDateString() @IsOptional() paidAt?: string;
  @IsString() @IsOptional()  paymentSource?: string;
}
