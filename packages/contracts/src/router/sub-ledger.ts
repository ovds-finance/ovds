/**
 * @ovds/contracts — Sub-Ledger oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  SubLedgerEntrySchema,
  SubLedgerSummarySchema,
  SubLedgerEntriesQuerySchema,
} from '../schemas/sub-ledger';
import { IdParamSchema, PaginationQuerySchema, PaginatedResultSchema } from '../schemas/common';

const subLedgerProcedures = {
  entries: {
    list: oc
      .input(SubLedgerEntriesQuerySchema)
      .output(PaginatedResultSchema(SubLedgerEntrySchema)),

    get: oc
      .input(IdParamSchema)
      .output(SubLedgerEntrySchema.optional()),

    create: oc
      .input(SubLedgerEntrySchema.omit({ id: true, createdAt: true, updatedAt: true }))
      .output(SubLedgerEntrySchema),
  },

  summary: oc
    .input(z.object({ type: z.string().optional(), dateFrom: z.string().optional(), dateTo: z.string().optional() }))
    .output(z.array(SubLedgerSummarySchema)),

  byAccount: oc
    .input(z.object({ accountId: z.string().uuid() }).merge(PaginationQuerySchema))
    .output(PaginatedResultSchema(SubLedgerEntrySchema)),
};

export const subLedgerContract = oc.router({
  entries: oc.router(subLedgerProcedures.entries),
  summary: subLedgerProcedures.summary,
  byAccount: subLedgerProcedures.byAccount,
});

export type SubLedgerContract = typeof subLedgerContract;
