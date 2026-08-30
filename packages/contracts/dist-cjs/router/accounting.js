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
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "accountingContract", {
    enumerable: true,
    get: function() {
        return accountingContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _accounting = require("../schemas/accounting");
const _common = require("../schemas/common");
const CompanyQuery = _zod.z.object({
    companyId: _zod.z.string().optional()
});
const PeriodQuery = _zod.z.object({
    companyId: _zod.z.string().optional(),
    period: _zod.z.string().optional()
});
// ── Journal Entry procedures ──────────────────────────────────────────────────
const journalProcedures = {
    list: _contract.oc.input(_accounting.ListJournalEntriesQuerySchema).output(_zod.z.object({
        data: _zod.z.array(_accounting.JournalEntrySchema),
        total: _zod.z.number().int(),
        page: _zod.z.number().int(),
        limit: _zod.z.number().int(),
        pages: _zod.z.number().int()
    })),
    get: _contract.oc.input(_common.IdParamSchema).output(_accounting.JournalEntrySchema),
    create: _contract.oc.input(_accounting.CreateJournalEntrySchema).output(_accounting.JournalEntrySchema),
    update: _contract.oc.input(_common.IdParamSchema.extend({
        data: _zod.z.object({
            date: _zod.z.string().optional(),
            reference: _zod.z.string().optional(),
            description: _zod.z.string().optional(),
            status: _zod.z.string().optional()
        })
    })).output(_accounting.JournalEntrySchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean(),
        id: _zod.z.string()
    })),
    // GL inquiry — all entries for a date range / account
    generalLedger: _contract.oc.input(_accounting.GeneralLedgerQuerySchema).output(_zod.z.object({
        data: _zod.z.array(_accounting.JournalEntrySchema),
        total: _zod.z.number().int(),
        page: _zod.z.number().int(),
        limit: _zod.z.number().int(),
        pages: _zod.z.number().int()
    }))
};
// ── Chart of Accounts procedures ─────────────────────────────────────────────
const accountProcedures = {
    list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    create: _contract.oc.input(_zod.z.object({
        code: _zod.z.string().min(1),
        name: _zod.z.string().min(1),
        type: _zod.z.string(),
        category: _zod.z.string(),
        description: _zod.z.string().optional(),
        parentId: _zod.z.string().optional(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    update: _contract.oc.input(_common.IdParamSchema.extend({
        data: _zod.z.object({
            name: _zod.z.string().optional(),
            description: _zod.z.string().optional(),
            isActive: _zod.z.boolean().optional(),
            parentId: _zod.z.string().optional()
        }),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    remove: _contract.oc.input(_common.IdParamSchema.extend({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.object({
        success: _zod.z.boolean(),
        id: _zod.z.string()
    })),
    // Orphan detection & repair
    orphans: _contract.oc.input(CompanyQuery).output(_zod.z.object({
        count: _zod.z.number().int(),
        orphans: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
    })),
    reassignOrphan: _contract.oc.input(_zod.z.object({
        orphanId: _zod.z.string(),
        parentId: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Trial Balance procedures ──────────────────────────────────────────────────
const trialBalanceProcedures = {
    get: _contract.oc.input(_accounting.TrialBalanceQuerySchema).output(_zod.z.array(_accounting.TrialBalanceRowSchema)),
    incomeStatement: _contract.oc.input(CompanyQuery.extend({
        from: _zod.z.string().optional(),
        to: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    balanceSheet: _contract.oc.input(CompanyQuery.extend({
        asOf: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Sub-Ledger procedures ─────────────────────────────────────────────────────
const subLedgerProcedures = {
    arSummary: _contract.oc.input(_accounting.SubLedgerQuerySchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    arCustomers: _contract.oc.input(_accounting.SubLedgerQuerySchema).output(_zod.z.array(_accounting.ArCustomerSchema)),
    arTransactions: _contract.oc.input(_zod.z.object({
        customerId: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    apSummary: _contract.oc.input(_accounting.SubLedgerQuerySchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    apVendors: _contract.oc.input(_accounting.SubLedgerQuerySchema).output(_zod.z.array(_accounting.ApVendorSchema)),
    glInquiry: _contract.oc.input(_accounting.GlInquiryQuerySchema).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    // AABE drill-down: report line → journal → source document
    auditDrillDown: _contract.oc.input(_zod.z.object({
        journalEntryId: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()).nullable())
};
// ── IFRS procedures ───────────────────────────────────────────────────────────
const ifrsProcedures = {
    dashboard: _contract.oc.input(CompanyQuery).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    // IFRS 15
    createContractSnapshot: _contract.oc.input(_accounting.IfrsContractSnapshotSchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    recognitionSchedule: _contract.oc.input(_zod.z.object({
        contractRef: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    evidenceExport: _contract.oc.input(_zod.z.object({
        contractRef: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    schedules: _contract.oc.router({
        create: _contract.oc.input(_accounting.Ifrs15ScheduleCreateSchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        list: _contract.oc.input(CompanyQuery.extend({
            contractId: _zod.z.string().optional()
        })).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
        updateProgress: _contract.oc.input(_common.IdParamSchema.extend({
            companyId: _zod.z.string(),
            recognizedAmount: _zod.z.number().nonnegative()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
    }),
    // IFRS 16
    leases: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_accounting.Ifrs16LeaseSchema)),
        modify: _contract.oc.input(_common.IdParamSchema.extend({
            data: _accounting.IfrsLeaseModificationSchema
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        history: _contract.oc.input(_common.IdParamSchema).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
        pvEvidence: _contract.oc.input(_common.IdParamSchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
    }),
    // IAS 38
    softwareAssets: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
        create: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            assetName: _zod.z.string(),
            phase: _zod.z.string(),
            cost: _zod.z.number().positive(),
            usefulLifeMonths: _zod.z.number().int().positive(),
            commencementDate: _zod.z.string()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        classify: _contract.oc.input(_zod.z.object({
            phase: _zod.z.string(),
            evidence: _zod.z.record(_zod.z.string(), _zod.z.unknown()).optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        capitalizationDecision: _contract.oc.input(_common.IdParamSchema.extend({
            decision: _zod.z.record(_zod.z.string(), _zod.z.unknown())
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
    }),
    // IFRS 10
    consolidationStatus: _contract.oc.input(_zod.z.object({
        parentCompanyId: _zod.z.string(),
        period: _zod.z.string()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    // AABE disclosure package
    aabedisclosure: _contract.oc.input(_accounting.AabeDisclosureQuerySchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── GL Compliance procedures ──────────────────────────────────────────────────
const glComplianceProcedures = {
    dashboard: _contract.oc.input(_accounting.GlDashboardQuerySchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    statutoryReports: _contract.oc.input(CompanyQuery.extend({
        startDate: _zod.z.string().optional(),
        endDate: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    morPackage: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        startDate: _zod.z.string(),
        endDate: _zod.z.string(),
        type: _zod.z.enum([
            'ANNUAL',
            'QUARTERLY',
            'MONTHLY'
        ]).default('ANNUAL')
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    auditReadiness: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        period: _zod.z.string()
    })).output(_accounting.AuditReadinessSchema),
    dualLedgerStatus: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        period: _zod.z.string()
    })).output(_accounting.DualLedgerStatusSchema)
};
// ── Ledger Mapping procedures ──────────────────────────────────────────────────
const ledgerMappingProcedures = {
    listRules: _contract.oc.input(CompanyQuery).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    getRule: _contract.oc.input(_common.IdParamSchema.extend({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    createRule: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        name: _zod.z.string().min(1),
        priority: _zod.z.number().int().default(100),
        isActive: _zod.z.boolean().default(true),
        matchType: _zod.z.enum([
            'KEYWORD',
            'ACCOUNT',
            'AMOUNT',
            'TEMPLATE'
        ]),
        matchValue: _zod.z.string().min(1),
        debitAccountId: _zod.z.string().min(1),
        creditAccountId: _zod.z.string().min(1),
        taxType: _zod.z.string().optional(),
        costCenterId: _zod.z.string().optional(),
        description: _zod.z.string().optional(),
        minAmount: _zod.z.number().optional(),
        maxAmount: _zod.z.number().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    updateRule: _contract.oc.input(_common.IdParamSchema.extend({
        companyId: _zod.z.string().optional(),
        data: _zod.z.object({
            name: _zod.z.string().optional(),
            priority: _zod.z.number().int().optional(),
            isActive: _zod.z.boolean().optional(),
            matchType: _zod.z.enum([
                'KEYWORD',
                'ACCOUNT',
                'AMOUNT',
                'TEMPLATE'
            ]).optional(),
            matchValue: _zod.z.string().optional(),
            debitAccountId: _zod.z.string().optional(),
            creditAccountId: _zod.z.string().optional(),
            taxType: _zod.z.string().optional(),
            costCenterId: _zod.z.string().optional(),
            description: _zod.z.string().optional(),
            minAmount: _zod.z.number().optional(),
            maxAmount: _zod.z.number().optional()
        })
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    deleteRule: _contract.oc.input(_common.IdParamSchema.extend({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.object({
        success: _zod.z.boolean(),
        id: _zod.z.string()
    })),
    listTemplates: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_zod.z.object({
        key: _zod.z.string(),
        name: _zod.z.string(),
        ruleCount: _zod.z.number().int()
    }))),
    applyTemplate: _contract.oc.input(_zod.z.object({
        templateKey: _zod.z.string(),
        companyId: _zod.z.string()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    autoMapInvoice: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        invoiceId: _zod.z.string(),
        paymentAmount: _zod.z.number(),
        paymentAccountId: _zod.z.string(),
        paymentDate: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    autoMapBill: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        billId: _zod.z.string(),
        paymentAmount: _zod.z.number(),
        paymentAccountId: _zod.z.string(),
        paymentDate: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    autoMapTransfer: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        bankTransactionId: _zod.z.string(),
        fromAccountId: _zod.z.string(),
        toAccountId: _zod.z.string(),
        amount: _zod.z.number(),
        description: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Fiscal Year procedures ─────────────────────────────────────────────────────
const fiscalYearProcedures = {
    list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    getCurrent: _contract.oc.input(CompanyQuery).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()).nullable()),
    create: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        year: _zod.z.number().int(),
        startDate: _zod.z.string(),
        endDate: _zod.z.string(),
        status: _zod.z.enum([
            'OPEN',
            'CLOSED',
            'CLOSING'
        ]).default('OPEN'),
        isCurrent: _zod.z.boolean().default(false),
        notes: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    update: _contract.oc.input(_common.IdParamSchema.extend({
        companyId: _zod.z.string().optional(),
        data: _zod.z.object({
            status: _zod.z.enum([
                'OPEN',
                'CLOSED',
                'CLOSING'
            ]).optional(),
            isCurrent: _zod.z.boolean().optional(),
            notes: _zod.z.string().optional()
        })
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    close: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        year: _zod.z.number().int(),
        notes: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    openingBalances: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        year: _zod.z.number().int()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    summary: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        year: _zod.z.number().int()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Cash Flow procedures ───────────────────────────────────────────────────────
const cashFlowProcedures = {
    get: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        from: _zod.z.string().optional(),
        to: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Comparative Reports procedures ────────────────────────────────────────────
const reportsProcedures = {
    comparativeBalanceSheet: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        asOfCurrent: _zod.z.string().optional(),
        asOfPrior: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    financialNotes: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        from: _zod.z.string().optional(),
        to: _zod.z.string().optional(),
        asOf: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Chart of Accounts procedures (enhanced) ────────────────────────────────────
const coaProcedures = {
    templates: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    applyTemplate: _contract.oc.input(_zod.z.object({
        templateKey: _zod.z.string(),
        companyId: _zod.z.string()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    export: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        format: _zod.z.enum([
            'json',
            'csv'
        ]).default('json')
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    import: _contract.oc.input(_zod.z.object({
        data: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
const accountingContract = _contract.oc.router({
    journals: _contract.oc.router(journalProcedures),
    accounts: _contract.oc.router(accountProcedures),
    trialBalance: _contract.oc.router(trialBalanceProcedures),
    subLedger: _contract.oc.router(subLedgerProcedures),
    ifrs: _contract.oc.router(ifrsProcedures),
    glCompliance: _contract.oc.router(glComplianceProcedures),
    ledgerMapping: _contract.oc.router(ledgerMappingProcedures),
    fiscalYear: _contract.oc.router(fiscalYearProcedures),
    cashFlow: _contract.oc.router(cashFlowProcedures),
    coa: _contract.oc.router(coaProcedures),
    reports: _contract.oc.router(reportsProcedures)
});
