import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FinancialLinkType {
  INVOICE = 'INVOICE',
  INCOME = 'INCOME',
  VENDOR_BILL = 'VENDOR_BILL',
  PAYMENT = 'PAYMENT',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum TransactionDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateProjectFinancialLinkDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsEnum(FinancialLinkType)
  linkType!: FinancialLinkType;

  @IsString()
  linkId!: string;

  @IsOptional()
  @IsString()
  linkNumber?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsEnum(TransactionDirection)
  direction?: TransactionDirection;

  @IsOptional()
  @IsString()
  linkDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateProjectFinancialLinkDto {
  @IsOptional()
  @IsEnum(FinancialLinkType)
  linkType?: FinancialLinkType;

  @IsOptional()
  @IsString()
  linkNumber?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsEnum(TransactionDirection)
  direction?: TransactionDirection;

  @IsOptional()
  @IsString()
  linkDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
