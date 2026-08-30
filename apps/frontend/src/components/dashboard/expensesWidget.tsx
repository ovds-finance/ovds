import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowUpRight, TrendingDown } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useBusiness } from '../../context/businessContext';
import { fmtCompact, fmtCurrency } from '@ovds/ui';

interface Props {
  currency?: string;
}

const ExpensesWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();

  const { data, loading } = useApiQuery<any>(
    `/ovds/invoices/stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 60_000, suppressToast: true }
  );

  const totalBills = data?.totalBills ?? 0;
  const pendingBills = data?.pendingBillsCount ?? 0;
  const overdueBills = data?.overdueBillsCount ?? 0;
  const pct = totalBills > 0 ? Math.min(100, Math.round((overdueBills / (pendingBills || 1)) * 100)) : 0;

  return (
    <div className="ovds-widget-card">
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center">
            <CreditCard size={14} className="text-rose-600" />
          </div>
          <div>
            <h3 className="ovds-card-title">Expenses &amp; Bills</h3>
            <p className="ovds-caption">This period</p>
          </div>
        </div>
        <Link to="/purchases/bills" className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline">
          View bills <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="ovds-widget-body">

      {loading ? (
        <div className="space-y-3">
          <div className="h-8 w-28 bg-slate-100 rounded-lg ovds-shimmer" />
          <div className="h-2 w-full bg-slate-100 rounded-full ovds-shimmer" />
        </div>
      ) : (
        <>
          <div className="flex items-end gap-3 mb-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Bills</p>
              <p className="text-[28px] font-extrabold text-slate-800 tabular-nums leading-none">
                {fmtCompact(totalBills, currency)}
              </p>
            </div>
            <div className="flex items-center gap-1 mb-1 text-rose-500">
              <TrendingDown size={14} />
              <span className="text-[11px] font-semibold">{fmtCompact(overdueBills, currency)} overdue</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Overdue rate</span>
              <span className="font-semibold text-rose-500">{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 dark:border-slate-800">
            <div>
              <p className="ovds-caption mb-0.5">Pending</p>
              <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">{pendingBills}</p>
            </div>
            <div>
              <p className="ovds-caption mb-0.5">Overdue</p>
              <p className="text-[15px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">{overdueBills}</p>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default ExpensesWidget;

