/**
 * offlineQueue.ts — Offline-first action queue for OVDS
 *
 * Implements the "localized caching or offline workflows" described in the
 * OVDS features document. When the device loses connectivity, actions
 * (attendance check-ins, expense submissions, invoice drafts) are persisted
 * to IndexedDB. On reconnect, the queue drains automatically in FIFO order.
 *
 * Architecture:
 *   - IndexedDB store "offline_queue" — durable across page reloads/crashes
 *   - Background sync via service worker message (FIFO drain on reconnect)
 *   - React hook `useOfflineQueue` for component-level integration
 *   - Typed action registry so every entry has a handler
 */

import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueuedActionType =
  | 'ATTENDANCE_CHECK_IN'
  | 'ATTENDANCE_CHECK_OUT'
  | 'EXPENSE_CREATE'
  | 'INVOICE_DRAFT_SAVE'
  | 'INVOICE_CREATE'
  | 'INVOICE_SYNC'
  | 'INVOICE_MODULE_SYNC'   // batch-sync from local Invoice Module on reconnect
  | 'NODE_SYNC_TOKEN'       // re-issue sync token for a registered node on reconnect
  | 'JOURNAL_ENTRY_SAVE'
  | 'LEAVE_REQUEST';

export interface QueuedAction<T = unknown> {
  id: string;
  type: QueuedActionType;
  payload: T;
  createdAt: number; // Date.now()
  retries: number;
  companyId?: string;
  label: string; // human-readable, shown in the sync banner
}

export interface QueueStats {
  total: number;
  byType: Record<QueuedActionType, number>;
  oldestAt: number | null;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME    = 'ovds_offline';
const STORE_NAME = 'offline_queue';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbPut(action: QueuedAction): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.put(action);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbGetAll(): Promise<QueuedAction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const idx   = store.index('createdAt');
    const req   = idx.getAll();
    req.onsuccess = () => resolve(req.result as QueuedAction[]);
    req.onerror   = () => reject(req.error);
  });
}

async function dbClear(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Action handlers ──────────────────────────────────────────────────────────
// Each handler maps a QueuedActionType → API call.
// Add new types here as the app grows.

type Handler = (payload: any, companyId?: string) => Promise<void>;

const HANDLERS: Record<QueuedActionType, Handler> = {
  ATTENDANCE_CHECK_IN: async (payload, companyId) => {
    await api.post('/hr/attendance/check-in', { ...payload, companyId });
  },
  ATTENDANCE_CHECK_OUT: async (payload, companyId) => {
    await api.post('/hr/attendance/check-out', { ...payload, companyId });
  },
  EXPENSE_CREATE: async (payload, companyId) => {
    await api.post('/ovds/expenses', { ...payload, companyId });
  },
  INVOICE_DRAFT_SAVE: async (payload, companyId) => {
    await api.post('/ovds/invoices', { ...payload, companyId, status: 'DRAFT' });
  },
  INVOICE_CREATE: async (payload, companyId) => {
    await api.post('/ovds/invoices', { ...payload, companyId });
  },
  INVOICE_SYNC: async (payload, companyId) => {
    // Sync a batch of locally-created invoices back to the cloud.
    // payload.invoices is an array of invoice objects.
    const invoices: any[] = (payload as any).invoices ?? [payload];
    for (const inv of invoices) {
      if (inv.id) {
        await api.patch(`/ovds/invoices/${inv.id}`, { ...inv, companyId });
      } else {
        await api.post('/ovds/invoices', { ...inv, companyId });
      }
    }
  },
  INVOICE_MODULE_SYNC: async (payload, companyId) => {
    // Drain a batch of invoices queued by the local Invoice Module client.
    // Identical routing to INVOICE_SYNC but sourced from the module's own
    // offline store — keeps audit trail distinct.
    const invoices: any[] = (payload as any).invoices ?? [payload];
    for (const inv of invoices) {
      if (inv.id) {
        await api.patch(`/ovds/invoices/${inv.id}`, { ...inv, companyId, source: 'INVOICE_MODULE' });
      } else {
        await api.post('/ovds/invoices', { ...inv, companyId, source: 'INVOICE_MODULE' });
      }
    }
  },
  NODE_SYNC_TOKEN: async (payload, _companyId) => {
    // Re-issue a sync token for a registered node after coming back online.
    // payload: { nodeId: string; nodeToken: string }
    const { nodeId, nodeToken } = payload as { nodeId: string; nodeToken: string };
    await api.post('/client/sync-token', { nodeId, nodeToken });
  },
  JOURNAL_ENTRY_SAVE: async (payload, companyId) => {
    await api.post('/ovds/journal-entries', { ...payload, companyId });
  },
  LEAVE_REQUEST: async (payload, companyId) => {
    await api.post('/hr/leaves', { ...payload, companyId });
  },
};

// ─── Enqueue (public API) ─────────────────────────────────────────────────────

/**
 * Adds an action to the offline queue. Call this instead of the API directly
 * when you want the action to survive offline. The queue will drain on reconnect.
 */
export async function enqueue<T>(
  type: QueuedActionType,
  payload: T,
  label: string,
  companyId?: string,
): Promise<QueuedAction<T>> {
  const action: QueuedAction<T> = {
    id:        `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
    retries:   0,
    companyId,
    label,
  };
  await dbPut(action as QueuedAction);
  // Notify any listening components
  window.dispatchEvent(new CustomEvent('ovds:queue-changed'));
  return action;
}

// ─── Drain (called on reconnect) ─────────────────────────────────────────────

export interface DrainResult {
  succeeded: number;
  failed:    number;
  remaining: number;
}

/**
 * Attempts to flush all queued actions in FIFO order.
 * Successful entries are removed. Failed entries increment their retry count
 * (max 3 retries before permanent failure and removal).
 */
export async function drainQueue(): Promise<DrainResult> {
  const actions = await dbGetAll();
  if (actions.length === 0) return { succeeded: 0, failed: 0, remaining: 0 };

  let succeeded = 0;
  let failed    = 0;

  // Sort by createdAt ascending (FIFO)
  actions.sort((a, b) => a.createdAt - b.createdAt);

  for (const action of actions) {
    const handler = HANDLERS[action.type];
    if (!handler) {
      // Unknown action type — log a warning before discarding so the data
      // loss is visible in the console rather than happening silently.
      console.warn(
        `[offlineQueue] Unknown action type "${action.type}" (id: ${action.id}) — discarding. ` +
        `If this type was recently added, ensure a handler is registered in HANDLERS.`,
      );
      window.dispatchEvent(
        new CustomEvent('ovds:queue-unknown-type', { detail: { action } }),
      );
      await dbDelete(action.id);
      continue;
    }
    try {
      await handler(action.payload, action.companyId);
      await dbDelete(action.id);
      succeeded++;
    } catch {
      if (action.retries >= 2) {
        // Give up after 3 attempts
        await dbDelete(action.id);
        failed++;
      } else {
        // Increment retry count
        await dbPut({ ...action, retries: action.retries + 1 });
        failed++;
      }
    }
  }

  const remaining = (await dbGetAll()).length;
  window.dispatchEvent(new CustomEvent('ovds:queue-changed'));

  // Notify the service worker so it can update its badge (if supported)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_DRAINED',
      succeeded,
      failed,
      remaining,
    });
  }

  return { succeeded, failed, remaining };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getQueueStats(): Promise<QueueStats> {
  const actions = await dbGetAll();
  const byType = {} as Record<QueuedActionType, number>;
  let oldestAt: number | null = null;

  for (const a of actions) {
    byType[a.type] = (byType[a.type] ?? 0) + 1;
    if (oldestAt === null || a.createdAt < oldestAt) oldestAt = a.createdAt;
  }

  return { total: actions.length, byType, oldestAt };
}

export { dbClear as clearQueue };

