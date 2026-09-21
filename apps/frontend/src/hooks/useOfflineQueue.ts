/**
 * useOfflineQueue — React hook for offline-first action submission.
 *
 * Wraps the offlineQueue service with React state so components get:
 *   - Live queue count (updates whenever the queue changes)
 *   - `submitOfflineSafe(type, payload, label)` — submits immediately if online,
 *     queues to IndexedDB if offline
 *   - `isSyncing` — true while the drain is in progress
 *   - `lastSync` — result of the most recent drain
 *
 * Usage:
 *   const { queueCount, submitOfflineSafe, isSyncing } = useOfflineQueue();
 *
 *   // In a check-in button handler:
 *   await submitOfflineSafe(
 *     'ATTENDANCE_CHECK_IN',
 *     { employeeId, location },
 *     'Check-in — Selam Tesfaye',
 *   );
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../services/api';
import {
  enqueue,
  drainQueue,
  getQueueStats,
  type QueuedActionType,
  type DrainResult,
} from '../services/offlineQueue';

// ─── Handler map for immediate (online) submission ────────────────────────────

type DirectHandler = (payload: any, companyId?: string) => Promise<any>;

const DIRECT_HANDLERS: Record<QueuedActionType, DirectHandler> = {
  ATTENDANCE_CHECK_IN:  (p, cId) => api.post('/hr/attendance/check-in',  { ...p, companyId: cId }),
  ATTENDANCE_CHECK_OUT: (p, cId) => api.post('/hr/attendance/check-out', { ...p, companyId: cId }),
  EXPENSE_CREATE:       (p, cId) => api.post('/ovds/expenses',         { ...p, companyId: cId }),
  INVOICE_DRAFT_SAVE:   (p, cId) => api.post('/ovds/invoices',         { ...p, companyId: cId, status: 'DRAFT' }),
  INVOICE_CREATE:       (p, cId) => api.post('/ovds/invoices',         { ...p, companyId: cId }),
  INVOICE_SYNC:         async (p, cId) => {
    const invoices: any[] = (p as any).invoices ?? [p];
    for (const inv of invoices) {
      if (inv.id) await api.patch(`/ovds/invoices/${inv.id}`, { ...inv, companyId: cId });
      else        await api.post('/ovds/invoices',             { ...inv, companyId: cId });
    }
  },
  INVOICE_MODULE_SYNC:  async (p, cId) => {
    // Batch-sync invoices from the local Invoice Module — tagged with source
    const invoices: any[] = (p as any).invoices ?? [p];
    for (const inv of invoices) {
      if (inv.id) await api.patch(`/ovds/invoices/${inv.id}`, { ...inv, companyId: cId, source: 'INVOICE_MODULE' });
      else        await api.post('/ovds/invoices',             { ...inv, companyId: cId, source: 'INVOICE_MODULE' });
    }
  },
  NODE_SYNC_TOKEN:      async (p) => {
    // Re-issue a 24h sync token for the local node on reconnect
    const { nodeId, nodeToken } = p as { nodeId: string; nodeToken: string };
    await api.post('/client/sync-token', { nodeId, nodeToken });
  },
  JOURNAL_ENTRY_SAVE:   (p, cId) => api.post('/ovds/journal-entries',  { ...p, companyId: cId }),
  LEAVE_REQUEST:        (p, cId) => api.post('/hr/leaves',                { ...p, companyId: cId }),
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOfflineQueueReturn {
  /** Number of pending actions in the offline queue */
  queueCount: number;
  /** true while the queue is being drained */
  isSyncing: boolean;
  /** Result of the most recent sync drain */
  lastSync: DrainResult | null;
  /**
   * Submit an action. If online, executes immediately.
   * If offline, enqueues to IndexedDB and shows a toast.
   * Returns true on success (or queued), false on error.
   */
  submitOfflineSafe: <T>(
    type: QueuedActionType,
    payload: T,
    label: string,
    companyId?: string,
  ) => Promise<boolean>;
  /** Manually trigger a queue drain (normally auto-triggered on reconnect) */
  syncNow: () => Promise<void>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing]   = useState(false);
  const [lastSync, setLastSync]     = useState<DrainResult | null>(null);

  // Refresh count from IndexedDB
  const refreshCount = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setQueueCount(stats.total);
    } catch {
      // IndexedDB unavailable (private browsing on some browsers)
      setQueueCount(0);
    }
  }, []);

  // Listen for queue changes (enqueue / drain)
  useEffect(() => {
    refreshCount();
    const handler = () => refreshCount();
    window.addEventListener('ovds:queue-changed', handler);
    return () => window.removeEventListener('ovds:queue-changed', handler);
  }, [refreshCount]);

  // Drain queue on reconnect
  useEffect(() => {
    const onOnline = async () => {
      if (queueCount === 0) return;
      setIsSyncing(true);
      try {
        const result = await drainQueue();
        setLastSync(result);
        if (result.succeeded > 0) {
          toast.success(
            `${result.succeeded} offline action${result.succeeded !== 1 ? 's' : ''} synced`,
            { duration: 4000 },
          );
        }
        if (result.failed > 0) {
          toast.error(`${result.failed} action${result.failed !== 1 ? 's' : ''} failed to sync`);
        }
      } finally {
        setIsSyncing(false);
        refreshCount();
      }
    };

    // Also listen for SW sync completion message
    const swHandler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_SUCCESS') {
        refreshCount();
        // SW sends either { count } (invoice batch) or { checkin } (attendance)
        const count = event.data.count ?? (event.data.checkin ? 1 : 0);
        if (count > 0) {
          toast.success(`${count} offline action${count !== 1 ? 's' : ''} synced`);
        }
      }
      if (event.data?.type === 'QUEUE_DRAINED') {
        refreshCount();
      }
      // SW background-sync asks the app to drain its IndexedDB queue
      if (event.data?.type === 'SW_DRAIN_QUEUE') {
        drainQueue().then(result => {
          if (result.succeeded > 0) {
            toast.success(`${result.succeeded} offline action${result.succeeded !== 1 ? 's' : ''} synced`);
          }
        }).catch(() => {/* silent — will retry on next reconnect */});
        refreshCount();
      }
    };

    window.addEventListener('online', onOnline);
    navigator.serviceWorker?.addEventListener('message', swHandler);
    return () => {
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker?.removeEventListener('message', swHandler);
    };
  }, [queueCount, refreshCount]);

  // Submit — online: direct API call; offline: enqueue
  const submitOfflineSafe = useCallback(async <T,>(
    type: QueuedActionType,
    payload: T,
    label: string,
    companyId?: string,
  ): Promise<boolean> => {
    if (navigator.onLine) {
      try {
        await DIRECT_HANDLERS[type](payload, companyId);
        return true;
      } catch (err: any) {
        // If it's a genuine network error (not a 4xx), fall through to queue
        if (!err?.response) {
          toast('Action queued — will sync when back online', { icon: '⏳', duration: 3500 });
          await enqueue(type, payload, label, companyId);
          await refreshCount();
          return true; // queued = success from the user's perspective
        }
        // 4xx/5xx — let caller handle
        throw err;
      }
    } else {
      // Device is offline — queue it
      toast(`"${label}" saved offline — will sync when reconnected`, {
        icon: '📶',
        duration: 4000,
      });
      await enqueue(type, payload, label, companyId);
      await refreshCount();
      return true;
    }
  }, [refreshCount]);

  // Manual drain
  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await drainQueue();
      setLastSync(result);
      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} action${result.succeeded !== 1 ? 's' : ''} synced`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} action${result.failed !== 1 ? 's' : ''} could not sync`);
      }
    } finally {
      setIsSyncing(false);
      refreshCount();
    }
  }, [refreshCount]);

  return { queueCount, isSyncing, lastSync, submitOfflineSafe, syncNow };
}

