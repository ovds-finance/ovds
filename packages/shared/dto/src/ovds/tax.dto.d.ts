import { TaxFilingType } from '@ovds/shared/ovds/tax.types';
export type { TaxFilingType, TaxPeriod, IAS12Treatment } from '@ovds/shared/ovds/tax.types';
export declare class FxDifferenceDto {
    intercompanyTxId: string;
    period: string;
}
export declare class NonIncomeTaxDto {
    journalLineId: string;
}
export declare class VatReconciliationDto {
    period: string;
    taxableAmount: number;
    outputVat: number;
    inputVat: number;
    netPayable: number;
}
export declare class IncomeTaxDto {
    year: number;
    annualRevenue?: number;
    netProfit: number;
    rate?: number;
    taxPayable: number;
}
export declare class ETaxPayloadDto {
    /** Optional override when generating payloads from background jobs/admin tools. */
    companyId?: string;
    tin: string;
    period: string;
    type: TaxFilingType;
    taxableAmount?: number;
    amount: number;
    paymentRef?: string;
    submittedAt: string;
}
export declare class TaxReportDto {
    period: string;
    type: TaxFilingType;
    outputVat?: number;
    inputVat?: number;
    netVat?: number;
    incomeTax?: number;
    drrfLevies?: number;
    attachments?: string[];
    status: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'FILED';
    eTaxReference?: string;
}
export declare class CreateTaxFilingDto {
    period: string;
    type: TaxFilingType | string;
    amount: number;
    notes?: string;
    grossIncome?: number;
    taxableIncome?: number;
    matAmount?: number;
    taxpayerType?: string;
    whtCredits?: number;
    provisionalPaid?: number;
    /** WHT transaction type — required when type is WITHHOLDING or WHT */
    whtType?: 'GOODS' | 'SERVICES' | 'SERVICES_NR' | 'RENT' | 'DIVIDEND' | 'INTEREST' | 'ROYALTY_ARTISTIC' | 'ROYALTY_TECHNICAL' | 'CAPITAL_GAINS' | 'IMPORT';
    exciseCategory?: 'ALCOHOL' | 'TOBACCO' | 'AUTOMOBILE_GT_1800CC' | 'AUTOMOBILE_LT_1800CC' | 'AUTOMOBILE_ELECTRIC' | 'JEWELRY' | 'YACHT' | 'PRIVATE_AIRCRAFT' | 'FIREARMS' | 'SUGAR_SWEETENED' | 'ENERGY_DRINK' | 'PLASTIC' | 'OTHER';
    drrfCategory?: 'LOAN_VALUE' | 'INSURANCE_PREMIUM' | 'SERVICE_FEES' | 'AIRTIME_SALES' | 'TICKET_SALES' | 'ANNUAL_SALES_REVENUE' | 'FUEL_SALES' | 'TOBACCO_ALCOHOL' | 'GOVERNMENT_SERVICES' | 'SALARY_CONTRIBUTION' | 'TELECOM_DIGITAL' | 'DIVIDEND' | 'OTHER';
    pensionType?: 'EMPLOYEE' | 'EMPLOYER' | 'COMBINED';
    cifValue?: number;
    customsDuty?: number;
    isContract?: boolean;
    contractValue?: number;
    /** IAS 12 treatment classification for this filing */
    ias12Treatment?: 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'COGS' | 'NOT_INCOME_TAX';
}
export declare class IncomeTaxFilingDto {
    fiscalYear: number;
    netProfit: number;
    adjustments?: number;
    taxableIncome: number;
    taxRate?: number;
    taxPayable: number;
    paid?: number;
    balanceDue: number;
    status: 'PENDING' | 'FILED' | 'PAID';
    dueDate: string;
    etaxRef?: string;
    notes?: string;
}
//# sourceMappingURL=tax.dto.d.ts.map