/**
 * useMediaQuery — reactive CSS media query hook.
 *
 * Returns true when the given media query matches, updating on resize.
 * SSR-safe: returns `defaultValue` when `window` is not available.
 *
 * Usage:
 *   const isMobile  = useMediaQuery('(max-width: 640px)');
 *   const isDark    = useMediaQuery('(prefers-color-scheme: dark)');
 *   const isTablet  = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
 *
 * Convenience breakpoints are also exported:
 *   const isMobile = useIsMobile();
 *   const isDesktop = useIsDesktop();
 */
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    // Use addEventListener when available (modern browsers), fallback to addListener
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      // Legacy browsers only — addListener is deprecated but needed for IE/old Safari
      (mql as any).addListener?.(handler);
    }
    // Sync in case the query changed between render and effect
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        (mql as any).removeListener?.(handler);
      }
    };
  }, [query]);

  return matches;
}

// -- Convenience breakpoint hooks (matches OVDS Tailwind config) ---------------

/** true when viewport width < 640px (Tailwind sm breakpoint) */
export const useIsMobile  = () => useMediaQuery('(max-width: 639px)');

/** true when viewport width ≥ 640px and < 1024px */
export const useIsTablet  = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');

/** true when viewport width ≥ 1024px */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** true when viewport width ≥ 1280px */
export const useIsWide    = () => useMediaQuery('(min-width: 1280px)');

/** true when OS/browser dark mode preference is active */
export const usePrefersDark  = () => useMediaQuery('(prefers-color-scheme: dark)');

/** true when user has requested reduced motion */
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
