/**
 * useAuth0Session — after Auth0 login, exchanges the Auth0 access token
 * for a local session token via POST /api/auth/auth0/session.
 *
 * Handles two cases:
 *  1. Redirect callback — URL contains ?code=&state= (only on /auth/callback)
 *  2. Silent re-auth   — Auth0 already has a valid session (e.g. page refresh)
 *
 * Enhancements over v1:
 *  - Retry with exponential backoff on network errors (max 3 attempts)
 *  - 10-second timeout per attempt
 *  - Passes stepUp + mfaEnrolled from the session response to AuthContext
 *
 * StrictMode note: the `exchanged` ref is reset on unmount so React's
 * double-invocation in development doesn't silently skip the exchange.
 */
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../rbac/AuthContext';
import type { AuthUser } from '../rbac/AuthContext';
import { BEARER_PREFIX } from '../utils/constants';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';
const CALLBACK_PATH = '/auth/callback';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 10_000;

/** Fetch with a timeout. Throws on timeout or network error. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Exchange Auth0 token for a local session with retry + backoff. */
async function exchangeToken(
  auth0Token: string,
): Promise<{ access_token: string; user: AuthUser }> {
  let lastError: Error = new Error('Exchange failed');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 500ms, 1000ms
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }

    try {
      const res = await fetchWithTimeout(
        '/api/auth/auth0/session',
        { method: 'POST', headers: { Authorization: `${BEARER_PREFIX}${auth0Token}` } },
        TIMEOUT_MS,
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        // 4xx errors are not retryable
        if (res.status >= 400 && res.status < 500) {
          throw new Error(
            body?.message ?? `Auth0 session exchange failed (${res.status})`,
          );
        }
        lastError = new Error(body?.message ?? `Server error (${res.status})`);
        continue; // retry on 5xx
      }

      return (await res.json()) as { access_token: string; user: AuthUser };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('Auth0 session exchange timed out');
      } else if (err instanceof Error) {
        // Re-throw non-retryable errors immediately
        if (err.message.includes('failed (4')) throw err;
        lastError = err;
      }
    }
  }

  throw lastError;
}

export function useAuth0Session() {
  const {
    isAuthenticated: auth0Authed,
    getAccessTokenSilently,
    isLoading,
    handleRedirectCallback,
  } = useAuth0();
  const { login, isAuthenticated: localAuthed } = useAuth();
  const exchanged = useRef(false);

  // -- Handle redirect callback (?code= in URL, only on /auth/callback) ------
  useEffect(() => {
    if (!AUTH0_ENABLED) return;
    if (window.location.pathname !== CALLBACK_PATH) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') || !params.has('state')) return;
    if (exchanged.current) return;
    exchanged.current = true;

    let cancelled = false;

    (async () => {
      try {
        await handleRedirectCallback();
        // SDK sets isAuthenticated=true → the exchange effect below fires
      } catch (err: unknown) {
        if (!cancelled) {
          exchanged.current = false;
          const msg =
            err instanceof Error ? err.message : 'Auth0 callback failed';
          toast.error(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      exchanged.current = false;
    };
    // Only run on mount for the callback page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Exchange Auth0 token for local session --------------------------------
  useEffect(() => {
    if (!AUTH0_ENABLED) return;
    if (isLoading || !auth0Authed || localAuthed || exchanged.current) return;

    exchanged.current = true;
    let cancelled = false;

    (async () => {
      try {
        const auth0Token = await getAccessTokenSilently();
        const data = await exchangeToken(auth0Token);

        if (!cancelled) {
          login(data.access_token, {
            ...data.user,
            isAuth0User: true,
            stepUp: data.user.stepUp ?? 'none',
            mfaEnrolled: data.user.mfaEnrolled ?? false,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          exchanged.current = false;
          const msg = err instanceof Error ? err.message : 'Auth0 login failed';
          toast.error(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      exchanged.current = false;
    };
  }, [auth0Authed, isLoading, localAuthed, getAccessTokenSilently, login]);
}
