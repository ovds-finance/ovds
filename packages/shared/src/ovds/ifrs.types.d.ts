export interface FxDifferenceResponse {
    id: string;
    intercompanyTxId: string;
    monetaryItemRef: string;
    fromCurrency: string;
    toCurrency: string;
    amountBase: number;
    fxRate: number;
    amountReporting: number;
    fxGainLoss: number;
    ias21Treatment: 'P_AND_L' | 'OCI';
    taxDeferred: boolean;
    period: string;
    notes: string;
}
export interface NonIncomeTaxResponse {
    journalLineId: string;
    taxType: 'VAT_EXCISE' | 'STAMP_DUTY' | 'CUSTOMS_DUTY' | 'PAYROLL_WITHHOLD';
    ias12Treatment: 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'COGS';
    etTaxTreatment: string;
}
export interface IfrsComplianceDashboard {
    companyId?: string;
    config: any;
    taxSummary: {
        vatCompliance: string;
        incomeTaxFiled: boolean;
        drrfRemitted: boolean;
        standardsEnabled: number;
        lastStatement: string;
    };
    score: number;
}
export interface FinancialStatement {
    templateId: string;
    type: string;
    period: string;
    ifrsCompliant: boolean;
    statements: {
        incomeStatement: {
            revenue: number;
            expenses: number;
            netProfit: number;
        };
        balanceSheet: {
            totalAssets: number;
            totalLiabilities: number;
            equity: number;
        };
        cashFlow: {
            operating: number;
            netChange: number;
        };
    };
    totals: Record<string, number>;
    generatedAt: string | Date;
}
export type FxDifferenceInput = {
    intercompanyTxId: string;
    period: string;
};
export type NonIncomeTaxInput = {
    journalLineId: string;
};
/** IAS 21 illustrative examples — for documentation and UI display */
export declare const IAS21_EXAMPLES: readonly [{
    readonly scenario: "Intercompany loan USD→ETB devaluation";
    readonly usdAmount: 100000;
    readonly etbPrev: 5500000;
    readonly etbCurrent: 5700000;
    readonly fxGainLoss: 200000;
    readonly journal: "Dr Receivable ETB200k / Cr FX Gain ETB200k (IAS21 P&L)";
}];
//# sourceMappingURL=ifrs.types.d.ts.map