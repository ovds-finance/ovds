/**
 * useNetworkStatus — fine-grained network connectivity detection.
 *
 * Goes beyond the basic `navigator.onLine` flag by:
 * - Detecting slow connections via the Network Information API
 * - Pinging the health endpoint to confirm actual API reachability
 * - Exposing a `quality` level: 'good' | 'slow' | 'offline'
 *
 * Usage:
 *   const { isOnline, quality, effectiveType } = useNetworkStatus();
 *
 *   if (!isOnline) return <OfflineBanner />;
 *   if (quality === 'slow') return <SlowConnectionWarning />;
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type NetworkQuality = 'good' | 'slow' | 'offline';

export interface NetworkStatus {
  /** true when navigator.onLine is true AND health ping succeeds */
  isOnline: boolean;
  /** 'good' | 'slow' | 'offline' */
  quality: NetworkQuality;
  /** Network Information API effective type: '4g' | '3g' | '2g' | 'slow-2g' | null */
  effectiveType: string | null;
  /** Round-trip time in ms from the last health ping (null when offline) */
  rtt: number | null;
  /** Manually trigger a connectivity check */
  checkNow: () => Promise<void>;
}

const SLOW_RTT_MS = 2000;
// Liveness probe — always returns 200 if the Node process is alive (no DB check)
const PING_URL = '/api/health/live';
const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 8_000; // increased from 5s — gives backend time to warm up after restart

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [rtt, setRtt] = useState<number | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(
    (navigator as any).connection?.effectiveType ?? null,
  );
  const pingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quality: NetworkQuality = !isOnline
    ? 'offline'
    : rtt !== null && rtt > SLOW_RTT_MS
      ? 'slow'
      : effectiveType === 'slow-2g' || effectiveType === '2g'
        ? 'slow'
        : 'good';

  const ping = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setRtt(null);
      return;
    }
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch(PING_URL, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      if (res.ok || res.status < 500) {
        // 200–499 all mean the server is reachable (401/404 still = online)
        const elapsed = Math.round(performance.now() - start);
        setIsOnline(true);
        setRtt(elapsed);
      } else {
        setIsOnline(false);
        setRtt(null);
      }
    } catch {
      clearTimeout(timeoutId);
      setIsOnline(false);
      setRtt(null);
    }
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  ping(); };
    const goOffline = () => { setIsOnline(false); setRtt(null); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [ping]);

  // Listen to Network Information API changes
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;
    const handler = () => setEffectiveType(conn.effectiveType ?? null);
    conn.addEventListener('change', handler);
    return () => conn.removeEventListener('change', handler);
  }, []);

  // Periodic ping — delay initial check slightly to survive StrictMode double-invoke
  useEffect(() => {
    const initTid = setTimeout(() => ping(), 200);
    pingRef.current = setInterval(ping, PING_INTERVAL_MS);
    return () => {
      clearTimeout(initTid);
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [ping]);

  return { isOnline, quality, effectiveType, rtt, checkNow: ping };
}
