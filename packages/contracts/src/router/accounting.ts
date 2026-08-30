/**
 * @ovds/contracts — Accounting oRPC Router Contract
 *
 * Exposes the full double-entry GL, sub-ledger, IFRS compliance,
 * and AABE audit-readiness surface via type-safe oRPC procedures.
 *
 * Domains covered:
 *   journals.*         — Journal entry CRUD + GL inquiry
 *   accounts.*         — Chart of Accounts management (+ orphan repair)
 *   trialBalance.*     — Trial balance + income statement + balance sheet
 *   subLedger.*        — AR/AP aging + GL drill-through + AABE drill-down
 *   ifrs.*             — IFRS 15/16/IAS 38/IFRS 10 compliance
 *   glCompliance.*     — AABE dashboard, statutory reports, audit-readiness, dual-ledger
 *   ledgerMapping.*    — Automated ledger mapping rules + templates
 *   fiscalYear.*       — Fiscal year management + year-end closing
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  JournalEntrySchema,
  CreateJournalEntrySchema,
  ListJournalEntriesQuerySchema,
  TrialBalanceRowSchema,
  TrialBalanceQuerySchema,
  GeneralLedgerQuerySchema,
  ArCustomerSchema,
  ApVendorSchema,
  SubLedgerQuerySchema,
  GlInquiryQuerySchema,
  IfrsContractSnapshotSchema,
  Ifrs15ScheduleCreateSchema,
  Ifrs16LeaseSchema,
  IfrsLeaseModificationSchema,
  AabeDisclosureQuerySchema,
  AuditReadinessSchema,
  GlDashboardQuerySchema,
  DualLedgerStatusSchema,
} from '../schemas/accounting';
import { IdParamSchema, PaginatedResultSchema } from '../schemas/common';

const CompanyQuery = z.object({ companyId: z.string().optional() });
const PeriodQuery  = z.object({ companyId: z.string().optional(), period: z.string().optional() });

// ── Journal Entry procedures ──────────────────────────────────────────────────

const journalProcedures = {
  list: oc
    .input(ListJournalEntriesQuerySchema)
    .output(z.object({
      data:  z.array(JournalEntrySchema),
      total: z.number().int(),
      page:  z.number().int(),
      limit: z.number().int(),
      pages: z.number().int(),
    })),

  get: oc
    .input(IdParamSchema)
    .output(JournalEntrySchema),

  create: oc
    .input(CreateJournalEntrySchema)
    .output(JournalEntrySchema),

  update: oc
    .input(IdParamSchema.extend({
      data: z.object({
        date:        z.string().optional(),
        reference:   z.string().optional(),
        description: z.string().optional(),
        status:      z.string().optional(),
      }),
    }))
    .output(JournalEntrySchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean(), id: z.string() })),

  // GL inquiry — all entries for a date range / account
  generalLedger: oc
    .input(GeneralLedgerQuerySchema)
    .output(z.object({
      data:  z.array(JournalEntrySchema),
      total: z.number().int(),
      page:  z.number().int(),
      limit: z.number().int(),
      pages: z.number().int(),
    })),
};

// ── Chart of Accounts procedures ─────────────────────────────────────────────

const accountProcedures = {
  list: oc
    .input(CompanyQuery)
    .output(z.array(z.record(z.string(), z.unknown()))),

  create: oc
    .input(z.object({
      code:        z.string().min(1),
      name:        z.string().min(1),
      type:        z.string(),
      category:    z.string(),
      description: z.string().optional(),
      parentId:    z.string().optional(),
      companyId:   z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  update: oc
    .input(IdParamSchema.extend({
      data: z.object({
        name:        z.string().optional(),
        description: z.string().optional(),
        isActive:    z.boolean().optional(),
        parentId:    z.string().optional(),
      }),
      companyId: z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  remove: oc
    .input(IdParamSchema.extend({ companyId: z.string().optional() }))
    .output(z.object({ success: z.boolean(), id: z.string() })),

  // Orphan detection & repair
  orphans: oc
    .input(CompanyQuery)
    .output(z.object({ count: z.number().int(), orphans: z.array(z.record(z.string(), z.unknown())) })),

  reassignOrphan: oc
    .input(z.object({ orphanId: z.string(), parentId: z.string(), companyId: z.string().optional() }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Trial Balance procedures ──────────────────────────────────────────────────

const trialBalanceProcedures = {
  get: oc
    .input(TrialBalanceQuerySchema)
    .output(z.array(TrialBalanceRowSchema)),

  incomeStatement: oc
    .input(CompanyQuery.extend({ from: z.string().optional(), to: z.string().optional() }))
    .output(z.record(z.string(), z.unknown())),

  balanceSheet: oc
    .input(CompanyQuery.extend({ asOf: z.string().optional() }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Sub-Ledger procedures ─────────────────────────────────────────────────────

const subLedgerProcedures = {
  arSummary: oc
    .input(SubLedgerQuerySchema)
    .output(z.record(z.string(), z.unknown())),

  arCustomers: oc
    .input(SubLedgerQuerySchema)
    .output(z.array(ArCustomerSchema)),

  arTransactions: oc
    .input(z.object({ customerId: z.string(), companyId: z.string().optional() }))
    .output(z.array(z.record(z.string(), z.unknown()))),

  apSummary: oc
    .input(SubLedgerQuerySchema)
    .output(z.record(z.string(), z.unknown())),

  apVendors: oc
    .input(SubLedgerQuerySchema)
    .output(z.array(ApVendorSchema)),

  glInquiry: oc
    .input(GlInquiryQuerySchema)
    .output(z.array(z.record(z.string(), z.unknown()))),

  // AABE drill-down: report line → journal → source document
  auditDrillDown: oc
    .input(z.object({ journalEntryId: z.string(), companyId: z.string().optional() }))
    .output(z.record(z.string(), z.unknown()).nullable()),
};

// ── IFRS procedures ───────────────────────────────────────────────────────────

const ifrsProcedures = {
  dashboard: oc
    .input(CompanyQuery)
    .output(z.record(z.string(), z.unknown())),

  // IFRS 15
  createContractSnapshot: oc
    .input(IfrsContractSnapshotSchema)
    .output(z.record(z.string(), z.unknown())),

  recognitionSchedule: oc
    .input(z.object({ contractRef: z.string(), companyId: z.string().optional() }))
    .output(z.array(z.record(z.string(), z.unknown()))),

  evidenceExport: oc
    .input(z.object({ contractRef: z.string(), companyId: z.string().optional() }))
    .output(z.record(z.string(), z.unknown())),

  schedules: oc.router({
    create: oc.input(Ifrs15ScheduleCreateSchema).output(z.record(z.string(), z.unknown())),
    list:   oc.input(CompanyQuery.extend({ contractId: z.string().optional() })).output(z.array(z.record(z.string(), z.unknown()))),
    updateProgress: oc.input(IdParamSchema.extend({
      companyId:        z.string(),
      recognizedAmount: z.number().nonnegative(),
    })).output(z.record(z.string(), z.unknown())),
  }),

  // IFRS 16
  leases: oc.router({
    list:     oc.input(CompanyQuery).output(z.array(Ifrs16LeaseSchema)),
    modify:   oc.input(IdParamSchema.extend({ data: IfrsLeaseModificationSchema })).output(z.record(z.string(), z.unknown())),
    history:  oc.input(IdParamSchema).output(z.array(z.record(z.string(), z.unknown()))),
    pvEvidence: oc.input(IdParamSchema).output(z.record(z.string(), z.unknown())),
  }),

  // IAS 38
  softwareAssets: oc.router({
    list:   oc.input(CompanyQuery).output(z.array(z.record(z.string(), z.unknown()))),
    create: oc.input(z.object({
      companyId:          z.string().optional(),
      assetName:          z.string(),
      phase:              z.string(),
      cost:               z.number().positive(),
      usefulLifeMonths:   z.number().int().positive(),
      commencementDate:   z.string(),
    })).output(z.record(z.string(), z.unknown())),
    classify: oc.input(z.object({ phase: z.string(), evidence: z.record(z.string(), z.unknown()).optional() })).output(z.record(z.string(), z.unknown())),
    capitalizationDecision: oc.input(IdParamSchema.extend({ decision: z.record(z.string(), z.unknown()) })).output(z.record(z.string(), z.unknown())),
  }),

  // IFRS 10
  consolidationStatus: oc
    .input(z.object({ parentCompanyId: z.string(), period: z.string() }))
    .output(z.record(z.string(), z.unknown())),

  // AABE disclosure package
  aabedisclosure: oc
    .input(AabeDisclosureQuerySchema)
    .output(z.record(z.string(), z.unknown())),
};

// ── GL Compliance procedures ──────────────────────────────────────────────────

const glComplianceProcedures = {
  dashboard: oc
    .input(GlDashboardQuerySchema)
    .output(z.record(z.string(), z.unknown())),

  statutoryReports: oc
    .input(CompanyQuery.extend({ startDate: z.string().optional(), endDate: z.string().optional() }))
    .output(z.record(z.string(), z.unknown())),

  morPackage: oc
    .input(z.object({
      companyId:  z.string().optional(),
      startDate:  z.string(),
      endDate:    z.string(),
      type:       z.enum(['ANNUAL', 'QUARTERLY', 'MONTHLY']).default('ANNUAL'),
    }))
    .output(z.record(z.string(), z.unknown())),

  auditReadiness: oc
    .input(z.object({ companyId: z.string().optional(), period: z.string() }))
    .output(AuditReadinessSchema),

  dualLedgerStatus: oc
    .input(z.object({ companyId: z.string().optional(), period: z.string() }))
    .output(DualLedgerStatusSchema),
};

// ── Ledger Mapping procedures ──────────────────────────────────────────────────

const ledgerMappingProcedures = {
  listRules: oc
    .input(CompanyQuery)
    .output(z.array(z.record(z.string(), z.unknown()))),

  getRule: oc
    .input(IdParamSchema.extend({ companyId: z.string().optional() }))
    .output(z.record(z.string(), z.unknown())),

  createRule: oc
    .input(z.object({
      companyId:       z.string().optional(),
      name:            z.string().min(1),
      priority:        z.number().int().default(100),
      isActive:        z.boolean().default(true),
      matchType:       z.enum(['KEYWORD', 'ACCOUNT', 'AMOUNT', 'TEMPLATE']),
      matchValue:      z.string().min(1),
      debitAccountId:  z.string().min(1),
      creditAccountId: z.string().min(1),
      taxType:         z.string().optional(),
      costCenterId:    z.string().optional(),
      description:     z.string().optional(),
      minAmount:       z.number().optional(),
      maxAmount:       z.number().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  updateRule: oc
    .input(IdParamSchema.extend({
      companyId: z.string().optional(),
      data: z.object({
        name:            z.string().optional(),
        priority:        z.number().int().optional(),
        isActive:        z.boolean().optional(),
        matchType:       z.enum(['KEYWORD', 'ACCOUNT', 'AMOUNT', 'TEMPLATE']).optional(),
        matchValue:      z.string().optional(),
        debitAccountId:  z.string().optional(),
        creditAccountId: z.string().optional(),
        taxType:         z.string().optional(),
        costCenterId:    z.string().optional(),
        description:     z.string().optional(),
        minAmount:       z.number().optional(),
        maxAmount:       z.number().optional(),
      }),
    }))
    .output(z.record(z.string(), z.unknown())),

  deleteRule: oc
    .input(IdParamSchema.extend({ companyId: z.string().optional() }))
    .output(z.object({ success: z.boolean(), id: z.string() })),

  listTemplates: oc
    .input(z.object({}))
    .output(z.array(z.object({
      key: z.string(),
      name: z.string(),
      ruleCount: z.number().int(),
    }))),

  applyTemplate: oc
    .input(z.object({
      templateKey: z.string(),
      companyId:   z.string(),
    }))
    .output(z.record(z.string(), z.unknown())),

  autoMapInvoice: oc
    .input(z.object({
      companyId:      z.string().optional(),
      invoiceId:      z.string(),
      paymentAmount:  z.number(),
      paymentAccountId: z.string(),
      paymentDate:    z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  autoMapBill: oc
    .input(z.object({
      companyId:      z.string().optional(),
      billId:         z.string(),
      paymentAmount:  z.number(),
      paymentAccountId: z.string(),
      paymentDate:    z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  autoMapTransfer: oc
    .input(z.object({
      companyId:      z.string().optional(),
      bankTransactionId: z.string(),
      fromAccountId:  z.string(),
      toAccountId:    z.string(),
      amount:         z.number(),
      description:    z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Fiscal Year procedures ─────────────────────────────────────────────────────

const fiscalYearProcedures = {
  list: oc
    .input(CompanyQuery)
    .output(z.array(z.record(z.string(), z.unknown()))),

  getCurrent: oc
    .input(CompanyQuery)
    .output(z.record(z.string(), z.unknown()).nullable()),

  create: oc
    .input(z.object({
      companyId: z.string().optional(),
      year:      z.number().int(),
      startDate: z.string(),
      endDate:   z.string(),
      status:    z.enum(['OPEN', 'CLOSED', 'CLOSING']).default('OPEN'),
      isCurrent: z.boolean().default(false),
      notes:     z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  update: oc
    .input(IdParamSchema.extend({
      companyId: z.string().optional(),
      data: z.object({
        status:    z.enum(['OPEN', 'CLOSED', 'CLOSING']).optional(),
        isCurrent: z.boolean().optional(),
        notes:     z.string().optional(),
      }),
    }))
    .output(z.record(z.string(), z.unknown())),

  close: oc
    .input(z.object({
      companyId: z.string().optional(),
      year:      z.number().int(),
      notes:     z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  openingBalances: oc
    .input(z.object({
      companyId: z.string().optional(),
      year:      z.number().int(),
    }))
    .output(z.record(z.string(), z.unknown())),

  summary: oc
    .input(z.object({
      companyId: z.string().optional(),
      year:      z.number().int(),
    }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Cash Flow procedures ───────────────────────────────────────────────────────

const cashFlowProcedures = {
  get: oc
    .input(z.object({
      companyId: z.string().optional(),
      from:      z.string().optional(),
      to:        z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Comparative Reports procedures ────────────────────────────────────────────

const reportsProcedures = {
  comparativeBalanceSheet: oc
    .input(z.object({
      companyId:    z.string().optional(),
      asOfCurrent:  z.string().optional(),
      asOfPrior:    z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),

  financialNotes: oc
    .input(z.object({
      companyId: z.string().optional(),
      from:      z.string().optional(),
      to:        z.string().optional(),
      asOf:      z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Chart of Accounts procedures (enhanced) ────────────────────────────────────

const coaProcedures = {
  templates: oc
    .input(z.object({}))
    .output(z.array(z.record(z.string(), z.unknown()))),

  applyTemplate: oc
    .input(z.object({
      templateKey: z.string(),
      companyId:   z.string(),
    }))
    .output(z.record(z.string(), z.unknown())),

  export: oc
    .input(z.object({
      companyId: z.string().optional(),
      format:    z.enum(['json', 'csv']).default('json'),
    }))
    .output(z.record(z.string(), z.unknown())),

  import: oc
    .input(z.object({
      data:      z.array(z.record(z.string(), z.unknown())),
      companyId: z.string().optional(),
    }))
    .output(z.record(z.string(), z.unknown())),
};

// ── Accounting contract ───────────────────────────────────────────────────────

export const accountingContract = oc.router({
  journals:       oc.router(journalProcedures),
  accounts:       oc.router(accountProcedures),
  trialBalance:   oc.router(trialBalanceProcedures),
  subLedger:      oc.router(subLedgerProcedures),
  ifrs:           oc.router(ifrsProcedures),
  glCompliance:   oc.router(glComplianceProcedures),
  ledgerMapping:  oc.router(ledgerMappingProcedures),
  fiscalYear:     oc.router(fiscalYearProcedures),
  cashFlow:       oc.router(cashFlowProcedures),
  coa:            oc.router(coaProcedures),
  reports:        oc.router(reportsProcedures),
});

export type AccountingContract = typeof accountingContract;
