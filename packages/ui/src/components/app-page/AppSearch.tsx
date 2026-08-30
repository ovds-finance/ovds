import { Search, X } from 'lucide-react';

export interface AppSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const AppSearch: React.FC<AppSearchProps> = ({ value, onChange, placeholder = 'Search...', className, autoFocus }) => (
  <div className={`relative ${className ?? ''}`}>
    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full pl-8 pr-7 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl
                 text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500
                 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-500
                 focus:bg-white dark:focus:bg-slate-950 transition-all"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label="Clear search"
      >
        <X size={12} />
      </button>
    )}
  </div>
);
