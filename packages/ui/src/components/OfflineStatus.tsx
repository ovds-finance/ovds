import React, { useMemo } from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export interface OfflineStatusProps {
  className?: string;
  mode?: 'banner' | 'dot' | 'badge';
  queueSize?: number;
  syncing?: boolean;
  lastSyncedAt?: string;
}

export const OfflineStatus: React.FC<OfflineStatusProps> = ({ className, mode = 'banner', queueSize = 0, syncing = false, lastSyncedAt }) => {
  const { isOnline } = useNetworkStatus();
  const hasActivity = queueSize > 0 || syncing || !isOnline;

  if (!hasActivity) {
    if (mode === 'dot') {
      return <span className={`w-2 h-2 rounded-full bg-[var(--pro-azure)] shrink-0 ${className ?? ''}`} aria-label="Online" />;
    }
    if (mode === 'badge') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--pro-azure-50)] dark:bg-green-950/40 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] ${className ?? ''}`}>
          <Database size={10} /> Synced
        </span>
      );
    }
    return null;
  }

  if (mode === 'dot') {
    return <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'} shrink-0 ${className ?? ''}`} aria-label={isOnline ? 'Syncing' : 'Offline'} />;
  }

  if (mode === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        isOnline ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
      } ${className ?? ''}`}>
        <WifiOff size={10} />
        {isOnline ? `Syncing ${queueSize}` : 'Offline'}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
      isOnline
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
    } ${className ?? ''}`}>
      <WifiOff size={16} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold">{isOnline ? 'Sync in progress' : 'You are offline'}</p>
        {isOnline && queueSize > 0 && (
          <p className="text-[10px] font-medium opacity-80">
            {syncing ? 'Uploading queued transactions...' : `${queueSize} changes queued`}
          </p>
        )}
        {!isOnline && (
          <p className="text-[10px] font-medium opacity-80">
            Sales and purchases continue. Changes sync when connection returns.
          </p>
        )}
        {lastSyncedAt && (
          <p className="text-[10px] font-medium opacity-60 mt-0.5">
            Last synced: {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};
