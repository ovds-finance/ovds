/**
 * Thin component that calls usePushNotifications once the user is authenticated.
 * Rendered inside the AuthenticatedShell so it mounts after login and
 * unmounts on logout, which properly cleans up the service worker registration.
 */
import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushNotificationInit() {
  usePushNotifications(true);
  return null;
}
