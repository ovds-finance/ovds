const CACHE_NAME = 'ovds-v5';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(urlsToCache)
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

async function queueOvdsTransaction(request) {
  const data = await request.clone().json();
  const entry = {
    id: `ovds-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    data,
    url: request.url
  };

  const dbRequest = indexedDB.open('OVDS_Offline_Cache', 1);
  return new Promise((resolve) => {
    dbRequest.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('ovds_transactions')) {
        db.createObjectStore('ovds_transactions', { keyPath: 'id' });
      }
    };
    dbRequest.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('ovds_transactions', 'readwrite');
      tx.objectStore('ovds_transactions').add(entry);
      tx.oncomplete = () => resolve(new Response(JSON.stringify({ queued: true, id: entry.id }), { status: 202, headers: { 'Content-Type': 'application/json' } }));
    };
  });
}

async function fetchWithOvdsSync(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch (err) {
    if (request.url.includes('/api/ovds/')) {
      return queueOvdsTransaction(request);
    }
    return new Response('Offline', { status: 503 });
  }
}

async function syncQueuedOvdsTransactions() {
  const dbRequest = indexedDB.open('OVDS_Offline_Cache', 1);
  return new Promise((resolve) => {
    dbRequest.onsuccess = async e => {
      const db = e.target.result;
      const tx = db.transaction('ovds_transactions', 'readwrite');
      const store = tx.objectStore('ovds_transactions');
      const entries = await store.getAll();

      for (const entry of entries) {
        try {
          const response = await fetch(new Request(entry.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry.data)
          }));

          if (response.ok) {
            store.delete(entry.id);
            self.clients.matchAll().then(clients => {
              clients.forEach(client => client.postMessage({
                type: 'OVDS_SYNC_SUCCESS',
                id: entry.id
              }));
            });
          }
        } catch (err) {
          break;
        }
      }

      resolve();
    };
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle POST requests to /api/ovds/ for offline queue
  if (event.request.method === 'POST' && url.pathname.startsWith('/api/ovds/')) {
    event.respondWith(fetchWithOvdsSync(event.request));
    return;
  }

  // Handle GET requests for caching (skip API calls)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  if (event.request.headers.get('accept')?.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'ovds-sync') {
    event.waitUntil(syncQueuedOvdsTransactions());
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
  }
  if (event.data.type === 'OVDS_DRAIN_QUEUE') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'OVDS_SYNC_TRIGGER' }));
    });
  }
});