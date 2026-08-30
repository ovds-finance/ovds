/**
 * NotificationBell — icon button with unread badge.
 *
 * Renders the bell icon with an animated count badge.
 * Designed to be placed in the app header.
 *
 * Usage:
 *   <NotificationBell
 *     count={unreadCount}
 *     urgent={urgentCount}
 *     onClick={() => setDrawerOpen(true)}
 *   />
 */
import React from 'react';
import { Bell, BellDot } from 'lucide-react';

export interface NotificationBellProps {
  /** Total unread count */
  count?: number;
  /** Urgent unread count — turns badge red */
  urgent?: number;
  onClick?: () => void;
  className?: string;
  /** Icon size in px (default 18) */
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  urgent = 0,
  onClick,
  className = '',
  size = 18,
}) => {
  const hasUnread  = count > 0;
  const isUrgent   = urgent > 0;
  const badgeColor = isUrgent
    ? 'bg-rose-500 text-white'
    : 'bg-emerald-500 text-white';
  const displayCount = count > 99 ? '99+' : String(count);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex items-center justify-center',
        'w-8 h-8 rounded-lg',
        'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      title={count > 0 ? `${count} unread notification${count !== 1 ? 's' : ''}` : 'Notifications'}
    >
      {hasUnread
        ? <BellDot size={size} strokeWidth={1.8} />
        : <Bell    size={size} strokeWidth={1.8} />
      }

      {hasUnread && (
        <span
          className={[
            'absolute -top-0.5 -right-0.5',
            'min-w-[16px] h-4 px-1',
            'rounded-full text-[9px] font-bold leading-4',
            'flex items-center justify-center',
            'ring-2 ring-white dark:ring-slate-900',
            isUrgent ? 'animate-pulse' : '',
            badgeColor,
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
};
