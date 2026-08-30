/**
 * useWebSocket — lightweight Socket.io hook for real-time event subscriptions.
 *
 * Automatically connects on mount, disconnects on unmount.
 * Re-connects when `enabled` changes from false → true.
 * Passes JWT token via handshake for authenticated rooms.
 *
 * Usage:
 *   const { connected } = useWebSocket({
 *     events: { newCheckin: (data) => setLogs(prev => [data, ...prev]) },
 *   });
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

interface UseWebSocketOptions<TEvents extends Record<string, unknown> = Record<string, unknown>> {
  /** Socket.io namespace path — defaults to '/realtime' */
  namespace?: string;
  /** Socket.io path option — defaults to '/socket.io' */
  path?: string;
  /** Map of event name → handler */
  events?: {
    [K in keyof TEvents]?: (data: TEvents[K]) => void;
  };
  /** Set to false to skip connecting (e.g. when user lacks permission) */
  enabled?: boolean;
  /** Rooms to join after connecting */
  rooms?: string[];
  /** Reconnect on visibility change (tab focus) */
  reconnectOnFocus?: boolean;
}

interface UseWebSocketReturn {
  connected: boolean;
  socket: Socket | null;
  /** Manually emit an event */
  emit: <T = unknown>(event: string, data?: T) => void;
  /** Manually reconnect */
  reconnect: () => void;
}

export function useWebSocket<TEvents extends Record<string, unknown> = Record<string, unknown>>({
  namespace = '/realtime',
  path = '/socket.io',
  events = {},
  enabled = true,
  rooms = [],
  reconnectOnFocus = true,
}: UseWebSocketOptions<TEvents> = {}): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const eventsRef = useRef(events);
  const roomsRef = useRef(rooms);
  // Keep a ref to the active socket cleanup so reconnect() and initial useEffect can share it
  const socketCleanupRef = useRef<(() => void) | undefined>(undefined);

  // Keep refs current without re-triggering effect
  useEffect(() => { eventsRef.current = events; });
  useEffect(() => { roomsRef.current = rooms; });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('ovds_token') ||
                  localStorage.getItem('auth0_token') ||
                  sessionStorage.getItem('auth0_token') || '';

    const socket = io(namespace, {
      path,
      // In production behind a reverse proxy (Plesk/nginx), WebSocket upgrades
      // can fail with 400. Start with polling which always works, then upgrade.
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join requested rooms
      roomsRef.current.forEach(room => socket.emit('joinRoom', { room }));
    });
    socket.on('disconnect', () => setConnected(false));
    // Suppress connect_error console noise — reconnection handles recovery
    socket.on('connect_error', () => setConnected(false));

    // Register a single catch-all listener so new event keys added after mount
    // are also handled. The ref stays current so handler updates are reflected
    // immediately without needing to reconnect.
    const anyHandler = (event: string, data: unknown) => {
      const handler = eventsRef.current[event];
      if (handler) handler(data as Parameters<typeof handler>[0]);
    };
    socket.onAny(anyHandler);

    return () => {
      socket.offAny(anyHandler);
      // Use close() instead of disconnect() to avoid the "closed before established" warning
      // that React StrictMode triggers by unmounting before the WS handshake completes
      socket.io.opts.reconnection = false;
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [namespace, path]);

  useEffect(() => {
    if (!enabled) return;
    // Small delay prevents the StrictMode double-invoke from firing a connect
    // immediately before the cleanup of the first mount tears it down
    const tid = setTimeout(() => {
      socketCleanupRef.current = connect() ?? undefined;
    }, 50);
    return () => {
      clearTimeout(tid);
      socketCleanupRef.current?.();
      socketCleanupRef.current = undefined;
    };
  }, [enabled, connect]);

  // Reconnect on tab focus (handles token refresh + network recovery)
  useEffect(() => {
    if (!reconnectOnFocus || !enabled) return;
    let focusCleanup: (() => void) | undefined;
    const handler = () => {
      if (!socketRef.current?.connected) {
        focusCleanup?.(); // tear down any prior focus-triggered socket
        focusCleanup = connect() ?? undefined;
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      focusCleanup?.();
    };
  }, [reconnectOnFocus, enabled, connect]);

  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  const reconnect = useCallback(() => {
    socketCleanupRef.current?.(); // close previous socket before opening a new one
    socketRef.current = null;
    setConnected(false);
    socketCleanupRef.current = connect() ?? undefined;
  }, [connect]);

  return { connected, socket: socketRef.current, emit, reconnect };
}

