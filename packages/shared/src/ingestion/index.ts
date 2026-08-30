export type IngestionEntityType =
  | 'CUSTOMERS'
  | 'VENDORS'
  | 'ITEMS'
  | 'EMPLOYEES'
  | 'BANK_TRANSACTIONS'
  | 'CHART_OF_ACCOUNTS'
  | 'JOURNAL_ENTRIES'
  | 'PRODUCT_VARIANTS';

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

export function validateRow(entityType: IngestionEntityType, row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!row.name && entityType !== 'ITEMS') errors.push('name is required');
  return errors;
}

export async function commitCustomers(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitVendors(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitItems(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitEmployees(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitBankTransactions(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitChartOfAccounts(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitJournalEntries(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}

export async function commitProductVariants(prisma: any, rows: Record<string, unknown>[], companyId: string | null): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  return { ids, errors };
}