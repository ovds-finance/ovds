/**
 * usePageTitle — sets document.title reactively.
 *
 * Appends the app name suffix automatically and restores the previous
 * title on unmount (useful for modals/drawers that want a temporary title).
 *
 * Usage:
 *   usePageTitle('Invoices');           // → "Invoices · ovds ovds"
 *   usePageTitle('Edit Invoice #42');   // → "Edit Invoice #42 · ovds ovds"
 *   usePageTitle(null);                 // → no-op (keeps current title)
 */
import { useEffect } from 'react';

const APP_NAME = 'ovds ovds';

export function usePageTitle(title: string | null, suffix = APP_NAME): void {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = suffix ? `${title} · ${suffix}` : title;
    return () => {
      document.title = prev;
    };
  }, [title, suffix]);
}
