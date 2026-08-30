/**
 * @ovds/contracts — Consolidation / Intercompany Elimination Schemas
 *
 * Zod schemas for IFRS 10 group consolidation and intercompany elimination procedures.
 */
import { z } from 'zod';

/** YYYY-MM period string */
const PeriodSchema = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

// ── Elimination types ─────────────────────────────────────────────────────────

export const EliminationTypeSchema = z.enum([
  'RECEIVABLE', 'PAYABLE', 'REVENUE', 'EXPENSE', 'DIVIDEND', 'INVESTMENT',
]);
export type EliminationType = z.infer<typeof EliminationTypeSchema>;

export const EliminationStatusSchema = z.enum(['PENDING', 'POSTED', 'REVERSED']);
export type EliminationStatus = z.infer<typeof EliminationStatusSchema>;

// ── Elimination record ────────────────────────────────────────────────────────

export const EliminationSchema = z.object({
  id:                z.string(),
  fromCompanyId:     z.string(),
  toCompanyId:       z.string(),
  intercompanyTxId:  z.string().nullable().optional(),
  period:            z.string(),
  eliminationType:   z.string(),
  amount:            z.number(),
  journalEntryId:    z.string().nullable().optional(),
  status:            z.string(),
  notes:             z.string().nullable().optional(),
  createdBy:         z.string().nullable().optional(),
  createdAt:         z.coerce.date(),
  updatedAt:         z.coerce.date(),
});
export type Elimination = z.infer<typeof EliminationSchema>;

// ── Create elimination ────────────────────────────────────────────────────────

export const CreateEliminationSchema = z.object({
  fromCompanyId:     z.string(),
  toCompanyId:       z.string(),
  period:            PeriodSchema,
  eliminationType:   EliminationTypeSchema,
  amount:            z.number().positive(),
  intercompanyTxId:  z.string().optional(),
  notes:             z.string().optional(),
});
export type CreateElimination = z.infer<typeof CreateEliminationSchema>;

// ── List query ────────────────────────────────────────────────────────────────

export const ListEliminationsQuerySchema = z.object({
  fromCompanyId: z.string().optional(),
  toCompanyId:   z.string().optional(),
  period:        PeriodSchema.optional(),
  status:        EliminationStatusSchema.optional(),
  page:          z.coerce.number().int().min(1).default(1),
  pageSize:      z.coerce.number().int().min(1).max(500).default(50),
});

// ── Unmatched balance ─────────────────────────────────────────────────────────

export const UnmatchedBalanceSchema = z.object({
  transactionId:  z.string(),
  fromCompanyId:  z.string(),
  toCompanyId:    z.string(),
  amount:         z.number(),
  type:           z.string(),
  description:    z.string().nullable().optional(),
});

export const DetectUnmatchedResultSchema = z.object({
  unmatched: z.array(UnmatchedBalanceSchema),
  count:     z.number().int(),
});

// ── Run period eliminations ───────────────────────────────────────────────────

export const RunEliminationsResultSchema = z.object({
  period:   z.string(),
  posted:   z.number().int(),
  skipped:  z.number().int(),
  failed:   z.number().int(),
  results:  z.array(z.record(z.string(), z.unknown())),
  errors:   z.array(z.object({ transactionId: z.string(), error: z.string() })),
});

// ── Consolidated summary ──────────────────────────────────────────────────────

export const ConsolidatedSummarySchema = z.object({
  entityGroupId:           z.string(),
  period:                  z.string(),
  reportCurrency:          z.string(),
  companies:               z.array(z.string()),
  grossRevenue:            z.number(),
  grossExpenses:           z.number(),
  eliminatedRevenue:       z.number(),
  eliminatedExpenses:      z.number(),
  netRevenue:              z.number(),
  netExpenses:             z.number(),
  grossAssets:             z.number(),
  grossLiabilities:        z.number(),
  eliminatedReceivables:   z.number(),
  eliminatedPayables:      z.number(),
  netAssets:               z.number(),
  netLiabilities:          z.number(),
  eliminationsApplied:     z.number().int(),
  pendingEliminations:     z.number().int(),
});
export type ConsolidatedSummary = z.infer<typeof ConsolidatedSummarySchema>;

// ── Ledger integrity ──────────────────────────────────────────────────────────

export const LedgerIntegrityViolationSchema = z.object({
  sourceId:     z.string(),
  storedHash:   z.string(),
  expectedHash: z.string(),
  verifiedAt:   z.string(),
});

export const LedgerIntegrityResultSchema = z.object({
  companyId:  z.string(),
  intact:     z.boolean(),
  verified:   z.number().int(),
  violations: z.number().int(),
  details:    z.array(LedgerIntegrityViolationSchema),
});
export type LedgerIntegrityResult = z.infer<typeof LedgerIntegrityResultSchema>;
