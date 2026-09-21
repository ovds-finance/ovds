import React from 'react';
import { BORDER_COLOR } from './tokens';

export interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  /** Ovds SaaS style coloured left border accent */
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
  /* Ovds SaaS: 4px left border stripe on KPI/feature cards */
  const accentCls = accent ? `border-l-[4px] ${BORDER_COLOR[accent]}` : '';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        /* Ovds SaaS: white bg, clean single-pixel border, small radius */
        'rounded-lg overflow-hidden',
        'transition-all duration-150',
        hover || onClick
          ? 'hover:-translate-y-0.5'
          : '',
        onClick
          ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/30'
          : '',
        accentCls,
        className ?? '',
      ].join(' ')}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: hover || onClick
          ? undefined
          : 'var(--card-shadow)',
      }}
      onMouseEnter={hover || onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--card-shadow-hover)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sys-border-surface)';
      } : undefined}
      onMouseLeave={hover || onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--card-shadow)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      } : undefined}
    >
      {header && (
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderBottom: '1px solid var(--border-alt)',
            background: 'var(--sys-bg-subtle)',
          }}
        >
          {header}
        </div>
      )}
      <div className={padCls}>{children}</div>
      {footer && (
        <div
          className="px-4 py-3"
          style={{
            borderTop: '1px solid var(--border-alt)',
            background: 'var(--sys-bg-subtle)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
