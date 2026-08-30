/**
 * @ovds/contracts — Sub-Ledger Schemas
 */
import { z } from 'zod';

export const SubLedgerTypeSchema = z.enum([
  'ACCOUNTS_RECEIVABLE',
  'ACCOUNTS_PAYABLE',
  'FIXED_ASSETS',
  'INVENTORY',
  'PAYROLL',
  'PROJECT',
]);

export const SubLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  type: SubLedgerTypeSchema,
  referenceId: z.string(),
  accountId: z.string().uuid(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  currencyCode: z.string().default('ETB'),
  description: z.string().optional(),
  transactionDate: z.string(),
  postedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SubLedgerSummarySchema = z.object({
  type: SubLedgerTypeSchema,
  totalDebit: z.number().nonnegative(),
  totalCredit: z.number().nonnegative(),
  balance: z.number(),
  entryCount: z.number().int().nonnegative(),
});

export const SubLedgerEntriesQuerySchema = z.object({
  type: SubLedgerTypeSchema.optional(),
  accountId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().positive().default(1),
  take: z.number().int().positive().max(100).default(20),
});

export type SubLedgerType = z.infer<typeof SubLedgerTypeSchema>;
export type SubLedgerEntry = z.infer<typeof SubLedgerEntrySchema>;
export type SubLedgerSummary = z.infer<typeof SubLedgerSummarySchema>;
export type SubLedgerEntriesQuery = z.infer<typeof SubLedgerEntriesQuerySchema>;
