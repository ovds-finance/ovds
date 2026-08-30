/**
 * usePrefetch — warm the in-memory cache for a URL on hover/focus.
 *
 * Attach to navigation links or action buttons so the data is already
 * cached by the time the user clicks, eliminating loading states.
 *
 * Usage:
 *   const prefetch = usePrefetch();
 *
 *   <Link
 *     to={`/invoices/${id}`}
 *     onMouseEnter={() => prefetch(`/ovds/invoices/${id}`)}
 *   >
 *     {invoice.invoiceNumber}
 *   </Link>
 *
 *   // Prefetch list page params on filter panel open
 *   <button onFocus={() => prefetch('/ovds/invoices?page=1&limit=20')}>
 *     Filters
 *   </button>
 *
 * Deduplicates: if the same URL is already in-flight or cached and fresh,
 * the prefetch is a no-op.
 */
import { useCallback } from 'react';
import api from '../services/api';
import { setCacheData, getCacheData } from './useApiQuery';

const PREFETCH_STALE_MS = 30_000;
const inFlight = new Set<string>();

export function usePrefetch() {
  const prefetch = useCallback(async (url: string): Promise<void> => {
    if (inFlight.has(url)) return;

    // Skip if cache is still fresh
    const cached = getCacheData(url);
    if (cached) return;

    inFlight.add(url);
    try {
      const res = await api.get(url, {
        headers: { 'x-background': 'true' },
      });
      setCacheData(url, res.data);
      // Auto-expire after stale time
      setTimeout(() => {
        // Don't evict if it was re-populated by an actual query
        inFlight.delete(url);
      }, PREFETCH_STALE_MS);
    } catch {
      // Prefetch failures are silent — the actual query will handle errors
      inFlight.delete(url);
    }
  }, []);

  return prefetch;
}

