import { BORDER_COLOR } from './tokens';

export interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  accent?: keyof typeof BORDER_COLOR;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  className,
  padding = 'md',
  hover,
  onClick,
  accent,
  header,
  footer,
}) => {
  const padCls = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' }[padding];
  const accentCls = accent ? `border-l-4 ${BORDER_COLOR[accent]}` : '';
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)]',
        hover || onClick
          ? 'hover:shadow-[0_4px_16px_0_rgb(0_0_0/0.08)] dark:hover:shadow-[0_4px_16px_0_rgb(0_0_0/0.16)] hover:-translate-y-0.5 transition-all duration-150'
          : '',
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/40' : '',
        accentCls,
        className ?? '',
      ].join(' ')}
    >
      {header && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={padCls}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {footer}
        </div>
      )}
    </div>
  );
};
