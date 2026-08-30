/**
 * @ovds/contracts — Sub-Ledger oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "subLedgerContract", {
    enumerable: true,
    get: function() {
        return subLedgerContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _subledger = require("../schemas/sub-ledger");
const _common = require("../schemas/common");
const subLedgerProcedures = {
    entries: {
        list: _contract.oc.input(_subledger.SubLedgerEntriesQuerySchema).output((0, _common.PaginatedResultSchema)(_subledger.SubLedgerEntrySchema)),
        get: _contract.oc.input(_common.IdParamSchema).output(_subledger.SubLedgerEntrySchema.optional()),
        create: _contract.oc.input(_subledger.SubLedgerEntrySchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        })).output(_subledger.SubLedgerEntrySchema)
    },
    summary: _contract.oc.input(_zod.z.object({
        type: _zod.z.string().optional(),
        dateFrom: _zod.z.string().optional(),
        dateTo: _zod.z.string().optional()
    })).output(_zod.z.array(_subledger.SubLedgerSummarySchema)),
    byAccount: _contract.oc.input(_zod.z.object({
        accountId: _zod.z.string().uuid()
    }).merge(_common.PaginationQuerySchema)).output((0, _common.PaginatedResultSchema)(_subledger.SubLedgerEntrySchema))
};
const subLedgerContract = _contract.oc.router({
    entries: _contract.oc.router(subLedgerProcedures.entries),
    summary: subLedgerProcedures.summary,
    byAccount: subLedgerProcedures.byAccount
});
