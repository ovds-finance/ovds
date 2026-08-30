/**
 * @ovds/contracts — Consolidation oRPC Router Contract
 *
 * Type-safe API surface for:
 *   eliminations.*   — IFRS 10.B86 intercompany elimination CRUD
 *   ledgerIntegrity.* — SHA-256 hash-chain verification (AABE immutable audit trail)
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  EliminationSchema,
  CreateEliminationSchema,
  ListEliminationsQuerySchema,
  DetectUnmatchedResultSchema,
  RunEliminationsResultSchema,
  ConsolidatedSummarySchema,
  LedgerIntegrityResultSchema,
} from '../schemas/consolidation';
import { IdParamSchema } from '../schemas/common';

const PeriodQuery = z.object({ period: z.string() });
const SuccessSchema = z.object({ success: z.boolean() });

// ── Elimination procedures ────────────────────────────────────────────────────

const eliminationProcedures = {
  /** List intercompany eliminations with optional filters */
  list: oc
    .input(ListEliminationsQuerySchema)
    .output(z.object({
      data: z.array(EliminationSchema),
      meta: z.object({
        total:      z.number().int(),
        page:       z.number().int(),
        pageSize:   z.number().int(),
        totalPages: z.number().int(),
      }),
    })),

  /** Detect IC transactions without a matching posted elimination */
  detectUnmatched: oc
    .input(PeriodQuery)
    .output(DetectUnmatchedResultSchema),

  /** Post a single IFRS 10.B86 elimination + journal entry */
  post: oc
    .input(CreateEliminationSchema)
    .output(EliminationSchema),

  /** Reverse a posted elimination (marks REVERSED) */
  reverse: oc
    .input(IdParamSchema)
    .output(EliminationSchema),

  /** Bulk-post all unmatched IC eliminations for a period (one-click consolidation close) */
  run: oc
    .input(PeriodQuery)
    .output(RunEliminationsResultSchema),

  /** Consolidated financial summary for an EntityGroup after eliminations */
  consolidatedSummary: oc
    .input(z.object({
      entityGroupId: z.string(),
      period:        z.string(),
    }))
    .output(ConsolidatedSummarySchema),
};

// ── Ledger integrity procedures ───────────────────────────────────────────────

const ledgerIntegrityProcedures = {
  /** Verify the SHA-256 hash chain over all posted journal entries for a company */
  verify: oc
    .input(z.object({ companyId: z.string() }))
    .output(LedgerIntegrityResultSchema),

  /** Manually stamp a journal entry into the verified ledger hash chain */
  stamp: oc
    .input(z.object({ journalEntryId: z.string(), companyId: z.string().optional() }))
    .output(z.object({ journalEntryId: z.string(), hash: z.string() })),
};

// ── Top-level consolidation contract ─────────────────────────────────────────

export const consolidationContract = oc.router({
  eliminations:     oc.router(eliminationProcedures),
  ledgerIntegrity:  oc.router(ledgerIntegrityProcedures),
});

export type ConsolidationContract = typeof consolidationContract;
