/**
 * @ovds/contracts — Purchases Schemas
 */
import { z } from 'zod';
import { BillSchema, VendorSchema } from './ovds';

export { BillSchema, VendorSchema };

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  poNumber: z.string(),
  vendorId: z.string().uuid().optional(),
  vendorName: z.string().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'received', 'cancelled']),
  expectedDelivery: z.string().optional(),
  totalAmount: z.number().nonnegative(),
  currencyCode: z.string().default('ETB'),
  notes: z.string().optional(),
  items: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GoodsReceivedNoteSchema = z.object({
  id: z.string().uuid(),
  grnNumber: z.string(),
  purchaseOrderId: z.string().uuid().optional(),
  vendorId: z.string().uuid(),
  receivedDate: z.string(),
  status: z.enum(['draft', 'received', 'accepted', 'rejected']),
  items: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const DebitNoteSchema = z.object({
  id: z.string().uuid(),
  debitNoteNumber: z.string(),
  billId: z.string().uuid().optional(),
  vendorId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  status: z.enum(['draft', 'issued', 'applied', 'cancelled']),
  createdAt: z.string(),
});

export const VendorPaymentSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  amount: z.number().positive(),
  currencyCode: z.string().default('ETB'),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});
