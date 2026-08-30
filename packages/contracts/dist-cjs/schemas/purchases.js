/**
 * @ovds/contracts — Purchases Schemas
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
    get BillSchema () {
        return _ovds.BillSchema;
    },
    get DebitNoteSchema () {
        return DebitNoteSchema;
    },
    get GoodsReceivedNoteSchema () {
        return GoodsReceivedNoteSchema;
    },
    get PurchaseOrderSchema () {
        return PurchaseOrderSchema;
    },
    get VendorPaymentSchema () {
        return VendorPaymentSchema;
    },
    get VendorSchema () {
        return _ovds.VendorSchema;
    }
});
const _zod = require("zod");
const _ovds = require("./ovds");
const PurchaseOrderSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
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
    items: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const GoodsReceivedNoteSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
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
    notes: _zod.z.string().optional(),
    createdAt: _zod.z.string()
});
const DebitNoteSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    debitNoteNumber: _zod.z.string(),
    billId: _zod.z.string().uuid().optional(),
    vendorId: _zod.z.string().uuid(),
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
const VendorPaymentSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    vendorId: _zod.z.string().uuid(),
    amount: _zod.z.number().positive(),
    currencyCode: _zod.z.string().default('ETB'),
    paymentDate: _zod.z.string(),
    paymentMethod: _zod.z.string(),
    reference: _zod.z.string().optional(),
    notes: _zod.z.string().optional(),
    createdAt: _zod.z.string()
});
