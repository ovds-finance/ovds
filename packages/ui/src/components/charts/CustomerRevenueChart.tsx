import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from 'recharts';
import { TT_STYLE, AXIS_STYLE, PIE_COLORS } from './shared';

// -- Customer Revenue Bar ------------------------------------------------------
interface CustomerRevenueProps {
  data: { name: string; revenue: number }[];
  currency?: string;
  loading?: boolean;
}

export const CustomerRevenueChart: React.FC<CustomerRevenueProps> = ({ data, currency = 'ETB', loading }) => (
  <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
    <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider mb-1">Top Customers</p>
    <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mb-4">Revenue by Customer</p>
    {loading ? (
      <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    ) : data.length === 0 ? (
      <p className="text-xs text-slate-400 text-center py-6">No invoice data yet</p>
    ) : (
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 9 }} tickLine={false} axisLine={false} width={70} />
          <Tooltip {...TT_STYLE} formatter={(v: unknown) => [`${currency} ${(v as number).toLocaleString('en-ET')}`, '']} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
            {data.slice(0, 6).map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);
