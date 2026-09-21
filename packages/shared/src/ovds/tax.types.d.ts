export declare enum TaxFilingType {
    VAT = "VAT",
    VAT_RETURN = "VAT_RETURN",
    TOT = "TOT",
    INCOME_TAX = "INCOME_TAX",
    BIT = "BIT",
    BIT_DECLARATION = "BIT_DECLARATION",
    RENTAL_INDIVIDUAL = "RENTAL_INDIVIDUAL",
    RENTAL_CORPORATE = "RENTAL_CORPORATE",
    DIVIDEND = "DIVIDEND",
    INTEREST = "INTEREST",
    CAPITAL_GAINS = "CAPITAL_GAINS",
    ROYALTY_ARTISTIC = "ROYALTY_ARTISTIC",
    ROYALTY_TECHNICAL = "ROYALTY_TECHNICAL",
    DIGITAL_CONTENT = "DIGITAL_CONTENT",
    GAMES_OF_CHANCE = "GAMES_OF_CHANCE",
    REPATRIATED_PROFIT = "REPATRIATED_PROFIT",
    UNDISTRIBUTED_PROFIT = "UNDISTRIBUTED_PROFIT",
    MANAGEMENT_FEES = "MANAGEMENT_FEES",
    TECHNICAL_FEES = "TECHNICAL_FEES",
    WITHHOLDING = "WITHHOLDING",
    WHT_RETURN = "WHT_RETURN",
    DRRF = "DRRF",
    EXCISE_TAX = "EXCISE_TAX",
    STAMP_DUTY = "STAMP_DUTY",
    PROPERTY_TAX = "PROPERTY_TAX",
    CUSTOMS_DUTY = "CUSTOMS_DUTY",
    IMPORT_SURTAX = "IMPORT_SURTAX"
}
export declare enum TaxPeriod {
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    ANNUAL = "ANNUAL"
}
export type { IAS12Treatment } from './universal-tax-config';
export interface VatReconciliation {
    period: string;
    outputVat: number;
    inputVat: number;
    netPayable: number;
    taxableAmount?: number;
}
export interface IncomeTaxReport {
    year: number;
    netProfit: number;
    rate: number;
    taxPayable: number;
    annualRevenue?: number;
    matPayable?: number;
    matApplies?: boolean;
    regularTax?: number;
}
export interface ETaxPayload {
    tin: string;
    period: string;
    taxType: TaxFilingType | string;
    taxableAmount: number;
    taxAmount: number;
    paymentReference?: string;
    submittedAt: string;
    taxpayerName: string;
    businessType: string;
    outputVat?: number;
    inputVat?: number;
    netVatPayable?: number;
    drrfLevies?: number;
}
export interface TaxReport {
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
export interface TaxDashboard {
    year: number;
    vatCurrent: number;
    incomeTaxDue: number;
    drrfPending: number;
    drrfPendingYear?: number;
    overdueFilings: number;
    nextDue: {
        vat: string;
        drrf: string;
    };
    complianceScore: number;
    totApplicable?: boolean;
    matPayable?: number;
    matApplies?: boolean;
    /** BIT/MAT income-tax schedule (500K / 1M bands) */
    taxpayerCategory?: 'A' | 'B' | 'C';
    /** Same as taxpayerCategory — explicit alias */
    incomeTaxSchedule?: 'A' | 'B' | 'C';
    /** VAT/TOT band (2M / 500K bands); A = VAT-registered */
    vatTotComplianceBand?: 'A' | 'B' | 'C';
    annualRevenue?: number;
    vatRegistrationRequired?: boolean;
    /** Schedule D outstanding obligations */
    capitalGainsDue?: number;
    dividendWhtDue?: number;
    rentalTaxDue?: number;
    exciseTaxDue?: number;
    stampDutyDue?: number;
    propertyTaxDue?: number;
    customsDutyDue?: number;
}
export interface WithholdingReport {
    period: string;
    totalServices: number;
    /** @deprecated Use withholdingTax3pct */
    withholdingTax2pct?: number;
    withholdingTax3pct?: number;
    totalWithholding?: number;
    status: string;
}
export interface CreateTaxFiling {
    period: string;
    type: TaxFilingType | string;
    amount: number;
    year?: number;
    taxDue?: number;
    notes?: string;
    grossIncome?: number;
    taxableIncome?: number;
    matAmount?: number;
    taxpayerType?: string;
    whtCredits?: number;
    provisionalPaid?: number;
    expenses?: Array<{
        id: string;
        label: string;
        amount: number;
    }>;
}
//# sourceMappingURL=tax.types.d.ts.map