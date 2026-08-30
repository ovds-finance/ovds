import { IsString, IsNotEmpty, Matches, IsNumber, IsPositive, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionItemDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsNumber()
  @IsPositive()
  itemTotalCents: number;
}

export class SubmitVatDeclarationDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'TIN must be exactly 10 digits.' })
  taxpayerTin: string;

  @IsString()
  @IsNotEmpty()
  declarationPeriod: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  salesItems: TransactionItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  purchaseItems: TransactionItemDto[];
}

export enum TaxDeclarationStatus {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  SUBMITTED = 'SUBMITTED',
  AMENDED = 'AMENDED',
  REJECTED = 'REJECTED',
}
