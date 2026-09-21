/**
 * Property Tax — Ethiopia
 * Based on: Property Tax Proclamation No. 1161/2019 and Regulations
 * Administered by: Regional/City Revenue Bureaus + Ministry of Revenues (MoR) oversight
 * MoR was formerly the Ethiopian Revenues and Customs Authority (ERCA).
 * Restructured under Proclamation No. 1097/2018.
 */
export type PropertyTaxType = 'URBAN_LAND' | 'BUILDING' | 'AGRICULTURAL_LAND' | 'RENTAL_INCOME';
export type PropertyUseType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE' | 'AGRICULTURAL';
export type ValuationMethod = 'MARKET_VALUE' | 'REPLACEMENT_COST' | 'INCOME_CAPITALIZATION' | 'AREA_BASED';
export type PropertyTaxStatus = 'DRAFT' | 'ASSESSED' | 'NOTIFIED' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'EXEMPT';
/** Annual urban land use fee rates by municipality (ETB per m²) */
export declare const URBAN_LAND_RATE_ETB_PER_SQM: {
    readonly ADDIS_ABABA_GRADE_1: 3.5;
    readonly ADDIS_ABABA_GRADE_2: 2.5;
    readonly ADDIS_ABABA_GRADE_3: 1.8;
    readonly ADDIS_ABABA_GRADE_4: 1.2;
    readonly REGIONAL_CAPITAL: 1;
    readonly SECONDARY_CITY: 0.7;
    readonly RURAL_TOWN: 0.4;
};
/** Building depreciation rate for replacement-cost valuation */
export declare const BUILDING_ANNUAL_DEPRECIATION = 0.02;
/** Rental income tax rate (applicable to rental property) */
export declare const RENTAL_INCOME_TAX_RATE = 0.15;
/** House/building tax rate on assessed value */
export declare const BUILDING_TAX_RATE = 0.01;
export interface PropertyRecord {
    id: string;
    companyId: string;
    propertyCode: string;
    description: string;
    address: string;
    city: string;
    subcity?: string;
    woreda?: string;
    kebele?: string;
    propertyType: PropertyTaxType;
    useType: PropertyUseType;
    landAreaSqm: number;
    buildingAreaSqm?: number;
    yearBuilt?: number;
    registrationNumber?: string;
    titleDeedNumber?: string;
    assessedValue: number;
    marketValue?: number;
    annualTaxPayable: number;
    valuationMethod: ValuationMethod;
    lastValuationDate?: string;
    nextValuationDate?: string;
    exemptReason?: string;
    isExempt: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface PropertyTaxAssessment {
    id: string;
    propertyId: string;
    period: string;
    assessedValue: number;
    taxRate: number;
    annualTaxDue: number;
    penaltyAmount: number;
    interestAmount: number;
    totalPayable: number;
    status: PropertyTaxStatus;
    assessedBy?: string;
    assessedAt?: string;
    dueDate: string;
    paidAt?: string;
    paymentReference?: string;
    municipality: string;
    notes?: string;
    createdAt: string;
}
export interface PropertyTaxPayment {
    id: string;
    assessmentId: string;
    propertyId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string;
    bankName?: string;
    receiptNumber?: string;
    notes?: string;
    createdAt: string;
}
export interface PropertyTaxDashboard {
    totalProperties: number;
    totalAssessedValue: number;
    totalAnnualTaxDue: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    propertiesByType: Record<PropertyTaxType, number>;
    propertiesByStatus: Record<PropertyTaxStatus, number>;
    complianceRate: number;
    nextDueDate?: string;
    penaltiesAccrued: number;
}
export interface PropertyTaxSummary {
    period: string;
    totalTaxDue: number;
    totalPaid: number;
    totalOutstanding: number;
    overduePenalty: number;
    propertyCount: number;
    paidCount: number;
    overdueCount: number;
}
export interface PropertyTaxCalcInput {
    propertyType: PropertyTaxType;
    useType: PropertyUseType;
    assessedValue: number;
    landAreaSqm?: number;
    municipality?: keyof typeof URBAN_LAND_RATE_ETB_PER_SQM;
    annualRentalIncome?: number;
    allowableExpenses?: number;
    daysOverdue?: number;
}
export interface PropertyTaxCalcResult {
    annualTaxDue: number;
    taxRate: number;
    rentalTax?: number;
    landUseFee?: number;
    buildingTax?: number;
    penaltyAmount: number;
    totalPayable: number;
    notes: string[];
}
export declare function calculatePropertyTax(input: PropertyTaxCalcInput): PropertyTaxCalcResult;
//# sourceMappingURL=property-tax.types.d.ts.map