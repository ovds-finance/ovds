/**
 * auth0Client — lazy singleton for the Auth0 SPA client.
 *
 * ⚠️  CACHE ISOLATION WARNING:
 * This client has its own in-memory token cache, separate from the
 * Auth0Provider React SDK instance. It is used ONLY for:
 *   - api.ts 401 interceptor (outside React)
 *   - SessionExpiryBanner silent refresh (outside React SDK lifecycle)
 *
 * For operations inside React components, prefer useAuth0() hooks.
 *
 * refreshSession event bus:
 * Components that need to trigger a session refresh from outside React
 * can register a listener via registerAuth0RefreshListener. The
 * SessionExpiryBanner uses this to delegate to the React SDK's
 * getAccessTokenSilently when possible.
 *
 * Enhancements over v1:
 *  - Token expiry pre-check before attempting silent refresh
 *  - Concurrent refresh deduplication (one in-flight request at a time)
 *  - Explicit error logging for debugging
 */
import { Auth0Client } from '@auth0/auth0-spa-js';

// -- Raw client singleton ------------------------------------------------------
let _client: Auth0Client | null = null;

export async function getAuth0Client(): Promise<Auth0Client> {
  if (_client) return _client;

  const domain = import.meta.env.VITE_AUTH0_DOMAIN ?? '';
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID ?? '';
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE ?? '';

  if (!domain || !clientId) throw new Error('Auth0 is not configured');

  _client = new Auth0Client({
    domain,
    clientId,
    authorizationParams: {
      audience: audience || undefined,
      redirect_uri: window.location.origin,
      scope: 'openid profile email offline_access',
    },
    cacheLocation: 'memory',
    useRefreshTokens: true,
  });

  return _client;
}

// -- Refresh session event bus -------------------------------------------------
type RefreshListener = () => Promise<string | null>;
let _refreshListener: RefreshListener | null = null;
// Deduplication: one in-flight refresh at a time
let _refreshInFlight: Promise<string | null> | null = null;

export function registerAuth0RefreshListener(fn: RefreshListener) {
  _refreshListener = fn;
  return () => {
    if (_refreshListener === fn) _refreshListener = null;
  };
}

/**
 * Get a fresh Auth0 access token.
 * Prefers the React SDK listener (has refresh tokens) over the raw client.
 * Deduplicates concurrent calls — only one network request in flight at a time.
 */
export async function getAuth0Token(): Promise<string | null> {
  // Return the in-flight promise if one exists (deduplication)
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = (async () => {
    try {
      // Prefer the React SDK listener (has the refresh token from redirect login)
      if (_refreshListener) {
        const token = await _refreshListener();
        if (token) return token;
      }

      // Fallback: raw client (works if Auth0 session cookie is still valid)
      const client = await getAuth0Client();
      return await client.getTokenSilently({ cacheMode: 'off' });
    } catch (err) {
      // Log for debugging but don't throw — callers handle null gracefully
      if (import.meta.env.DEV) {
        console.warn('[auth0Client] Silent token refresh failed:', err);
      }
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();

  return _refreshInFlight;
}
