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

// -- Payroll Comparison --------------------------------------------------------
interface PayrollCompareProps {
  current: {
    label: string;
    gross: number;
    net: number;
    tax: number;
    pension: number;
  };
  previous: {
    label: string;
    gross: number;
    net: number;
    tax: number;
    pension: number;
  };
  loading?: boolean;
  currency?: string;
  noCard?: boolean;
}

export const PayrollCompareChart: React.FC<PayrollCompareProps> = ({
  current,
  previous,
  loading,
  currency = 'ETB',
  noCard = false,
}) => {
  const fmt = (n: number) =>
    `${currency} ${Number(n).toLocaleString('en-ET', { maximumFractionDigits: 0 })}`;
  const data = [
    { name: 'Gross', cur: current.gross, prev: previous.gross },
    { name: 'Net Pay', cur: current.net, prev: previous.net },
    { name: 'Tax', cur: current.tax, prev: previous.tax },
    { name: 'Pension', cur: current.pension, prev: previous.pension },
  ];

  return (
    <div className={noCard ? '' : 'bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors'}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider">
            Payroll Comparison
          </p>
          <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mt-0.5">
            {current.label} vs {previous.label}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--pro-azure)] inline-block" />
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
            Previous
          </span>
        </div>
      </div>
      {loading ? (
        <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
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
              className="dark:opacity-10"
              vertical={false}
            />
            <XAxis
              dataKey="name"
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
              formatter={(v: unknown) => [fmt(v as number), '']}
            />
            <Bar
              dataKey="cur"
              fill="#00E784"
              radius={[4, 4, 0, 0]}
              name="Current"
            />
            <Bar
              dataKey="prev"
              fill="#e2e8f0"
              className="dark:fill-slate-700"
              radius={[4, 4, 0, 0]}
              name="Previous"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
