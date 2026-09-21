/**
 * CashForecastChart — 6-month cash flow projection chart.
 *
 * Fetches saved forecasts from /ovds/treasury/forecasts and renders
 * a Recharts AreaChart with projected, low, and high bands.
 * Falls back gracefully when no forecast data is available.
 *
 * Uses the project's standard patterns:
 *  - useApiQuery for data fetching (not @tanstack/react-query)
 *  - recharts (already in package.json, not @nivo/line)
 *  - fmtCompact for axis labels
 */
import { Skeleton } from '@ovds/ui';
import { TrendingUp, AlertCircle } from 'lucide-react';
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

import { useApiQuery } from '../hooks/useApiQuery';
import { fmtCompact } from '../utils/fmt';


interface ForecastPoint {
  period: string;
  projected: number;
  low: number;
  high: number;
  confidence: number;
}

const TT = {
  contentStyle: {
    background: 'var(--bg-sidebar, #1e293b)',
    border: 'none',
    borderRadius: 10,
    fontSize: 11,
    color: '#fff',
    padding: '8px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  itemStyle: { color: '#cbd5e1' },
  labelStyle: { color: '#fff', fontWeight: 700 },
};

const CashForecastChart: React.FC = () => {
  const { data: raw, loading, error } = useApiQuery<any>(
    '/ovds/treasury/forecasts',
    {
      staleTime: 60_000,
      suppressToast: true,
      select: (r) => r?.data ?? r,
    },
  );

  // Normalise: API may return array or { data: [...] }
  const forecasts: ForecastPoint[] = React.useMemo(() => {
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return arr.map((f: any) => ({
      period:     f.period ?? f.month ?? '—',
      projected:  Number(f.projected ?? f.net ?? 0),
      low:        Number(f.low  ?? (f.projected != null ? f.projected * 0.85 : 0)),
      high:       Number(f.high ?? (f.projected != null ? f.projected * 1.15 : 0)),
      confidence: Number(f.confidence ?? 75),
    }));
  }, [raw]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Cash Forecast Trend</h3>
        </div>
        <Skeleton.Card className="h-64" />
      </div>
    );
  }

  if (error || forecasts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Cash Forecast Trend</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
          <AlertCircle size={32} className="opacity-30" />
          <p className="text-sm font-medium">No forecast data available</p>
          <p className="text-xs text-slate-400">Generate a forecast from the Treasury Forecast page</p>
        </div>
      </div>
    );
  }

  const avgConfidence = Math.round(
    forecasts.reduce((s, f) => s + f.confidence, 0) / forecasts.length,
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl flex items-center justify-center">
            <TrendingUp size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cash Forecast Trend</h3>
            <p className="ovds-caption">
              {forecasts.length}-period projection · {avgConfidence}% confidence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--pro-azure-50)]0 inline-block" />
            Projected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/30 inline-block" />
            Range
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={forecasts} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="cfProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00E784" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00E784" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cfRange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00E784" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#00E784" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtCompact(v)}
          />
          <Tooltip
            {...TT}
            formatter={(v: unknown, name: string | number | undefined) => [
              `ETB ${Number(v).toLocaleString('en-ET')}`,
              name === 'high' ? 'High' : name === 'low' ? 'Low' : 'Projected',
            ]}
          />
          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="4 2" />
          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="high"
            stroke="none"
            fill="url(#cfRange)"
            fillOpacity={1}
            name="high"
          />
          <Area
            type="monotone"
            dataKey="low"
            stroke="none"
            fill="#fff"
            fillOpacity={1}
            name="low"
          />
          {/* Projected line */}
          <Area
            type="monotone"
            dataKey="projected"
            stroke="#00E784"
            strokeWidth={2.5}
            fill="url(#cfProjected)"
            dot={{ r: 3.5, fill: '#00E784', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#00E784' }}
            name="projected"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Footer note */}
      <p className="text-[10px] text-slate-400 mt-3">
        IAS 7.48 — Forecast based on trailing 6-month cash flow data. Range shows ±15% sensitivity band.
      </p>
    </div>
  );
};

export { CashForecastChart };
export default CashForecastChart;






