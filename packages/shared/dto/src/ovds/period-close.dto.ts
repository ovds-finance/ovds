import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class LockPeriodDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsInt()
  @Min(2000)
  @Max(2099)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @IsOptional()
  force?: boolean;
}

export class UnlockPeriodDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsInt()
  @Min(2000)
  @Max(2099)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class ListPeriodsDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsInt()
  year?: number;
}
