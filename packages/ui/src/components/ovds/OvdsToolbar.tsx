/**
 * ovdsToolbar — ovds-style search + filter toolbar
 * Consistent across all ovds list pages
 * Includes: search, status pills, date range, export, column toggle
 */
import React from 'react';
import { Search, X, Download, SlidersHorizontal, Calendar } from 'lucide-react';

interface StatusPill {
  id: string;
  label: string;
  count?: number;
  color?: string; // dot color class e.g. "bg-[var(--pro-azure)]"
}

interface ovdsToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  statusPills?: StatusPill[];
  activeStatus?: string;
  onStatusChange?: (id: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFrom?: (v: string) => void;
  onDateTo?: (v: string) => void;
  onExport?: () => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export const OvdsToolbar: React.FC<ovdsToolbarProps> = ({
  search, onSearch, searchPlaceholder = 'Search…',
  statusPills, activeStatus, onStatusChange,
  dateFrom, dateTo, onDateFrom, onDateTo,
  onExport, onClearFilters, hasActiveFilters,
  extra, children,
}) => (
  <div className="bg-white border-b border-slate-100 px-4 sm:px-5 py-3 space-y-2.5">
    {/* Row 1: search + actions */}
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] focus:bg-white transition-all"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Date range */}
      {onDateFrom && onDateTo && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <Calendar size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFrom ?? ''}
              onChange={e => onDateFrom(e.target.value)}
              className="pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600
                         focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all w-[130px]"
            />
          </div>
          <span className="text-slate-300 text-[10px]">–</span>
          <input
            type="date"
            value={dateTo ?? ''}
            onChange={e => onDateTo(e.target.value)}
            className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600
                       focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all w-[130px]"
          />
        </div>
      )}

      {/* Export */}
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600
                     hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
        >
          <Download size={12} />
          Export
        </button>
      )}

      {/* Clear filters */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-2.5 py-2 text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition-colors shrink-0"
        >
          <X size={11} /> Clear
        </button>
      )}

      {extra}
    </div>

    {/* Row 2: status pills */}
    {statusPills && statusPills.length > 0 && (
      <div className="flex items-center gap-1.5 flex-wrap">
        {statusPills.map(pill => (
          <button
            key={pill.id}
            onClick={() => onStatusChange?.(pill.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all',
              activeStatus === pill.id
                ? 'bg-[var(--pro-azure)] text-white shadow-sm shadow-[var(--pro-azure)]/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {pill.color && (
              <span className={`w-1.5 h-1.5 rounded-full ${
                activeStatus === pill.id ? 'bg-white/70' : pill.color
              }`} />
            )}
            {pill.label}
            {pill.count !== undefined && (
              <span className={`px-1 py-0.5 rounded-full text-[9px] font-bold leading-none ${
                activeStatus === pill.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
              }`}>
                {pill.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )}

    {/* Extra children (e.g. category chips) */}
    {children}
  </div>
);

export default OvdsToolbar;
