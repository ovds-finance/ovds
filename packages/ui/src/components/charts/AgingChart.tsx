import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TT_STYLE, AXIS_STYLE } from './shared';

// -- AR / AP Aging Bar ---------------------------------------------------------
interface AgingChartProps {
  data: { bucket: string; ar: number; ap: number }[];
  loading?: boolean;
  currency?: string;
}

export const AgingChart: React.FC<AgingChartProps> = ({
  data,
  loading,
  currency = 'ETB',
}) => (
  <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider">
          AR / AP Aging
        </p>
        <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mt-0.5">
          Outstanding by Age Bucket
        </p>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-bold">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--pro-azure)] inline-block" />
          AR
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          AP
        </span>
      </div>
    </div>
    {loading ? (
      <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
    ) : (
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="bucket"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            {...TT_STYLE}
            formatter={(v: unknown) => [
              `${currency} ${(v as number).toLocaleString('en-ET')}`,
              '',
            ]}
          />
          <Bar dataKey="ar" fill="#00E784" radius={[4, 4, 0, 0]} name="AR" />
          <Bar dataKey="ap" fill="#f43f5e" radius={[4, 4, 0, 0]} name="AP" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);
