export declare enum TaxRateType {
    VAT = "VAT",
    INCOME_TAX = "INCOME_TAX",
    WITHHOLDING = "WITHHOLDING",
    DRRF = "DRRF",
    SALES_TAX = "SALES_TAX",
    CUSTOM = "CUSTOM"
}
export interface EthiopianTaxRules {
    vatRate: number;
    whtRate: number;
    isDrrfApplicable: boolean;
    proclamationNumber: string;
}
//# sourceMappingURL=tax.d.ts.map