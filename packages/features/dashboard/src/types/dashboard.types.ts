import type { DashboardKpi, TrendPoint } from '@ovds/ui';

export type { DashboardKpi, TrendPoint };

export interface DashboardPageState {
  kpi: DashboardKpi | null;
  trend: TrendPoint[];
  loading: boolean;
  error: string | null;
}

export const initialDashboardState: DashboardPageState = {
  kpi: null,
  trend: [],
  loading: false,
  error: null,
};
