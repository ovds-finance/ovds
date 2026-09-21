/**
 * @ovds/dto/trade/zod-bridge — Zod schemas for the trade domain
 *
 * Provides Zod versions of the class-validator DTOs in @ovds/dto/trade.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 *
 * Usage in React:
 *   import { CreateShipmentSchema } from '@ovds/dto';
 *   const { register, handleSubmit } = useForm({
 *     resolver: createZodResolver(CreateShipmentSchema)
 *   });
 *
 * Usage in NestJS:
 *   import { CreateShipmentSchema } from '@ovds/dto';
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateShipmentSchema)) dto: z.infer<typeof CreateShipmentSchema>) { ... }
 */

import { z } from 'zod';

// ── Trade Direction ──────────────────────────────────────────────────────────

export const TradeDirectionSchema = z.enum(['IMPORT', 'EXPORT', 'TRANSIT']);
export type TradeDirection = z.infer<typeof TradeDirectionSchema>;

// ── Shipment Schemas ─────────────────────────────────────────────────────────

export const ShipmentSchema = z.object({
  id: z.string(),
  direction: TradeDirectionSchema,
  referenceNo: z.string().nullable().optional(),
  hsCode: z.string().nullable().optional(),
  hsDescription: z.string().nullable().optional(),
  goodsDescription: z.string().nullable().optional(),
  originCountry: z.string().nullable().optional(),
  destinationCountry: z.string().nullable().optional(),
  portOfLoading: z.string().nullable().optional(),
  portOfDischarge: z.string().nullable().optional(),
  incoterms: z.string().nullable().optional(),
  invoiceValue: z.number().nullable().optional(),
  currencyCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().default('PENDING'),
  companyId: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateShipmentSchema = ShipmentSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const UpdateShipmentSchema = CreateShipmentSchema.partial();

// ── Shipment Step Schemas ────────────────────────────────────────────────────

export const ShipmentStepStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED']);

export const ShipmentStepSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  name: z.string(),
  status: ShipmentStepStatusSchema,
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  completedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const UpdateShipmentStepSchema = z.object({
  status: ShipmentStepStatusSchema,
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ── Forex Approval Schemas ───────────────────────────────────────────────────

export const ForexApprovalSchema = z.object({
  id: z.string(),
  bankName: z.string(),
  applicationDate: z.coerce.date().nullable().optional(),
  foreignCurrency: z.string().nullable().optional(),
  foreignAmount: z.number().nullable().optional(),
  exchangeRate: z.number().nullable().optional(),
  status: z.string().default('PENDING'),
  notes: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateForexApprovalSchema = ForexApprovalSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

// ── Proforma Schemas ─────────────────────────────────────────────────────────

export const ProformaSchema = z.object({
  id: z.string(),
  supplierName: z.string(),
  buyerName: z.string(),
  issueDate: z.coerce.date(),
  validUntil: z.coerce.date().nullable().optional(),
  totalValue: z.number().nullable().optional(),
  currencyCode: z.string().nullable().optional(),
  incoterms: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  lineItemsJson: z.string().nullable().optional(),
  shipmentId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().default('DRAFT'),
  companyId: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateProformaSchema = ProformaSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

// ── Type exports ─────────────────────────────────────────────────────────────

export type Shipment = z.infer<typeof ShipmentSchema>;
export type CreateShipment = z.infer<typeof CreateShipmentSchema>;
export type UpdateShipment = z.infer<typeof UpdateShipmentSchema>;

export type ShipmentStepStatus = z.infer<typeof ShipmentStepStatusSchema>;
export type ShipmentStep = z.infer<typeof ShipmentStepSchema>;
export type UpdateShipmentStep = z.infer<typeof UpdateShipmentStepSchema>;

export type ForexApproval = z.infer<typeof ForexApprovalSchema>;
export type CreateForexApproval = z.infer<typeof CreateForexApprovalSchema>;

export type Proforma = z.infer<typeof ProformaSchema>;
export type CreateProforma = z.infer<typeof CreateProformaSchema>;
