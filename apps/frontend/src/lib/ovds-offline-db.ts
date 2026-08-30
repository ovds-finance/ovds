/**
 * ovds-offline-db — offline ledger cache for transactions awaiting sync.
 *
 * Originally backed by `dexie`, which is no longer a dependency of this app.
 * Re-implemented on top of the browser IndexedDB API so the offline ledger
 * keeps working without an extra package. The public API (saveOfflineTransaction,
 * getPendingTransactions, markSynced, markSyncError, clearSyncedTransactions)
 * is unchanged so callers are unaffected.
 */

export interface OfflineOvdsTransaction {
  id?: string;
  transactionId: string;
  companyCode: string;
  isolationToken: string;
  invoiceNumber: string;
  fiscalDeviceId?: string;
  transactionType: string;
  executionDate: string;
  originalCurrency: string;
  exchangeRate: number;
  taxableAmountEtb: number;
  calculatedVatEtb: number;
  whtAmountEtb: number;
  isIntercompany: boolean;
  ledgerHash: string;
  glAccountCodeString: string;
  createdByUser: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'ERROR';
  offlineCreatedAt: Date;
  syncedAt?: Date;
  retryCount: number;
}

const DB_NAME = 'OVDS_Offline_Cache';
const STORE = 'offlineLedger';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'transactionId' });
        store.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
        store.createIndex('ledgerHash', 'ledgerHash', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('companyCode', 'companyCode', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

function txn(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDb().then(
    (db) =>
      new Promise<IDBObjectStore>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        t.onerror = () => reject(t.error);
        resolve(t.objectStore(STORE));
      }),
  );
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineTransaction(tx: OfflineOvdsTransaction) {
  const store = await txn('readwrite');
  await reqToPromise(
    store.put({
      ...tx,
      id: tx.transactionId,
      syncStatus: 'PENDING',
      offlineCreatedAt: new Date(),
      retryCount: 0,
    }),
  );
}

export async function getPendingTransactions(): Promise<OfflineOvdsTransaction[]> {
  const store = await txn('readonly');
  const all = await reqToPromise(store.getAll() as IDBRequest<OfflineOvdsTransaction[]>);
  return all.filter((t) => t.syncStatus === 'PENDING');
}

export async function markSynced(transactionIds: string[]) {
  const store = await txn('readwrite');
  await Promise.all(
    transactionIds.map((id) =>
      reqToPromise(
        store.put({
          transactionId: id,
          syncStatus: 'SYNCED',
          syncedAt: new Date(),
        } as Partial<OfflineOvdsTransaction> as OfflineOvdsTransaction),
      ),
    ),
  );
}

export async function markSyncError(transactionId: string, _error: string) {
  const store = await txn('readwrite');
  const existing = await reqToPromise(
    store.get(transactionId) as IDBRequest<OfflineOvdsTransaction | undefined>,
  );
  if (existing) {
    await reqToPromise(
      store.put({
        ...existing,
        syncStatus: 'ERROR',
        retryCount: (existing.retryCount || 0) + 1,
      }),
    );
  }
}

export async function clearSyncedTransactions() {
  const store = await txn('readwrite');
  const all = await reqToPromise(store.getAll() as IDBRequest<OfflineOvdsTransaction[]>);
  await Promise.all(
    all
      .filter((t) => t.syncStatus === 'SYNCED')
      .map((t) => reqToPromise(store.delete(t.transactionId))),
  );
}
