import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHolidayDto {
  @IsString() @IsNotEmpty() name: string;
  @Type(() => Date) @IsDate() @IsNotEmpty() date: Date;
  @IsBoolean() @IsOptional() isAnnual?: boolean;
}

export class UpdateHolidayDto {
  @IsString() @IsOptional() name?: string;
  @Type(() => Date) @IsDate() @IsOptional() date?: Date;
  @IsBoolean() @IsOptional() isAnnual?: boolean;
}
