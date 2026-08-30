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
  efficiencyScoreByDept: Array<{ department: string; score: number }>;
  complianceHealth: {
    missingBankDetails: number;
    unconfiguredPayroll: number;
    pendingReimbursements: number;
    unpaidInvoices: number;
    // Ethiopian tax compliance
    vatThresholdStatus?: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
    /** 'A' = annual revenue > 1,000,000 ETB (VAT mandatory); 'B' = below */
    taxpayerCategory?: 'A' | 'B';
    matApplies?: boolean;
    vatRegistrationRequired?: boolean;
  };
  resourceUtilizationTrend: 'UP' | 'DOWN' | 'STABLE';
  // Ethiopian compliance summary
  taxCompliance?: {
    annualRevenue: number;
    vatThresholdPct: number;
    /** 'A' = annual revenue > 1,000,000 ETB; 'B' = below */
    taxpayerCategory: 'A' | 'B';
    matPayable: number;
    vatThresholdStatus: 'BELOW' | 'APPROACHING' | 'EXCEEDED';
  };
}

// -- Dashboard KPI snapshot -----------------------------------------------------
export interface DashboardKpi {
  /** Total revenue in current period */
  revenue:          number;
  /** Total expenses in current period */
  expenses:         number;
  /** Net profit/loss (revenue - expenses) */
  netProfit:        number;
  /** Outstanding receivables */
  receivables:      number;
  /** Outstanding payables */
  payables:         number;
  /** Current cash balance across all bank accounts */
  cashBalance:      number;
  /** Number of unpaid/overdue invoices */
  overdueInvoices:  number;
  /** Number of overdue bills */
  overdueBills:     number;
  /** Total active employees */
  employees:        number;
  /** Period label e.g. "Jun 2026" */
  period:           string;
}

// -- Trend data point ----------------------------------------------------------
export interface TrendPoint {
  /** Month label e.g. "Jan", "Feb" */
  month:    string;
  revenue:  number;
  expenses: number;
  profit:   number;
}

// -- Report period helpers -----------------------------------------------------

/** Canonical period types used across reports and filters */
export type ReportPeriodType =
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'LAST_QUARTER'
  | 'THIS_YEAR'
  | 'LAST_YEAR'
  | 'CUSTOM';

/** Date range resolved from a ReportPeriodType */
export interface ResolvedPeriod {
  from:   Date;
  to:     Date;
  label:  string;
  period: string; // YYYY-MM
}

/** Resolve a ReportPeriodType to absolute date range */
export function resolveReportPeriod(
  type: ReportPeriodType,
  customFrom?: Date,
  customTo?:   Date,
): ResolvedPeriod {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();

  switch (type) {
    case 'THIS_MONTH':
      return {
        from:   new Date(y, m, 1),
        to:     new Date(y, m + 1, 0, 23, 59, 59),
        label:  now.toLocaleDateString('en-ET', { month: 'long', year: 'numeric' }),
        period: `${y}-${String(m + 1).padStart(2, '0')}`,
      };
    case 'LAST_MONTH': {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      return {
        from:   new Date(ly, lm, 1),
        to:     new Date(ly, lm + 1, 0, 23, 59, 59),
        label:  new Date(ly, lm, 1).toLocaleDateString('en-ET', { month: 'long', year: 'numeric' }),
        period: `${ly}-${String(lm + 1).padStart(2, '0')}`,
      };
    }
    case 'THIS_QUARTER': {
      const qStart = Math.floor(m / 3) * 3;
      return {
        from:  new Date(y, qStart, 1),
        to:    new Date(y, qStart + 3, 0, 23, 59, 59),
        label: `Q${Math.floor(m / 3) + 1} ${y}`,
        period: `${y}-${String(qStart + 1).padStart(2, '0')}`,
      };
    }
    case 'LAST_QUARTER': {
      const qStart = (Math.floor(m / 3) - 1 + 4) % 4 * 3;
      const qy     = m < 3 ? y - 1 : y;
      return {
        from:  new Date(qy, qStart, 1),
        to:    new Date(qy, qStart + 3, 0, 23, 59, 59),
        label: `Q${Math.floor(qStart / 3) + 1} ${qy}`,
        period: `${qy}-${String(qStart + 1).padStart(2, '0')}`,
      };
    }
    case 'THIS_YEAR':
      return {
        from:   new Date(y, 0, 1),
        to:     new Date(y, 11, 31, 23, 59, 59),
        label:  String(y),
        period: `${y}-01`,
      };
    case 'LAST_YEAR':
      return {
        from:   new Date(y - 1, 0, 1),
        to:     new Date(y - 1, 11, 31, 23, 59, 59),
        label:  String(y - 1),
        period: `${y - 1}-01`,
      };
    case 'CUSTOM':
      return {
        from:   customFrom ?? new Date(y, m, 1),
        to:     customTo   ?? new Date(),
        label:  'Custom Range',
        period: `${y}-${String(m + 1).padStart(2, '0')}`,
      };
  }
}
