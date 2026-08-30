import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TradeDirection } from '@ovds/shared/types';

export class CreateShipmentDto {
  @IsEnum(TradeDirection)
  direction!: TradeDirection;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsString()
  hsDescription?: string;

  @IsOptional()
  @IsString()
  goodsDescription?: string;

  @IsOptional()
  @IsString()
  originCountry?: string;

  @IsOptional()
  @IsString()
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  portOfLoading?: string;

  @IsOptional()
  @IsString()
  portOfDischarge?: string;

  @IsOptional()
  @IsString()
  incoterms?: string;

  @IsOptional()
  @IsNumber()
  invoiceValue?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShipmentStepDto {
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'])
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class CreateForexApprovalDto {
  @IsString()
  bankName!: string;

  @IsOptional()
  @IsDateString()
  applicationDate?: string;

  @IsOptional()
  @IsString()
  foreignCurrency?: string;

  @IsOptional()
  @IsNumber()
  foreignAmount?: number;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProformaDto {
  @IsString()
  supplierName!: string;

  @IsString()
  buyerName!: string;

  @IsDateString()
  issueDate!: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  incoterms?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  lineItemsJson?: string;

  @IsOptional()
  @IsString()
  shipmentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
