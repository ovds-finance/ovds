import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { TT_STYLE, PIE_COLORS } from './shared';

// -- Department Headcount Pie --------------------------------------------------
interface DeptPieProps {
  data: { name: string; count: number }[];
  loading?: boolean;
}

export const DepartmentPieChart: React.FC<DeptPieProps> = ({
  data,
  loading,
}) => (
  <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
    <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider mb-1">
      Headcount by Department
    </p>
    <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mb-4">
      Employee Distribution
    </p>
    {loading ? (
      <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
    ) : (
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx={55}
              cy={55}
              innerRadius={32}
              outerRadius={52}
              dataKey="count"
              strokeWidth={2}
              stroke="#fff"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...TT_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.slice(0, 6).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-[11px] text-slate-600 font-medium truncate flex-1">
                {d.name}
              </span>
              <span className="text-[11px] font-semibold text-slate-700">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
