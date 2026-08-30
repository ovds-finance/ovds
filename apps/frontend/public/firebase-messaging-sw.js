/**
 * Firebase Web Push Service Worker
 *
 * Must live at the ROOT of your served origin (e.g. /firebase-messaging-sw.js)
 * so the browser grants it the full-scope push subscription.
 *
 * Config values are injected at build time via Vite's define or at runtime via
 * self.__FIREBASE_CONFIG__ (set by the HTML template before this SW registers).
 *
 * Usage:
 *  1. Register in your app:
 *       navigator.serviceWorker.register('/firebase-messaging-sw.js')
 *  2. Call messaging.getToken({ serviceWorkerRegistration: reg })
 *  3. Store the FCM token on the user's profile (POST /api/auth/fcm-token)
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ---------------------------------------------------------------------------
// Config — populated at runtime from window.__FIREBASE_CONFIG__ via the main
// app, or you can hard-code non-secret values here for simplicity.
// ---------------------------------------------------------------------------
const config = self.__FIREBASE_CONFIG__ || {
  apiKey:            self.VITE_FIREBASE_API_KEY            || '',
  authDomain:        self.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     self.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: self.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.VITE_FIREBASE_APP_ID             || '',
};

if (config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  /**
   * Background message handler — fires when the app is in the background
   * or the tab is closed.  The push notification is displayed automatically
   * by Firebase when notification payload is present; this handler lets you
   * perform custom logic or show a custom notification.
   */
  messaging.onBackgroundMessage((payload) => {
    const { title = 'OVDS', body = '' } = payload.notification ?? {};
    const link = payload.data?.link ?? '/';

    self.registration.showNotification(title, {
      body,
      icon:  '/logo192.png',
      badge: '/badge72.png',
      data:  { link },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  });

  /**
   * Notification click handler — opens the app at the linked route.
   */
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const link = event.notification.data?.link ?? '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
        const existing = wins.find((w) => w.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.postMessage({ type: 'NAVIGATE', link });
        } else {
          clients.openWindow(self.location.origin + link);
        }
      }),
    );
  });
}
