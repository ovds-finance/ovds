import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { LoyaltyTransactionType } from '@ovds/shared/types';

export class CreateLoyaltyTransactionDto {
  @IsString()
  customerId!: string;

  @Type(() => Number)
  @IsNumber()
  points!: number;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsEnum(LoyaltyTransactionType)
  type?: LoyaltyTransactionType;

  @IsOptional()
  @IsString()
  companyId?: string;
}
