/**
 * Budget & FX rate types — shared between frontend and backend.
 * DTO aliases are re-exported from @ovds/dto/ovds for NestJS/React imports.
 */
export type BudgetStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export interface BudgetLineItem {
    id?: string;
    accountCode: string;
    accountName: string;
    budgetedAmount: number;
    actualAmount?: number;
    variance?: number;
    variancePct?: number;
    notes?: string;
}
export interface Budget {
    id: string;
    companyId: string;
    name: string;
    period: BudgetPeriod;
    fiscalYear: number;
    status: BudgetStatus;
    totalBudgeted: number;
    totalActual?: number;
    variance?: number;
    startDate: string;
    endDate: string;
    lineItems?: BudgetLineItem[];
    approvedBy?: string;
    approvedAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface BudgetVarianceRow {
    accountCode: string;
    accountName: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePct: number;
    isFavorable: boolean;
}
export interface BudgetVarianceSummary {
    period: string;
    totalBudgeted: number;
    totalActual: number;
    variance: number;
    variancePct: number;
    rows: BudgetVarianceRow[];
}
export interface CreateBudgetDto {
    name: string;
    period: BudgetPeriod;
    fiscalYear: number;
    startDate: string;
    endDate: string;
    notes?: string;
    lineItems?: Omit<BudgetLineItem, 'id' | 'actualAmount' | 'variance' | 'variancePct'>[];
}
export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {
    status?: BudgetStatus;
}
export interface FxRate {
    id?: string;
    companyId?: string;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
    source: 'MANUAL' | 'NBE' | 'IMPORT';
    buyingRate?: number;
    sellingRate?: number;
    createdAt?: string;
}
export interface FxRateQuery {
    fromCurrency?: string;
    toCurrency?: string;
    date?: string;
    page?: number;
    limit?: number;
}
export interface CreateFxRateDto {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
    source?: 'MANUAL' | 'NBE' | 'IMPORT';
    buyingRate?: number;
    sellingRate?: number;
}
export declare function convertCurrency(amount: number, rate: number): number;
export declare function crossRate(rateA_to_base: number, rateB_to_base: number): number;
//# sourceMappingURL=budget.types.d.ts.map