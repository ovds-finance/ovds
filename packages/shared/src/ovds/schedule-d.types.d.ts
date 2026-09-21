/**
 * Schedule D — Other Income & Capital Taxes (Ethiopia)
 * Proclamation No. 979/2016 as amended
 * Administered by: Ministry of Revenues (MoR) — formerly ERCA
 * Portal: etax.mor.gov.et
 *
 * Schedule D covers flat-rate taxes on specific income sources:
 * dividends, interest, capital gains, royalties, digital content,
 * games of chance, repatriated profits, and management/technical fees.
 */
export type ScheduleDTaxType = 'DIVIDEND' | 'INTEREST_STANDARD' | 'INTEREST_FINANCIAL_INSTITUTION' | 'CAPITAL_GAINS' | 'ROYALTY_ARTISTIC' | 'ROYALTY_TECHNICAL' | 'DIGITAL_CONTENT' | 'GAMES_OF_CHANCE' | 'REPATRIATED_PROFIT' | 'UNDISTRIBUTED_PROFIT' | 'MANAGEMENT_FEES' | 'TECHNICAL_FEES';
export declare const SCHEDULE_D_RATES: Record<ScheduleDTaxType, {
    rate: number;
    description: string;
    proclamationRef: string;
    withheldAtSource: boolean;
    notes?: string;
}>;
/** Individual landlord rental income — progressive annual brackets */
export declare const RENTAL_INCOME_BRACKETS: readonly [{
    readonly min: 0;
    readonly max: 7200;
    readonly rate: 0;
    readonly deduction: 0;
    readonly notes: "Tax-free up to ETB 7,200/year";
}, {
    readonly min: 7201;
    readonly max: 19800;
    readonly rate: 0.1;
    readonly deduction: 720;
    readonly notes: "10% bracket";
}, {
    readonly min: 19801;
    readonly max: 38400;
    readonly rate: 0.15;
    readonly deduction: 1710;
    readonly notes: "15% bracket";
}, {
    readonly min: 38401;
    readonly max: 63000;
    readonly rate: 0.2;
    readonly deduction: 3630;
    readonly notes: "20% bracket";
}, {
    readonly min: 63001;
    readonly max: 93600;
    readonly rate: 0.25;
    readonly deduction: 6780;
    readonly notes: "25% bracket";
}, {
    readonly min: 93601;
    readonly max: 130800;
    readonly rate: 0.3;
    readonly deduction: 11460;
    readonly notes: "30% bracket";
}, {
    readonly min: 130801;
    readonly max: number;
    readonly rate: 0.35;
    readonly deduction: 18000;
    readonly notes: "35% top bracket";
}];
/** Corporate/body rental income — flat 30% */
export declare const CORPORATE_RENTAL_RATE = 0.3;
/** Allowable deductions for rental income: 40% of gross rent as maintenance allowance */
export declare const RENTAL_ALLOWABLE_EXPENSE_PCT = 0.4;
export type CapitalGainsAssetType = 'SHARES' | 'BONDS' | 'IMMOVABLE_PROPERTY' | 'OTHER_SECURITIES';
/** Customs duty band ranges (CIF-based) per Ethiopian Customs Tariff */
export declare const CUSTOMS_DUTY_BANDS: readonly [{
    readonly min: 0;
    readonly rate: 0;
    readonly label: "Exempt (essential goods, raw materials)";
}, {
    readonly min: 0;
    readonly rate: 0.05;
    readonly label: "5% (basic inputs)";
}, {
    readonly min: 0;
    readonly rate: 0.1;
    readonly label: "10% (semi-processed goods)";
}, {
    readonly min: 0;
    readonly rate: 0.15;
    readonly label: "15% (intermediate goods)";
}, {
    readonly min: 0;
    readonly rate: 0.2;
    readonly label: "20% (consumer goods, light manufactures)";
}, {
    readonly min: 0;
    readonly rate: 0.25;
    readonly label: "25% (selected consumer goods)";
}, {
    readonly min: 0;
    readonly rate: 0.3;
    readonly label: "30% (luxury consumer goods)";
}, {
    readonly min: 0;
    readonly rate: 0.35;
    readonly label: "35% (maximum — vehicles, alcohol, finished goods)";
}];
export declare const CUSTOMS_DUTY_MIN_RATE = 0;
export declare const CUSTOMS_DUTY_MAX_RATE = 0.35;
export interface ScheduleDTaxRecord {
    id: string;
    companyId: string;
    taxType: ScheduleDTaxType;
    period: string;
    grossAmount: number;
    taxRate: number;
    taxAmount: number;
    netAmount: number;
    payerName?: string;
    payerTin?: string;
    recipientName?: string;
    recipientTin?: string;
    assetType?: CapitalGainsAssetType;
    acquisitionCost?: number;
    disposalProceeds?: number;
    capitalGain?: number;
    withheldAtSource: boolean;
    status: 'DRAFT' | 'FILED' | 'PAID' | 'EXEMPT';
    /** MoR reference number for this Schedule D filing (field kept as ercaReference for DB compat) */
    ercaReference?: string;
    dueDate?: string;
    paidAt?: string;
    notes?: string;
    createdAt: string;
}
export interface RentalIncomeTaxRecord {
    id: string;
    companyId: string;
    taxpayerType: 'INDIVIDUAL' | 'CORPORATE';
    period: string;
    grossRentalIncome: number;
    allowableExpenses: number;
    netRentalIncome: number;
    taxPayable: number;
    effectiveRate: number;
    status: 'DRAFT' | 'ASSESSED' | 'FILED' | 'PAID';
    propertyId?: string;
    notes?: string;
    createdAt: string;
}
export interface CustomsDutyRecord {
    id: string;
    companyId: string;
    declarationNo: string;
    importDate: string;
    goodsDescription: string;
    hsCode?: string;
    cifValue: number;
    customsDutyRate: number;
    customsDutyAmount: number;
    exciseDuty?: number;
    surtaxAmount?: number;
    vatOnImport?: number;
    totalTaxBurden: number;
    status: 'DRAFT' | 'ASSESSED' | 'PAID' | 'CLEARED';
    notes?: string;
    createdAt: string;
}
export interface ScheduleDCalcResult {
    grossAmount: number;
    taxRate: number;
    taxAmount: number;
    netAmount: number;
    taxType: ScheduleDTaxType;
    description: string;
    withheldAtSource: boolean;
}
/**
 * Calculate Schedule D flat-rate tax.
 * @param grossAmount  Gross payment or income amount
 * @param taxType      Which Schedule D category applies
 */
export declare function calculateScheduleD(grossAmount: number, taxType: ScheduleDTaxType): ScheduleDCalcResult;
/**
 * Calculate Capital Gains Tax on disposal of assets.
 * @param acquisitionCost   Original purchase price (ETB)
 * @param disposalProceeds  Selling / transfer price (ETB)
 * @param assetType         Type of asset
 */
export declare function calculateCapitalGains(acquisitionCost: number, disposalProceeds: number, assetType?: CapitalGainsAssetType): {
    capitalGain: number;
    taxAmount: number;
    taxRate: number;
    netProceeds: number;
    applicable: boolean;
    assetType: CapitalGainsAssetType;
};
/**
 * Calculate individual rental income tax using progressive annual brackets.
 * Applies 40% standard expense deduction before applying brackets.
 *
 * @param grossAnnualRent  Total annual rental receipts (ETB)
 * @param actualExpenses   Optional: use actual expenses instead of 40% allowance
 */
export declare function calculateRentalIncomeTax(grossAnnualRent: number, actualExpenses?: number): {
    grossRent: number;
    deductibleExpenses: number;
    netRentalIncome: number;
    taxPayable: number;
    effectiveRate: number;
    bracket: (typeof RENTAL_INCOME_BRACKETS)[number] | null;
};
/**
 * Calculate corporate / body rental income tax — flat 30%.
 */
export declare function calculateCorporateRentalTax(netRentalIncome: number): {
    netRentalIncome: number;
    taxRate: number;
    taxPayable: number;
};
/**
 * Calculate total customs import duty.
 * @param cifValue        Cost + Insurance + Freight (CIF) value in ETB
 * @param customsDutyRate Applicable tariff rate (0.00–0.35)
 */
export declare function calculateCustomsDuty(cifValue: number, customsDutyRate: number): {
    cifValue: number;
    customsDutyRate: number;
    customsDutyAmount: number;
};
//# sourceMappingURL=schedule-d.types.d.ts.map