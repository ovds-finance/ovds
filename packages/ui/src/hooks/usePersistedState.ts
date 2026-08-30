/**
 * usePersistedState — localStorage state with optional TTL expiry.
 *
 * Extends useLocalStorage with:
 * - TTL: auto-expires stale values after N milliseconds
 * - Version key: invalidates cache when schema changes
 * - Serialization error safety: falls back to defaultValue on corruption
 *
 * Usage:
 *   // Persist for 24 hours
 *   const [dashLayout, setDashLayout] = usePersistedState('dash-layout', [], {
 *     ttlMs: 24 * 60 * 60 * 1000,
 *   });
 *
 *   // Invalidate on schema change (bump version when shape changes)
 *   const [filters, setFilters] = usePersistedState('inv-filters', {}, {
 *     version: 2,
 *   });
 */
import { useState, useCallback } from 'react';
import { safeJsonParse } from '@ovds/shared';

interface PersistedWrapper<T> {
  v:   number;        // schema version
  d:   T;             // data
  ts:  number;        // stored-at timestamp ms
}

export interface UsePersistedStateOptions {
  /** Auto-expire after this many ms. Omit for no expiry. */
  ttlMs?: number;
  /** Increment when the stored shape changes to auto-invalidate old data. */
  version?: number;
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistedStateOptions = {},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { ttlMs, version = 1 } = options;
  const storageKey = `ovds_ps_${key}`;

  const read = (): T => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultValue;
      const wrapper = safeJsonParse<PersistedWrapper<T>>(raw, null as any);
      if (!wrapper || wrapper.v !== version) return defaultValue;
      if (ttlMs && Date.now() - wrapper.ts > ttlMs) {
        localStorage.removeItem(storageKey);
        return defaultValue;
      }
      return wrapper.d;
    } catch {
      return defaultValue;
    }
  };

  const [state, setStateRaw] = useState<T>(read);

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw(prev => {
        const next = typeof value === 'function'
          ? (value as (p: T) => T)(prev)
          : value;
        try {
          const wrapper: PersistedWrapper<T> = { v: version, d: next, ts: Date.now() };
          localStorage.setItem(storageKey, JSON.stringify(wrapper));
        } catch {
          // Quota exceeded — write silently fails, state still updates in memory
        }
        return next;
      });
    },
    [storageKey, version],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStateRaw(defaultValue);
  }, [storageKey, defaultValue]);

  return [state, setState, clear];
}
