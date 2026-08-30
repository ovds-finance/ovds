import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui';

interface OvdsSummaryProps {
  revenue: number;
  expenses: number;
  profit: number;
  currency?: string;
  loading?: boolean;
}

const OvdsSummary: React.FC<OvdsSummaryProps> = ({
  revenue = 0,
  expenses = 0,
  profit = 0,
  currency = 'ETB',
  loading = false,
}) => {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

  const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const cards = [
    {
      label: 'Revenue',
      value: fmt(revenue),
      icon: 'TRENDING_UP',
      color: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Expenses',
      value: fmt(expenses),
      icon: 'TRENDING_DOWN',
      color: 'rose',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-100 dark:border-rose-900/30',
      text: 'text-rose-700 dark:text-rose-400',
    },
    {
      label: 'Profit',
      value: fmt(profit),
      icon: 'WALLET',
      color: profit >= 0 ? 'violet' : 'amber',
      bg: profit >= 0 ? 'bg-violet-50 dark:bg-violet-950/20' : 'bg-amber-50 dark:bg-amber-950/20',
      border: profit >= 0 ? 'border-violet-100 dark:border-violet-900/30' : 'border-amber-100 dark:border-amber-900/30',
      text: profit >= 0 ? 'text-violet-700 dark:text-violet-400' : 'text-amber-700 dark:text-amber-400',
      sub: `${profitMargin}% margin`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`${card.bg} ${card.border} border rounded-xl p-4 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
              <Icon name={card.icon} size={16} className={card.text} />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ) : (
            <>
              <p className={`text-2xl font-extrabold tabular-nums ${card.text}`}>{card.value}</p>
              {card.sub && (
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{card.sub}</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default OvdsSummary;
