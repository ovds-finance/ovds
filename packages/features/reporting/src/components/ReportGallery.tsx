import React from 'react';
import { Btn } from '@ovds/ui';
import {
  BarChart3, FileText, TrendingUp, List, ShieldCheck, BookOpen,
  Box, Banknote, Users,
} from 'lucide-react';
import type { ReportCategory, ReportTemplate } from '../types/reporting.types';
import { ALL_TEMPLATES } from '../lib/reportRegistry';

interface Props {
  category: ReportCategory | 'all';
  onSelect: (template: ReportTemplate) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'profit-and-loss': <TrendingUp size={18} />,
  'income-summary': <TrendingUp size={18} />,
  'expense-summary': <List size={18} />,
  'income-expense': <BarChart3 size={18} />,
  'tax-summary': <ShieldCheck size={18} />,
  'double-entry-gl': <BookOpen size={18} />,
  'inventory-valuation': <Box size={18} />,
  'payroll-summary': <Banknote size={18} />,
  'crm-sales': <Users size={18} />,
};

const ACCENTS: Record<string, string> = {
  'profit-and-loss': 'bg-emerald-50 text-emerald-600',
  'income-summary': 'bg-emerald-50 text-emerald-600',
  'expense-summary': 'bg-amber-50 text-amber-600',
  'income-expense': 'bg-sky-50 text-sky-600',
  'tax-summary': 'bg-rose-50 text-rose-600',
  'double-entry-gl': 'bg-violet-50 text-violet-600',
  'inventory-valuation': 'bg-orange-50 text-orange-600',
  'payroll-summary': 'bg-teal-50 text-teal-600',
  'crm-sales': 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]',
};

export default function ReportGallery({ category, onSelect }: Props) {
  const items = React.useMemo(
    () => ALL_TEMPLATES.filter((t) => (category === 'all' ? true : t.category === category)),
    [category],
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No reports in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${ACCENTS[t.id] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {ICON_MAP[t.id] ?? <BarChart3 size={18} />}
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                t.category === 'standard'
                  ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)]'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300'
              }`}
              title={t.category}
            >
              {t.category}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {t.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {t.description}
            </p>
          </div>
          <Btn size="sm" onClick={() => onSelect(t)} className="self-start">
            <FileText size={14} className="mr-1.5" />
            Open report
          </Btn>
        </div>
      ))}
    </div>
  );
}
