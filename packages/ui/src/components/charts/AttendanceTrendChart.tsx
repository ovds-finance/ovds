import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TT_STYLE, AXIS_STYLE } from './shared';

// -- Attendance Trend ----------------------------------------------------------
interface AttendanceTrendProps {
  data: { date: string; present: number; late: number; absent: number }[];
  loading?: boolean;
  noCard?: boolean;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendProps> = ({
  data,
  loading,
  noCard = false,
}) => (
  <div className={noCard ? '' : 'bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors'}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider">
          Attendance Trend
        </p>
        <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mt-0.5">
          Last 14 Days
        </p>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-bold">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--pro-azure)] inline-block" />
          Present
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Late
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          Absent
        </span>
      </div>
    </div>
    {loading ? (
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
    ) : (
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E784" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00E784" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:opacity-10" />
          <XAxis
            dataKey="date"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <Tooltip {...TT_STYLE} />
          <Area
            type="monotone"
            dataKey="present"
            stroke="#00E784"
            strokeWidth={2}
            fill="url(#gPresent)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="late"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gLate)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="absent"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="none"
            dot={false}
            strokeDasharray="4 2"
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </div>
);
