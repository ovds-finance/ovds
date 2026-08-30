/**
 * useAuth0Status — fetches and caches the server-side Auth0 configuration status.
 *
 * Enhancements over v1:
 *  - Stale-while-revalidate: returns cached value immediately, refreshes in background
 *  - Retry on failure: up to 3 attempts with 1s backoff
 *  - Jitter on cache expiry to avoid thundering herd on page load
 *
 * Cache TTL: 5 minutes. Returns { enabled, domain, loading }.
 * Safe to call before Auth0Provider mounts.
 */
import { useState, useEffect, useRef } from 'react';

interface Auth0Status {
  enabled: boolean;
  domain: string | null;
}

interface CachedStatus extends Auth0Status {
  expiresAt: number;
}

// 5 minutes ± 30s jitter to avoid thundering herd
const CACHE_TTL_MS = 5 * 60 * 1000;
const JITTER_MS = 30_000;
const MAX_RETRIES = 3;

let _cache: CachedStatus | null = null;
let _promise: Promise<Auth0Status> | null = null;

function isFresh(): boolean {
  return _cache !== null && Date.now() < _cache.expiresAt;
}

function isStale(): boolean {
  return _cache !== null && !isFresh();
}

async function fetchWithRetry(): Promise<Auth0Status> {
  let lastErr: Error = new Error('Failed to fetch Auth0 status');
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000 * i));
    try {
      const r = await fetch('/api/auth/auth0/status');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as Auth0Status;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr;
}

function fetchStatus(): Promise<Auth0Status> {
  if (isFresh())
    return Promise.resolve({
      enabled: _cache!.enabled,
      domain: _cache!.domain,
    });

  if (!_promise) {
    _promise = fetchWithRetry()
      .then((d) => {
        const jitter = Math.random() * JITTER_MS;
        _cache = { ...d, expiresAt: Date.now() + CACHE_TTL_MS + jitter };
        _promise = null;
        return d;
      })
      .catch(() => {
        _promise = null;
        // Keep stale cache on failure rather than returning disabled
        if (_cache) return { enabled: _cache.enabled, domain: _cache.domain };
        return { enabled: false, domain: null };
      });
  }
  return _promise;
}

export function useAuth0Status() {
  // Read the cache synchronously on first render to avoid a loading flash
  const [status, setStatus] = useState<Auth0Status | null>(
    _cache ? { enabled: _cache.enabled, domain: _cache.domain } : null,
  );
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    // If we have a fresh cache, no need to fetch
    if (isFresh()) return;

    // Stale-while-revalidate: if we have stale data, show it immediately
    // and revalidate in the background
    if (isStale() && _cache) {
      setStatus({ enabled: _cache.enabled, domain: _cache.domain });
    }

    fetchStatus().then((s) => {
      if (mounted.current) setStatus(s);
    });

    return () => {
      mounted.current = false;
    };
  }, []);

  return {
    enabled: status?.enabled ?? false,
    domain: status?.domain ?? null,
    loading: status === null,
  };
}
