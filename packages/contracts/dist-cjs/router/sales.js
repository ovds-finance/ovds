/**
 * @ovds/contracts — Sales oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "salesContract", {
    enumerable: true,
    get: function() {
        return salesContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _sales = require("../schemas/sales");
const _common = require("../schemas/common");
const invoiceProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional(),
        customerId: _zod.z.string().uuid().optional()
    }))).output((0, _common.PaginatedResultSchema)(_sales.InvoiceSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_sales.InvoiceSchema),
    create: _contract.oc.input(_sales.CreateInvoiceSchema).output(_sales.InvoiceSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            customerId: _zod.z.string().nullable().optional(),
            customerName: _zod.z.string().optional(),
            customerEmail: _zod.z.string().email().nullable().optional(),
            customerPhone: _zod.z.string().nullable().optional(),
            customerAddress: _zod.z.string().nullable().optional(),
            customerTin: _zod.z.string().nullable().optional(),
            status: _sales.InvoiceStatusSchema.optional(),
            date: _zod.z.coerce.date().optional(),
            dueDate: _zod.z.coerce.date().nullable().optional(),
            subtotal: _zod.z.number().nonnegative().optional(),
            discountAmount: _zod.z.number().nonnegative().optional(),
            vatAmount: _zod.z.number().nonnegative().optional(),
            vatRate: _zod.z.number().nonnegative().optional(),
            totalAmount: _zod.z.number().nonnegative().optional(),
            notes: _zod.z.string().nullable().optional(),
            companyId: _zod.z.string().optional(),
            isRecurring: _zod.z.boolean().optional(),
            recurringInterval: _zod.z.enum([
                'WEEKLY',
                'MONTHLY',
                'QUARTERLY',
                'YEARLY'
            ]).nullable().optional(),
            items: _zod.z.array(_sales.InvoiceItemSchema).optional(),
            customFields: _sales.CustomFieldValuesMapSchema.optional()
        })
    }))).output(_sales.InvoiceSchema),
    send: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        method: _zod.z.string().optional()
    }))).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    cancel: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        reason: _zod.z.string()
    }))).output(_sales.InvoiceSchema),
    markPaid: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        amount: _zod.z.number().positive(),
        paymentDate: _zod.z.string()
    }))).output(_sales.InvoiceSchema)
};
const revenueProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_sales.RevenueSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_sales.RevenueSchema),
    create: _contract.oc.input(_zod.z.object({
        amount: _zod.z.number().positive(),
        currencyCode: _zod.z.string().default('ETB'),
        category: _zod.z.string(),
        description: _zod.z.string().optional(),
        receivedAt: _zod.z.string(),
        accountId: _zod.z.string().uuid().optional(),
        customerId: _zod.z.string().uuid().optional()
    })).output(_sales.RevenueSchema)
};
const customerProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_sales.CustomerSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_sales.CustomerSchema),
    create: _contract.oc.input(_zod.z.object({
        name: _zod.z.string(),
        email: _zod.z.string().email().optional(),
        phone: _zod.z.string().optional(),
        address: _zod.z.string().optional(),
        taxNumber: _zod.z.string().optional(),
        currencyCode: _zod.z.string().default('ETB')
    })).output(_sales.CustomerSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            name: _zod.z.string().optional(),
            email: _zod.z.string().email().optional(),
            phone: _zod.z.string().optional(),
            address: _zod.z.string().optional(),
            taxNumber: _zod.z.string().optional(),
            currencyCode: _zod.z.string().optional()
        })
    }))).output(_sales.CustomerSchema),
    statement: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        dateFrom: _zod.z.string().optional(),
        dateTo: _zod.z.string().optional()
    }))).output(_zod.z.object({
        customer: _sales.CustomerSchema,
        transactions: _zod.z.array(_zod.z.any()),
        openingBalance: _zod.z.number(),
        closingBalance: _zod.z.number()
    }))
};
const estimateProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_sales.EstimateSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_sales.EstimateSchema),
    create: _contract.oc.input(_zod.z.object({
        estimateNumber: _zod.z.string(),
        customerId: _zod.z.string().uuid(),
        estimateDate: _zod.z.string(),
        expiryDate: _zod.z.string().optional(),
        status: _zod.z.enum([
            'draft',
            'sent',
            'approved',
            'rejected',
            'converted',
            'expired'
        ]),
        subTotal: _zod.z.number(),
        taxTotal: _zod.z.number(),
        total: _zod.z.number()
    })).output(_sales.EstimateSchema),
    convertToInvoice: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean(),
        invoiceId: _zod.z.string().uuid().optional()
    }))
};
const creditNoteProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_sales.CreditNoteSchema)),
    create: _contract.oc.input(_zod.z.object({
        creditNoteNumber: _zod.z.string(),
        invoiceId: _zod.z.string().uuid().optional(),
        customerId: _zod.z.string().uuid(),
        amount: _zod.z.number().positive(),
        reason: _zod.z.string().optional(),
        status: _zod.z.enum([
            'draft',
            'issued',
            'applied',
            'cancelled'
        ])
    })).output(_sales.CreditNoteSchema)
};
const salesContract = _contract.oc.router({
    invoices: _contract.oc.router(invoiceProcedures),
    revenues: _contract.oc.router(revenueProcedures),
    customers: _contract.oc.router(customerProcedures),
    estimates: _contract.oc.router(estimateProcedures),
    creditNotes: _contract.oc.router(creditNoteProcedures)
});
