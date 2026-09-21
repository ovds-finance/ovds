import React from 'react';
import { STATUS_CONFIG, type StatusVariant } from '@ovds/shared';
import { Icon } from './ui/icon';

/**
 * StatusBadge — Ovds SaaS status pill.
 *
 * Draws colours entirely from the CSS token system (--status-*-bg/text/border/dot
 * defined in tokens.css) so every badge automatically matches the design system
 * without hard-coded Tailwind colour classes.
 *
 * Sizes:
 *  xs — 10px font, 2px 6px padding  (default — compact table cell use)
 *  sm — 11px font, 2.5px 8px padding
 *  md — 12px font, 4px 10px padding
 */

/* ── Map StatusVariant → CSS token prefix ───────────────────────── */
const VARIANT_TOKEN: Record<StatusVariant, string> = {
  settled:  'paid',
  pending:  'pending',
  draft:    'draft',
  overdue:  'overdue',
  sent:     'sent',
  pipeline: 'open',
  info:     'info',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  showIcon?: boolean;
  dot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  dot = false,
  size = 'xs',
  className = '',
}) => {
  const key = (status ?? '').toUpperCase();
  const cfg = STATUS_CONFIG[key] ?? { label: status ?? '—', icon: 'CLOCK', variant: 'draft' as StatusVariant };

  /* Map variant to token prefix; fall back to draft tokens */
  const token = VARIANT_TOKEN[cfg.variant] ?? 'draft';

  const sizeCls =
    size === 'md'
      ? 'text-[12px] gap-1.5'
      : size === 'sm'
        ? 'text-[11px] gap-1'
        : 'text-[10px] gap-1';

  const pad =
    size === 'md' ? 'px-2.5 py-1' : size === 'sm' ? 'px-2 py-0.5' : 'px-1.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border whitespace-nowrap ${sizeCls} ${pad} ${className}`}
      style={{
        background:   `var(--status-${token}-bg)`,
        color:        `var(--status-${token}-text)`,
        borderColor:  `var(--status-${token}-border)`,
      }}
    >
      {dot ? (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: `var(--status-${token}-dot)` }}
        />
      ) : (
        showIcon && (
          <Icon
            name={cfg.icon as any}
            size={size === 'md' ? 12 : 10}
          />
        )
      )}
      {label ?? cfg.label}
    </span>
  );
};
