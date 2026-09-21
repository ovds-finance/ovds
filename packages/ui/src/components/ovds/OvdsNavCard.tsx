/**
 * ovdsNavCard — ovds-style navigation card for accounting hub
 * Used in SinglePageAccounting and other hub pages
 * Large icon, label, description, count badge — non-accountant friendly
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ovdsNavCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  count?: number;
  countLabel?: string;
  color: string;       // icon bg e.g. "bg-[var(--pro-azure-50)]"
  iconColor: string;   // icon text e.g. "text-[var(--pro-azure-dark)]"
  active?: boolean;
  badge?: string;
  badgeCls?: string;
  onClick: () => void;
}

export const ovdsNavCard: React.FC<ovdsNavCardProps> = ({
  icon, label, description, count, countLabel,
  color, iconColor, active, badge, badgeCls, onClick,
}) => (
  <button
    onClick={onClick}
    className={[
      'group w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/30',
      active
        ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] shadow-sm'
        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]',
    ].join(' ')}
  >
    {/* Icon */}
    <div className={[
      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150',
      color, iconColor,
      'group-hover:scale-105',
    ].join(' ')}>
      {icon}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[13px] font-bold leading-tight ${active ? 'text-[var(--pro-azure-dark)]' : 'text-slate-800'}`}>
          {label}
        </span>
        {badge && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${badgeCls ?? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">{description}</p>
    </div>

    {/* Count + chevron */}
    <div className="flex items-center gap-1.5 shrink-0">
      {count !== undefined && (
        <span className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-lg ${
          active ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-slate-100 text-slate-500'
        }`}>
          {count > 999 ? '999+' : count}
          {countLabel && <span className="font-normal ml-0.5 text-[9px]">{countLabel}</span>}
        </span>
      )}
      <ChevronRight size={13} className={`transition-transform duration-150 group-hover:translate-x-0.5 ${active ? 'text-[var(--pro-azure)]' : 'text-slate-300'}`} />
    </div>
  </button>
);

export default ovdsNavCard;
