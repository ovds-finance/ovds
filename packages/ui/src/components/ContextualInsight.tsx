/**
 * ContextualInsight — inline AI-style insight chip.
 *
 * Surfaces a short, actionable observation directly inside a widget or card.
 * Designed for minimal cognitive load: one sentence, one optional action.
 *
 * Usage:
 *   <ContextualInsight text="Payroll costs rose 12% vs last month." />
 *   <ContextualInsight variant="warning" text="3 invoices overdue by 7+ days." action={{ label: 'Review', onClick: ... }} />
 */
import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Info, ArrowRight } from 'lucide-react';

export type InsightVariant = 'info' | 'warning' | 'positive' | 'neutral';

export interface ContextualInsightProps {
  text: string;
  variant?: InsightVariant;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const VARIANT_CONFIG: Record<InsightVariant, { icon: React.ReactNode; cls: string }> = {
  info: {
    icon: <Info size={11} />,
    cls: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-900/50 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  },
  warning: {
    icon: <AlertTriangle size={11} />,
    cls: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-300',
  },
  positive: {
    icon: <TrendingUp size={11} />,
    cls: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 border-[var(--pro-azure-100)] dark:border-green-900/50 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
  },
  neutral: {
    icon: <Lightbulb size={11} />,
    cls: 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  },
};

export const ContextualInsight: React.FC<ContextualInsightProps> = ({
  text,
  variant = 'neutral',
  action,
  className = '',
}) => {
  const { icon, cls } = VARIANT_CONFIG[variant];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium leading-snug animate-in fade-in duration-300 ${cls} ${className}`}>
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="flex-1">{text}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="shrink-0 flex items-center gap-0.5 font-bold opacity-70 hover:opacity-100 transition-opacity underline underline-offset-2"
        >
          {action.label}
          <ArrowRight size={9} />
        </button>
      )}
    </div>
  );
};

export default ContextualInsight;
