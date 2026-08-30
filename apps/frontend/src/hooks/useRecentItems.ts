/**
 * useRecentItems — track recently visited records per entity type.
 *
 * Persists to localStorage so the list survives page refreshes.
 * Used by GlobalSearchModal and quick-access sidebars to surface
 * recently viewed invoices, bills, employees, contacts, etc.
 *
 * Usage:
 *   const { items, push, clear } = useRecentItems('invoices', 10);
 *
 *   // When user opens an invoice
 *   push({ id: invoice.id, label: invoice.invoiceNumber, sub: invoice.customerName, url: `/invoices/${invoice.id}` });
 *
 *   // Render
 *   {items.map(item => <RecentChip key={item.id} {...item} />)}
 *
 * Type-safe: each entity type has its own isolated key in localStorage.
 */
import { useState, useCallback } from 'react';
import { safeJsonParse } from '@ovds/ui';

export interface RecentItem {
  id: string;
  label: string;
  sub?: string;
  url: string;
  /** ISO timestamp when this was last visited */
  visitedAt: string;
  /** Optional icon name from OVDS icon set */
  icon?: string;
}

const STORAGE_PREFIX = 'ovds_recent_';

function readStorage(key: string, max: number): RecentItem[] {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  const items = safeJsonParse<RecentItem[]>(raw, []);
  return Array.isArray(items) ? items.slice(0, max) : [];
}

function writeStorage(key: string, items: RecentItem[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(items));
  } catch {
    // Storage quota exceeded — silently fail
  }
}

export interface UseRecentItemsResult {
  items: RecentItem[];
  /** Add or bump a record to the top of the recent list */
  push: (item: Omit<RecentItem, 'visitedAt'>) => void;
  /** Remove a specific item by id */
  remove: (id: string) => void;
  /** Clear all recent items for this entity type */
  clear: () => void;
}

export function useRecentItems(
  entityType: string,
  maxItems = 8,
): UseRecentItemsResult {
  const storageKey = entityType;
  const [items, setItems] = useState<RecentItem[]>(() =>
    readStorage(storageKey, maxItems),
  );

  const push = useCallback(
    (item: Omit<RecentItem, 'visitedAt'>) => {
      setItems((prev) => {
        // Remove existing entry with same id (we'll re-insert at top)
        const filtered = prev.filter((i) => i.id !== item.id);
        const next = [
          { ...item, visitedAt: new Date().toISOString() },
          ...filtered,
        ].slice(0, maxItems);
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey, maxItems],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_PREFIX + storageKey);
    setItems([]);
  }, [storageKey]);

  return { items, push, remove, clear };
}

