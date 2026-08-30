/**
 * DashboardTrendChart — isolated recharts component for the Dashboard 7-day trend.
 *
 * Kept in its own file so it can be lazy-loaded, preventing recharts (and its
 * bundled d3 dependencies) from being included in the initial Dashboard chunk.
 */
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export interface DashboardTrendChartProps {
  data: Array<{ day: string; value: number }>;
  total: string;
  title: string;
}

const DashboardTrendChart: React.FC<DashboardTrendChartProps> = ({ data, total, title }) => (
  <div className="ovds-widget-card">
    <div className="ovds-widget-header">
      <h3 className="ovds-card-title">{title}</h3>
      <div className="text-right">
        <p className="text-[18px] font-bold text-slate-800 dark:text-slate-100 tabular-nums">{total}</p>
        <p className="ovds-caption">7-day total</p>
      </div>
    </div>
    <div className="ovds-widget-body !pt-2">
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E784" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00E784" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11, color: '#fff', padding: '6px 10px' }}
          labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
          itemStyle={{ color: '#00E784' }}
          cursor={{ stroke: '#00E784', strokeWidth: 1, strokeDasharray: '4 2' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#00E784"
          strokeWidth={2.5}
          fill="url(#trendGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#00E784', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  </div>
);

export default DashboardTrendChart;

