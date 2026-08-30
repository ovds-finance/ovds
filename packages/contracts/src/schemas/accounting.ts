/**
 * @ovds/contracts — Accounting Domain Schemas
 *
 * Zod schemas for:
 *   - Journal Entries (double-entry GL)
 *   - Trial Balance
 *   - General Ledger
 *   - Sub-Ledger (AR/AP aging)
 *   - IFRS compliance (15 / 16 / IAS 38 / IFRS 10)
 *   - GL Compliance dashboard & AABE audit-readiness
 */
import { z } from 'zod';
import { PaginationQuerySchema } from './common';

// ── Shared primitives ─────────────────────────────────────────────────────────

const CompanyQuery = z.object({ companyId: z.string().optional() });
const PeriodSchema = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

// ── Journal Entry ─────────────────────────────────────────────────────────────

export const JournalLineSchema = z.object({
  id:           z.string().optional(),
  accountId:    z.string(),
  description:  z.string().nullable().optional(),
  debit:        z.number().nonnegative().default(0),
  credit:       z.number().nonnegative().default(0),
  costCenterId: z.string().nullable().optional(),
});
export type JournalLine = z.infer<typeof JournalLineSchema>;

export const JournalEntrySchema = z.object({
  id:          z.string(),
  date:        z.coerce.date(),
  reference:   z.string().nullable().optional(),
  description: z.string(),
  status:      z.string().default('POSTED'),
  companyId:   z.string().nullable().optional(),
  postedBy:    z.string().nullable().optional(),
  createdAt:   z.coerce.date(),
  updatedAt:   z.coerce.date(),
  journalLine: z.array(JournalLineSchema).optional(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const CreateJournalEntrySchema = z.object({
  date:        z.string().optional(),
  reference:   z.string().optional(),
  description: z.string().min(1),
  companyId:   z.string().optional(),
  lines:       z.array(z.object({
    accountId:    z.string(),
    description:  z.string().optional(),
    debit:        z.number().nonnegative().optional(),
    credit:       z.number().nonnegative().optional(),
    costCenterId: z.string().optional(),
  })).min(2, 'At least 2 lines required'),
});
export type CreateJournalEntry = z.infer<typeof CreateJournalEntrySchema>;

export const ListJournalEntriesQuerySchema = PaginationQuerySchema.merge(CompanyQuery).extend({
  status: z.string().optional(),
  from:   z.string().optional(),
  to:     z.string().optional(),
});

// ── Trial Balance ─────────────────────────────────────────────────────────────

export const TrialBalanceRowSchema = z.object({
  accountId:         z.string(),
  accountCode:       z.string(),
  accountName:       z.string(),
  accountType:       z.string(),
  accountCategory:   z.string(),
  parentId:          z.string().nullable().optional(),
  totalDebit:        z.number(),
  totalCredit:       z.number(),
  balance:           z.number(),
  normalizedBalance: z.number(),
});
export type TrialBalanceRow = z.infer<typeof TrialBalanceRowSchema>;

export const TrialBalanceQuerySchema = CompanyQuery.extend({
  from: z.string().optional(),
  to:   z.string().optional(),
});

// ── General Ledger ─────────────────────────────────────────────────────────────

export const GeneralLedgerQuerySchema = PaginationQuerySchema.merge(CompanyQuery).extend({
  accountId: z.string().optional(),
  from:      z.string().optional(),
  to:        z.string().optional(),
});

// ── Sub-Ledger (AR/AP aging) ──────────────────────────────────────────────────

export const ArCustomerSchema = z.object({
  customerId:       z.string(),
  customerName:     z.string(),
  outstanding:      z.number(),
  current:          z.number(),
  days1_30:         z.number(),
  days31_60:        z.number(),
  days61_90:        z.number(),
  days90Plus:       z.number(),
  lastInvoiceDate:  z.coerce.date().optional(),
  invoiceCount:     z.number().int(),
});
export type ArCustomer = z.infer<typeof ArCustomerSchema>;

export const ApVendorSchema = z.object({
  vendorId:     z.string(),
  vendorName:   z.string(),
  tin:          z.string().nullable().optional(),
  outstanding:  z.number(),
  current:      z.number(),
  days1_30:     z.number(),
  days31_60:    z.number(),
  days60Plus:   z.number(),
  nextDueDate:  z.coerce.date().optional(),
});
export type ApVendor = z.infer<typeof ApVendorSchema>;

export const SubLedgerQuerySchema = CompanyQuery.extend({
  asOf: z.string().optional(),
});

export const GlInquiryQuerySchema = z.object({
  accountId: z.string(),
  startDate: z.string(),
  endDate:   z.string(),
  companyId: z.string().optional(),
});

// ── IFRS schemas ──────────────────────────────────────────────────────────────

export const IfrsContractSnapshotSchema = z.object({
  invoiceId: z.string(),
  companyId: z.string().optional(),
  months:    z.number().int().min(1).max(120).optional(),
});

export const Ifrs15ScheduleCreateSchema = z.object({
  companyId:                  z.string(),
  contractId:                 z.string(),
  performanceObligationId:    z.string(),
  totalTransactionPrice:      z.number().positive(),
  currencyCode:               z.string().default('ETB'),
  startDate:                  z.string(),
  endDate:                    z.string(),
  recognitionMethod:          z.enum(['OVER_TIME', 'POINT_IN_TIME']),
});

export const Ifrs16LeaseSchema = z.object({
  id:                  z.string(),
  leaseNumber:         z.string(),
  leaseType:           z.enum(['FINANCE', 'OPERATING']),
  status:              z.string(),
  assetDescription:    z.string(),
  lessorName:          z.string().nullable().optional(),
  commencementDate:    z.coerce.date(),
  endDate:             z.coerce.date(),
  termMonths:          z.number().int(),
  monthlyPayment:      z.number(),
  discountRate:        z.number(),
  rouAssetInitial:     z.number(),
  rouAssetCarrying:    z.number(),
  companyId:           z.string().nullable().optional(),
});
export type Ifrs16Lease = z.infer<typeof Ifrs16LeaseSchema>;

export const IfrsLeaseModificationSchema = z.object({
  effectiveDate:        z.string(),
  modificationType:     z.string(),
  revisedMonthlyPayment: z.number().optional(),
  revisedTermMonths:    z.number().int().optional(),
  revisedDiscountRate:  z.number().optional(),
  notes:                z.string().optional(),
});

export const AabeDisclosureQuerySchema = CompanyQuery.extend({
  period: PeriodSchema,
});

export const AuditReadinessSchema = z.object({
  companyId:      z.string(),
  period:         z.string(),
  score:          z.number().int().min(0).max(100),
  grade:          z.enum(['A', 'B', 'C', 'F']),
  riskLevel:      z.enum(['LOW', 'MEDIUM', 'HIGH']),
  passed:         z.number().int(),
  failed:         z.number().int(),
  recommendation: z.string(),
  criteria:       z.array(z.object({
    name:   z.string(),
    weight: z.number(),
    passed: z.boolean(),
    detail: z.string(),
  })),
  generatedAt:    z.string(),
});
export type AuditReadiness = z.infer<typeof AuditReadinessSchema>;

// ── GL Compliance dashboard ───────────────────────────────────────────────────

export const GlDashboardQuerySchema = CompanyQuery.extend({
  period:    PeriodSchema.optional(),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
});

export const DualLedgerStatusSchema = z.object({
  companyId: z.string(),
  period:    z.string(),
  managementTaxBook: z.object({
    journalEntries: z.number().int(),
    description:    z.string(),
    status:         z.string(),
  }),
  ifrsStatutoryBook: z.object({
    ifrsTaggedEntries: z.number().int(),
    description:       z.string(),
    status:            z.string(),
  }),
  deferredTax: z.object({
    timingDifferenceRecords: z.number().int(),
    description:             z.string(),
  }),
  reconciled:        z.boolean(),
  aabeProclamation:  z.string(),
  generatedAt:       z.string(),
});
export type DualLedgerStatus = z.infer<typeof DualLedgerStatusSchema>;
