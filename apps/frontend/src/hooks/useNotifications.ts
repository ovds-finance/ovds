/**
 * useNotifications — real-time notification feed via Socket.IO + REST fallback.
 *
 * Connects to the backend WebSocket gateway (/notifications namespace).
 * Uses the JWT access token from cookies / localStorage for auth.
 * Falls back to polling the REST endpoint if the socket is unavailable.
 *
 * Returns:
 *  notifications  — paginated list of in-app notifications
 *  unreadCount    — badge count
 *  markRead       — mark one as read
 *  markAllRead    — mark all as read
 *  remove         — delete a notification
 *  loading        — initial fetch in progress
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

import api from '../services/api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  items: AppNotification[];
  total: number;
  unread: number;
}

// Use a relative URL so the connection goes through the Vite dev proxy
// (or nginx in production) instead of hitting the backend port directly.
// An absolute URL derived from VITE_API_BASE_URL bypasses the proxy and
// causes Firefox to attempt ws://127.0.0.1:3000 which fails in dev.
const WS_URL = '';

export function useNotifications(enabled = true) {
  const [state, setState] = useState<NotificationsState>({
    items: [], total: 0, unread: 0,
  });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // ---------- REST fetch ----------
  const fetch = useCallback(async (page = 1) => {
    try {
      const res = await api.get('/notifications', { params: { page, limit: 20 } });
      const data = res.data as NotificationsState & { page: number; limit: number };
      setState({ items: data.items, total: data.total, unread: data.unread });
    } catch {
      // silently ignore — user may not be logged in yet
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- Socket.IO ----------
  useEffect(() => {
    if (!enabled) return;

    fetch();

    const token =
      document.cookie.match(/access_token=([^;]+)/)?.[1] ??
      localStorage.getItem('access_token') ?? '';

    const socket = io(`${WS_URL}/notifications`, {
      path: '/socket.io',
      auth: { token },
      // Start with polling so the Vite proxy (or nginx) can upgrade to WS.
      // websocket-only fails in dev when the proxy hasn't yet established the tunnel.
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('notification', (n: AppNotification) => {
      setState((prev) => ({
        items:  [n, ...prev.items],
        total:  prev.total + 1,
        unread: prev.unread + 1,
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, fetch]);

  // ---------- Actions ----------
  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setState((prev) => ({
      ...prev,
      items:  prev.items.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unread: Math.max(0, prev.unread - 1),
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all');
    setState((prev) => ({
      ...prev,
      items:  prev.items.map((n) => ({ ...n, isRead: true })),
      unread: 0,
    }));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setState((prev) => {
      const removed = prev.items.find((n) => n.id === id);
      return {
        items:  prev.items.filter((n) => n.id !== id),
        total:  prev.total - 1,
        unread: removed && !removed.isRead ? prev.unread - 1 : prev.unread,
      };
    });
  }, []);

  return {
    notifications: state.items,
    unreadCount:   state.unread,
    total:         state.total,
    loading,
    markRead,
    markAllRead,
    remove,
    refresh:       () => fetch(),
  };
}
