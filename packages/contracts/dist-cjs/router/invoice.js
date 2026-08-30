/**
 * @ovds/contracts — Invoice oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "invoiceContract", {
    enumerable: true,
    get: function() {
        return invoiceContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _ovds = require("../schemas/ovds");
const _common = require("../schemas/common");
const invoiceProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_ovds.InvoiceSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.InvoiceSchema.optional()),
    create: _contract.oc.input(_ovds.CreateInvoiceSchema).output(_ovds.InvoiceSchema),
    update: _contract.oc.input(_ovds.UpdateInvoiceSchema).output(_ovds.InvoiceSchema),
    delete: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    getByNumber: _contract.oc.input(_zod.z.object({
        invoiceNumber: _zod.z.string()
    })).output(_ovds.InvoiceSchema.optional()),
    getByCustomer: _contract.oc.input(_zod.z.object({
        customerId: _zod.z.string().uuid()
    }).merge(_common.PaginationQuerySchema)).output((0, _common.PaginatedResultSchema)(_ovds.InvoiceSchema)),
    getOverdue: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_ovds.InvoiceSchema)),
    markPaid: _contract.oc.input(_zod.z.object({
        id: _zod.z.string().uuid(),
        amount: _zod.z.number().nonnegative()
    })).output(_ovds.InvoiceSchema)
};
const invoiceContract = _contract.oc.router({
    ...invoiceProcedures
});
