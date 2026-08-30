/**
 * @ovds/shared — Data Ingestion (Import/Export) DTOs
 * Shared between NestJS backend and React frontend.
 */
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// -- Supported entity types ----------------------------------------------------

export const INGESTION_ENTITY_TYPES = [
  'CUSTOMERS',
  'VENDORS',
  'ITEMS',
  'EMPLOYEES',
  'BANK_TRANSACTIONS',
  'CHART_OF_ACCOUNTS',
  'JOURNAL_ENTRIES',
  'PRODUCT_VARIANTS',
] as const;

export type IngestionEntityType = (typeof INGESTION_ENTITY_TYPES)[number];

// -- Supported source formats --------------------------------------------------

export const INGESTION_SOURCE_TYPES = ['CSV', 'XLSX', 'XLS', 'JSON'] as const;
export type IngestionSourceType = (typeof INGESTION_SOURCE_TYPES)[number];

// -- Job statuses --------------------------------------------------------------

export const INGESTION_STATUSES = [
  'RECEIVED',
  'PARSING',
  'REVIEW',
  'COMMITTING',
  'COMPLETED',
  'FAILED',
] as const;

export type IngestionStatus = (typeof INGESTION_STATUSES)[number];

// -- DTOs ----------------------------------------------------------------------

/** Query params for listing ingestion jobs */
export class ListIngestionJobsDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsIn(INGESTION_ENTITY_TYPES)
  entityType?: IngestionEntityType;

  @IsOptional()
  @IsIn(INGESTION_STATUSES)
  status?: IngestionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** Response shape for a single ingestion job */
export interface IngestionJobDto {
  id: string;
  sourceType: string;
  targetType: string;
  status: IngestionStatus;
  companyId: string | null;
  createdBy: string | null;
  fileName: string | null;
  mimeType: string | null;
  rowsParsed: number;
  rowsCommitted: number;
  rowsFailed: number;
  rowsForReview: number;
  errors: string | null;
  committedIds: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** Parsed row preview item */
export interface IngestionRowPreview {
  rowIndex: number;
  data: Record<string, unknown>;
  errors: string[];
  status: 'OK' | 'ERROR' | 'REVIEW';
}

/** Response after uploading a file */
export interface IngestionUploadResponse {
  jobId: string;
  status: IngestionStatus;
  fileName: string;
  targetType: string;
  rowsParsed: number;
  rowsForReview: number;
  rowsFailed: number;
  preview: IngestionRowPreview[];
  message: string;
}

/** Response after committing a job */
export interface IngestionCommitResponse {
  jobId: string;
  status: IngestionStatus;
  rowsCommitted: number;
  rowsFailed: number;
  committedIds: string[];
  errors: string[];
}

/** Export request body */
export class ExportRequestDto {
  @IsString()
  @IsIn(INGESTION_ENTITY_TYPES)
  entityType!: IngestionEntityType;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CSV', 'JSON'])
  format?: 'CSV' | 'JSON';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dateTo?: string;
}
