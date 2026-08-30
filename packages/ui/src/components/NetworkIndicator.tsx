import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export interface NetworkIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  queueSize?: number;
  syncing?: boolean;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ className, showLabel = false, size = 'sm', queueSize = 0, syncing = false }) => {
  const isOnline = useNetworkStatus();

  if (isOnline && queueSize === 0) return null;

  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {!isOnline ? (
        <>
          <WifiOff size={iconSize} className="text-rose-500 dark:text-rose-400" />
          {showLabel && <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Offline</span>}
        </>
      ) : syncing ? (
        <>
          <RefreshCw size={iconSize} className="animate-spin text-amber-500 dark:text-amber-400" />
          {showLabel && <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Syncing...</span>}
        </>
      ) : queueSize > 0 ? (
        <>
          <AlertTriangle size={iconSize} className="text-amber-500 dark:text-amber-400" />
          {showLabel && <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{queueSize} pending</span>}
        </>
      ) : (
        <>
          <Wifi size={iconSize} className="text-emerald-500 dark:text-emerald-400" />
          {showLabel && <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Online</span>}
        </>
      )}
    </div>
  );
};
