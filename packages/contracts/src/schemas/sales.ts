/**
 * @ovds/contracts — Sales Schemas
 */
import { z } from 'zod';
import {
  InvoiceSchema,
  CreateInvoiceSchema,
  CustomerSchema,
  InvoiceStatusSchema,
  InvoiceItemSchema,
} from './ovds';
import { CustomFieldValuesMapSchema } from './custom-fields';

export {
  InvoiceSchema,
  CreateInvoiceSchema,
  CustomerSchema,
  InvoiceStatusSchema,
  InvoiceItemSchema,
  CustomFieldValuesMapSchema,
};

export const RevenueSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  currencyCode: z.string().default('ETB'),
  category: z.string(),
  description: z.string().optional(),
  receivedAt: z.string(),
  accountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  createdAt: z.string(),
});

export const EstimateSchema = z.object({
  id: z.string().uuid(),
  estimateNumber: z.string(),
  customerId: z.string().uuid(),
  estimateDate: z.string(),
  expiryDate: z.string().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'converted', 'expired']),
  subTotal: z.number(),
  taxTotal: z.number(),
  total: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreditNoteSchema = z.object({
  id: z.string().uuid(),
  creditNoteNumber: z.string(),
  invoiceId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  status: z.enum(['draft', 'issued', 'applied', 'cancelled']),
  createdAt: z.string(),
});
