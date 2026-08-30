import { useEffect, useCallback } from 'react';

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

interface ShortcutOptions {
  /** The key to listen for (e.g. 'k', 'Enter', 'Escape') */
  key: string;
  /** Optional modifier keys required */
  modifiers?: Modifier[];
  /** Handler to call when shortcut fires */
  handler: (e: KeyboardEvent) => void;
  /** Whether to call e.preventDefault() — default true */
  preventDefault?: boolean;
  /** Only fire when no input/textarea/select is focused — default true */
  ignoreInputs?: boolean;
  /** Whether the shortcut is currently active — default true */
  enabled?: boolean;
}

/**
 * Register a keyboard shortcut that fires a handler.
 *
 * Usage:
 *   useKeyboardShortcut({ key: 'k', modifiers: ['ctrl'], handler: openSearch });
 *   useKeyboardShortcut({ key: 'Escape', handler: closeModal, ignoreInputs: false });
 */
export function useKeyboardShortcut({
  key,
  modifiers = [],
  handler,
  preventDefault = true,
  ignoreInputs = true,
  enabled = true,
}: ShortcutOptions): void {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if focused on an input element (unless explicitly allowed)
      if (ignoreInputs) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      }

      // Check key match (case-insensitive for single chars)
      const keyMatch =
        e.key === key || e.key.toLowerCase() === key.toLowerCase();
      if (!keyMatch) return;

      // Check modifiers
      const ctrlOk = modifiers.includes('ctrl')
        ? e.ctrlKey || e.metaKey
        : !e.ctrlKey && !e.metaKey;
      const shiftOk = modifiers.includes('shift') ? e.shiftKey : !e.shiftKey;
      const altOk = modifiers.includes('alt') ? e.altKey : !e.altKey;

      // For ctrl/meta, treat them interchangeably
      const metaOk = modifiers.includes('meta') ? e.metaKey || e.ctrlKey : true;

      if (!ctrlOk || !shiftOk || !altOk || !metaOk) return;

      if (preventDefault) e.preventDefault();
      handler(e);
    },
    [key, modifiers, handler, preventDefault, ignoreInputs, enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
