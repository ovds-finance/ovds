import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectProfitabilityDto {
  @IsString()
  projectId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRevenue!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalCost!: number;

  @Type(() => Number)
  profit!: number;

  @Type(() => Number)
  @Min(0)
  @Max(100)
  profitMargin!: number;

  @Type(() => Number)
  @Min(0)
  billableHours!: number;

  @Type(() => Number)
  @Min(0)
  nonBillableHours!: number;
}
