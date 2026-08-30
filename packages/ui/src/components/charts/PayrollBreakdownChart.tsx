import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { TT_STYLE } from './shared';

// -- Payroll Breakdown Donut ---------------------------------------------------
interface PayrollBreakdownProps {
  gross: number;
  net: number;
  tax: number;
  pension: number;
  loans: number;
  currency?: string;
  loading?: boolean;
}

export const PayrollBreakdownChart: React.FC<PayrollBreakdownProps> = ({
  gross, net, tax, pension, loans, currency = 'ETB', loading,
}) => {
  const data = [
    { name: 'Net Pay', value: net, color: '#00E784' },
    { name: 'Income Tax', value: tax, color: '#f43f5e' },
    { name: 'Pension (7%)', value: pension, color: '#8b5cf6' },
    { name: 'Loan Repayments', value: loans, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const fmt = (n: number) => `${currency} ${n.toLocaleString('en-ET', { maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl border border-ovds-border dark:border-ovds-muted-dark shadow-sm p-5 transition-colors">
      <p className="text-[10px] font-semibold text-ovds-text-subtle uppercase tracking-wider mb-1">Payroll Breakdown</p>
      <p className="text-sm font-semibold text-ovds-text-main dark:text-ovds-surface mb-4">Gross Allocation — Current Month</p>
      {loading ? (
        <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      ) : gross === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No payroll data yet</p>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <PieChart width={110} height={110}>
              <Pie data={data} cx={53} cy={53} innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={2} stroke="#fff">
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip {...TT_STYLE} formatter={(v: unknown) => [fmt(v as number), '']} />
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Gross</span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{(gross / 1000).toFixed(0)}k</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5 min-w-0">
            {data.map(d => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    {gross > 0 ? Math.round((d.value / gross) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${gross > 0 ? (d.value / gross) * 100 : 0}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
