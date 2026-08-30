/**
 * VVProgressiveDisclosure — "Advanced Options" toggle.
 *
 * Hides advanced V&V settings so the initial screen stays uncluttered, per the
 * Ovds-style V&V best-practice of progressive disclosure.
 */
import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface VVProgressiveDisclosureProps {
  open: boolean;
  onToggle: (open: boolean) => void;
  count?: number;
  children: React.ReactNode;
  className?: string;
}

export const VVProgressiveDisclosure: React.FC<VVProgressiveDisclosureProps> = ({
  open,
  onToggle,
  count,
  children,
  className,
}) => (
  <div className={cn('border border-dashed border-slate-200 dark:border-slate-700 rounded-oki overflow-hidden', className)}>
    <button
      type="button"
      onClick={() => onToggle(!open)}
      aria-expanded={open}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <SlidersHorizontal size={12} />
        Advanced Options
        {count !== undefined && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500">
            {count}
          </span>
        )}
      </span>
      <ChevronDown size={14} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
    </button>
    {open && (
      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 animate-aki-enter">
        {children}
      </div>
    )}
  </div>
);
