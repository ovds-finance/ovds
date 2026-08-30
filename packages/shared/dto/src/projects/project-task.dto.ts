import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum BillingStyle {
  FIXED_PER_HOUR = 'FIXED_PER_HOUR',
  FIXED_PRICE = 'FIXED_PRICE',
  FIXED_PER_TASK = 'FIXED_PER_TASK',
}

// -- Project Task DTOs ---------------------------------------------------------

export class CreateProjectTaskDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignedTo?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsEnum(BillingStyle)
  billingStyle?: BillingStyle;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  profitMargin?: number;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateProjectTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignedTo?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsEnum(BillingStyle)
  billingStyle?: BillingStyle;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  profitMargin?: number;
}

// -- Project Milestone DTOs -----------------------------------------------------

export class CreateProjectMilestoneDto {
  @IsString()
  projectId!: string;

  @IsString()
  @MaxLength(300)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'COMPLETED', 'MISSED'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  spent?: number;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateProjectMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'COMPLETED', 'MISSED'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  spent?: number;
}

// -- Project Timesheet DTOs -----------------------------------------------------

export class CreateProjectTimesheetDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  employeeName?: string;

  @IsString()
  date!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  hours!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateProjectTimesheetDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  employeeName?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  hours?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
