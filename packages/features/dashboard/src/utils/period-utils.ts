export function formatDashboardPeriod(period: string): string {
  const labels: Record<string, string> = {
    THIS_MONTH: 'This Month',
    LAST_MONTH: 'Last Month',
    THIS_QUARTER: 'This Quarter',
    LAST_QUARTER: 'Last Quarter',
    THIS_YEAR: 'This Year',
    LAST_YEAR: 'Last Year',
    CUSTOM: 'Custom',
  };
  return labels[period] ?? period;
}

export function calculateTrendDirection(trend: { revenue: number }[]): 'up' | 'down' | 'stable' {
  if (trend.length < 2) return 'stable';
  const first = trend[0].revenue;
  const last = trend[trend.length - 1].revenue;
  const diff = ((last - first) / first) * 100;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}
