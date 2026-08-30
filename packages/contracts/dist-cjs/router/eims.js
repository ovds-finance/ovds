/**
 * @ovds/contracts — EIMS oRPC Router Contract (Ethiopia e-Invoice Management System)
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "eimsContract", {
    enumerable: true,
    get: function() {
        return eimsContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _eims = require("../schemas/eims");
const _common = require("../schemas/common");
const authProcedures = {
    login: _contract.oc.input(_eims.EimsAuthRequestSchema).output(_eims.EimsAuthResponseSchema),
    refreshToken: _contract.oc.input(_zod.z.object({
        refreshToken: _zod.z.string()
    })).output(_eims.EimsAuthResponseSchema)
};
const registerProcedures = {
    single: _contract.oc.input(_eims.EimsInvoiceRegisterSchema).output(_eims.EimsRegisterResponseSchema),
    bulk: _contract.oc.input(_zod.z.object({
        items: _zod.z.array(_eims.EimsInvoiceRegisterSchema)
    })).output(_zod.z.object({
        conversationId: _zod.z.string()
    }))
};
const cancelProcedures = {
    single: _contract.oc.input(_eims.EimsCancelRequestSchema).output(_zod.z.object({
        success: _zod.z.boolean(),
        cancellationDate: _zod.z.string().optional()
    })),
    bulk: _contract.oc.input(_zod.z.object({
        items: _zod.z.array(_eims.EimsCancelRequestSchema)
    })).output(_zod.z.object({
        conversationId: _zod.z.string()
    }))
};
const verifyProcedures = {
    byIrn: _contract.oc.input(_eims.EimsVerifyRequestSchema).output(_zod.z.object({
        status: _zod.z.string(),
        irn: _zod.z.string().optional(),
        details: _zod.z.any().optional()
    }))
};
const receiptProcedures = {
    sales: _contract.oc.input(_eims.EimsSalesReceiptSchema).output(_eims.EimsRegisterResponseSchema),
    withholding: _contract.oc.input(_eims.EimsWithholdingReceiptSchema).output(_eims.EimsRegisterResponseSchema)
};
const bulkProcedures = {
    register: _contract.oc.input(_zod.z.object({
        items: _zod.z.array(_zod.z.string())
    })).output(_zod.z.object({
        conversationId: _zod.z.string()
    })),
    cancel: _contract.oc.input(_zod.z.object({
        items: _zod.z.array(_zod.z.object({
            irn: _zod.z.string(),
            reasonCode: _zod.z.string(),
            remark: _zod.z.string().optional()
        }))
    })).output(_zod.z.object({
        conversationId: _zod.z.string()
    })),
    jobs: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_zod.z.object({
        id: _zod.z.string().uuid(),
        conversationId: _zod.z.string(),
        type: _zod.z.string(),
        status: _zod.z.string(),
        totalItems: _zod.z.number().int(),
        processedItems: _zod.z.number().int(),
        successCount: _zod.z.number().int(),
        failureCount: _zod.z.number().int(),
        createdAt: _zod.z.string()
    })))
};
const eimsContract = _contract.oc.router({
    auth: _contract.oc.router(authProcedures),
    register: _contract.oc.router(registerProcedures),
    cancel: _contract.oc.router(cancelProcedures),
    verify: _contract.oc.router(verifyProcedures),
    receipts: _contract.oc.router(receiptProcedures),
    bulk: _contract.oc.router(bulkProcedures)
});
