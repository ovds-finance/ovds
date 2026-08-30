/**
 * SyncStatusBadge — Offline resilience indicator
 *
 * Shows the current sync queue state and connectivity status.
 * Regulated sectors (RETAIL, MANUFACTURING, PHARMACEUTICAL, etc.) that
 * require offline operation display this badge in the app header.
 *
 * States:
 *   online   — no pending queue entries, all synced
 *   pending  — entries queued, waiting to push
 *   conflict — sync conflicts detected
 *   offline  — browser is offline (navigator.onLine = false)
 */
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orpc } from '../lib/orpc';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

type SyncState = 'online' | 'pending' | 'conflict' | 'offline' | 'syncing';

const STATE_CONFIG: Record<SyncState, { label: string; color: string; icon: React.ReactNode }> = {
  online:   { label: 'Synced',    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200', icon: <CheckCircle2 size={11} /> },
  pending:  { label: 'Pending',   color: 'text-amber-600  bg-amber-50  dark:bg-amber-950/30  border-amber-200',  icon: <RefreshCw size={11} className="animate-spin" /> },
  conflict: { label: 'Conflict',  color: 'text-rose-600   bg-rose-50   dark:bg-rose-950/30   border-rose-200',   icon: <AlertTriangle size={11} /> },
  offline:  { label: 'Offline',   color: 'text-slate-500  bg-slate-100 dark:bg-slate-800      border-slate-200',  icon: <WifiOff size={11} /> },
  syncing:  { label: 'Syncing…',  color: 'text-blue-600   bg-blue-50   dark:bg-blue-950/30   border-blue-200',   icon: <RefreshCw size={11} className="animate-spin" /> },
};

export const SyncStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const statsQuery = useQuery({
    queryKey: ['sync', 'queue', 'stats'],
    queryFn: () => orpc.sync.queue.stats({}),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const cycleMutation = useMutation({
    mutationFn: () => orpc.sync.cycle({}),
    onSuccess: () => statsQuery.refetch(),
  });

  const stats = statsQuery.data as any;

  const syncState: SyncState = !isOnline
    ? 'offline'
    : cycleMutation.isPending
      ? 'syncing'
      : (stats?.conflicts ?? 0) > 0
        ? 'conflict'
        : (stats?.pending ?? 0) > 0 || (stats?.failed ?? 0) > 0
          ? 'pending'
          : 'online';

  const cfg = STATE_CONFIG[syncState];
  const totalQueued = (stats?.pending ?? 0) + (stats?.failed ?? 0);

  return (
    <button
      onClick={() => { if (isOnline && !cycleMutation.isPending) cycleMutation.mutate(); }}
      title={isOnline ? 'Click to sync now' : 'No internet connection — working offline'}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-colors ${cfg.color}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
      {totalQueued > 0 && (
        <span className="ml-0.5 font-bold">{totalQueued}</span>
      )}
    </button>
  );
};

export default SyncStatusBadge;
