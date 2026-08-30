/**
 * ovdsSummaryBar — ovds-style top summary strip
 * Shows income vs expenses as a visual split bar with plain-language labels
 * Designed for non-accountants: "Money In" vs "Money Out"
 */
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

interface ovdsSummaryBarProps {
  moneyIn: number;
  moneyOut: number;
  netProfit: number;
  cashBalance: number;
  currency?: string;
  loading?: boolean;
  period?: string;
}

function fmt(n: number, currency = 'ETB'): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return `${currency} ${n.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export const ovdsSummaryBar: React.FC<ovdsSummaryBarProps> = ({
  moneyIn, moneyOut, netProfit, cashBalance, currency = 'ETB', loading, period,
}) => {
  const total = moneyIn + moneyOut;
  const inPct = total === 0 ? 0 : Math.round((moneyIn / total) * 100);
  const outPct = 100 - inPct;
  const isProfit = netProfit >= 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-slate-100 rounded-full mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h3 className="text-[13px] font-bold text-slate-800">Financial Overview</h3>
          {period && <p className="text-[10px] text-slate-400 mt-0.5">{period}</p>}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
          isProfit
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {isProfit ? 'Profitable' : 'Net Loss'}
        </div>
      </div>

      {/* Split bar — visual income vs expense */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
          <span className="text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Money In ({inPct}%)
          </span>
          <span className="text-rose-500 flex items-center gap-1">
            Money Out ({outPct}%)
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div
            className="bg-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${inPct}%` }}
          />
          <div
            className="bg-rose-400 flex-1 transition-all duration-700 ease-out"
          />
        </div>
      </div>

      {/* 4 KPI cells */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-100">
        {[
          {
            label: 'Money In',
            sublabel: 'Total revenue',
            value: fmt(moneyIn, currency),
            icon: <TrendingUp size={14} />,
            iconCls: 'bg-emerald-50 text-emerald-600',
            valueCls: 'text-emerald-600',
          },
          {
            label: 'Money Out',
            sublabel: 'Total expenses',
            value: fmt(moneyOut, currency),
            icon: <TrendingDown size={14} />,
            iconCls: 'bg-rose-50 text-rose-600',
            valueCls: 'text-rose-600',
          },
          {
            label: 'Net Profit',
            sublabel: isProfit ? 'You\'re in the green' : 'Spending more than earning',
            value: fmt(netProfit, currency),
            icon: isProfit ? <TrendingUp size={14} /> : <AlertCircle size={14} />,
            iconCls: isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
            valueCls: isProfit ? 'text-emerald-600' : 'text-rose-600',
          },
          {
            label: 'Cash Balance',
            sublabel: 'Available in bank',
            value: fmt(cashBalance, currency),
            icon: <Wallet size={14} />,
            iconCls: 'bg-sky-50 text-sky-600',
            valueCls: 'text-sky-600',
          },
        ].map((cell, i) => (
          <div
            key={i}
            className={`p-4 ${i < 3 ? 'border-r border-slate-100' : ''} ${i >= 2 ? 'border-t sm:border-t-0 border-slate-100' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${cell.iconCls} flex items-center justify-center shrink-0`}>
                {cell.icon}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                {cell.label}
              </span>
            </div>
            <p className={`text-[17px] font-bold tabular-nums leading-none ${cell.valueCls}`}>
              {cell.value}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">{cell.sublabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ovdsSummaryBar;
