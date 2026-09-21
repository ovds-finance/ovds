/**
 * @ovds/dto/ovds/zod-bridge — Zod schemas for the ovds domain
 *
 * Provides Zod versions of the class-validator DTOs in @ovds/dto/ovds.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 *
 * The actual Zod schemas are defined in @ovds/contracts/schemas/ovds and
 * re-exported here so the frontend can import from @ovds/dto exclusively.
 *
 * Usage in React:
 *   import { InvoiceSchema, CreateInvoiceSchema } from '@ovds/dto';
 *   const { register, handleSubmit } = useForm({
 *     resolver: createZodResolver(CreateInvoiceSchema)
 *   });
 *
 * Usage in NestJS:
 *   import { CreateInvoiceSchema } from '@ovds/dto';
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateInvoiceSchema)) dto: z.infer<typeof CreateInvoiceSchema>) {
 *     return this.service.create(dto);
 *   }
 */

import { z } from 'zod';

// ── Invoice Schemas ──────────────────────────────────────────────────────────

export const InvoiceStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'SENT',
  'PARTIAL',
  'VOID',
  'POSTED',
  'ARCHIVED',
]);

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
});

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

// ── Bill Schemas ─────────────────────────────────────────────────────────────

export const BillStatusSchema = z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']);

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
});

export const CreateBillSchema = BillSchema.omit({
  id: true,
  billNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
  vendor: z.string().optional(),
  date: z.coerce.date().optional(),
  currencyRate: z.number().optional(),
  recurringInterval: z.string().optional(),
  recurringNextDate: z.coerce.date().nullable().optional(),
  warehouseId: z.string().optional(),
});

export const UpdateBillSchema = CreateBillSchema.partial();

// ── Customer Schemas ─────────────────────────────────────────────────────────

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
});

export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// ── Vendor Schemas ───────────────────────────────────────────────────────────

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
});

export const CreateVendorSchema = VendorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  currencyCode: z.string().optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

// ── Type exports ─────────────────────────────────────────────────────────────

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;

export type BillStatus = z.infer<typeof BillStatusSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type CreateBill = z.infer<typeof CreateBillSchema>;
export type UpdateBill = z.infer<typeof UpdateBillSchema>;

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

export type Vendor = z.infer<typeof VendorSchema>;
export type CreateVendor = z.infer<typeof CreateVendorSchema>;
export type UpdateVendor = z.infer<typeof UpdateVendorSchema>;
