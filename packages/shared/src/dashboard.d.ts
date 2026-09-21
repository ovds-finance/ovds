export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export interface Alert {
    id: string;
    severity: AlertSeverity;
    title: string;
    detail: string;
    actionTo?: string;
    actionLabel?: string;
    domain: string;
    /** ISO timestamp when the alert was created */
    createdAt?: string;
    /** Mark as dismissed in local state */
    dismissed?: boolean;
}
export interface StrategicInsights {
    projectedPayrollNextMonth: number;
    absenteeismPredictionRate: number;
    efficiencyScoreByDept: Array<{
        department: string;
        score: number;
    }>;
    complianceHealth: {
        missingBankDetails: number;
        unconfiguredPayroll: number;
        pendingReimbursements: number;
        unpaidInvoices: number;
        vatThresholdStatus?: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
        /** 'A' = annual revenue > 1,000,000 ETB (VAT mandatory); 'B' = below */
        taxpayerCategory?: 'A' | 'B';
        matApplies?: boolean;
        vatRegistrationRequired?: boolean;
    };
    resourceUtilizationTrend: 'UP' | 'DOWN' | 'STABLE';
    taxCompliance?: {
        annualRevenue: number;
        vatThresholdPct: number;
        /** 'A' = annual revenue > 1,000,000 ETB; 'B' = below */
        taxpayerCategory: 'A' | 'B';
        matPayable: number;
        vatThresholdStatus: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
    };
}
export interface DashboardKpi {
    /** Total revenue in current period */
    revenue: number;
    /** Total expenses in current period */
    expenses: number;
    /** Net profit/loss (revenue - expenses) */
    netProfit: number;
    /** Outstanding receivables */
    receivables: number;
    /** Outstanding payables */
    payables: number;
    /** Current cash balance across all bank accounts */
    cashBalance: number;
    /** Number of unpaid/overdue invoices */
    overdueInvoices: number;
    /** Number of overdue bills */
    overdueBills: number;
    /** Total active employees */
    employees: number;
    /** Period label e.g. "Jun 2026" */
    period: string;
}
export interface TrendPoint {
    /** Month label e.g. "Jan", "Feb" */
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}
/** Canonical period types used across reports and filters */
export type ReportPeriodType = 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'LAST_QUARTER' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM';
/** Date range resolved from a ReportPeriodType */
export interface ResolvedPeriod {
    from: Date;
    to: Date;
    label: string;
    period: string;
}
/** Resolve a ReportPeriodType to absolute date range */
export declare function resolveReportPeriod(type: ReportPeriodType, customFrom?: Date, customTo?: Date): ResolvedPeriod;
//# sourceMappingURL=dashboard.d.ts.map