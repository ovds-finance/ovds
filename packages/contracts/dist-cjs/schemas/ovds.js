/**
 * @ovds/contracts — ovds Schemas
 *
 * Zod schemas for Invoice, Bill, Customer, Vendor, BankAccount, Account.
 * These are the single source of truth for request/response contracts on
 * the ovds domain — both the NestJS handler and the React client use them.
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
    get AccountCategorySchema () {
        return AccountCategorySchema;
    },
    get AccountSchema () {
        return AccountSchema;
    },
    get AccountTypeSchema () {
        return AccountTypeSchema;
    },
    get BankAccountSchema () {
        return BankAccountSchema;
    },
    get BillPaymentSchema () {
        return BillPaymentSchema;
    },
    get BillSchema () {
        return BillSchema;
    },
    get BillStatusSchema () {
        return BillStatusSchema;
    },
    get CreateBankAccountSchema () {
        return CreateBankAccountSchema;
    },
    get CreateBillPaymentSchema () {
        return CreateBillPaymentSchema;
    },
    get CreateBillSchema () {
        return CreateBillSchema;
    },
    get CreateCustomerSchema () {
        return CreateCustomerSchema;
    },
    get CreateInvoiceSchema () {
        return CreateInvoiceSchema;
    },
    get CreateVendorSchema () {
        return CreateVendorSchema;
    },
    get CustomerSchema () {
        return CustomerSchema;
    },
    get InvoiceItemSchema () {
        return InvoiceItemSchema;
    },
    get InvoiceSchema () {
        return InvoiceSchema;
    },
    get InvoiceStatusSchema () {
        return InvoiceStatusSchema;
    },
    get ListCustomersQuerySchema () {
        return ListCustomersQuerySchema;
    },
    get ListInvoicesQuerySchema () {
        return ListInvoicesQuerySchema;
    },
    get UpdateBillSchema () {
        return UpdateBillSchema;
    },
    get UpdateCustomerSchema () {
        return UpdateCustomerSchema;
    },
    get UpdateInvoiceSchema () {
        return UpdateInvoiceSchema;
    },
    get UpdateVendorSchema () {
        return UpdateVendorSchema;
    },
    get VendorSchema () {
        return VendorSchema;
    }
});
const _zod = require("zod");
const _common = require("./common");
const _customfields = require("./custom-fields");
const CustomerSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    email: _zod.z.string().email().nullable().optional(),
    phone: _zod.z.string().nullable().optional(),
    address: _zod.z.string().nullable().optional(),
    tin: _zod.z.string().nullable().optional(),
    vatNumber: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    paymentTerms: _zod.z.string().nullable().optional(),
    creditLimit: _zod.z.number().nullable().optional(),
    creditScore: _zod.z.number().int().nullable().optional(),
    kycStatus: _zod.z.enum([
        'PENDING',
        'VERIFIED',
        'REJECTED'
    ]).nullable().optional(),
    riskLevel: _zod.z.enum([
        'LOW',
        'MEDIUM',
        'HIGH'
    ]).nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateCustomerSchema = CustomerSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const UpdateCustomerSchema = CreateCustomerSchema.partial();
const ListCustomersQuerySchema = _common.PaginationQuerySchema.merge(_zod.z.object({
    companyId: _zod.z.string().optional()
}));
const VendorSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    email: _zod.z.string().email().nullable().optional(),
    phone: _zod.z.string().nullable().optional(),
    address: _zod.z.string().nullable().optional(),
    tin: _zod.z.string().nullable().optional(),
    category: _zod.z.string().nullable().optional(),
    paymentTerms: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    notes: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateVendorSchema = VendorSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    status: _zod.z.enum([
        'ACTIVE',
        'INACTIVE'
    ]).optional(),
    currencyCode: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const UpdateVendorSchema = CreateVendorSchema.partial();
const InvoiceStatusSchema = _zod.z.enum([
    'DRAFT',
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'SENT',
    'PARTIAL'
]);
const InvoiceItemSchema = _zod.z.object({
    id: _zod.z.string().optional(),
    itemId: _zod.z.string().nullable().optional(),
    quantity: _zod.z.number().int().positive(),
    salePrice: _zod.z.number().nonnegative(),
    discount: _zod.z.number().nonnegative().default(0),
    discountType: _zod.z.string().optional(),
    discountValue: _zod.z.number().nonnegative().optional(),
    description: _zod.z.string().nullable().optional()
});
const InvoiceSchema = _zod.z.object({
    id: _zod.z.string(),
    invoiceNumber: _zod.z.string(),
    customerId: _zod.z.string().nullable().optional(),
    customerName: _zod.z.string(),
    customerEmail: _zod.z.string().email().nullable().optional(),
    customerPhone: _zod.z.string().nullable().optional(),
    customerAddress: _zod.z.string().nullable().optional(),
    customerTin: _zod.z.string().nullable().optional(),
    status: InvoiceStatusSchema,
    date: _zod.z.coerce.date(),
    dueDate: _zod.z.coerce.date().nullable().optional(),
    subtotal: _zod.z.number().nonnegative().optional(),
    discountAmount: _zod.z.number().nonnegative().optional(),
    vatAmount: _zod.z.number().nonnegative().default(0),
    vatRate: _zod.z.number().nonnegative().default(15),
    totalAmount: _zod.z.number().nonnegative(),
    notes: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    isRecurring: _zod.z.boolean().default(false),
    recurringInterval: _zod.z.enum([
        'WEEKLY',
        'MONTHLY',
        'QUARTERLY',
        'YEARLY'
    ]).nullable().optional(),
    items: _zod.z.array(InvoiceItemSchema).optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateInvoiceSchema = InvoiceSchema.omit({
    id: true,
    invoiceNumber: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const UpdateInvoiceSchema = CreateInvoiceSchema.partial();
const ListInvoicesQuerySchema = _common.PaginationQuerySchema.merge(_common.DateRangeSchema).merge(_zod.z.object({
    companyId: _zod.z.string().optional(),
    status: InvoiceStatusSchema.optional(),
    customerId: _zod.z.string().optional()
}));
const BillStatusSchema = _zod.z.enum([
    'DRAFT',
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'PARTIAL'
]);
const BillSchema = _zod.z.object({
    id: _zod.z.string(),
    billNumber: _zod.z.string(),
    vendorId: _zod.z.string().nullable().optional(),
    vendorName: _zod.z.string().nullable().optional(),
    category: _zod.z.string(),
    amount: _zod.z.number().nonnegative(),
    vatAmount: _zod.z.number().nonnegative().default(0),
    vatRate: _zod.z.number().nonnegative().nullable().optional(),
    total: _zod.z.number().nonnegative(),
    status: BillStatusSchema,
    dueDate: _zod.z.coerce.date(),
    notes: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    vendorTin: _zod.z.string().nullable().optional(),
    whtApplicable: _zod.z.boolean().default(false),
    currencyCode: _zod.z.string().default('ETB'),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateBillSchema = BillSchema.omit({
    id: true,
    billNumber: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    vendor: _zod.z.string().optional(),
    date: _zod.z.coerce.date().optional(),
    currencyRate: _zod.z.number().optional(),
    recurringInterval: _zod.z.string().optional(),
    recurringNextDate: _zod.z.coerce.date().nullable().optional(),
    warehouseId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional(),
    items: _zod.z.array(_zod.z.object({
        itemId: _zod.z.string().nullable().optional(),
        quantity: _zod.z.number().int().positive(),
        salePrice: _zod.z.number().nonnegative().optional(),
        purchasePrice: _zod.z.number().nonnegative().optional(),
        discount: _zod.z.number().nonnegative().default(0),
        discountType: _zod.z.string().optional(),
        discountValue: _zod.z.number().nonnegative().optional(),
        description: _zod.z.string().nullable().optional(),
        vatRate: _zod.z.number().nonnegative().optional(),
        vatAmount: _zod.z.number().nonnegative().optional(),
        totalAmount: _zod.z.number().nonnegative().optional()
    })).optional()
});
const UpdateBillSchema = CreateBillSchema.partial();
const BillPaymentSchema = _zod.z.object({
    id: _zod.z.string(),
    billId: _zod.z.string(),
    amount: _zod.z.number().nonnegative(),
    currencyCode: _zod.z.string().default('ETB'),
    currencyRate: _zod.z.number().default(1.0),
    method: _zod.z.string().default('CASH'),
    reference: _zod.z.string().nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    paidAt: _zod.z.coerce.date(),
    createdAt: _zod.z.coerce.date(),
    journalEntryId: _zod.z.string().nullable().optional(),
    bankAccountId: _zod.z.string().nullable().optional(),
    bankTransactionId: _zod.z.string().nullable().optional()
});
const CreateBillPaymentSchema = BillPaymentSchema.omit({
    id: true,
    createdAt: true
});
const BankAccountSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    accountNumber: _zod.z.string(),
    bankName: _zod.z.string(),
    currencyCode: _zod.z.string().default('ETB'),
    balance: _zod.z.number(),
    openingBalance: _zod.z.number().nonnegative().default(0),
    companyId: _zod.z.string().nullable().optional(),
    accountId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateBankAccountSchema = BankAccountSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const AccountTypeSchema = _zod.z.enum([
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'INCOME',
    'EXPENSE'
]);
const AccountCategorySchema = _zod.z.enum([
    'CASH',
    'BANK',
    'ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE',
    'INVENTORY',
    'FIXED_ASSET',
    'CURRENT_ASSET',
    'CURRENT_LIABILITY',
    'LONG_TERM_LIABILITY',
    'EQUITY',
    'REVENUE',
    'OTHER_INCOME',
    'OPERATING_EXPENSE',
    'COST_OF_GOODS_SOLD',
    'OTHER_EXPENSE'
]);
const AccountSchema = _zod.z.object({
    id: _zod.z.string(),
    code: _zod.z.string(),
    name: _zod.z.string(),
    type: AccountTypeSchema,
    category: AccountCategorySchema,
    isActive: _zod.z.boolean().default(true),
    companyId: _zod.z.string().nullable(),
    description: _zod.z.string().nullable().optional(),
    balance: _zod.z.number().optional(),
    parentId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
