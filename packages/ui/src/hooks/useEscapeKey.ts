import { useEffect } from 'react';

/**
 * Calls `handler` when the Escape key is pressed.
 * Automatically cleans up the event listener on unmount.
 *
 * Usage:
 *   useEscapeKey(() => setOpen(false));
 *
 * Pass `enabled = false` to temporarily disable (e.g. when a nested modal is open).
 */
export function useEscapeKey(handler: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}
