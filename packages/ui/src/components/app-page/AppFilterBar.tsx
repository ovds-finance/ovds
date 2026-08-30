export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  color?: string;
}

export interface AppFilterBarProps {
  chips: FilterChip[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const AppFilterBar: React.FC<AppFilterBarProps> = ({ chips, active, onChange, className }) => (
  <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ''}`}>
    {chips.map((chip) => (
      <button
        key={chip.id}
        onClick={() => onChange(chip.id)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all',
          active === chip.id
            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
        ].join(' ')}
      >
        {chip.color && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              active === chip.id ? 'bg-white/70' : chip.color
            }`}
          />
        )}
        {chip.label}
        {chip.count !== undefined && (
          <span
            className={`px-1 py-0.5 rounded-full text-[9px] font-bold leading-none ${
              active === chip.id
                ? 'bg-white/20 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {chip.count}
          </span>
        )}
      </button>
    ))}
  </div>
);
