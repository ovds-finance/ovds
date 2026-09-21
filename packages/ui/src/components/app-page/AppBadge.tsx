import React from 'react';
import { ICON_BG } from './tokens';

/**
 * AppBadge — Ovds SaaS style inline badge / chip.
 *
 * Uses the token map from tokens.tsx so 'indigo' → --pro-azure-50 bg automatically.
 * Supports dot indicator, 3 sizes, and the full colour palette.
 */

export interface AppBadgeProps {
  children: React.ReactNode;
  color?: keyof typeof ICON_BG;
  dot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  color = 'indigo',
  dot,
  size = 'xs',
  className,
}) => {
  /* ICON_BG maps indigo → Ovds SaaS green tokens */
  const bg = ICON_BG[color] ?? ICON_BG.indigo;

  const sizeCls = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2   py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1   text-[11px] gap-1.5',
  }[size];

  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-full',
        bg,
        sizeCls,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
