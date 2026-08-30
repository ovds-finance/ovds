export interface AppSectionProps {
  label: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  divider?: boolean;
}

export const AppSection: React.FC<AppSectionProps> = ({ label, subtitle, action, icon, className, children, divider }) => (
  <div className={`mb-4 ${className ?? ''}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] leading-tight">
            {label}
          </h2>
          {subtitle && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {divider && <div className="mt-3 h-px bg-slate-100 dark:bg-slate-800" />}
    {children}
  </div>
);
