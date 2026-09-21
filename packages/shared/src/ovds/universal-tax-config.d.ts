/**
 * Universal Ethiopian Tax Configuration
 * ─────────────────────────────────────
 * Single source of truth for ALL tax rates, thresholds, GL account mappings,
 * IAS 12 treatments, filing deadlines, RBAC permissions, and rule-based
 * automation triggers used across every industry in Ethiopia.
 *
 * Legal authority hierarchy:
 *   1. Federal Tax Proclamations (Proc. 979/2016, 1186/2020, 1341/2024, 1395/2025)
 *   2. Council of Ministers Regulations (Reg. 570/2025)
 *   3. MoR Directives (etax.mor.gov.et, TASS, ECC)
 *   4. IFRS / IAS (adopted by AABE — Full IFRS / IFRS for SMEs / EFRS)
 *
 * Applies uniformly across ALL business sectors (Primary → Quaternary).
 * Sector-specific EXEMPTIONS are declared in TAX_RULE_OVERRIDES below.
 */
export type TaxTypeCode = 'VAT' | 'TOT' | 'BIT' | 'PIT' | 'WHT_GOODS' | 'WHT_SERVICES' | 'WHT_NR' | 'WHT_RENT' | 'WHT_DIVIDEND' | 'WHT_INTEREST' | 'DRRF' | 'PENSION_EE' | 'PENSION_ER' | 'EXCISE' | 'STAMP_DUTY' | 'PROPERTY_TAX' | 'CUSTOMS_DUTY' | 'IMPORT_SURTAX' | 'ADVANCE_BIT' | 'CAPITAL_GAINS' | 'SCHEDULE_D';
/**
 * IAS 12 classifies tax charges into:
 *   CURRENT_TAX   — income taxes in the current period (Dr Tax Expense / Cr Tax Payable)
 *   DEFERRED_TAX  — temporary differences creating deferred assets/liabilities
 *   NOT_INCOME_TAX — levies that are NOT income taxes (VAT, WHT, DRRF, excise, etc.)
 *                    These go to P&L as operating costs or balance sheet as liabilities.
 */
export type IAS12Treatment = 'CURRENT_TAX' | 'DEFERRED_TAX' | 'NOT_INCOME_TAX';
export type IFRS18Category = 'OPERATING' | 'INVESTING' | 'FINANCING' | 'INCOME_TAX' | 'DISCONTINUED';
export type MoRPortal = 'ETAX' | 'TASS' | 'CUSTOMS' | 'PFSA' | 'MUNICIPALITY';
export type FilingFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AT_TRANSACTION' | 'AT_CLEARANCE';
export type AutomationLevel = 'FULL' | 'PARTIAL' | 'MANUAL';
export interface TaxRule {
    /** Unique code — matches TaxTypeCode */
    code: TaxTypeCode;
    name: string;
    /** Short label shown in UI */
    label: string;
    /** Primary rate (decimal, e.g. 0.15 = 15%) */
    rate: number;
    /** Minimum ETB amount before tax triggers (0 = always applies) */
    thresholdEtb: number;
    /** ETB/year registration threshold (for VAT/TOT band determination) */
    annualTurnoverThresholdEtb?: number;
    /** Specific per-unit rate in ETB (for excise fuel, plastic bags, etc.) */
    specificRateEtb?: number;
    /** Whether this tax is collected FROM customers (output) or deducted FROM payments (input) */
    direction: 'OUTPUT' | 'INPUT' | 'BOTH';
    /** IAS 12 classification */
    ias12Treatment: IAS12Treatment;
    /** IFRS 18 P&L category */
    ifrs18Category: IFRS18Category;
    /** GL debit account code */
    glDebitCode: string;
    /** GL credit account code */
    glCreditCode: string;
    /** Account name for debit side */
    glDebitName: string;
    /** Account name for credit side */
    glCreditName: string;
    /** Filing frequency */
    frequency: FilingFrequency;
    /** Filing deadline rule (human-readable) */
    deadline: string;
    /** MoR portal */
    portal: MoRPortal;
    /** Automation level in OVDS */
    automation: AutomationLevel;
    /** Governing proclamation(s) */
    proclamation: string;
    /** Whether this tax is enabled globally by default */
    enabledByDefault: boolean;
    /** Whether the company can disable this tax in settings */
    overridable: boolean;
    /** Notes for accountants */
    notes: string;
}
export declare const UNIVERSAL_TAX_RULES: Record<TaxTypeCode, TaxRule>;
export type EthiopianSector = 'AGRICULTURE' | 'MANUFACTURING' | 'CONSTRUCTION' | 'TRADE_WHOLESALE' | 'TRADE_RETAIL' | 'FINANCIAL_SERVICES' | 'TRANSPORT_LOGISTICS' | 'HEALTHCARE' | 'EDUCATION' | 'HOSPITALITY_TOURISM' | 'ICT' | 'MEDIA' | 'MINING' | 'NGO_NONPROFIT' | 'GOVERNMENT' | 'OTHER';
export interface SectorTaxOverride {
    sector: EthiopianSector;
    taxCode: TaxTypeCode;
    /** Override rate — null means use universal rate */
    rateOverride?: number;
    /** Whether this tax is exempt for this sector */
    exempt: boolean;
    /** Condition text explaining why */
    condition: string;
    /** Governing provision */
    authority: string;
}
export declare const TAX_RULE_OVERRIDES: SectorTaxOverride[];
export interface CompanyTaxProfile {
    companyId: string;
    tin: string;
    vatNumber?: string;
    srmDeviceSerial?: string;
    /** FULL_IFRS | IFRS_FOR_SMES | EFRS_SMALL | EFRS_MICRO */
    aabéFramework: string;
    isPublicInterestEntity: boolean;
    annualTurnoverEtb: number;
    sector: EthiopianSector;
    entityType: 'SOLE_PROPRIETORSHIP' | 'PLC' | 'ONE_MEMBER_PLC' | 'SHARE_COMPANY';
    /** VAT/TOT compliance band: A=VAT registered, B=TOT 500K–2M, C=<500K */
    vatTotBand: 'A' | 'B' | 'C';
    /** BIT/MAT schedule: A>1M, B=500K–1M, C<500K */
    incomeTaxSchedule: 'A' | 'B' | 'C';
    isVatRegistered: boolean;
    isTotApplicable: boolean;
    taxes: {
        vat: boolean;
        tot: boolean;
        bit: boolean;
        pit: boolean;
        whtGoods: boolean;
        whtServices: boolean;
        whtNr: boolean;
        whtRent: boolean;
        whtDividend: boolean;
        whtInterest: boolean;
        drrf: boolean;
        pensionEe: boolean;
        pensionEr: boolean;
        excise: boolean;
        stampDuty: boolean;
        propertyTax: boolean;
        customsDuty: boolean;
        importSurtax: boolean;
        advanceBit: boolean;
        capitalGains: boolean;
        scheduleD: boolean;
    };
    rateOverrides?: Partial<Record<TaxTypeCode, number>>;
    fiscalYearStartMonth: number;
    vatFilingDay: number;
    pitFilingDay: number;
    drrfFilingDay: number;
    bitDeadlineMonth: number;
    bitDeadlineDay: number;
    enableDeferredTax: boolean;
    deferredTaxRate: number;
    depreciationPoolRates: {
        cat1: number;
        cat2: number;
        cat3: number;
        cat4: number;
    };
    materialityThresholdEtb: number;
    roundingMethod: 'HALF_UP' | 'HALF_EVEN';
    etaxAutoSubmit: boolean;
    srmIntegrated: boolean;
    cbeReconciliation: boolean;
}
/** Build a default CompanyTaxProfile from minimal onboarding data. */
export declare function buildDefaultTaxProfile(companyId: string, tin: string, annualTurnoverEtb: number, sector: EthiopianSector, isPublicInterestEntity?: boolean): CompanyTaxProfile;
export interface TaxEngineInput {
    /** Gross transaction amount in ETB */
    amountEtb: number;
    /** Company tax profile */
    profile: CompanyTaxProfile;
    /** Transaction type for TOT / WHT routing */
    transactionType: 'GOODS' | 'SERVICES' | 'CONSTRUCTION_GRAIN_FARM' | 'IMPORT' | 'CONTRACT';
    /** Import CIF value (for customs / surtax / advance BIT) */
    importCifEtb?: number;
    /** Whether the counterparty is non-resident */
    isNonResident?: boolean;
    /** Whether WHT applies (company is a WHT agent) */
    applyWht?: boolean;
    /** Excise category (if excisable goods) */
    exciseCategory?: string;
    /** Whether stamp duty applies (contract transaction) */
    isContract?: boolean;
}
export interface TaxEngineLineItem {
    taxCode: TaxTypeCode;
    label: string;
    rate: number;
    baseAmount: number;
    taxAmount: number;
    direction: 'OUTPUT' | 'INPUT' | 'BOTH';
    glDebitCode: string;
    glCreditCode: string;
    ias12Treatment: IAS12Treatment;
    ifrs18Category: IFRS18Category;
    proclamation: string;
}
export interface TaxEngineResult {
    subtotal: number;
    lines: TaxEngineLineItem[];
    totalOutputTax: number;
    totalInputTax: number;
    grossAmount: number;
    netPayable: number;
    vatPayable: number;
    summary: Record<TaxTypeCode, number>;
}
/**
 * Core rule-based tax engine — resolves which taxes apply, applies overrides,
 * calculates amounts, and returns full GL line data.
 */
export declare function resolveTaxes(input: TaxEngineInput): TaxEngineResult;
export interface GlAccountEntry {
    code: string;
    name: string;
    /** ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE */
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    /** Normal balance: DEBIT increases this account */
    normalBalance: 'DEBIT' | 'CREDIT';
    /** IFRS 18 category for P&L accounts */
    ifrs18Category?: IFRS18Category;
    /** IAS 12 treatment */
    ias12Treatment?: IAS12Treatment;
    description: string;
}
/**
 * Canonical GL account codes used exclusively for tax entries.
 * These codes must exist in Chart of Accounts (Account model) for every company.
 */
export declare const TAX_GL_ACCOUNTS: GlAccountEntry[];
/** Quick lookup: GL account by code */
export declare const TAX_GL_BY_CODE: Record<string, GlAccountEntry>;
export type TaxAction = 'view' | 'calculate' | 'create_draft' | 'submit' | 'approve' | 'pay' | 'amend' | 'override_rate' | 'configure' | 'export' | 'delete_draft';
/**
 * Minimum role level required per action.
 * Matches ROLE_HIERARCHY values in rbac.ts:
 *   SPURADMIN=200, SUPERADMIN=190, DEVELOPER=150, ADMIN=100,
 *   ovds=60, ACCOUNTING=55, IFRS_OFFICER=52, HR=50,
 *   AUDITOR=30, DATA_CLERK=8, EMPLOYEE=10
 */
export declare const TAX_RBAC_MATRIX: Record<TaxAction, {
    minLevel: number;
    description: string;
}>;
/** Check if a role level satisfies a tax action. */
export declare function canPerformTaxAction(roleLevel: number, action: TaxAction): boolean;
export declare const TAX_PERMISSION_MAP: Record<string, TaxAction[]>;
export interface FilingDeadline {
    taxCode: TaxTypeCode;
    label: string;
    dueDate: Date;
    portal: MoRPortal;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    daysUntilDue: number;
    overdue: boolean;
}
/**
 * Compute all upcoming (or overdue) filing deadlines for the next 90 days.
 * Returns sorted by dueDate ascending.
 */
export declare function getUpcomingDeadlines(profile: CompanyTaxProfile, today?: Date): FilingDeadline[];
export interface DeferredTaxItem {
    description: string;
    ifrsCarryingAmount: number;
    taxBase: number;
    temporaryDifference: number;
    /** TAXABLE = DTL; DEDUCTIBLE = DTA */
    type: 'TAXABLE' | 'DEDUCTIBLE';
    deferredTaxAmount: number;
    ias12Reference: string;
}
/**
 * IAS 12 deferred tax on PPE — pool depreciation vs. IFRS straight-line.
 *
 * Ethiopian pool rates (Proc. 979/2016 Art. 25):
 *   CAT1: computers/software/vehicles = 25%
 *   CAT2: plant & machinery = 20%
 *   CAT3: business buildings = 15%
 *   CAT4: other fixed assets = 10%
 */
export declare function calcDeferredTaxPPE(ifrsNBV: number, taxPoolBalance: number, taxRate?: number): DeferredTaxItem;
/**
 * IAS 12 deferred tax on ECL provisions (IFRS 9).
 * ECL provisions are NOT deductible until the debtor is legally exhausted.
 * => Deductible temporary difference => Deferred Tax Asset.
 */
export declare function calcDeferredTaxECL(eclProvisionAmount: number, taxRate?: number): DeferredTaxItem;
/**
 * IAS 12.81 reconciliation — reconcile effective rate to 30% statutory rate.
 * Returns line items explaining the difference.
 */
export interface IAS12Reconciliation {
    accountingProfit: number;
    statutoryRate: number;
    expectedTax: number;
    actualTax: number;
    effectiveRate: number;
    items: Array<{
        description: string;
        amount: number;
    }>;
}
export declare function buildIAS12Reconciliation(accountingProfit: number, actualTax: number, nonDeductibleExpenses?: number, exemptIncome?: number, matAdjustment?: number): IAS12Reconciliation;
export declare const TAX_SYSTEM_SETTINGS_SCHEMA: Record<string, {
    defaultValue: string;
    description: string;
    overridable: boolean;
}>;
export {};
/**
 * Convenience: get the effective rate for a tax code, respecting overrides.
 */
export declare function getEffectiveTaxRate(code: TaxTypeCode, profile?: Pick<CompanyTaxProfile, 'rateOverrides'>): number;
/**
 * Validate that a company tax profile is internally consistent.
 * Returns an array of error strings (empty = valid).
 */
export declare function validateTaxProfile(profile: CompanyTaxProfile): string[];
//# sourceMappingURL=universal-tax-config.d.ts.map