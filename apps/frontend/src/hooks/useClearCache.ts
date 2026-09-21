/**
 * useClearCache — recovery hooks for stale/corrupt client UI state.
 *
 * Why this is NOT `localStorage.clear()`:
 *   A blanket clear on mount removes `ovds_token` / `ovds_user`, so
 *   AuthContext sees an unauthenticated session, `AuthenticatedShell`
 *   redirects to /login, and the user is bounced on every single mount.
 *   That *is* the login/redirect flicker, not a fix for it. It also wipes
 *   unrelated third-party, PWA and other-tab data.
 *
 * Instead we purge only superseded and unparseable UI keys, once per state
 * schema version, and leave the session intact. See utils/storage.ts.
 */
import { useEffect, useState, useCallback } from 'react';

import {
  sanitizeUiState,
  hardResetUiState,
  clearBrowserCaches,
  type SanitizeResult,
} from '../utils/storage';

/**
 * Run the one-shot stale-state purge for this app boot.
 *
 * Mount once, high in the tree (see main.tsx). Safe to call from several
 * places: it is version-gated and becomes a no-op after the first run.
 */
export function useUiStateSanitizer(): SanitizeResult | null {
  const [result, setResult] = useState<SanitizeResult | null>(null);

  useEffect(() => {
    const res = sanitizeUiState();
    setResult(res);
    if (res.ran && (res.legacyRemoved.length || res.corruptRemoved.length)) {
      // Surface once in dev so regressions in persisted shapes are visible.
      if (import.meta.env.DEV) {
        console.info(
          '[ovds] purged stale UI state',
          { legacy: res.legacyRemoved, corrupt: res.corruptRemoved },
        );
      }
    }
  }, []);

  return result;
}

export interface ClearCacheApi {
  /** True while the reset is running. */
  clearing: boolean;
  /** Purge caches + non-session UI state, keeping the user signed in. */
  clear(): Promise<void>;
  /** Purge caches + UI state, then hard-reload to fetch a fresh chunk manifest. */
  clearAndReload(): Promise<void>;
  /** Drop only Service Worker / HTTP caches. */
  clearCachesOnly(): Promise<void>;
}

/**
 * Imperative cache reset for a user-triggered "fix display problems" action.
 * Nothing here runs automatically.
 */
export function useClearCache(): ClearCacheApi {
  const [clearing, setClearing] = useState(false);

  const clear = useCallback(async () => {
    setClearing(true);
    try {
      await hardResetUiState();
    } finally {
      setClearing(false);
    }
  }, []);

  const clearAndReload = useCallback(async () => {
    setClearing(true);
    try {
      await hardResetUiState();
    } finally {
      window.location.reload();
    }
  }, []);

  const clearCachesOnly = useCallback(async () => {
    setClearing(true);
    try {
      await clearBrowserCaches();
    } finally {
      setClearing(false);
    }
  }, []);

  return { clearing, clear, clearAndReload, clearCachesOnly };
}

export default useClearCache;
