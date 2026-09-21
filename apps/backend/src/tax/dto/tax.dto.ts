/**
 * Tax module DTOs — typed request bodies replacing all previous `body: any`
 * parameters. Enforces required fields and value ranges at the NestJS
 * validation-pipe layer (ZodValidationPipe).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

// ─── WHT Certificate ──────────────────────────────────────────────────────────
// Field names match TaxService.createWhtCertificate() signature:
//   { vendorId, whtType, amount, period }

export class CreateWhtCertificateDto {
  @ApiProperty({ description: 'Vendor ID from the Vendor master', maxLength: 36 })
  @IsString() @MaxLength(36)
  vendorId: string;

  @ApiProperty({ description: 'WHT type: GOODS | SERVICES | IMPORT | DIVIDEND | INTEREST | ROYALTY | GOVERNMENT' })
  @IsIn(['GOODS', 'SERVICES', 'IMPORT', 'DIVIDEND', 'INTEREST', 'ROYALTY', 'GOVERNMENT'])
  whtType: string;

  @ApiProperty({ description: 'Gross payment amount as string (ETB, e.g. "5000.00")' })
  @IsString()
  amount: string;

  @ApiProperty({ description: 'Tax period in YYYY-MM format', maxLength: 7 })
  @IsString() @MaxLength(7)
  period: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

// ─── TOT Filing ───────────────────────────────────────────────────────────────
// Field names match TaxService.createTotFiling() signature:
//   { period, goodsAmount, servicesAmount }

export class CreateTotFilingDto {
  @ApiProperty({ description: 'Filing period in YYYY-MM format', maxLength: 7 })
  @IsString() @MaxLength(7)
  period: string;

  @ApiProperty({ description: 'Total taxable goods sales as string (ETB, e.g. "50000.00")' })
  @IsString()
  goodsAmount: string;

  @ApiProperty({ description: 'Total taxable services revenue as string (ETB, e.g. "20000.00")' })
  @IsString()
  servicesAmount: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

// ─── Tax Filing (generic — VAT / BIT) ─────────────────────────────────────────

export class CreateTaxFilingDto {
  @ApiProperty({ description: 'Filing type: VAT | BIT | TOT | WHT' })
  @IsIn(['VAT', 'BIT', 'TOT', 'WHT'])
  type: string;

  @ApiProperty({ description: 'Filing period in YYYY-MM or YYYY format', maxLength: 7 })
  @IsString() @MaxLength(7)
  period: string;

  @ApiProperty({ description: 'Total tax amount (ETB)' })
  @IsNumber() @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Filing status: DRAFT | SUBMITTED | ACCEPTED | REJECTED' })
  @IsOptional() @IsIn(['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

// ─── Penalty Calculation ──────────────────────────────────────────────────────

export class CalculatePenaltyDto {
  @ApiProperty({ description: 'Original tax amount due (ETB)' })
  @IsNumber() @Min(0)
  amount: number;

  @ApiProperty({ description: 'Number of days past the filing due date' })
  @IsNumber() @Min(0)
  daysLate: number;

  @ApiPropertyOptional({
    description: 'Monthly penalty rate as a percentage (default 1.5% per month per Proc. 1395/2025)',
    default: 1.5,
  })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  rate?: number;

  @ApiPropertyOptional({ description: 'Filing type context for display', maxLength: 10 })
  @IsOptional() @IsString() @MaxLength(10)
  type?: string;

  @ApiPropertyOptional({ description: 'Period context for display', maxLength: 7 })
  @IsOptional() @IsString() @MaxLength(7)
  period?: string;
}
