/**
 * @ovds/contracts — Tax oRPC Router Contract
 *
 * Covers the entire Ethiopian tax compliance surface:
 *   vat.*          — VAT ledgers, filings, reverse-charge, withholding, refunds, IRN, eTax
 *   wht.*          — WHT certificates (Proc. 1395/2025)
 *   tot.*          — Turnover Tax filings
 *   bit.*          — Business Income Tax (Proc. 979/2016)
 *   profile.*      — CompanyTaxProfile management
 *   dashboard      — Tax KPI summary
 *   compliance     — Health check + upcoming deadlines
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "taxContract", {
    enumerable: true,
    get: function() {
        return taxContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _tax = require("../schemas/tax");
const _common = require("../schemas/common");
const CompanyQuery = _zod.z.object({
    companyId: _zod.z.string().optional()
});
// ── VAT procedures ────────────────────────────────────────────────────────────
const vatProcedures = {
    // Dashboard
    dashboard: _contract.oc.input(CompanyQuery.extend({
        period: _tax.PeriodSchema.optional()
    })).output(_tax.VatDashboardSchema),
    // Filings
    filings: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_tax.VatFilingSchema)),
        calculate: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            startDate: _zod.z.string(),
            endDate: _zod.z.string(),
            period: _tax.PeriodSchema
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        autoCompute: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            period: _tax.PeriodSchema
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        zeroDeclaration: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            period: _tax.PeriodSchema
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        updateStatus: _contract.oc.input(_common.IdParamSchema.extend({
            status: _zod.z.enum([
                'PENDING',
                'FILED',
                'PAID'
            ])
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema),
        lock: _contract.oc.input(_common.IdParamSchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        getApportionment: _contract.oc.input(_common.IdParamSchema).output(_tax.ApportionmentResultSchema),
        setApportionment: _contract.oc.input(_common.IdParamSchema.extend({
            apportionmentPct: _zod.z.number().min(0).max(1)
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        /** Auto-compute apportionment ratio from live sales data (Proc. 1341/2024 Art. 26) */ autoComputeApportionment: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            period: _tax.PeriodSchema
        })).output(_tax.AutoApportionmentResultSchema)
    }),
    // Input VAT Ledger
    inputLedger: _contract.oc.router({
        list: _contract.oc.input(_tax.VatPeriodQuerySchema).output(_tax.PaginatedVatLedgerSchema),
        create: _contract.oc.input(_tax.CreateVatInputEntrySchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
            data: _tax.UpdateVatInputEntrySchema
        }))).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // Output VAT Ledger
    outputLedger: _contract.oc.router({
        list: _contract.oc.input(_tax.VatPeriodQuerySchema).output(_tax.PaginatedVatLedgerSchema),
        create: _contract.oc.input(_tax.CreateVatOutputEntrySchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
            data: _tax.UpdateVatOutputEntrySchema
        }))).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // Reverse Charge
    reverseCharges: _contract.oc.router({
        list: _contract.oc.input(_tax.VatPeriodQuerySchema).output(_zod.z.object({
            data: _zod.z.array(_tax.VatReverseChargeSchema),
            meta: _zod.z.record(_zod.z.string(), _zod.z.unknown())
        })),
        create: _contract.oc.input(_tax.CreateReverseChargeSchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // Refund Claims
    refundClaims: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_tax.VatRefundClaimSchema)),
        create: _contract.oc.input(_tax.CreateVatRefundClaimSchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        updateStatus: _contract.oc.input(_common.IdParamSchema.extend({
            status: _zod.z.string(),
            notes: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // VAT Notes
    notes: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_tax.VatNoteSchema)),
        create: _contract.oc.input(_tax.CreateVatNoteSchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // Withholding Register
    withholding: _contract.oc.router({
        list: _contract.oc.input(_tax.VatPeriodQuerySchema).output(_zod.z.object({
            data: _zod.z.array(_tax.VatWithholdingSchema),
            meta: _zod.z.record(_zod.z.string(), _zod.z.unknown())
        })),
        create: _contract.oc.input(_tax.CreateVatWithholdingSchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        toggleRemitted: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
            id: _zod.z.string(),
            remitted: _zod.z.boolean()
        })),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // Export Evidence
    exportEvidence: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
        create: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            invoiceNo: _zod.z.string(),
            Customer: _zod.z.string(),
            exportDate: _zod.z.string(),
            amountETB: _zod.z.number()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        cycleStatus: _contract.oc.input(_common.IdParamSchema.extend({
            field: _zod.z.enum([
                'customsDecl',
                'billOfLading',
                'bankReceipt'
            ])
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // eTax Submissions
    etaxSubmissions: _contract.oc.router({
        list: _contract.oc.input(CompanyQuery.extend({
            period: _tax.PeriodSchema.optional()
        })).output(_zod.z.array(_tax.EtaxSubmissionSchema)),
        create: _contract.oc.input(_tax.CreateEtaxSubmissionSchema.extend({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        remove: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
    }),
    // IRN
    irn: _contract.oc.router({
        generate: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            invoiceId: _zod.z.string(),
            invoiceNumber: _zod.z.string(),
            invoiceDate: _zod.z.string(),
            grossAmount: _zod.z.number(),
            tin: _zod.z.string().optional()
        })).output(_tax.IrnResultSchema),
        get: _contract.oc.input(_zod.z.object({
            invoiceId: _zod.z.string(),
            companyId: _zod.z.string().optional()
        })).output(_tax.IrnResultSchema)
    }),
    // Period summary
    periodSummary: _contract.oc.input(_zod.z.object({
        period: _tax.PeriodSchema,
        companyId: _zod.z.string().optional()
    })).output(_tax.VatDashboardSchema)
};
// ── WHT Certificate procedures ────────────────────────────────────────────────
const whtProcedures = {
    list: _contract.oc.input(CompanyQuery.extend({
        period: _tax.PeriodSchema.optional(),
        status: _zod.z.string().optional()
    })).output(_zod.z.array(_tax.WhtCertificateSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_tax.WhtCertificateSchema),
    create: _contract.oc.input(_tax.CreateWhtCertificateSchema).output(_tax.WhtCertificateSchema),
    issue: _contract.oc.input(_common.IdParamSchema).output(_tax.WhtCertificateSchema),
    remit: _contract.oc.input(_common.IdParamSchema.extend({
        ercaReference: _zod.z.string().min(1)
    })).output(_tax.WhtCertificateSchema),
    cancel: _contract.oc.input(_common.IdParamSchema).output(_tax.WhtCertificateSchema),
    summary: _contract.oc.input(CompanyQuery.extend({
        period: _tax.PeriodSchema.optional()
    })).output(_tax.WhtSummarySchema),
    autoGenerate: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        period: _tax.PeriodSchema
    })).output(_zod.z.object({
        generated: _zod.z.number().int(),
        certificates: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
    }))
};
// ── TOT procedures ────────────────────────────────────────────────────────────
const totProcedures = {
    list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_tax.TotFilingSchema)),
    calculate: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        period: _tax.PeriodSchema
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    autoCompute: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        period: _tax.PeriodSchema
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    updateStatus: _contract.oc.input(_common.IdParamSchema.extend({
        status: _zod.z.string()
    })).output(_tax.TotFilingSchema)
};
// ── BIT / Income Tax procedures ───────────────────────────────────────────────
const bitProcedures = {
    list: _contract.oc.input(CompanyQuery).output(_zod.z.array(_tax.IncomeTaxFilingSchema)),
    calculate: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        year: _zod.z.number().int()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    record: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        year: _zod.z.number().int(),
        amount: _zod.z.number().nonnegative(),
        grossIncome: _zod.z.number().optional(),
        taxableIncome: _zod.z.number().optional(),
        whtCredits: _zod.z.number().optional(),
        provisionalPaid: _zod.z.number().optional(),
        permanentAddBacks: _zod.z.number().optional(),
        permanentDeductions: _zod.z.number().optional(),
        timingDifferences: _zod.z.number().optional(),
        notes: _zod.z.string().optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    reports: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        period: _tax.PeriodSchema.optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
};
// ── Tax Profile procedures ────────────────────────────────────────────────────
const profileProcedures = {
    get: _contract.oc.input(CompanyQuery).output(_tax.TaxProfileSchema),
    update: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        data: _tax.UpdateTaxProfileSchema
    })).output(_tax.TaxProfileSchema),
    rules: _contract.oc.input(_zod.z.object({
        sector: _zod.z.string().optional()
    })).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())))
};
// ── Acknowledgement Receipt Vault procedures ───────────────────────────────────
const ackVaultProcedures = {
    list: _contract.oc.input(_tax.AckReceiptQuerySchema).output(_zod.z.array(_tax.MorAcknowledgementReceiptSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_tax.MorAcknowledgementReceiptSchema),
    create: _contract.oc.input(_tax.CreateMorAcknowledgementReceiptSchema).output(_tax.MorAcknowledgementReceiptSchema),
    update: _contract.oc.input(_common.IdParamSchema.extend({
        data: _tax.UpdateMorAcknowledgementReceiptSchema
    })).output(_tax.MorAcknowledgementReceiptSchema),
    verify: _contract.oc.input(_common.IdParamSchema.extend({
        method: _zod.z.string().optional(),
        verifiedBy: _zod.z.string().optional()
    })).output(_tax.MorAcknowledgementReceiptSchema),
    delete: _contract.oc.input(_common.IdParamSchema).output(_tax.SuccessSchema)
};
const taxContract = _contract.oc.router({
    dashboard: _contract.oc.input(CompanyQuery).output(_tax.TaxDashboardSchema),
    compliance: _contract.oc.input(CompanyQuery).output(_tax.ComplianceHealthSchema),
    deadlines: _contract.oc.input(CompanyQuery).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    vat: _contract.oc.router(vatProcedures),
    wht: _contract.oc.router(whtProcedures),
    tot: _contract.oc.router(totProcedures),
    bit: _contract.oc.router(bitProcedures),
    profile: _contract.oc.router(profileProcedures),
    ackVault: _contract.oc.router(ackVaultProcedures)
});
