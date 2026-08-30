/**
 * @ovds/contracts — EIMS Schemas (Ethiopia e-Invoice Management System)
 */
import { z } from 'zod';

export const EimsAuthRequestSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  apiKey: z.string(),
  tin: z.string(),
});

export const EimsAuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  encryptionKey: z.string().optional(),
  expiresIn: z.number().int(),
});

export const EimsInvoiceRegisterSchema = z.object({
  buyerDetails: z.object({
    tin: z.string(),
    legalName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    region: z.string(),
    city: z.string().optional(),
    zone: z.string().optional(),
    woreda: z.string().optional(),
    kebele: z.string().optional(),
    country: z.string().default('70'),
    idType: z.string().optional(),
    idNumber: z.string().optional(),
    vatNumber: z.string().optional(),
  }),
  documentDetails: z.object({
    documentNumber: z.string(),
    date: z.string(),
    type: z.enum(['INV', 'CN', 'DN']),
  }),
  itemList: z.array(z.object({
    lineNumber: z.number().int(),
    itemCode: z.string(),
    productDescription: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    unitPrice: z.number().nonnegative(),
    preTaxValue: z.number().nonnegative(),
    taxAmount: z.number().nonnegative(),
    taxCode: z.string(),
    totalLineAmount: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
    exciseTaxValue: z.number().nonnegative().default(0),
    natureOfSupplies: z.string().default('Goods'),
    harmonizationCode: z.string().optional(),
  })),
  paymentDetails: z.object({
    mode: z.enum(['CASH', 'CHEQUE', 'CPO', 'Local Bank Transfer', 'SWIFT', 'Wire Transfer', 'Letter of Credit', 'Card']),
    paymentTerm: z.string().default('IMMIDIATE'),
  }),
  referenceDetails: z.object({
    previousIrn: z.string().optional(),
    relatedDocument: z.string().optional(),
  }),
  sellerDetails: z.object({
    tin: z.string(),
    legalName: z.string(),
    email: z.string(),
    phone: z.string(),
    region: z.string(),
    city: z.string().optional(),
    subCity: z.string().optional(),
    locality: z.string().optional(),
    houseNumber: z.string().optional(),
    woreda: z.string(),
    vatNumber: z.string().optional(),
  }),
  sourceSystem: z.object({
    systemNumber: z.string(),
    systemType: z.enum(['ERP', 'POS', 'MANUAL']),
    cashierName: z.string().optional(),
    salesPersonName: z.string().optional(),
    invoiceCounter: z.number().int(),
  }),
  transactionType: z.enum(['B2B', 'B2C', 'B2G', 'B2N']).default('B2B'),
  valueDetails: z.object({
    totalValue: z.number().nonnegative(),
    taxValue: z.number().nonnegative(),
    exciseValue: z.number().nonnegative().default(0),
    discount: z.number().nonnegative().optional(),
    incomeWithholdValue: z.number().nonnegative().default(0),
    transactionWithholdValue: z.number().nonnegative().default(0),
    invoiceCurrency: z.string().default('ETB'),
    exchangeRate: z.number().optional(),
  }),
  version: z.literal('1'),
});

export const EimsCancelRequestSchema = z.object({
  irn: z.string().length(64),
  reasonCode: z.string(),
  remark: z.string().optional(),
});

export const EimsVerifyRequestSchema = z.object({
  irn: z.string(),
});

export const EimsSalesReceiptSchema = z.object({
  receiptNumber: z.string(),
  receiptType: z.literal('Sales Receipts'),
  reason: z.string(),
  receiptDate: z.string(),
  receiptCounter: z.string(),
  manualReceiptNumber: z.string().optional(),
  sourceSystemType: z.enum(['POS', 'MAN', 'CRM', 'EFD', 'SYS']),
  sourceSystemNumber: z.string(),
  receiptCurrency: z.string().default('ETB'),
  exchangeRate: z.number().optional(),
  collectedAmount: z.number().positive(),
  sellerTin: z.string(),
  invoices: z.array(z.object({
    invoiceIrn: z.string().length(64),
    paymentCoverage: z.enum(['FULL', 'PARTIAL']),
    invoicePaidAmount: z.number().nonnegative(),
    discountAmount: z.number().nonnegative().optional(),
    remainingAmount: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative(),
  })),
  transactionDetails: z.object({
    modeOfPayment: z.enum(['CASH', 'CHEQUE', 'CPO', 'Local Bank Transfer', 'SWIFT', 'Wire Transfer', 'Letter of Credit', 'Card']),
    chequeNumber: z.string().optional(),
    cpoNumber: z.string().optional(),
    documentNumber: z.string().optional(),
    collectorName: z.string().optional(),
    paymentServiceProvider: z.string().optional(),
    otherPaymentServiceProviderName: z.string().optional(),
    accountNumber: z.string().optional(),
    transactionNumber: z.string().optional(),
  }),
});

export const EimsWithholdingReceiptSchema = z.object({
  receiptNumber: z.string(),
  reason: z.string(),
  receiptCounter: z.string(),
  manualReceiptNumber: z.string().optional(),
  sourceSystemType: z.string(),
  sourceSystemNumber: z.string(),
  invoiceDetail: z.object({
    invoiceIrn: z.string().length(64),
    currency: z.string().default('ETB'),
    exchangeRate: z.number().optional(),
  }),
  withholdDetail: z.object({
    type: z.enum(['TWHT', 'IWHT']),
    rate: z.number().optional(),
    preTaxAmount: z.number().nonnegative(),
    withholdingAmount: z.number().nonnegative(),
  }),
});

export const EimsRegisterResponseSchema = z.object({
  irn: z.string(),
  ackDate: z.string(),
  signedQr: z.string().optional(),
  status: z.string(),
  documentNumber: z.string(),
  signedInvoice: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const EimsBulkResponseSchema = z.object({
  irn: z.string().optional(),
  status: z.string(),
  documentNumber: z.string().optional(),
  docNo: z.string().optional(),
  ruleError: z.array(z.object({
    portion: z.string(),
    errorMessage: z.array(z.string()),
  })).optional(),
  conversionId: z.string().optional(),
});
