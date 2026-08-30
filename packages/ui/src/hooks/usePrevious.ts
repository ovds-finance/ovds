import { useRef, useEffect } from 'react';

/**
 * Returns the previous value of a variable.
 * Useful for comparing old vs new values (e.g. detecting filter changes,
 * animating number transitions, or skipping effects on first render).
 *
 * Usage:
 *   const prevCount = usePrevious(count);
 *   // On first render, prevCount is undefined
 *   // On subsequent renders, prevCount is the value from the last render
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
