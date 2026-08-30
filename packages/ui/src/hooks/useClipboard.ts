/**
 * useClipboard — copy text to clipboard with status feedback.
 *
 * Handles both the modern Clipboard API and the legacy execCommand fallback.
 * Auto-resets the `copied` state after `resetAfterMs` milliseconds.
 *
 * Usage:
 *   const { copy, copied, error } = useClipboard();
 *
 *   <button onClick={() => copy(invoice.invoiceNumber)}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 */
import { useState, useCallback, useRef } from 'react';

export interface UseClipboardResult {
  /** Copy a string to the clipboard */
  copy: (text: string) => Promise<boolean>;
  /** true for `resetAfterMs` ms after a successful copy */
  copied: boolean;
  /** Error message if the last copy failed */
  error: string | null;
}

export function useClipboard(resetAfterMs = 1500): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    setError(null);

    // Clear any pending reset timer
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Legacy fallback for older browsers / HTTP contexts
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        if (!ok) throw new Error('execCommand copy failed');
      }

      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), resetAfterMs);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Copy failed';
      setError(msg);
      setCopied(false);
      return false;
    }
  }, [resetAfterMs]);

  return { copy, copied, error };
}
