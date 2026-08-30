/**
 * useWindowSize — returns live window dimensions.
 *
 * SSR-safe: returns { width: 0, height: 0 } when window is not available.
 * Debounced at 100ms to avoid excessive re-renders on resize.
 *
 * Usage:
 *   const { width, height } = useWindowSize();
 *   const isCompact = width < 768;
 */
import { useState, useEffect } from 'react';

export interface WindowSize {
  width:  number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return { width: window.innerWidth, height: window.innerHeight };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: ReturnType<typeof setTimeout>;

    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, 100);
    };

    window.addEventListener('resize', handler, { passive: true });
    // Initial sync in case size changed between render and effect
    setSize({ width: window.innerWidth, height: window.innerHeight });

    return () => {
      window.removeEventListener('resize', handler);
      clearTimeout(timer);
    };
  }, []);

  return size;
}
