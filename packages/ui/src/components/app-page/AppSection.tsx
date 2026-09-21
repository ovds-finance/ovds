import React from 'react';

export interface AppSectionProps {
  label: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  divider?: boolean;
}

/**
 * AppSection — Ovds SaaS style section label with optional icon and action.
 */
export const AppSection: React.FC<AppSectionProps> = ({
  label, subtitle, action, icon, className, children, divider,
}) => (
  <div className={`mb-4 ${className ?? ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: 'var(--sys-bg-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-4)',
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <h2
            className="text-[10px] font-bold uppercase tracking-[0.1em] leading-tight"
            style={{ color: 'var(--text-4)' }}
          >
            {label}
          </h2>
          {subtitle && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-5)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {divider && (
      <div
        className="h-px mb-3"
        style={{ background: 'var(--border)' }}
      />
    )}
    {children}
  </div>
);
