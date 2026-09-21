import { fmtCompact } from '@ovds/ui';
import { PieChart, ArrowUpRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { useApiQuery } from '../../hooks/useApiQuery';


interface Props {
  currency?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#0891b2', '#ec4899'];

const PieBreakdownWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();

  const { data, loading } = useApiQuery<any>(
    `/dashboard/reports${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 60_000, suppressToast: true }
  );

  const categories: { label: string; amount: number }[] =
    data?.expenseBreakdown ?? data?.categoryBreakdown ?? [];

  const total = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="ovds-widget-card">
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
            <PieChart size={14} className="text-violet-600" />
          </div>
          <div>
            <h3 className="ovds-card-title">Expense Breakdown</h3>
            <p className="ovds-caption">By category</p>
          </div>
        </div>
        <Link to="/purchases/expenses" className="flex items-center gap-1 text-[11px] font-semibold text-[var(--pro-azure)] hover:underline">
          All expenses <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="ovds-widget-body">

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-100 ovds-shimmer shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-slate-100 rounded ovds-shimmer" style={{ width: `${60 + i * 7}%` }} />
              </div>
              <div className="h-3 w-14 bg-slate-100 rounded ovds-shimmer" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="ovds-empty">
          <PieChart size={28} className="mb-2 text-slate-200" />
          <p className="text-[12px] font-semibold">No expense data</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {categories.slice(0, 6).map((cat, i) => {
            const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{cat.label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="ovds-caption">{pct}%</span>
                    <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                      {fmtCompact(cat.amount, currency)}
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
          {categories.length > 6 && (
            <p className="ovds-caption text-center pt-1">
              +{categories.length - 6} more categories
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default PieBreakdownWidget;

