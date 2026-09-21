/**
 * PagePinButton — 1-click star to pin/unpin a page to the sidebar favorites.
 *
 * Drop this into any AppPage `actions` prop alongside other header buttons.
 *
 * Usage:
 *   <AppPage
 *     title="IoT Hub"
 *     actions={
 *       <>
 *         <PagePinButton to="/iot" label="IoT Hub" icon="MONITOR" />
 *         <Btn variant="primary">…</Btn>
 *       </>
 *     }
 *   >
 */
import React from 'react';
import toast from 'react-hot-toast';

import { usePagePin } from '../../hooks/usePagePin';

import { Icon } from './index';

interface PagePinButtonProps {
  to: string;
  label: string;
  icon?: string;
  /** Override size, defaults to 'sm' */
  size?: 'xs' | 'sm' | 'md';
  /** Show text label alongside the star */
  showLabel?: boolean;
}

const PagePinButton: React.FC<PagePinButtonProps> = ({
  to,
  label,
  icon,
  size = 'sm',
  showLabel = false,
}) => {
  const { pinned, toggle } = usePagePin(to, label, icon);

  const handleClick = () => {
    toggle();
    toast(
      pinned
        ? `Removed "${label}" from favorites`
        : `"${label}" pinned to sidebar favorites`,
      {
        icon: pinned ? '✕' : '★',
        duration: 2000,
        style: { fontSize: '12px', fontWeight: 600 },
      },
    );
  };

  const sizeClasses = {
    xs: 'h-6 px-1.5 text-[10px] gap-1',
    sm: 'h-8 px-2.5 text-[11px] gap-1.5',
    md: 'h-9 px-3 text-[12px] gap-2',
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      title={pinned ? `Remove "${label}" from favorites` : `Pin "${label}" to sidebar`}
      aria-pressed={pinned}
      className={[
        'inline-flex items-center rounded-xl font-semibold transition-all duration-150',
        'border focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        sizeClasses,
        pinned
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:border-amber-300 dark:hover:border-amber-700',
      ].join(' ')}
    >
      <Icon
        name="STAR"
        size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14}
        className={pinned ? 'fill-current' : ''}
      />
      {showLabel && <span>{pinned ? 'Pinned' : 'Pin to sidebar'}</span>}
    </button>
  );
};

export default PagePinButton;
