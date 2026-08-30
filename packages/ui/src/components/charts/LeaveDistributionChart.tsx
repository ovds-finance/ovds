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

interface LeaveDistProps {
  data: { type: string; count: number }[];
  loading?: boolean;
}

export const LeaveDistributionChart: React.FC<LeaveDistProps> = ({
  data,
  loading,
}) => (
  <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
    <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider mb-1">
      Leave Distribution
    </p>
    <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mb-4">
      By Type — This Year
    </p>
    {loading ? (
      <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
    ) : (
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="type"
            tick={{ ...AXIS_STYLE, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip {...TT_STYLE} />
          <Bar dataKey="count" fill="#00E784" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);
