/**
 * useNotifications — manages in-app notification state.
 *
 * Features:
 * - Stores notifications in local state (feed by parent component via WebSocket)
 * - Mark single / all as read
 * - Dismiss (remove) notifications
 * - Derived counts: unread, urgent, total
 * - Auto-expires notifications past their expiresAt timestamp
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead, dismiss, add } =
 *     useNotifications(rawNotifications);
 *
 *   // Add from WebSocket event
 *   useEffect(() => {
 *     socket.on('notification:new', (n) => add(n));
 *   }, [add]);
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppNotification, NotificationSummary } from '@ovds/shared';

// Re-export types so consumers don't need to import from @ovds/shared directly
export type { AppNotification, NotificationSummary };

export interface UseNotificationsResult {
  notifications: AppNotification[];
  /** Summary counts for bell badge */
  summary: NotificationSummary;
  unreadCount: number;
  urgentCount: number;
  /** Add a new notification (from WebSocket or polling) */
  add: (n: AppNotification) => void;
  /** Add multiple notifications at once (initial load) */
  setAll: (ns: AppNotification[]) => void;
  /** Mark a single notification as read */
  markRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllRead: () => void;
  /** Remove a notification */
  dismiss: (id: string) => void;
  /** Remove all read notifications */
  clearRead: () => void;
}

export function useNotifications(
  initial: AppNotification[] = [],
): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>(initial);

  // Auto-expire notifications past their expiresAt
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNotifications(prev =>
        prev.filter(n => !n.expiresAt || new Date(n.expiresAt).getTime() > now),
      );
    }, 60_000); // check every minute
    return () => clearInterval(timer);
  }, []);

  const add = useCallback((n: AppNotification) => {
    setNotifications(prev => {
      // Deduplicate by id
      if (prev.some(existing => existing.id === n.id)) return prev;
      return [n, ...prev];
    });
  }, []);

  const setAll = useCallback((ns: AppNotification[]) => {
    setNotifications(ns);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.isRead));
  }, []);

  const summary = useMemo<NotificationSummary>(() => {
    const unread  = notifications.filter(n => !n.isRead).length;
    const urgent  = notifications.filter(n => !n.isRead && n.priority === 'urgent').length;
    return { unread, urgent, total: notifications.length };
  }, [notifications]);

  return {
    notifications,
    summary,
    unreadCount: summary.unread,
    urgentCount: summary.urgent,
    add,
    setAll,
    markRead,
    markAllRead,
    dismiss,
    clearRead,
  };
}
