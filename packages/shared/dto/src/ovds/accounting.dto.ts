import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, AccountCategory } from '@ovds/shared/types';

export class CreateAccountDto {
  @IsOptional() @IsString() companyId?: string;
  @IsString() @MaxLength(50) code!: string;
  @IsString() @MaxLength(200) name!: string;
  @IsEnum(AccountType) type!: AccountType;
  @IsEnum(AccountCategory) category!: AccountCategory;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() customFields?: Record<string, string | null>;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsEnum(AccountType) type?: AccountType;
  @IsOptional() @IsEnum(AccountCategory) category?: AccountCategory;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() customFields?: Record<string, string | null>;
}

export class JournalLineDto {
  @IsString() accountId!: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @Type(() => Number) @IsNumber() @Min(0) debit!: number;
  @Type(() => Number) @IsNumber() @Min(0) credit!: number;
}

export class CreateJournalEntryDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() @MaxLength(100) reference?: string;
  @IsString() @MaxLength(500) description!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}

export class CreateVendorDto {
  @IsOptional() @IsString() companyId?: string;
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(50) tin?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() @MaxLength(20) paymentTerms?: string;
  /** Vendor category: SUPPLIER, CONTRACTOR, SERVICE_PROVIDER, UTILITY, GOVERNMENT, OTHER */
  @IsOptional() @IsString() @MaxLength(50) category?: string;
  /** Vendor status: ACTIVE | INACTIVE */
  @IsOptional() @IsString() @MaxLength(20) status?: string;

  @IsOptional() @IsString() @MaxLength(50) vatNumber?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() whtApplicable?: boolean;
  @IsOptional() @IsString() whtType?: string;
  @IsOptional() @IsString() @MaxLength(100) bankName?: string;
  @IsOptional() @IsString() @MaxLength(100) accountNumber?: string;
  @IsOptional() customFields?: Record<string, string | null>;
}

export class UpdateVendorDto extends CreateVendorDto {}

export class CreateBankAccountDto {
  @IsOptional() @IsString() companyId?: string;
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MaxLength(100) accountNumber!: string;
  @IsString() @MaxLength(100) bankName!: string;
  @IsOptional() @IsString() @MaxLength(10) currencyCode?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @Type(() => Number) @IsNumber() openingBalance?: number;
  @IsOptional() @IsString() accountId?: string;
}
