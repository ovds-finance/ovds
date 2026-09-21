/**
 * Ethiopian Business Workflow Engine — @ovds/shared
 *
 * Maps business size / type / sector to the correct tax types, IFRS standards,
 * filing obligations, and module set. Used by all layers (frontend, backend,
 * compliance engine) to derive the correct compliance posture for each company.
 *
 * Governing frameworks:
 *   - Income Tax Proclamation No. 1395/2025 (Category A/B/C schedule)
 *   - VAT Proclamation No. 1341/2024 (ETB 2M registration threshold)
 *   - Commercial Code of Ethiopia 2021 (business type classification)
 *   - AABE Directive No. 2/2012 (IFRS full vs IFRS for SMEs applicability)
 */
export type BusinessSize = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
export type EthBusinessType = 'SOLE_PROPRIETOR' | 'PARTNERSHIP' | 'PLC' | 'SC' | 'NGO' | 'GOVERNMENT' | 'FINANCIAL_INSTITUTION' | 'COOPERATIVE' | 'BRANCH_OFFICE';
export type BusinessSectorCategory = 'MANUFACTURING' | 'TRADE' | 'SERVICES' | 'CONSTRUCTION' | 'AGRICULTURE' | 'HOSPITALITY' | 'REAL_ESTATE' | 'FINANCIAL_SERVICES' | 'HEALTHCARE' | 'EDUCATION' | 'TECHNOLOGY' | 'TRANSPORT' | 'MINING' | 'OTHER';
export interface TaxObligation {
    taxType: string;
    rate: number;
    threshold?: number;
    period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    applies: boolean;
    rationale: string;
    proclamationRef: string;
}
/**
 * MoR taxpayer category based on annual gross income.
 * Previously referred to as "ERCA category".
 *  A: Body or person with annual gross income ≥ ETB 1,000,000
 *  B: Person (not body) with annual gross income ETB 500,000–999,999
 *  C: Person (not body) with annual gross income < ETB 500,000
 */
export type ErcaTaxpayerCategory = 'A' | 'B' | 'C';
/** Determine MoR taxpayer category based on annual turnover (Proclamation No. 979/2016) */
export declare function getErcaTaxpayerCategory(annualTurnover: number): ErcaTaxpayerCategory;
export interface BusinessProfile {
    businessId: string;
    name: string;
    tin: string;
    size: BusinessSize;
    type: EthBusinessType;
    sector: BusinessSectorCategory;
    annualTurnover: number;
    employeeCount: number;
    isVatRegistered: boolean;
    ercaCategory: ErcaTaxpayerCategory;
    ifrsStandard: 'IFRS_FULL' | 'IFRS_SME' | 'LOCAL_GAAP';
    /** Modules enabled for this business — from BUSINESS_MODULE_MAP */
    enabledModules: string[];
    taxObligations: TaxObligation[];
}
/** Determine which IFRS standard applies.
 *  AABE Directive No. 2/2012:
 *  - Tier 1 (full IFRS): public interest entities, FIs, large companies (> ETB 200M assets)
 *  - Tier 2 (IFRS for SMEs): all others with public accountability
 *  - Tier 3 (local GAAP): micro entities without public accountability
 */
export declare function getIfrsStandard(type: EthBusinessType, size: BusinessSize, annualTurnover: number): 'IFRS_FULL' | 'IFRS_SME' | 'LOCAL_GAAP';
/**
 * Returns the full set of tax obligations for a business based on its
 * size, type, sector, and registration status.
 */
export declare function buildTaxObligations(size: BusinessSize, type: EthBusinessType, sector: BusinessSectorCategory, annualTurnover: number, isVatRegistered: boolean, employeeCount: number): TaxObligation[];
/**
 * Build a complete BusinessProfile from raw company data.
 * Call this once when company is created / settings change.
 */
export declare function buildBusinessProfile(input: {
    businessId: string;
    name: string;
    tin: string;
    type: EthBusinessType;
    sector: BusinessSectorCategory;
    annualTurnover: number;
    employeeCount: number;
    isVatRegistered: boolean;
}): BusinessProfile;
export type WorkflowModule = 'CORE_OPERATIONS' | 'PEOPLE' | 'ovds' | 'COMPLIANCE' | 'REPORTING' | 'ADMIN' | 'DEVELOPER';
export interface WorkflowStep {
    module: WorkflowModule;
    name: string;
    description: string;
    applies: boolean;
    ifrsPrinciples: string[];
    taxObligation: string;
    autoActions: string[];
}
/** Get the 7-step accounting workflow for a given business profile */
export declare function getWorkflowSteps(profile: BusinessProfile): WorkflowStep[];
//# sourceMappingURL=business-workflow.types.d.ts.map