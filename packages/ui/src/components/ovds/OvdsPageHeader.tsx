/**
 * ovdsPageHeader — ovds-style page header for all ovds pages
 * Consistent sticky header with icon, title, subtitle, tab bar, and actions
 * Used by: Invoices, Bills, Expenses, Vendors, Customers, Items, etc.
 */
import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface ovdsTab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badge?: string;
  badgeCls?: string;
}

interface ovdsPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;       // e.g. "bg-[var(--pro-azure)]"
  actions?: React.ReactNode;
  tabs?: ovdsTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  badge?: React.ReactNode;
  /** Extra content below the title row, above tabs */
  extra?: React.ReactNode;
}

export const OvdsPageHeader: React.FC<ovdsPageHeaderProps> = ({
  title, subtitle, icon, iconBg = 'bg-[var(--pro-azure)]',
  actions, tabs, activeTab, onTabChange, onRefresh, loading, badge, extra,
}) => (
  <div className="bg-white border-b border-slate-100 px-4 sm:px-5 pt-4 pb-0 sticky top-0 z-10">
    {/* Title row */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-2xl ${iconBg} shadow-sm flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[16px] font-bold text-slate-900 tracking-tight leading-tight truncate">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
        {actions}
      </div>
    </div>

    {/* Extra content (e.g. KPI strip) */}
    {extra && <div className="mb-3">{extra}</div>}

    {/* Tab bar */}
    {tabs && tabs.length > 0 && (
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-none -mb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-semibold border-b-2 whitespace-nowrap transition-all shrink-0',
              activeTab === tab.id
                ? 'border-[var(--pro-azure)] text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)]/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200',
            ].join(' ')}
          >
            {tab.icon && (
              <span className={activeTab === tab.id ? 'text-[var(--pro-azure-dark)]' : 'text-slate-400'}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none ${
                activeTab === tab.id
                  ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count > 999 ? '999+' : tab.count}
              </span>
            )}
            {tab.badge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide ${tab.badgeCls ?? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default OvdsPageHeader;
