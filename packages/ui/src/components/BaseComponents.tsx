/**
 * BaseComponents — ovds-style shared UI primitives
 * Pure white background · indigo text · White-blue icons · Times New Roman
 * Single source of truth — no duplication across pages
 * Ethiopian IFRS + ERCA tax compliance
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { EmptyState } from './EmptyState';

// -- Design tokens -------------------------------------------------------------
export const tk = {
  // Surfaces — pure white (60% neutral) + dark equivalents
  card:    'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)]',
  cardHov: 'hover:shadow-[0_4px_16px_0_rgb(85_110_230/0.08)] dark:hover:shadow-[0_4px_16px_0_rgb(0_0_0/0.16)] hover:-translate-y-0.5 transition-all duration-150',
  // Buttons (10% accent)
  btn:     'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
  btnPrimary:   'bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
  btnSecondary: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:hover:border-[var(--pro-azure)] dark:hover:text-[var(--pro-azure)]',
  btnDanger:    'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-medium hover:bg-rose-100 dark:hover:bg-rose-950/50',
  // Form
  input:   'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--pro-azure)] focus:border-[var(--pro-azure)] dark:focus:ring-[var(--pro-azure)]/30 dark:focus:border-[var(--pro-azure)] transition-all',
  label:   'block text-[11px] font-bold text-gray-900 dark:text-slate-300 mb-1 uppercase tracking-wide',
  // Table (30% secondary surfaces)
  badge:   'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
  th:      'px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-500 bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800',
  td:      'px-3 py-2.5 text-[12px] text-gray-900 dark:text-slate-200 font-semibold border-b border-slate-100 dark:border-slate-800/60',
  // Icons — green background, white icon inside (Ovds SaaS primary accent)
  iconBox:     'w-8 h-8 rounded-lg flex items-center justify-center shadow-sm',
  iconBlue:    'bg-[var(--pro-azure)] text-white',
  iconBlueSm:  'bg-[var(--pro-azure)] text-white',
  iconindigo: 'bg-[var(--pro-azure)]/10 text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure)]/20 dark:text-[var(--pro-azure-light)] border border-[var(--pro-azure)]/20 dark:border-[var(--pro-azure)]/30',
  iconAmber:   'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800',
  iconViolet:  'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800',
  iconRose:    'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800',
  iconSlate:   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
};

// -- BlueIcon (Standardized Brand Icon) — now uses Ovds SaaS green ---------
export const BlueIcon: React.FC<{ icon: React.ReactNode; size?: 'sm' | 'md' | 'lg'; variant?: 'primary' | 'info' | 'blue' }> = ({
  icon, size = 'md', variant = 'blue'
}) => {
  const sizeMap = {
    sm: 'w-6 h-6 rounded-lg',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-10 h-10 rounded-xl',
  };
  // All variants map to the Ovds SaaS green primary
  const colorMap = {
    primary: 'bg-[var(--pro-azure)] text-white',
    info:    'bg-[var(--pro-azure)] text-white',
    blue:    'bg-[var(--pro-azure)] text-white',
  };
  return (
    <div className={`${sizeMap[size]} ${colorMap[variant]} flex items-center justify-center shadow-sm shrink-0 transition-all duration-200`}>
      {icon}
    </div>
  );
};

// -- BaseForm ------------------------------------------------------------------
interface BaseFormProps {
  title?: string;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
  onCancel?: () => void;
}

export const BaseForm: React.FC<BaseFormProps> = ({
  title, onSubmit, loading, children, submitLabel = 'Save', onCancel,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {title && <h3 className="text-[13px] font-bold text-slate-800 mb-4">{title}</h3>}
    <div className="space-y-3">
      {children}
    </div>
    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
      {onCancel && (
        <Btn variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Btn>
      )}
      <Btn variant="primary" type="submit" loading={loading}>
        {submitLabel}
      </Btn>
    </div>
  </form>
);

// -- BaseTable -----------------------------------------------------------------
interface BaseTableColDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface BaseTableProps<T> {
  cols: BaseTableColDef<T>[];
  rows: T[];
  loading?: boolean;
  emptyLabel?: string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}

export function BaseTable<T extends Record<string, any>>({
  cols, rows, loading, emptyLabel, onRowClick, actions,
}: BaseTableProps<T>) {
  return (
    <div className={tk.card}>
      <SimpleTable
        cols={cols}
        rows={rows}
        loading={loading}
        onRowClick={onRowClick}
        actions={actions}
        empty={
          <EmptyState
            icon={<AlertCircle size={20} />}
            title={emptyLabel ?? "No data available"}
            desc="No records match your current filters."
          />
        }
      />
    </div>
  );
}

// -- PageShell -----------------------------------------------------------------
interface PageShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: { key: string; label: string; count?: number; icon?: React.ReactNode }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title, subtitle, icon, actions, tabs, activeTab, onTabChange, children,
}) => (
  <div className="min-h-full bg-white dark:bg-slate-950">
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-4 pb-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure)] shadow-sm flex items-center justify-center text-white shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 leading-tight">{title}</h1>
            {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {tabs && (
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className={[
                'flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold border-b-2 whitespace-nowrap transition-all',
                activeTab === tab.key
                  ? 'border-[var(--pro-azure)] text-gray-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600',
              ].join(' ')}
            >
              {tab.icon && (
                <span className={`transition-colors ${activeTab === tab.key ? 'text-[var(--pro-azure)]' : 'text-slate-400 dark:text-slate-500'}`}>
                  {React.cloneElement(tab.icon as React.ReactElement<{ size?: number }>, { size: 14 })}
                </span>
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  activeTab === tab.key
                    ? 'bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// -- KpiStrip -----------------------------------------------------------------
interface KpiItem {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  iconCls?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendVal?: string;
  color?: 'indigo' | 'rose' | 'amber' | 'sky' | 'violet';
}

export const KpiStrip: React.FC<{ items: KpiItem[]; cols?: number }> = ({ items, cols }) => (
  <div
    className="grid bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)] mb-4"
    style={{ gridTemplateColumns: `repeat(${cols ?? items.length}, minmax(0,1fr))` }}
  >
    {items.map((item, i) => {
      const colorMap: Record<string, string> = {
        indigo: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
        rose:    'text-rose-600 dark:text-rose-400',
        amber:   'text-amber-600 dark:text-amber-400',
        sky:     'text-sky-600 dark:text-sky-400',
        violet:  'text-violet-600 dark:text-violet-400',
      };
      const valColor = colorMap[item.color ?? 'indigo'] ?? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]';
      return (
        <div
          key={i}
          className={`p-3 ${i < items.length - 1 ? 'border-r border-slate-100 dark:border-slate-800' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
            {item.icon && (
              <span className={`w-6 h-6 rounded-md flex items-center justify-center ${item.iconCls ?? 'bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'}`}>
                {item.icon}
              </span>
            )}
          </div>
          <p className={`text-[18px] font-bold leading-none ${valColor} tabular-nums`}>{item.value}</p>
          {(item.sub || item.trendVal) && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              {item.trendVal && (
                <span className={item.trend === 'up' ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : item.trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}>
                  {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} {item.trendVal}
                </span>
              )}
              {item.sub}
            </p>
          )}
        </div>
      );
    })}
  </div>
);

// -- SimpleTable (internal — used by BaseTable only) ---------------------------
// NOTE: The full-featured DataTable lives in ./DataTable.tsx and is the
// canonical export. This internal helper is NOT exported to avoid name collisions.
interface SimpleTableProps<T> {
  cols: BaseTableColDef<T>[];
  rows: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  keyFn?: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
}

function SimpleTable<T extends Record<string, any>>({
  cols, rows, loading, empty, onRowClick, keyFn, actions,
}: SimpleTableProps<T>) {
  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={20} className="animate-spin text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
    </div>
  );
  if (!rows.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {empty ?? (
        <>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <AlertCircle size={18} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">No records found</p>
        </>
      )}
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} className={tk.th} style={{ width: c.width, textAlign: c.align ?? 'left' }}>
                {c.label}
              </th>
            ))}
            {actions && <th className={tk.th} style={{ width: '80px', textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={keyFn ? keyFn(row) : i}
              onClick={() => onRowClick?.(row)}
              className={`group ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50' : ''}`}
            >
              {cols.map(c => (
                <td key={c.key} className={tk.td} style={{ textAlign: c.align ?? 'left' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {actions && (
                <td className={tk.td} style={{ textAlign: 'right' }}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -- Card ----------------------------------------------------------------------
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  onClick?: () => void;
}> = ({ children, className, hover, padding = 'p-4', onClick }) => (
  <div 
    onClick={onClick}
    className={[
      tk.card,
      hover ? tk.cardHov : '',
      onClick ? 'cursor-pointer' : '',
      padding, className,
    ].join(' ')}
  >
    {children}
  </div>
);

// -- Btn -----------------------------------------------------------------------
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Btn: React.FC<BtnProps> = ({
  variant = 'secondary', size = 'md', loading, icon, children, className, disabled, ...rest
}) => {
  const variantCls = {
    primary:   'bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
    secondary: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:hover:border-[var(--pro-azure)] dark:hover:text-[var(--pro-azure)]',
    danger:    'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50',
    ghost:     'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200',
  }[variant];
  const sizeCls = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
  }[size];
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variantCls, sizeCls, className,
      ].join(' ')}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
      {children}
    </button>
  );
};

// -- SectionLabel --------------------------------------------------------------
export const SectionLabel: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
      {children}
      <span className="flex-1 h-px bg-slate-100 w-8 inline-block" />
    </span>
    {action}
  </div>
);

// -- PipelineBar ---------------------------------------------------------------
interface PipelineStage {
  key: string;
  label: string;
  count: number;
  amount?: string;
  color: string;
  icon?: React.ReactNode;
}

export const PipelineBar: React.FC<{ stages: PipelineStage[]; activeKey?: string; onStageClick?: (key: string) => void }> = ({
  stages, activeKey, onStageClick,
}) => {
  const total = stages.reduce((s, st) => s + st.count, 0) || 1;
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 mb-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]">
      <div className="flex h-1.5 rounded-full overflow-hidden mb-4 gap-px">
        {stages.map(st => (
          <div
            key={st.key}
            className={`${st.color} transition-all duration-700`}
            style={{ width: `${(st.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none">
        {stages.map((st, i) => (
          <React.Fragment key={st.key}>
            <button
              onClick={() => onStageClick?.(st.key)}
              className={[
                'flex-1 min-w-[80px] flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all',
                activeKey === st.key
                  ? 'bg-[var(--sys-bg-accent)] ring-1 ring-[var(--sys-border-accent)]'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
              ].join(' ')}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${st.color}`}>
                {st.icon ?? st.count}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">{st.label}</span>
              {st.amount && <span className="text-[10px] font-bold text-slate-700 tabular-nums">{st.amount}</span>}
            </button>
            {i < stages.length - 1 && (
              <div className="flex items-center px-1">
                <ChevronRight size={12} className="text-slate-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// -- SearchBar -----------------------------------------------------------------
export const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={`relative ${className}`}>
    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 dark:focus:ring-[var(--pro-azure)]/30 focus:border-[var(--pro-azure)] dark:focus:border-[var(--pro-azure)] transition-all"
    />
  </div>
);

// -- Modal ---------------------------------------------------------------------
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}> = ({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-2xl shadow-2xl dark:shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150`}>
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all ml-3 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

// -- FormField -----------------------------------------------------------------
export const FormField: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, error, hint, className, children }) => (
  <div className={['space-y-1', className ?? ''].filter(Boolean).join(' ')}>
    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1"><AlertCircle size={10} />{error}</p>}
    {hint && !error && <p className="text-[10px] text-slate-400 dark:text-slate-500">{hint}</p>}
  </div>
);

// -- IconBox -------------------------------------------------------------------
export const IconBox: React.FC<{
  icon: React.ReactNode;
  color?: 'indigo' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate';
  size?: 'sm' | 'md' | 'lg';
}> = ({ icon, color = 'green', size = 'md' }) => {
  const colorCls = {
    indigo: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    green:  'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
    sky:     'bg-sky-50 text-sky-600 border-sky-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    violet:  'bg-violet-50 text-violet-600 border-violet-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
    slate:   'bg-slate-100 text-slate-500 border-slate-200',
  }[color];
  const sizeCls = { sm: 'w-7 h-7 rounded-lg', md: 'w-9 h-9 rounded-xl', lg: 'w-11 h-11 rounded-2xl' }[size];
  return (
    <div className={`${sizeCls} ${colorCls} border flex items-center justify-center shrink-0`}>
      {icon}
    </div>
  );
};

// -- Divider -------------------------------------------------------------------
export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-slate-100" />
    {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>}
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

/** @deprecated Use `Pagination` from '@ovds/ui' (Pagination.tsx) instead. */
export const SimplePagination: React.FC<{
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}> = ({ page, total, pageSize, onChange }) => {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
      <span className="text-[11px] text-slate-400">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px]"
        >‹</button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page - 2 + i;
          if (p < 1 || p > pages) return null;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-all ${
                p === page
                  ? 'bg-[var(--pro-azure)] text-white'
                  : 'border border-slate-200 text-slate-500 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)]'
              }`}
            >{p}</button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px]"
        >›</button>
      </div>
    </div>
  );
};

// -- Toolbar -------------------------------------------------------------------
export const Toolbar: React.FC<{
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  count?: number;
  countLabel?: string;
}> = ({ search, filters, actions, count, countLabel }) => (
  <div className="flex items-center gap-2 flex-wrap mb-3">
    {search && (
      <SearchBar
        value={search.value}
        onChange={search.onChange}
        placeholder={search.placeholder}
        className="w-48 shrink-0"
      />
    )}
    {filters}
    <div className="flex-1" />
    {count !== undefined && (
      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        {count} {countLabel ?? 'records'}
      </span>
    )}
    {actions}
  </div>
);

// -- EthiopianTaxBadge ---------------------------------------------------------
export const EthTaxBadge: React.FC<{ type: 'VAT' | 'WHT' | 'BIT' | 'PENSION' | 'DRRF'; rate?: number }> = ({ type, rate }) => {
  const map: Record<string, { cls: string; label: string }> = {
    VAT:     { cls: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] border-[var(--pro-azure-100)] dark:border-green-800', label: `VAT ${rate ?? 15}%` },
    WHT:     { cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',           label: `WHT ${rate ?? 3}%` },
    BIT:     { cls: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',                     label: `BIT ${rate ?? 30}%` },
    PENSION: { cls: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',   label: `Pension ${rate ?? 11}%` },
    DRRF:    { cls: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',               label: `DRRF ${rate ?? 1}%` },
  };
  const s = map[type] ?? map.VAT;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
};

// -- AmountDisplay -------------------------------------------------------------
export const Amount: React.FC<{
  value: number | string;
  currency?: string;
  positive?: boolean;
  negative?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, currency = 'ETB', positive, negative, size = 'md' }) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const colorCls = positive
    ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
    : negative
    ? 'text-rose-600 dark:text-rose-400'
    : num > 0
    ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
    : num < 0
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-slate-700 dark:text-slate-300';
  const sizeCls = { sm: 'text-[11px]', md: 'text-[13px]', lg: 'text-[16px]' }[size];
  const formatted = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(num));
  return (
    <span className={`font-bold tabular-nums ${colorCls} ${sizeCls}`}>
      {num < 0 && !positive ? '−' : ''}{currency} {formatted}
    </span>
  );
};
