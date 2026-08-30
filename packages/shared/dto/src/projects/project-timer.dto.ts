import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StartProjectTimerDto {
  @IsString()
  projectId!: string;

  @IsString()
  taskId!: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StopProjectTimerDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  hours?: number;
}

export class CreateProjectTimerDto {
  @IsString()
  projectId!: string;

  @IsString()
  taskId!: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  hours?: number;
}

export class UpdateProjectTimerDto {
  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  hours?: number;
}
