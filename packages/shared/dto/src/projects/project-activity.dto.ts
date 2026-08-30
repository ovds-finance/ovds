import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProjectActivityType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TIMER_STARTED = 'TIMER_STARTED',
  TIMER_STOPPED = 'TIMER_STOPPED',
  TIMESHEET_CREATED = 'TIMESHEET_CREATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  FILE_ATTACHED = 'FILE_ATTACHED',
  FINANCIAL_LINKED = 'FINANCIAL_LINKED',
  MILESTONE_UPDATED = 'MILESTONE_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  BILLING_UPDATED = 'BILLING_UPDATED',
}

export class CreateProjectActivityDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsEnum(ProjectActivityType)
  activityType!: ProjectActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  delta?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateProjectActivityDto {
  @IsOptional()
  @IsEnum(ProjectActivityType)
  activityType?: ProjectActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  delta?: string;
}
