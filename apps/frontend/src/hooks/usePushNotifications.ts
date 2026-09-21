/**
 * usePushNotifications — registers the Firebase Web SW and obtains an FCM token.
 *
 * Call this once after login.  On success, POSTs the token to /api/auth/fcm-token
 * so the backend can store it against the user for push delivery.
 *
 * Required env vars (set in apps/frontend/.env):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY
 */
import { useEffect } from 'react';

import api from '../services/api';

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const PUSH_ENABLED =
  !!FIREBASE_CONFIG.projectId && !!VAPID_KEY && 'serviceWorker' in navigator;

export function usePushNotifications(enabled = true) {
  useEffect(() => {
    if (!enabled || !PUSH_ENABLED) return;

    let cancelled = false;

    (async () => {
      try {
        // Lazy-load Firebase only when push is configured.
        // The indirect specifier prevents Vite's static import-analysis from
        // resolving these modules unless firebase is actually installed.
        const firebaseAppPkg = 'firebase/app';
        const firebaseMsgPkg = 'firebase/messaging';
        const { initializeApp, getApps } = await import(/* @vite-ignore */ firebaseAppPkg);
        const { getMessaging, getToken } = await import(/* @vite-ignore */ firebaseMsgPkg);

        const app =
          getApps().length > 0
            ? getApps()[0]
            : initializeApp(FIREBASE_CONFIG);

        const messaging = getMessaging(app);

        // Register / reuse the service worker
        const reg = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' },
        );

        // Inject config into the SW so it can init Firebase
        reg.active?.postMessage({
          type:   '__FIREBASE_CONFIG__',
          config: FIREBASE_CONFIG,
        });

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, {
          vapidKey:               VAPID_KEY,
          serviceWorkerRegistration: reg,
        });

        if (!cancelled && token) {
          await api.post('/auth/fcm-token', { token });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[PushNotifications] setup failed:', err);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
