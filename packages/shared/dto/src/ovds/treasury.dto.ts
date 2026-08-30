import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { PaymentType, BatchStatus } from '@ovds/shared/types';

export { PaymentType, BatchStatus };

export class CreateCashForecastDto {
  @IsString()
  period: string; // YYYY-MM

  @IsNumber()
  projected: number;

  @IsOptional()
  @IsNumber()
  low?: number;

  @IsOptional()
  @IsNumber()
  high?: number;

  @IsOptional()
  @Min(0)
  @Max(100)
  confidence?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePaymentBatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  items: Array<{
    invoiceId?: string;
    billId?: string;
    amount: number;
    reference?: string;
    notes?: string;
  }>;
}

export class UpdatePaymentBatchDto {
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsDateString()
  exportedAt?: string;

  @IsOptional()
  @IsString()
  exportFormat?: string; // CSV, MT940
}
