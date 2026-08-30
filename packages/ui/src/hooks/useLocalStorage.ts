import { useState, useCallback, useEffect, useRef } from 'react';

/** Keys owned by AuthContext — must never be written via this hook */
const AUTH_KEYS = new Set(['ovds_token', 'ovds_user']);

/**
 * Like useState, but persists the value in localStorage.
 * Automatically serializes/deserializes JSON.
 *
 * NOTE: Do NOT use this for auth keys ('ovds_token', 'ovds_user').
 *       Those are owned by AuthContext.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 *   const [filters, setFilters] = useLocalStorage('payroll_filters', { year: 2026, month: 3 });
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  if (AUTH_KEYS.has(key)) {
    throw new Error(
      `[useLocalStorage] Key "${key}" is reserved for AuthContext. Use useAuth() instead.`,
    );
  }

  // Capture initialValue in a ref so removeValue doesn't recreate on every render
  // when initialValue is an object/array literal
  const initialRef = useRef<T>(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialRef.current;
    } catch {
      return initialRef.current;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage full */
        }
        return next;
      });
    },
    [key],
  );

  // removeValue resets to the initial value captured at mount time
  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialRef.current);
  }, [key]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
