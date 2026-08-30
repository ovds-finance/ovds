/**
 * VVSavedIndicator — subtle auto-save status shown top-right.
 *
 * Displays a small timestamp when the V&V draft was last auto-saved to the
 * server ("Auto-saved · 14:32"), or a saving spinner while in flight.
 */
import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface VVSavedIndicatorProps {
  lastSavedAt?: string | null;
  saving?: boolean;
  className?: string;
}

export const VVSavedIndicator: React.FC<VVSavedIndicatorProps> = ({
  lastSavedAt,
  saving,
  className,
}) => {
  const time = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-[10px] font-semibold transition-colors',
        saving ? 'text-slate-400' : time ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300',
        className,
      )}
      aria-live="polite"
    >
      {saving ? (
        <>
          <Loader2 size={11} className="animate-spin" />
          Saving draft…
        </>
      ) : time ? (
        <>
          <Check size={11} strokeWidth={3} />
          Auto-saved · {time}
        </>
      ) : (
        <span>Not yet saved</span>
      )}
    </div>
  );
};
