/* IAS21 + IAS12 Ethiopian Tax Shared Types */

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
    incomeStatement: { revenue: number; expenses: number; netProfit: number };
    balanceSheet: { totalAssets: number; totalLiabilities: number; equity: number };
    cashFlow: { operating: number; netChange: number };
  };
  totals: Record<string, number>;
  generatedAt: string | Date;
}

// FxDifferenceDto and NonIncomeTaxDto are exported as classes from tax.dto.ts.
// Rename the type aliases here to avoid the duplicate export conflict.
export type FxDifferenceInput = {
  intercompanyTxId: string;
  period: string;
};

export type NonIncomeTaxInput = {
  journalLineId: string;
};

/** IAS 21 illustrative examples — for documentation and UI display */
export const IAS21_EXAMPLES = [
  {
    scenario: 'Intercompany loan USD→ETB devaluation',
    usdAmount: 100000,
    etbPrev: 5500000,
    etbCurrent: 5700000,
    fxGainLoss: 200000,
    journal: 'Dr Receivable ETB200k / Cr FX Gain ETB200k (IAS21 P&L)',
  },
] as const;
