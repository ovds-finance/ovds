/**
 * useIdleTimer — detects user inactivity and fires a callback.
 *
 * Useful for auto-logout, session refresh prompts, and analytics.
 * Monitors mouse, keyboard, touch, and scroll events.
 *
 * Usage:
 *   useIdleTimer({
 *     timeoutMs: 30 * 60 * 1000, // 30 minutes
 *     onIdle: () => logout(),
 *     onActive: () => refreshSession(),
 *   });
 */
import { useEffect, useRef, useCallback } from 'react';

export interface IdleTimerOptions {
  /** Idle timeout in milliseconds (default: 15 minutes) */
  timeoutMs?: number;
  /** Called when the user becomes idle */
  onIdle?:    () => void;
  /** Called when the user becomes active again after being idle */
  onActive?:  () => void;
  /** Whether the timer is enabled (default: true) */
  enabled?:   boolean;
}

const ACTIVITY_EVENTS: string[] = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'focus',
];

export function useIdleTimer(options: IdleTimerOptions = {}): void {
  const {
    timeoutMs = 15 * 60 * 1000,
    onIdle,
    onActive,
    enabled = true,
  } = options;

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef   = useRef(false);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    if (idleRef.current) {
      idleRef.current = false;
      onActive?.();
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      idleRef.current = true;
      onIdle?.();
    }, timeoutMs);
  }, [enabled, timeoutMs, onIdle, onActive]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the timer on mount
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);
}
