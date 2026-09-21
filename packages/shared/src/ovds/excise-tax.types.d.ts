/**
 * Excise Tax — Ethiopia
 * Based on: Excise Tax Proclamation No. 1186/2020
 * Administered by: Ministry of Revenues (MoR) — formerly Ethiopian Revenues and
 * Customs Authority (ERCA), restructured under Proclamation No. 1097/2018.
 * Portal: etax.mor.gov.et
 *
 * Excise tax applies to locally manufactured goods and imported goods before sale.
 * Some goods carry both VAT + Excise; excise is levied on the ex-factory price (local)
 * or CIF value (imports).
 */
export type ExciseGoodsCategory = 'TOBACCO_CIGARETTES' | 'TOBACCO_OTHER' | 'ALCOHOL_WINE' | 'ALCOHOL_BEER' | 'ALCOHOL_SPIRITS' | 'SOFT_DRINKS' | 'PERFUMES_COSMETICS' | 'VEHICLES_UP_TO_1300CC' | 'VEHICLES_1300_TO_1800CC' | 'VEHICLES_ABOVE_1800CC' | 'VEHICLES_TRUCKS' | 'FUEL_PETROL' | 'FUEL_DIESEL' | 'PLASTIC_BAGS' | 'ELECTRONICS' | 'LUXURY_GOODS' | 'SALT' | 'SUGAR' | 'OTHER';
export type ExciseTaxBasis = 'PERCENTAGE' | 'SPECIFIC_ETB' | 'HYBRID';
export type ExciseTaxStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'FILED' | 'OVERDUE' | 'EXEMPTED';
export type ExciseTaxOrigin = 'LOCAL' | 'IMPORT';
/** Excise rates per Proclamation No. 1186/2020 */
export declare const EXCISE_RATES: Record<ExciseGoodsCategory, {
    rate?: number;
    specificRate?: number;
    unit?: string;
    basis: ExciseTaxBasis;
    notes: string;
}>;
export interface ExciseTaxRecord {
    id: string;
    companyId: string;
    period: string;
    goodsCategory: ExciseGoodsCategory;
    goodsDescription: string;
    origin: ExciseTaxOrigin;
    quantity: number;
    unit: string;
    baseValue: number;
    exciseRate?: number;
    specificRate?: number;
    exciseTaxDue: number;
    vatOnExcise?: number;
    totalTaxDue: number;
    status: ExciseTaxStatus;
    customsDeclarationNo?: string;
    filedAt?: string;
    paidAt?: string;
    paymentReference?: string;
    notes?: string;
    createdAt: string;
}
export interface ExciseTaxFiling {
    id: string;
    companyId: string;
    period: string;
    totalExciseDue: number;
    totalPaid: number;
    penaltyAmount: number;
    status: ExciseTaxStatus;
    /** MoR reference number (field kept as ercaReferenceNo for DB compat) */
    ercaReferenceNo?: string;
    filedAt?: string;
    dueDate: string;
    recordCount: number;
    notes?: string;
    createdAt: string;
}
export interface ExciseTaxDashboard {
    period: string;
    totalExciseDue: number;
    totalPaid: number;
    totalOutstanding: number;
    penaltiesAccrued: number;
    byCategory: Record<string, number>;
    complianceRate: number;
    nextDueDate: string;
    overdueCount: number;
}
export interface ExciseCalcInput {
    category: ExciseGoodsCategory;
    baseValue: number;
    quantity?: number;
    applyVatOnTop?: boolean;
}
export interface ExciseCalcResult {
    exciseTaxDue: number;
    vatIfApplied?: number;
    totalTaxBurden: number;
    effectiveRate: number;
    notes: string;
}
export declare function calculateExciseTax(input: ExciseCalcInput): ExciseCalcResult;
//# sourceMappingURL=excise-tax.types.d.ts.map