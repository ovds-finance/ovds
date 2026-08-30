/**
 * @ovds/contracts — ovds oRPC Router Contract
 *
 * Defines the type-safe API contract for the ovds domain.
 * Both NestJS (implements it) and React (calls it) import from here.
 * No business logic lives here — only shapes.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ovdsContract", {
    enumerable: true,
    get: function() {
        return ovdsContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _ovds = require("../schemas/ovds");
const _common = require("../schemas/common");
// ── Customer procedures ───────────────────────────────────────────────────────
const customerProcedures = {
    list: _contract.oc.input(_ovds.ListCustomersQuerySchema).output((0, _common.PaginatedResultSchema)(_ovds.CustomerSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.CustomerSchema),
    create: _contract.oc.input(_ovds.CreateCustomerSchema).output(_ovds.CustomerSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _ovds.UpdateCustomerSchema
    }))).output(_ovds.CustomerSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Vendor procedures ─────────────────────────────────────────────────────────
const vendorProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        companyId: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_ovds.VendorSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.VendorSchema),
    create: _contract.oc.input(_ovds.CreateVendorSchema).output(_ovds.VendorSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _ovds.UpdateVendorSchema
    }))).output(_ovds.VendorSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Invoice procedures ────────────────────────────────────────────────────────
const invoiceProcedures = {
    list: _contract.oc.input(_ovds.ListInvoicesQuerySchema).output((0, _common.PaginatedResultSchema)(_ovds.InvoiceSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.InvoiceSchema),
    create: _contract.oc.input(_ovds.CreateInvoiceSchema).output(_ovds.InvoiceSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _ovds.UpdateInvoiceSchema
    }))).output(_ovds.InvoiceSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    markPaid: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        method: _zod.z.string().default('CASH'),
        amount: _zod.z.number().positive(),
        reference: _zod.z.string().optional(),
        paidAt: _zod.z.coerce.date().optional()
    }))).output(_ovds.InvoiceSchema)
};
// ── Bill procedures ───────────────────────────────────────────────────────────
const billProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        companyId: _zod.z.string().optional(),
        status: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_ovds.BillSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.BillSchema),
    create: _contract.oc.input(_ovds.CreateBillSchema).output(_ovds.BillSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _ovds.UpdateBillSchema
    }))).output(_ovds.BillSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    payments: {
        list: _contract.oc.input(_common.IdParamSchema).output(_zod.z.array(_ovds.BillPaymentSchema)),
        create: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
            data: _ovds.CreateBillPaymentSchema
        }))).output(_ovds.BillPaymentSchema),
        remove: _contract.oc.input(_zod.z.object({
            billId: _zod.z.string(),
            paymentId: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        }))
    }
};
// ── Bank Account procedures ───────────────────────────────────────────────────
const bankAccountProcedures = {
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_ovds.BankAccountSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.BankAccountSchema),
    create: _contract.oc.input(_ovds.CreateBankAccountSchema).output(_ovds.BankAccountSchema)
};
// ── Account (Chart of Accounts) procedures ────────────────────────────────────
const accountProcedures = {
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_ovds.AccountSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_ovds.AccountSchema)
};
const ovdsContract = _contract.oc.router({
    customers: _contract.oc.router(customerProcedures),
    vendors: _contract.oc.router(vendorProcedures),
    invoices: _contract.oc.router(invoiceProcedures),
    bills: _contract.oc.router(billProcedures),
    bankAccounts: _contract.oc.router(bankAccountProcedures),
    accounts: _contract.oc.router(accountProcedures)
});
