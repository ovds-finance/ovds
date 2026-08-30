/**
 * @ovds/contracts — Purchases oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "purchasesContract", {
    enumerable: true,
    get: function() {
        return purchasesContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _purchases = require("../schemas/purchases");
const _common = require("../schemas/common");
const billProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional(),
        vendorId: _zod.z.string().uuid().optional()
    }))).output((0, _common.PaginatedResultSchema)(_purchases.BillSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_purchases.BillSchema),
    create: _contract.oc.input(_zod.z.object({
        billNumber: _zod.z.string(),
        vendorId: _zod.z.string().nullable().optional(),
        vendorName: _zod.z.string().nullable().optional(),
        category: _zod.z.string(),
        amount: _zod.z.number().nonnegative(),
        vatAmount: _zod.z.number().nonnegative().default(0),
        vatRate: _zod.z.number().nonnegative().nullable().optional(),
        total: _zod.z.number().nonnegative(),
        status: _zod.z.enum([
            'DRAFT',
            'PENDING',
            'PAID',
            'OVERDUE',
            'CANCELLED',
            'PARTIAL'
        ]),
        dueDate: _zod.z.coerce.date(),
        notes: _zod.z.string().nullable().optional(),
        companyId: _zod.z.string().nullable().optional(),
        vendorTin: _zod.z.string().nullable().optional(),
        whtApplicable: _zod.z.boolean().default(false),
        currencyCode: _zod.z.string().default('ETB')
    })).output(_purchases.BillSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            billNumber: _zod.z.string().optional(),
            vendorId: _zod.z.string().nullable().optional(),
            vendorName: _zod.z.string().nullable().optional(),
            category: _zod.z.string().optional(),
            amount: _zod.z.number().nonnegative().optional(),
            vatAmount: _zod.z.number().nonnegative().optional(),
            vatRate: _zod.z.number().nonnegative().nullable().optional(),
            total: _zod.z.number().nonnegative().optional(),
            status: _zod.z.enum([
                'DRAFT',
                'PENDING',
                'PAID',
                'OVERDUE',
                'CANCELLED',
                'PARTIAL'
            ]).optional(),
            dueDate: _zod.z.coerce.date().optional(),
            notes: _zod.z.string().nullable().optional(),
            companyId: _zod.z.string().nullable().optional(),
            vendorTin: _zod.z.string().nullable().optional(),
            whtApplicable: _zod.z.boolean().optional(),
            currencyCode: _zod.z.string().optional()
        })
    }))).output(_purchases.BillSchema),
    markPaid: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        amount: _zod.z.number().positive(),
        paymentDate: _zod.z.string(),
        paymentMethod: _zod.z.string()
    }))).output(_purchases.BillSchema)
};
const vendorProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_purchases.VendorSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_purchases.VendorSchema),
    create: _contract.oc.input(_zod.z.object({
        name: _zod.z.string(),
        email: _zod.z.string().email().nullable().optional(),
        phone: _zod.z.string().nullable().optional(),
        address: _zod.z.string().nullable().optional(),
        tin: _zod.z.string().nullable().optional(),
        category: _zod.z.string().nullable().optional(),
        paymentTerms: _zod.z.string().nullable().optional(),
        companyId: _zod.z.string().nullable().optional(),
        isActive: _zod.z.boolean().default(true),
        notes: _zod.z.string().nullable().optional()
    })).output(_purchases.VendorSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _zod.z.object({
            name: _zod.z.string().optional(),
            email: _zod.z.string().email().nullable().optional(),
            phone: _zod.z.string().nullable().optional(),
            address: _zod.z.string().nullable().optional(),
            tin: _zod.z.string().nullable().optional(),
            category: _zod.z.string().nullable().optional(),
            paymentTerms: _zod.z.string().nullable().optional(),
            companyId: _zod.z.string().nullable().optional(),
            isActive: _zod.z.boolean().optional(),
            notes: _zod.z.string().nullable().optional()
        })
    }))).output(_purchases.VendorSchema),
    statement: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        dateFrom: _zod.z.string().optional(),
        dateTo: _zod.z.string().optional()
    }))).output(_zod.z.object({
        vendor: _purchases.VendorSchema,
        transactions: _zod.z.array(_zod.z.any()),
        openingBalance: _zod.z.number(),
        closingBalance: _zod.z.number()
    }))
};
const purchaseOrderProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        status: _zod.z.string().optional(),
        vendorId: _zod.z.string().uuid().optional()
    }))).output((0, _common.PaginatedResultSchema)(_purchases.PurchaseOrderSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_purchases.PurchaseOrderSchema),
    create: _contract.oc.input(_zod.z.object({
        poNumber: _zod.z.string(),
        vendorId: _zod.z.string().uuid().optional(),
        vendorName: _zod.z.string().optional(),
        status: _zod.z.enum([
            'draft',
            'sent',
            'approved',
            'received',
            'cancelled'
        ]),
        expectedDelivery: _zod.z.string().optional(),
        totalAmount: _zod.z.number().nonnegative(),
        currencyCode: _zod.z.string().default('ETB'),
        notes: _zod.z.string().optional(),
        items: _zod.z.string().optional()
    })).output(_purchases.PurchaseOrderSchema),
    approve: _contract.oc.input(_common.IdParamSchema).output(_purchases.PurchaseOrderSchema),
    cancel: _contract.oc.input(_common.IdParamSchema).output(_purchases.PurchaseOrderSchema)
};
const grnProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema).output((0, _common.PaginatedResultSchema)(_purchases.GoodsReceivedNoteSchema)),
    create: _contract.oc.input(_zod.z.object({
        grnNumber: _zod.z.string(),
        purchaseOrderId: _zod.z.string().uuid().optional(),
        vendorId: _zod.z.string().uuid(),
        receivedDate: _zod.z.string(),
        status: _zod.z.enum([
            'draft',
            'received',
            'accepted',
            'rejected'
        ]),
        items: _zod.z.string().optional(),
        notes: _zod.z.string().optional()
    })).output(_purchases.GoodsReceivedNoteSchema)
};
const vendorPaymentProcedures = {
    list: _contract.oc.input(_common.PaginationQuerySchema.merge(_zod.z.object({
        vendorId: _zod.z.string().uuid().optional()
    }))).output((0, _common.PaginatedResultSchema)(_purchases.VendorPaymentSchema)),
    create: _contract.oc.input(_zod.z.object({
        vendorId: _zod.z.string().uuid(),
        amount: _zod.z.number().positive(),
        currencyCode: _zod.z.string().default('ETB'),
        paymentDate: _zod.z.string(),
        paymentMethod: _zod.z.string(),
        reference: _zod.z.string().optional(),
        notes: _zod.z.string().optional()
    })).output(_purchases.VendorPaymentSchema)
};
const purchasesContract = _contract.oc.router({
    bills: _contract.oc.router(billProcedures),
    vendors: _contract.oc.router(vendorProcedures),
    purchaseOrders: _contract.oc.router(purchaseOrderProcedures),
    grn: _contract.oc.router(grnProcedures),
    vendorPayments: _contract.oc.router(vendorPaymentProcedures)
});
