import { useEffect, useRef } from 'react';

/**
 * Runs `callback` on a fixed interval, cleaning up automatically on unmount.
 * The callback is always called with the latest closure values (uses a ref).
 *
 * Automatically pauses when the browser tab is hidden (Page Visibility API)
 * to avoid wasted network requests and CPU usage in background tabs.
 * Resumes immediately when the tab becomes visible again.
 *
 * Usage:
 *   useInterval(() => fetchData(), 30_000);          // every 30s
 *   useInterval(() => fetchData(), enabled ? 5000 : null); // pause when null
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Keep ref up to date so the interval always calls the latest version
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id !== null) return;
      id = setInterval(() => {
        // Skip tick if tab is hidden — avoids stale data fetches
        if (document.visibilityState === 'hidden') return;
        savedCallback.current();
      }, delay);
    };

    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Immediately fire once on tab focus, then restart interval
        savedCallback.current();
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [delay]);
}
