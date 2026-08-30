import { COLOR_VALUE, ICON_BG } from './tokens';

export interface AppBadgeProps {
  children: React.ReactNode;
  color?: keyof typeof COLOR_VALUE;
  dot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({ children, color = 'emerald', dot, size = 'xs', className }) => {
  const bg = ICON_BG[color] ?? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
  const sizeCls = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
  }[size];
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border border-transparent ${bg} ${sizeCls} ${className ?? ''}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
};
