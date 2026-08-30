/**
 * @ovds/contracts — ovds Schemas
 *
 * Zod schemas for Invoice, Bill, Customer, Vendor, BankAccount, Account.
 * These are the single source of truth for request/response contracts on
 * the ovds domain — both the NestJS handler and the React client use them.
 */
import { z } from 'zod';
import { DateRangeSchema, PaginationQuerySchema } from './common';
import { CustomFieldWithValueSchema } from './custom-fields';
import { CustomFieldValuesMapSchema } from './custom-fields';

// ── Customer ─────────────────────────────────────────────────────────────────

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  tin: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  creditLimit: z.number().nullable().optional(),
  creditScore: z.number().int().nullable().optional(),
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).nullable().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable().optional(),
   notes: z.string().nullable().optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = CustomerSchema.omit({ id: true, createdAt: true, updatedAt: true, customFields: true }).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

export const ListCustomersQuerySchema = PaginationQuerySchema.merge(
  z.object({ companyId: z.string().optional() }),
);
export type ListCustomersQuery = z.infer<typeof ListCustomersQuerySchema>;

// ── Vendor ───────────────────────────────────────────────────────────────────

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  tin: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
   isActive: z.boolean().default(true),
   notes: z.string().nullable().optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Vendor = z.infer<typeof VendorSchema>;

export const CreateVendorSchema = VendorSchema.omit({ id: true, createdAt: true, updatedAt: true, customFields: true }).extend({
  companyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  currencyCode: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateVendor = z.infer<typeof CreateVendorSchema>;

export const UpdateVendorSchema = CreateVendorSchema.partial();
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;

// ── Invoice ──────────────────────────────────────────────────────────────────

export const InvoiceStatusSchema = z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'SENT', 'PARTIAL']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  salePrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  discountType: z.string().optional(),
  discountValue: z.number().nonnegative().optional(),
  description: z.string().nullable().optional(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerId: z.string().nullable().optional(),
  customerName: z.string(),
  customerEmail: z.string().email().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  customerAddress: z.string().nullable().optional(),
  customerTin: z.string().nullable().optional(),
  status: InvoiceStatusSchema,
  date: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  subtotal: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().default(0),
  vatRate: z.number().nonnegative().default(15),
  totalAmount: z.number().nonnegative(),
  notes: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).nullable().optional(),
   items: z.array(InvoiceItemSchema).optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const CreateInvoiceSchema = InvoiceSchema.omit({ id: true, invoiceNumber: true, createdAt: true, updatedAt: true, customFields: true }).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;

export const ListInvoicesQuerySchema = PaginationQuerySchema.merge(DateRangeSchema).merge(
  z.object({
    companyId: z.string().optional(),
    status: InvoiceStatusSchema.optional(),
    customerId: z.string().optional(),
  }),
);
export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;

// ── Bill ─────────────────────────────────────────────────────────────────────

export const BillStatusSchema = z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']);
export type BillStatus = z.infer<typeof BillStatusSchema>;

export const BillSchema = z.object({
  id: z.string(),
  billNumber: z.string(),
  vendorId: z.string().nullable().optional(),
  vendorName: z.string().nullable().optional(),
  category: z.string(),
  amount: z.number().nonnegative(),
  vatAmount: z.number().nonnegative().default(0),
  vatRate: z.number().nonnegative().nullable().optional(),
  total: z.number().nonnegative(),
  status: BillStatusSchema,
  dueDate: z.coerce.date(),
  notes: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  vendorTin: z.string().nullable().optional(),
  whtApplicable: z.boolean().default(false),
   currencyCode: z.string().default('ETB'),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Bill = z.infer<typeof BillSchema>;

export const CreateBillSchema = BillSchema.omit({ id: true, billNumber: true, createdAt: true, updatedAt: true, customFields: true }).extend({
  companyId: z.string().optional(),
  vendor: z.string().optional(),
  date: z.coerce.date().optional(),
  currencyRate: z.number().optional(),
  recurringInterval: z.string().optional(),
  recurringNextDate: z.coerce.date().nullable().optional(),
  warehouseId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
  items: z.array(z.object({
    itemId: z.string().nullable().optional(),
    quantity: z.number().int().positive(),
    salePrice: z.number().nonnegative().optional(),
    purchasePrice: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().default(0),
    discountType: z.string().optional(),
    discountValue: z.number().nonnegative().optional(),
    description: z.string().nullable().optional(),
    vatRate: z.number().nonnegative().optional(),
    vatAmount: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
  })).optional(),
});
export type CreateBill = z.infer<typeof CreateBillSchema>;

export const UpdateBillSchema = CreateBillSchema.partial();
export type UpdateBill = z.infer<typeof UpdateBillSchema>;

export const BillPaymentSchema = z.object({
  id: z.string(),
  billId: z.string(),
  amount: z.number().nonnegative(),
  currencyCode: z.string().default('ETB'),
  currencyRate: z.number().default(1.0),
  method: z.string().default('CASH'),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  paidAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  journalEntryId: z.string().nullable().optional(),
  bankAccountId: z.string().nullable().optional(),
  bankTransactionId: z.string().nullable().optional(),
});
export type BillPayment = z.infer<typeof BillPaymentSchema>;

export const CreateBillPaymentSchema = BillPaymentSchema.omit({ id: true, createdAt: true });
export type CreateBillPayment = z.infer<typeof CreateBillPaymentSchema>;

// ── Bank Account ─────────────────────────────────────────────────────────────

export const BankAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountNumber: z.string(),
  bankName: z.string(),
  currencyCode: z.string().default('ETB'),
  balance: z.number(),
  openingBalance: z.number().nonnegative().default(0),
  companyId: z.string().nullable().optional(),
   accountId: z.string().nullable().optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;

export const CreateBankAccountSchema = BankAccountSchema.omit({ id: true, createdAt: true, updatedAt: true, customFields: true }).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateBankAccount = z.infer<typeof CreateBankAccountSchema>;

// ── Account (Chart of Accounts) ──────────────────────────────────────────────

export const AccountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AccountCategorySchema = z.enum([
  'CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY',
  'FIXED_ASSET', 'CURRENT_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
  'EQUITY', 'REVENUE', 'OTHER_INCOME', 'OPERATING_EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_EXPENSE',
]);
export type AccountCategory = z.infer<typeof AccountCategorySchema>;

export const AccountSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: AccountTypeSchema,
  category: AccountCategorySchema,
  isActive: z.boolean().default(true),
  companyId: z.string().nullable(),
  description: z.string().nullable().optional(),
  balance: z.number().optional(),
  parentId: z.string().nullable().optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});

export type Account = z.infer<typeof AccountSchema>;
