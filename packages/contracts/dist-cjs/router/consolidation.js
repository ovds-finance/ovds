/**
 * @ovds/contracts — Consolidation oRPC Router Contract
 *
 * Type-safe API surface for:
 *   eliminations.*   — IFRS 10.B86 intercompany elimination CRUD
 *   ledgerIntegrity.* — SHA-256 hash-chain verification (AABE immutable audit trail)
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "consolidationContract", {
    enumerable: true,
    get: function() {
        return consolidationContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _consolidation = require("../schemas/consolidation");
const _common = require("../schemas/common");
const PeriodQuery = _zod.z.object({
    period: _zod.z.string()
});
const SuccessSchema = _zod.z.object({
    success: _zod.z.boolean()
});
// ── Elimination procedures ────────────────────────────────────────────────────
const eliminationProcedures = {
    /** List intercompany eliminations with optional filters */ list: _contract.oc.input(_consolidation.ListEliminationsQuerySchema).output(_zod.z.object({
        data: _zod.z.array(_consolidation.EliminationSchema),
        meta: _zod.z.object({
            total: _zod.z.number().int(),
            page: _zod.z.number().int(),
            pageSize: _zod.z.number().int(),
            totalPages: _zod.z.number().int()
        })
    })),
    /** Detect IC transactions without a matching posted elimination */ detectUnmatched: _contract.oc.input(PeriodQuery).output(_consolidation.DetectUnmatchedResultSchema),
    /** Post a single IFRS 10.B86 elimination + journal entry */ post: _contract.oc.input(_consolidation.CreateEliminationSchema).output(_consolidation.EliminationSchema),
    /** Reverse a posted elimination (marks REVERSED) */ reverse: _contract.oc.input(_common.IdParamSchema).output(_consolidation.EliminationSchema),
    /** Bulk-post all unmatched IC eliminations for a period (one-click consolidation close) */ run: _contract.oc.input(PeriodQuery).output(_consolidation.RunEliminationsResultSchema),
    /** Consolidated financial summary for an EntityGroup after eliminations */ consolidatedSummary: _contract.oc.input(_zod.z.object({
        entityGroupId: _zod.z.string(),
        period: _zod.z.string()
    })).output(_consolidation.ConsolidatedSummarySchema)
};
// ── Ledger integrity procedures ───────────────────────────────────────────────
const ledgerIntegrityProcedures = {
    /** Verify the SHA-256 hash chain over all posted journal entries for a company */ verify: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_consolidation.LedgerIntegrityResultSchema),
    /** Manually stamp a journal entry into the verified ledger hash chain */ stamp: _contract.oc.input(_zod.z.object({
        journalEntryId: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.object({
        journalEntryId: _zod.z.string(),
        hash: _zod.z.string()
    }))
};
const consolidationContract = _contract.oc.router({
    eliminations: _contract.oc.router(eliminationProcedures),
    ledgerIntegrity: _contract.oc.router(ledgerIntegrityProcedures)
});
