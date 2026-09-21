/**
 * Tax domain API client — @ovds/features/tax
 *
 * Covers: VAT, TOT, BIT/Schedule-D, WHT, DRRF, PAYE, Pension,
 * TaxFilings, ETax integration, ERCA compliance, Universal Tax Config.
 *
 * No imports from apps/. Types from @ovds/contracts/schemas.
 */
export interface VatFilingParams {
    companyId?: string | null;
    period?: string;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | null | undefined;
}
export declare const vatApi: {
    summary: (companyId?: string | null) => Promise<any>;
    filings: (params?: VatFilingParams) => Promise<any>;
    getFiling: (id: string) => Promise<any>;
    compute: (companyId: string, period: string) => Promise<any>;
    submit: (id: string) => Promise<any>;
    acknowledge: (id: string, data: {
        acknowledgementNumber: string;
        submittedAt: string;
    }) => Promise<any>;
    createAmendment: (id: string, data: any) => Promise<any>;
    input: (companyId?: string | null, period?: string) => Promise<any>;
    output: (companyId?: string | null, period?: string) => Promise<any>;
    administration: (companyId?: string | null) => Promise<any>;
};
export declare const totApi: {
    filings: (params?: {
        companyId?: string | null;
        page?: number;
        limit?: number;
    }) => Promise<any>;
    compute: (companyId: string, period: string) => Promise<any>;
    submit: (id: string) => Promise<any>;
    dashboard: (companyId?: string | null) => Promise<any>;
};
export declare const bitApi: {
    filings: (params?: {
        companyId?: string | null;
        page?: number;
        limit?: number;
    }) => Promise<any>;
    compute: (companyId: string, year: number) => Promise<any>;
    submit: (id: string) => Promise<any>;
    advance: (companyId?: string | null) => Promise<any>;
    dashboard: (companyId?: string | null) => Promise<any>;
    estimator: (companyId?: string | null, year?: number) => Promise<any>;
};
export declare const scheduleD: {
    list: (companyId?: string | null, year?: number) => Promise<any[]>;
    compute: (companyId: string, year: number) => Promise<any>;
    submit: (id: string) => Promise<any>;
};
export declare const whtApi: {
    certificates: (params?: {
        companyId?: string | null;
        page?: number;
        limit?: number;
        status?: string;
    }) => Promise<any>;
    getCertificate: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    remove: (id: string) => Promise<void>;
    summary: (companyId?: string | null, period?: string) => Promise<any>;
    submit: (id: string) => Promise<any>;
};
export declare const drrfApi: {
    summary: (companyId?: string | null, period?: string) => Promise<any>;
    filings: (params?: {
        companyId?: string | null;
        page?: number;
    }) => Promise<any>;
    compute: (companyId: string, period: string) => Promise<any>;
    submit: (id: string) => Promise<any>;
};
export declare const payeApi: {
    declarations: (params?: {
        companyId?: string | null;
        year?: number;
        month?: number;
        page?: number;
    }) => Promise<any>;
    getDeclaration: (id: string) => Promise<any>;
    generate: (companyId: string, year: number, month: number) => Promise<any>;
    submit: (id: string) => Promise<any>;
};
export declare const pensionApi: {
    remittances: (params?: {
        companyId?: string | null;
        page?: number;
    }) => Promise<any>;
    generate: (companyId: string, year: number, month: number) => Promise<any>;
    submit: (id: string) => Promise<any>;
};
export declare const exciseTaxApi: {
    items: (companyId?: string | null) => Promise<any[]>;
    compute: (companyId: string, period: string) => Promise<any>;
    filings: (params?: {
        companyId?: string | null;
        page?: number;
    }) => Promise<any>;
};
export declare const stampDutyApi: {
    list: (companyId?: string | null) => Promise<any[]>;
    calculate: (data: {
        transactionType: string;
        amount: number;
    }) => Promise<any>;
};
export declare const propertyTaxApi: {
    assessments: (companyId?: string | null) => Promise<any[]>;
    calculate: (data: {
        propertyValue: number;
        type: string;
    }) => Promise<any>;
};
export declare const universalTaxConfigApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: any) => Promise<any>;
    seed: (companyId: string) => Promise<any>;
};
export declare const taxDashboardApi: {
    overview: (companyId?: string | null) => Promise<any>;
    liabilities: (companyId?: string | null, period?: string) => Promise<any>;
    calendar: (companyId?: string | null, year?: number) => Promise<any>;
    taxpayerStatus: (companyId?: string | null) => Promise<any>;
    ercaDashboard: (companyId?: string | null) => Promise<any>;
};
export declare const etaxApi: {
    submit: (filingId: string, type: string) => Promise<any>;
    status: (submissionId: string) => Promise<any>;
    acknowledge: (data: {
        submissionId: string;
        tin: string;
    }) => Promise<any>;
    penaltyCalc: (companyId: string, filingType: string, dueDate: string) => Promise<any>;
};
export declare const taxVaultApi: {
    list: (companyId?: string | null) => Promise<any[]>;
    get: (id: string) => Promise<any>;
    upload: (data: any) => Promise<any>;
    remove: (id: string) => Promise<void>;
};
export declare const taxFilingsApi: {
    list: (params?: {
        companyId?: string | null;
        type?: string;
        page?: number;
        limit?: number;
    }) => Promise<any>;
    get: (id: string) => Promise<any>;
    submit: (id: string) => Promise<any>;
    history: (companyId?: string | null) => Promise<any[]>;
};
export declare const taxPaymentRefApi: {
    list: (companyId?: string | null) => Promise<any[]>;
    generate: (filingId: string) => Promise<any>;
    verify: (ref: string) => Promise<any>;
};
export declare function recordTaxFiling(dto: {
    type: string;
    year?: number;
    period?: string;
    amount?: number;
    taxDue?: number;
    taxableIncome?: number;
    notes?: string;
    matAmount?: number;
}): Promise<any>;
export declare function generateETaxPayload(payload: {
    filingId: string;
    type: string;
    period: string;
}): Promise<{
    eTaxPayload: typeof payload;
}>;
export declare function exportETaxJson(period: string): Promise<Blob>;
export declare function submitToETax(filingId: string): Promise<any>;
export declare function syncBankTransactions(bankAccountId: string): Promise<any>;
export declare function calculateTot(period: string): Promise<{
    period: string;
    goodsAmount: number;
    servicesAmount: number;
    totGoods: number;
    totServices: number;
    netPayable: number;
}>;
export declare function triggerAutoComputeTot(period?: string): Promise<{
    computed: boolean;
    period: string;
    message: string;
    totGoods?: number;
    totServices?: number;
    netPayable?: number;
}>;
export declare function recordBITFiling(year: number, amount: number, opts?: {
    taxableIncome?: number;
    notes?: string;
    matAmount?: number;
}): Promise<any>;
export declare function recordDRRFRemittance(period: string, amount: number, opts?: {
    drrfCategory?: string;
    notes?: string;
}): Promise<any>;
export declare function recordWHTRemittance(period: string, amount: number, opts?: {
    whtType?: string;
    notes?: string;
}): Promise<any>;
export declare function calculateERCAPenalty(params: {
    taxType: 'VAT' | 'BIT' | 'WHT' | 'DRRF' | 'TOT' | 'PIT' | 'PENSION';
    taxDue: number;
    dueDate: string;
    paymentDate: string;
}): Promise<any>;
export declare function updateCompanyTaxProfile(updates: Record<string, unknown>, companyId?: string): Promise<any>;
export declare function resolveTaxesForTransaction(params: {
    amountEtb: number;
    transactionType: 'GOODS' | 'SERVICES' | 'CONSTRUCTION_GRAIN_FARM' | 'IMPORT' | 'CONTRACT';
    isNonResident?: boolean;
    applyWht?: boolean;
    isContract?: boolean;
    importCifEtb?: number;
    companyId?: string;
}): Promise<any>;
//# sourceMappingURL=taxApi.d.ts.map