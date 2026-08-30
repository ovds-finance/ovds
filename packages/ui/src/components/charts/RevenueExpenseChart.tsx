import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TT_STYLE, AXIS_STYLE } from './shared';

// -- Revenue vs Expenses -------------------------------------------------------
interface RevenueExpenseProps {
  data: { month: string; revenue: number; expenses: number; profit: number }[];
  loading?: boolean;
  currency?: string;
  noCard?: boolean;
}

export const RevenueExpenseChart: React.FC<RevenueExpenseProps> = ({
  data,
  loading,
  currency = 'ETB',
  noCard = false,
}) => {
  const fmt = (v: number) => `${(v / 1000).toFixed(0)}k`;
  return (
    <div className={noCard ? '' : 'bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors'}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider">
            Revenue vs Expenses
          </p>
          <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mt-0.5">
            6-Month Overview · {currency}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Revenue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Expenses
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Profit
          </span>
        </div>
      </div>
      {loading ? (
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E784" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00E784" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:opacity-10" />
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
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#00E784"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#00E784' }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f43f5e' }}
              strokeDasharray="5 3"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#00E784"
              strokeWidth={2}
              dot={{ r: 3, fill: '#00E784' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
