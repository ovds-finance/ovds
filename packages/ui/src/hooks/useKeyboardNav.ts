/**
 * useKeyboardNav — arrow key navigation for lists, tables, and menus.
 *
 * Tracks a focused index and handles ArrowUp/Down, Home/End, Enter, Escape.
 * Works with both roving tabindex and aria-activedescendant patterns.
 *
 * Usage:
 *   const { focusedIndex, setFocusedIndex, onKeyDown } = useKeyboardNav({
 *     count: invoices.length,
 *     onSelect: (i) => openInvoice(invoices[i].id),
 *     onEscape: () => setOpen(false),
 *     wrap: true,
 *   });
 *
 *   <ul role="listbox" onKeyDown={onKeyDown}>
 *     {invoices.map((inv, i) => (
 *       <li
 *         key={inv.id}
 *         role="option"
 *         aria-selected={i === focusedIndex}
 *         tabIndex={i === focusedIndex ? 0 : -1}
 *       >
 *         {inv.invoiceNumber}
 *       </li>
 *     ))}
 *   </ul>
 */
import { useState, useCallback, type KeyboardEvent } from 'react';

export interface UseKeyboardNavOptions {
  /** Total number of items in the list */
  count: number;
  /** Called when Enter is pressed on a focused item */
  onSelect?: (index: number) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Wrap around from last to first and vice versa (default: true) */
  wrap?: boolean;
  /** Initial focused index (default: -1 = none) */
  initialIndex?: number;
}

export interface UseKeyboardNavResult {
  /** Currently focused item index (-1 = none) */
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  /** Attach to the container element's onKeyDown */
  onKeyDown: (e: KeyboardEvent) => void;
  /** Reset to no selection */
  reset: () => void;
}

export function useKeyboardNav({
  count,
  onSelect,
  onEscape,
  wrap = true,
  initialIndex = -1,
}: UseKeyboardNavOptions): UseKeyboardNavResult {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (count === 0) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev < count - 1) return prev + 1;
            return wrap ? 0 : prev;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (prev > 0) return prev - 1;
            return wrap ? count - 1 : prev;
          });
          break;
        }
        case 'Home': {
          e.preventDefault();
          setFocusedIndex(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          setFocusedIndex(count - 1);
          break;
        }
        case 'Enter': {
          if (focusedIndex >= 0 && focusedIndex < count) {
            e.preventDefault();
            onSelect?.(focusedIndex);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onEscape?.();
          break;
        }
      }
    },
    [count, focusedIndex, onSelect, onEscape, wrap],
  );

  const reset = useCallback(() => setFocusedIndex(-1), []);

  return { focusedIndex, setFocusedIndex, onKeyDown, reset };
}
