import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TT_STYLE, AXIS_STYLE } from './shared';

// -- Cash Flow Chart -----------------------------------------------------------
interface CashFlowChartProps {
  data: { month: string; inflow: number; outflow: number; net: number }[];
  loading?: boolean;
  currency?: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  loading,
  currency = 'ETB',
}) => {
  const fmt = (v: number) => `${(v / 1000).toFixed(0)}k`;
  return (
    <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider">
            Cash Flow
          </p>
          <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mt-0.5">
            Inflow vs Outflow · {currency}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Inflow
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Outflow
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Net
          </span>
        </div>
      </div>
      {loading ? (
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={fmt}
            />
            <Tooltip
              {...TT_STYLE}
              formatter={(v: unknown) => [
                `${currency} ${(v as number).toLocaleString('en-ET')}`,
                '',
              ]}
            />
            <Bar
              dataKey="inflow"
              fill="#00E784"
              radius={[4, 4, 0, 0]}
              name="Inflow"
            />
            <Bar
              dataKey="outflow"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
              name="Outflow"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#00E784"
              strokeWidth={2}
              dot={{ r: 3, fill: '#00E784' }}
              name="Net"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
