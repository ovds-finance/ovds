import { useEffect, useRef, RefObject } from 'react';

/**
 * Calls `handler` when a click occurs outside the given element ref.
 * Useful for closing dropdowns, modals, and popovers.
 *
 * The handler is stored in a ref so the effect never re-runs due to
 * inline function identity changes — only `ref` and `enabled` matter.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useClickOutside(ref, () => setOpen(false));
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
): void {
  // Keep handler in a ref so the effect doesn't re-subscribe on every render
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handlerRef.current();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, enabled]);
}
