export type IngestionEntityType = 'CUSTOMERS' | 'VENDORS' | 'ITEMS' | 'EMPLOYEES' | 'BANK_TRANSACTIONS' | 'CHART_OF_ACCOUNTS' | 'JOURNAL_ENTRIES' | 'PRODUCT_VARIANTS';
export interface IngestionJobDto {
    id: string;
    sourceType: string;
    targetType: string;
    status: string;
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
export interface IngestionRowPreview {
    rowIndex: number;
    data: Record<string, unknown>;
    errors: string[];
    status: 'OK' | 'ERROR' | 'REVIEW';
}
export interface IngestionUploadResponse {
    jobId: string;
    status: string;
    fileName: string;
    targetType: string;
    rowsParsed: number;
    rowsForReview: number;
    rowsFailed: number;
    preview: IngestionRowPreview[];
    message: string;
}
export interface IngestionCommitResponse {
    jobId: string;
    status: string;
    rowsCommitted: number;
    rowsFailed: number;
    committedIds: string[];
    errors: string[];
}
export declare function validateRow(entityType: IngestionEntityType, row: Record<string, unknown>): string[];
export declare function commitCustomers(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitVendors(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitItems(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitEmployees(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitBankTransactions(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitChartOfAccounts(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitJournalEntries(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
export declare function commitProductVariants(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{
    ids: string[];
    errors: string[];
}>;
//# sourceMappingURL=index.d.ts.map