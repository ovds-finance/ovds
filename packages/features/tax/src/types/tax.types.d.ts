/**
 * @ovds/features/tax types
 *
 * Shared TypeScript interfaces for the tax domain.
 */
export interface TotCalculation {
    period: string;
    goodsAmount: number;
    servicesAmount: number;
    totGoods: number;
    totServices: number;
    netPayable: number;
}
export interface TotFiling extends TotCalculation {
    id: string;
    paid: number;
    status: 'DRAFT' | 'PENDING' | 'PAID' | 'FILED' | 'OVERDUE';
    filedAt?: string;
    dueDate?: string;
    eTaxReference?: string;
    notes?: string;
    createdAt: string;
}
export interface TaxAutomationStatus {
    period: string;
    vatAutoComputed: boolean;
    vatFilingStatus: 'NONE' | 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'FILED' | 'PAID' | 'OVERDUE' | 'ZERO_DECLARATION';
    isZeroDeclaration: boolean;
    totApplicable: boolean;
    totFilingStatus: 'NONE' | 'DRAFT' | 'PENDING' | 'PAID' | 'FILED' | 'OVERDUE';
    vatThresholdPct: number;
    overdueCount: number;
    nextDeadlines: Array<{
        type: 'VAT' | 'TOT' | 'WHT' | 'BIT' | 'DRRF' | 'BIT_Q1' | 'BIT_Q2' | 'BIT_Q3' | 'BIT_Q4';
        label: string;
        deadline: string;
        daysLeft: number;
        isOverdue: boolean;
    }>;
}
//# sourceMappingURL=tax.types.d.ts.map