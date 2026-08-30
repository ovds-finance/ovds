/**
 * @ovds/contracts — Sales Schemas
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateInvoiceSchema () {
        return _ovds.CreateInvoiceSchema;
    },
    get CreditNoteSchema () {
        return CreditNoteSchema;
    },
    get CustomFieldValuesMapSchema () {
        return _customfields.CustomFieldValuesMapSchema;
    },
    get CustomerSchema () {
        return _ovds.CustomerSchema;
    },
    get EstimateSchema () {
        return EstimateSchema;
    },
    get InvoiceItemSchema () {
        return _ovds.InvoiceItemSchema;
    },
    get InvoiceSchema () {
        return _ovds.InvoiceSchema;
    },
    get InvoiceStatusSchema () {
        return _ovds.InvoiceStatusSchema;
    },
    get RevenueSchema () {
        return RevenueSchema;
    }
});
const _zod = require("zod");
const _ovds = require("./ovds");
const _customfields = require("./custom-fields");
const RevenueSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    amount: _zod.z.number().positive(),
    currencyCode: _zod.z.string().default('ETB'),
    category: _zod.z.string(),
    description: _zod.z.string().optional(),
    receivedAt: _zod.z.string(),
    accountId: _zod.z.string().uuid().optional(),
    customerId: _zod.z.string().uuid().optional(),
    createdAt: _zod.z.string()
});
const EstimateSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
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
    total: _zod.z.number(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const CreditNoteSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
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
    ]),
    createdAt: _zod.z.string()
});
