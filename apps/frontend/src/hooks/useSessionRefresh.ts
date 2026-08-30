/**
 * useSessionRefresh — proactively refreshes the session before JWT expiry.
 *
 * For Auth0 SSO users: silently calls getAccessTokenSilently 2 minutes before
 * the token expires, exchanges it for a new local session token, and updates
 * AuthContext — all without showing the expiry banner.
 *
 * For local JWT users: no-op (they see the SessionExpiryBanner instead).
 *
 * Usage: mount once inside the authenticated layout.
 *   useSessionRefresh();
 */
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../rbac/AuthContext';
import { getAuth0Token } from '../rbac/auth0Client';
import { BEARER_PREFIX } from '../utils/constants';
import type { AuthUser } from '../rbac/AuthContext';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';
/** Refresh when this many minutes remain */
const REFRESH_THRESHOLD_MINS = 2;
/** Poll interval — check every 30s */
const POLL_MS = 30_000;

async function silentRefresh(
  login: (token: string, user: AuthUser) => void,
): Promise<boolean> {
  try {
    const auth0Token = await getAuth0Token();
    if (!auth0Token) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    let res: Response;
    try {
      res = await fetch('/api/auth/auth0/session', {
        method: 'POST',
        headers: { Authorization: `${BEARER_PREFIX}${auth0Token}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return false;
    const data = (await res.json()) as { access_token: string; user: AuthUser };
    login(data.access_token, { ...data.user, isAuth0User: true });
    // Notify api.ts interceptor so it picks up the new token
    window.dispatchEvent(new CustomEvent('ovds:token-refreshed'));
    return true;
  } catch {
    return false;
  }
}

export function useSessionRefresh() {
  const auth = useAuth();
  const { expiresInMinutes, isAuthenticated, isAuth0User } = auth;
  // Stabilise login via ref so it never appears in useCallback deps,
  // preventing maybeRefresh from changing on every render and tearing
  // down / recreating the polling interval.
  const loginRef = useRef(auth.login);
  useEffect(() => { loginRef.current = auth.login; });

  const refreshingRef = useRef(false);

  const maybeRefresh = useCallback(async () => {
    if (!AUTH0_ENABLED || !isAuthenticated || !isAuth0User) return;
    if (refreshingRef.current) return;
    if (expiresInMinutes === null) return;
    // Only refresh when within the threshold but not already expired
    if (expiresInMinutes > REFRESH_THRESHOLD_MINS || expiresInMinutes <= 0)
      return;

    refreshingRef.current = true;
    try {
      await silentRefresh((token, user) => loginRef.current(token, user));
    } finally {
      refreshingRef.current = false;
    }
  }, [expiresInMinutes, isAuthenticated, isAuth0User]);

  useEffect(() => {
    const runMaybeRefresh = () => {
      void maybeRefresh();
    };

    runMaybeRefresh();
    const id = setInterval(runMaybeRefresh, POLL_MS);
    return () => clearInterval(id);
  }, [maybeRefresh]);
}
