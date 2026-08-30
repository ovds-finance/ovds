import { useEffect, useCallback, useState } from 'react';
import {
  saveOfflineTransaction,
  getPendingTransactions,
  markSynced,
  markSyncError,
  clearSyncedTransactions,
  type OfflineOvdsTransaction,
} from '../lib/ovds-offline-db';

export function useOvdsOfflineSync(companyCode: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const pending = await getPendingTransactions();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    refreshCount();

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [refreshCount]);

  const triggerSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      const pending = await getPendingTransactions();
      if (pending.length === 0) {
        setSyncing(false);
        return;
      }

      const response = await fetch('/api/ovds/pipeline/sync-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Code': companyCode,
        },
        body: JSON.stringify(pending),
      });

      if (response.ok) {
        const ids = pending.map((t) => t.transactionId);
        await markSynced(ids);
        await clearSyncedTransactions();
      } else {
        for (const tx of pending) {
          await markSyncError(tx.transactionId, `HTTP ${response.status}`);
        }
      }
    } catch (error: any) {
      console.error('[OVDS Sync] Failed:', error);
      const pending = await getPendingTransactions();
      for (const tx of pending) {
        await markSyncError(tx.transactionId, error.message);
      }
    } finally {
      setSyncing(false);
      refreshCount();
    }
  }, [companyCode, syncing, refreshCount]);

  const saveTransaction = useCallback(
    async (tx: Omit<OfflineOvdsTransaction, 'syncStatus' | 'offlineCreatedAt' | 'retryCount'>) => {
      await saveOfflineTransaction(tx as OfflineOvdsTransaction);
      await refreshCount();

      if (isOnline) {
        setTimeout(() => triggerSync(), 500);
      }
    },
    [isOnline, triggerSync, refreshCount],
  );

  return {
    isOnline,
    pendingCount,
    syncing,
    saveTransaction,
    triggerSync,
    refreshCount,
  };
}
