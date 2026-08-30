import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TT_STYLE } from './shared';

// -- Invoice Status Donut ------------------------------------------------------
interface InvoiceStatusProps {
  paid: number;
  pending: number;
  overdue: number;
  draft: number;
  loading?: boolean;
}

export const InvoiceStatusChart: React.FC<InvoiceStatusProps> = ({
  paid,
  pending,
  overdue,
  draft,
  loading,
}) => {
  const data = [
    { name: 'Paid', value: paid, color: '#00E784' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Overdue', value: overdue, color: '#f43f5e' },
    { name: 'Draft', value: draft, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const total = paid + pending + overdue + draft;

  return (
    <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
      <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider mb-1">
        Invoice Status
      </p>
      <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mb-4">
        Current Period
      </p>
      {loading ? (
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <PieChart width={100} height={100}>
              <Pie
                data={data}
                cx={48}
                cy={48}
                innerRadius={28}
                outerRadius={44}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-700">{total}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: d.color }}
                />
                <span className="text-[11px] text-slate-500 flex-1">
                  {d.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-700">
                  {d.value}
                </span>
                <span className="text-[10px] text-slate-400">
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
