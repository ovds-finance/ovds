/**
 * useDebounceCallback — returns a stable debounced version of any callback.
 *
 * Unlike `useDebounce` (which debounces a value), this debounces a function.
 * The returned function maintains a stable reference across renders.
 *
 * Usage:
 *   const save = useDebounceCallback((value: string) => {
 *     api.patch('/settings', { name: value });
 *   }, 600);
 *
 *   <input onChange={e => save(e.target.value)} />
 *
 * The `flush` method immediately invokes any pending call.
 * The `cancel` method discards any pending call.
 */
import { useCallback, useRef, useEffect } from 'react';

export interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** Immediately invoke the pending debounced call (if any) */
  flush: () => void;
  /** Cancel the pending debounced call without invoking it */
  cancel: () => void;
}

export function useDebounceCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): DebouncedFn<T> {
  const fnRef    = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef  = useRef<Parameters<T> | null>(null);

  // Keep the fn ref fresh without re-creating the debounced wrapper
  useEffect(() => { fnRef.current = fn; });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...(argsRef.current as Parameters<T>));
        argsRef.current = null;
      }, delay);
    },
    [delay],
  ) as DebouncedFn<T>;

  debounced.flush = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (argsRef.current !== null) {
      fnRef.current(...argsRef.current);
      argsRef.current = null;
    }
  };

  debounced.cancel = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    argsRef.current = null;
  };

  return debounced;
}
