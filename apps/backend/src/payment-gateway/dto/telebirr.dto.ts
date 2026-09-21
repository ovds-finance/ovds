import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsEnum, ValidateNested, IsUUID, Min } from 'class-validator';

export enum TelebirrPaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum TelebirrTransactionType {
  VAT_PAYMENT = 'VAT_PAYMENT',
  TAX_PENALTY = 'TAX_PENALTY',
  SERVICE_FEE = 'SERVICE_FEE',
}

export class TelebirrInitiateRequestDto {
  @ApiProperty({ description: 'Unique transaction reference', example: 'TXN-2024-001234' })
  @IsString()
  @IsUUID()
  transactionId: string;

  @ApiProperty({ description: 'Amount in ETB', example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'ETB' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: TelebirrTransactionType, description: 'Type of transaction' })
  @IsEnum(TelebirrTransactionType)
  transactionType: TelebirrTransactionType;

  @ApiProperty({ description: 'Customer phone number (Ethiopia format)', example: '+251911234567' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Customer email', example: 'taxpayer@example.com' })
  @IsString()
  customerEmail: string;

  @ApiProperty({ description: 'Taxpayer TIN', example: '0001234567' })
  @IsString()
  tin: string;

  @ApiPropertyOptional({ description: 'Callback URL for payment completion' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class TelebirrInitiateResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  paymentUrl: string;

  @ApiProperty()
  referenceId: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  message?: string;
}

export class TelebirrCallbackDto {
  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty()
  @IsString()
  referenceId: string;

  @ApiProperty({ enum: TelebirrPaymentStatus })
  @IsEnum(TelebirrPaymentStatus)
  status: TelebirrPaymentStatus;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiProperty()
  @IsString()
  signature: string;
}

export class TelebirrWebhookDto {
  @ApiProperty()
  @IsString()
  event: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TelebirrCallbackDto)
  data: TelebirrCallbackDto;
}

export class TelebirrRefundRequestDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  originalTransactionId: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TelebirrRefundResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  refundId: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  message?: string;
}

export class TelebirrStatusQueryDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  transactionId: string;
}

export class TelebirrStatusResponseDto {
  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty({ enum: TelebirrPaymentStatus })
  @IsEnum(TelebirrPaymentStatus)
  status: TelebirrPaymentStatus;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;
}