import { IsString, IsNumber, IsBoolean, IsOptional, IsDateString, IsArray, IsObject, Min, MaxLength } from 'class-validator';

/** Buyer details for B2B transactions — mirrors EIMS BuyerDetails structure */
export class BuyerDetailsDto {
  @IsString() @IsOptional() @MaxLength(10) tin?: string;
  @IsString() @IsOptional() @MaxLength(200) legalName?: string;
  @IsString() @IsOptional() @MaxLength(200) name?: string;
  @IsString() @IsOptional() @MaxLength(200) email?: string;
  @IsString() @IsOptional() @MaxLength(50) phone?: string;
  @IsString() @IsOptional() @MaxLength(50) vatNumber?: string;
  @IsString() @IsOptional() @MaxLength(100) region?: string;
  @IsString() @IsOptional() @MaxLength(100) zone?: string;
  @IsString() @IsOptional() @MaxLength(100) kebele?: string;
  @IsString() @IsOptional() @MaxLength(100) city?: string;
  @IsString() @IsOptional() @MaxLength(100) houseNumber?: string;
  @IsString() @IsOptional() @MaxLength(50) subCity?: string;
  @IsString() @IsOptional() @MaxLength(50) wereda?: string;
  @IsString() @IsOptional() @MaxLength(50) country?: string;
}

export class CreateInvoiceDto {
  @IsString() @MaxLength(200) customerName: string;
  @IsString() @IsOptional() @MaxLength(200) customerEmail?: string;
  @IsString() @IsOptional() customerId?: string;
  @IsString() @IsOptional() companyId?: string;
  @IsDateString() date: string;
  @IsDateString() @IsOptional() dueDate?: string;
  @IsString() @IsOptional() @MaxLength(3) currencyCode?: string;
  @IsNumber() @IsOptional() currencyRate?: number;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() @MaxLength(20) paymentTerms?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() @MaxLength(500) customerAddress?: string;
  @IsString() @IsOptional() @MaxLength(50) customerPhone?: string;
  @IsString() @IsOptional() @MaxLength(50) customerTin?: string;
  @IsBoolean() @IsOptional() isRecurring?: boolean;
  @IsString() @IsOptional() recurringInterval?: string;
  @IsDateString() @IsOptional() recurringNextDate?: string;
  @IsArray() @IsOptional() items?: any[];
  @IsArray() @IsOptional() taxes?: any[];
  /** Full buyer details for B2B transactions (EIMS compliance) */
  @IsObject() @IsOptional() buyerDetails?: BuyerDetailsDto;
}

export class UpdateInvoiceDto {
  @IsString() @IsOptional() @MaxLength(200) customerName?: string;
  @IsString() @IsOptional() @MaxLength(200) customerEmail?: string;
  @IsString() @IsOptional() customerId?: string;
  @IsString() @IsOptional() @MaxLength(3) currencyCode?: string;
  @IsNumber() @IsOptional() currencyRate?: number;
  @IsDateString() @IsOptional() date?: string;
  @IsDateString() @IsOptional() dueDate?: string;
  @IsString() @IsOptional() @MaxLength(20) paymentTerms?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isRecurring?: boolean;
  @IsString() @IsOptional() recurringInterval?: string;
  @IsDateString() @IsOptional() recurringNextDate?: string;
  @IsArray() @IsOptional() items?: any[];
  @IsArray() @IsOptional() taxes?: any[];
}

export class QueryInvoicesDto {
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() customerId?: string;
  @IsString() @IsOptional() companyId?: string;
  @IsString() @IsOptional() search?: string;
  @IsDateString() @IsOptional() dateFrom?: string;
  @IsDateString() @IsOptional() dateTo?: string;
  @IsNumber() @IsOptional() page?: number;
  @IsNumber() @IsOptional() limit?: number;
  @IsString() @IsOptional() sortBy?: string;
  @IsString() @IsOptional() sortOrder?: string;
}

export class RecordPaymentDto {
  @IsNumber() @Min(0) amount: number;
  @IsString() method: string;
  @IsString() @IsOptional() currencyCode?: string;
  @IsNumber() @IsOptional() currencyRate?: number;
  @IsString() @IsOptional() reference?: string;
  @IsString() @IsOptional() notes?: string;
  @IsDateString() @IsOptional() paidAt?: string;
  @IsString() @IsOptional() paymentSource?: string;
}
