import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';
import { TaxCalculationType } from '@ovds/shared';

export class BulkToggleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsBoolean()
  isActive!: boolean;
}

export class BulkDeleteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];
}

export class CreateTaxRateDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  rate!: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsEnum(['VAT', 'SALES_TAX', 'WITHHOLDING', 'INCOME_TAX', 'DRRF', 'CUSTOM'])
  type?: 'VAT' | 'SALES_TAX' | 'WITHHOLDING' | 'INCOME_TAX' | 'DRRF' | 'CUSTOM';

  @IsOptional()
  @IsEnum(TaxCalculationType)
  calculationType?: TaxCalculationType;

  @IsOptional()
  @IsArray()
  appliesTo?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isInclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  isCompound?: boolean;

  @IsOptional()
  @IsString()
  compoundParentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  specificAmount?: number;

  @IsOptional()
  @IsString()
  roundingRule?: string;
}

export class UpdateTaxRateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsEnum(['VAT', 'SALES_TAX', 'WITHHOLDING', 'INCOME_TAX', 'DRRF', 'CUSTOM'])
  type?: 'VAT' | 'SALES_TAX' | 'WITHHOLDING' | 'INCOME_TAX' | 'DRRF' | 'CUSTOM';

  @IsOptional()
  @IsEnum(TaxCalculationType)
  calculationType?: TaxCalculationType;

  @IsOptional()
  @IsArray()
  appliesTo?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isInclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  isCompound?: boolean;

  @IsOptional()
  @IsString()
  compoundParentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  specificAmount?: number;

  @IsOptional()
  @IsString()
  roundingRule?: string;
}
