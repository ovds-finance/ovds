import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsPositive,
  IsNotEmpty,
} from 'class-validator';
import { CollectionStage, DeductionReason, DeductionStatus } from '@ovds/shared/types';

export { CollectionStage, DeductionReason, DeductionStatus };

export class CreateCollectionCaseDto {
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCollectionCaseDto {
  @IsOptional()
  @IsEnum(CollectionStage)
  stage?: CollectionStage;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsDateString()
  contactDate?: string;

  @IsOptional()
  @IsDateString()
  promiseDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  partialPaid?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDeductionDto {
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsEnum(DeductionReason)
  reason: DeductionReason;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeductionDto {
  @IsOptional()
  @IsEnum(DeductionStatus)
  status?: DeductionStatus;

  @IsOptional()
  @IsDateString()
  resolvedAt?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
