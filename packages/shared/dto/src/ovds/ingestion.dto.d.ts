export declare const INGESTION_ENTITY_TYPES: readonly ["CUSTOMERS", "VENDORS", "ITEMS", "EMPLOYEES", "BANK_TRANSACTIONS", "CHART_OF_ACCOUNTS", "JOURNAL_ENTRIES", "PRODUCT_VARIANTS"];
export type IngestionEntityType = (typeof INGESTION_ENTITY_TYPES)[number];
export declare const INGESTION_SOURCE_TYPES: readonly ["CSV", "XLSX", "XLS", "JSON"];
export type IngestionSourceType = (typeof INGESTION_SOURCE_TYPES)[number];
export declare const INGESTION_STATUSES: readonly ["RECEIVED", "PARSING", "REVIEW", "COMMITTING", "COMPLETED", "FAILED"];
export type IngestionStatus = (typeof INGESTION_STATUSES)[number];
/** Query params for listing ingestion jobs */
export declare class ListIngestionJobsDto {
    companyId?: string;
    entityType?: IngestionEntityType;
    status?: IngestionStatus;
    page?: number;
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
export declare class ExportRequestDto {
    entityType: IngestionEntityType;
    companyId?: string;
    format?: 'CSV' | 'JSON';
    dateFrom?: string;
    dateTo?: string;
}
//# sourceMappingURL=ingestion.dto.d.ts.map