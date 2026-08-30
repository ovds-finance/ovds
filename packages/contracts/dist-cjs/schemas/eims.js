/**
 * @ovds/contracts — EIMS Schemas (Ethiopia e-Invoice Management System)
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
    get EimsAuthRequestSchema () {
        return EimsAuthRequestSchema;
    },
    get EimsAuthResponseSchema () {
        return EimsAuthResponseSchema;
    },
    get EimsBulkResponseSchema () {
        return EimsBulkResponseSchema;
    },
    get EimsCancelRequestSchema () {
        return EimsCancelRequestSchema;
    },
    get EimsInvoiceRegisterSchema () {
        return EimsInvoiceRegisterSchema;
    },
    get EimsRegisterResponseSchema () {
        return EimsRegisterResponseSchema;
    },
    get EimsSalesReceiptSchema () {
        return EimsSalesReceiptSchema;
    },
    get EimsVerifyRequestSchema () {
        return EimsVerifyRequestSchema;
    },
    get EimsWithholdingReceiptSchema () {
        return EimsWithholdingReceiptSchema;
    }
});
const _zod = require("zod");
const EimsAuthRequestSchema = _zod.z.object({
    clientId: _zod.z.string(),
    clientSecret: _zod.z.string(),
    apiKey: _zod.z.string(),
    tin: _zod.z.string()
});
const EimsAuthResponseSchema = _zod.z.object({
    accessToken: _zod.z.string(),
    refreshToken: _zod.z.string(),
    encryptionKey: _zod.z.string().optional(),
    expiresIn: _zod.z.number().int()
});
const EimsInvoiceRegisterSchema = _zod.z.object({
    buyerDetails: _zod.z.object({
        tin: _zod.z.string(),
        legalName: _zod.z.string(),
        email: _zod.z.string().email().optional(),
        phone: _zod.z.string().optional(),
        region: _zod.z.string(),
        city: _zod.z.string().optional(),
        zone: _zod.z.string().optional(),
        woreda: _zod.z.string().optional(),
        kebele: _zod.z.string().optional(),
        country: _zod.z.string().default('70'),
        idType: _zod.z.string().optional(),
        idNumber: _zod.z.string().optional(),
        vatNumber: _zod.z.string().optional()
    }),
    documentDetails: _zod.z.object({
        documentNumber: _zod.z.string(),
        date: _zod.z.string(),
        type: _zod.z.enum([
            'INV',
            'CN',
            'DN'
        ])
    }),
    itemList: _zod.z.array(_zod.z.object({
        lineNumber: _zod.z.number().int(),
        itemCode: _zod.z.string(),
        productDescription: _zod.z.string(),
        quantity: _zod.z.number().positive(),
        unit: _zod.z.string(),
        unitPrice: _zod.z.number().nonnegative(),
        preTaxValue: _zod.z.number().nonnegative(),
        taxAmount: _zod.z.number().nonnegative(),
        taxCode: _zod.z.string(),
        totalLineAmount: _zod.z.number().nonnegative(),
        discount: _zod.z.number().nonnegative().default(0),
        exciseTaxValue: _zod.z.number().nonnegative().default(0),
        natureOfSupplies: _zod.z.string().default('Goods'),
        harmonizationCode: _zod.z.string().optional()
    })),
    paymentDetails: _zod.z.object({
        mode: _zod.z.enum([
            'CASH',
            'CHEQUE',
            'CPO',
            'Local Bank Transfer',
            'SWIFT',
            'Wire Transfer',
            'Letter of Credit',
            'Card'
        ]),
        paymentTerm: _zod.z.string().default('IMMIDIATE')
    }),
    referenceDetails: _zod.z.object({
        previousIrn: _zod.z.string().optional(),
        relatedDocument: _zod.z.string().optional()
    }),
    sellerDetails: _zod.z.object({
        tin: _zod.z.string(),
        legalName: _zod.z.string(),
        email: _zod.z.string(),
        phone: _zod.z.string(),
        region: _zod.z.string(),
        city: _zod.z.string().optional(),
        subCity: _zod.z.string().optional(),
        locality: _zod.z.string().optional(),
        houseNumber: _zod.z.string().optional(),
        woreda: _zod.z.string(),
        vatNumber: _zod.z.string().optional()
    }),
    sourceSystem: _zod.z.object({
        systemNumber: _zod.z.string(),
        systemType: _zod.z.enum([
            'ERP',
            'POS',
            'MANUAL'
        ]),
        cashierName: _zod.z.string().optional(),
        salesPersonName: _zod.z.string().optional(),
        invoiceCounter: _zod.z.number().int()
    }),
    transactionType: _zod.z.enum([
        'B2B',
        'B2C',
        'B2G',
        'B2N'
    ]).default('B2B'),
    valueDetails: _zod.z.object({
        totalValue: _zod.z.number().nonnegative(),
        taxValue: _zod.z.number().nonnegative(),
        exciseValue: _zod.z.number().nonnegative().default(0),
        discount: _zod.z.number().nonnegative().optional(),
        incomeWithholdValue: _zod.z.number().nonnegative().default(0),
        transactionWithholdValue: _zod.z.number().nonnegative().default(0),
        invoiceCurrency: _zod.z.string().default('ETB'),
        exchangeRate: _zod.z.number().optional()
    }),
    version: _zod.z.literal('1')
});
const EimsCancelRequestSchema = _zod.z.object({
    irn: _zod.z.string().length(64),
    reasonCode: _zod.z.string(),
    remark: _zod.z.string().optional()
});
const EimsVerifyRequestSchema = _zod.z.object({
    irn: _zod.z.string()
});
const EimsSalesReceiptSchema = _zod.z.object({
    receiptNumber: _zod.z.string(),
    receiptType: _zod.z.literal('Sales Receipts'),
    reason: _zod.z.string(),
    receiptDate: _zod.z.string(),
    receiptCounter: _zod.z.string(),
    manualReceiptNumber: _zod.z.string().optional(),
    sourceSystemType: _zod.z.enum([
        'POS',
        'MAN',
        'CRM',
        'EFD',
        'SYS'
    ]),
    sourceSystemNumber: _zod.z.string(),
    receiptCurrency: _zod.z.string().default('ETB'),
    exchangeRate: _zod.z.number().optional(),
    collectedAmount: _zod.z.number().positive(),
    sellerTin: _zod.z.string(),
    invoices: _zod.z.array(_zod.z.object({
        invoiceIrn: _zod.z.string().length(64),
        paymentCoverage: _zod.z.enum([
            'FULL',
            'PARTIAL'
        ]),
        invoicePaidAmount: _zod.z.number().nonnegative(),
        discountAmount: _zod.z.number().nonnegative().optional(),
        remainingAmount: _zod.z.number().nonnegative().optional(),
        totalAmount: _zod.z.number().nonnegative()
    })),
    transactionDetails: _zod.z.object({
        modeOfPayment: _zod.z.enum([
            'CASH',
            'CHEQUE',
            'CPO',
            'Local Bank Transfer',
            'SWIFT',
            'Wire Transfer',
            'Letter of Credit',
            'Card'
        ]),
        chequeNumber: _zod.z.string().optional(),
        cpoNumber: _zod.z.string().optional(),
        documentNumber: _zod.z.string().optional(),
        collectorName: _zod.z.string().optional(),
        paymentServiceProvider: _zod.z.string().optional(),
        otherPaymentServiceProviderName: _zod.z.string().optional(),
        accountNumber: _zod.z.string().optional(),
        transactionNumber: _zod.z.string().optional()
    })
});
const EimsWithholdingReceiptSchema = _zod.z.object({
    receiptNumber: _zod.z.string(),
    reason: _zod.z.string(),
    receiptCounter: _zod.z.string(),
    manualReceiptNumber: _zod.z.string().optional(),
    sourceSystemType: _zod.z.string(),
    sourceSystemNumber: _zod.z.string(),
    invoiceDetail: _zod.z.object({
        invoiceIrn: _zod.z.string().length(64),
        currency: _zod.z.string().default('ETB'),
        exchangeRate: _zod.z.number().optional()
    }),
    withholdDetail: _zod.z.object({
        type: _zod.z.enum([
            'TWHT',
            'IWHT'
        ]),
        rate: _zod.z.number().optional(),
        preTaxAmount: _zod.z.number().nonnegative(),
        withholdingAmount: _zod.z.number().nonnegative()
    })
});
const EimsRegisterResponseSchema = _zod.z.object({
    irn: _zod.z.string(),
    ackDate: _zod.z.string(),
    signedQr: _zod.z.string().optional(),
    status: _zod.z.string(),
    documentNumber: _zod.z.string(),
    signedInvoice: _zod.z.string().optional(),
    errorMessage: _zod.z.string().optional()
});
const EimsBulkResponseSchema = _zod.z.object({
    irn: _zod.z.string().optional(),
    status: _zod.z.string(),
    documentNumber: _zod.z.string().optional(),
    docNo: _zod.z.string().optional(),
    ruleError: _zod.z.array(_zod.z.object({
        portion: _zod.z.string(),
        errorMessage: _zod.z.array(_zod.z.string())
    })).optional(),
    conversionId: _zod.z.string().optional()
});
