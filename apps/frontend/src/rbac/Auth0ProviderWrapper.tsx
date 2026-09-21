/**
 * Auth0ProviderWrapper — conditionally wraps the app with Auth0Provider.
 *
 * Only active when VITE_AUTH0_ENABLED=true. When disabled, renders children
 * directly so the existing username/password flow is completely unaffected.
 *
 * Features:
 *  - onRedirectCallback: strips ?code=&state= and navigates to intended destination
 *  - Refresh tokens: enabled for silent re-auth without full redirect
 *  - Memory cache: tokens never touch localStorage (XSS protection)
 *  - Connection hint: VITE_AUTH0_CONNECTION lets you pre-select an enterprise
 *    connection (e.g. "google-apps", "samlp-ovds") on the Universal Login page
 */
import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import React, { useCallback } from 'react';

import { Auth0LogoutHandler } from './auth0LogoutHandler';

const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN ?? '';
const AUTH0_CLIENT = import.meta.env.VITE_AUTH0_CLIENT_ID ?? '';
const AUTH0_AUD = import.meta.env.VITE_AUTH0_AUDIENCE ?? '';
const AUTH0_CONNECTION = import.meta.env.VITE_AUTH0_CONNECTION ?? ''; // optional enterprise connection

const Inner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const onRedirectCallback = useCallback((appState?: AppState) => {
    const target = appState?.returnTo ?? window.location.pathname;
    // Use replaceState to strip the ?code=&state= params without a full reload
    window.history.replaceState({}, document.title, target);
  }, []);

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/auth/callback`,
        audience: AUTH0_AUD || undefined,
        scope: 'openid profile email offline_access',
        // Pre-select enterprise connection if configured (skips the connection picker)
        ...(AUTH0_CONNECTION ? { connection: AUTH0_CONNECTION } : {}),
      }}
      onRedirectCallback={onRedirectCallback}
      // Memory cache: tokens are never written to localStorage or sessionStorage.
      // This prevents XSS token theft at the cost of losing the session on hard refresh
      // (mitigated by silent refresh via refresh tokens).
      cacheLocation="memory"
      useRefreshTokens={true}
      // Rotate refresh tokens on every use (requires "Refresh Token Rotation" in Auth0 dashboard)
      useRefreshTokensFallback={true}
    >
      <Auth0LogoutHandler />
      {children}
    </Auth0Provider>
  );
};

export const Auth0ProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // All three values must be non-empty strings for Auth0 to work
  if (!AUTH0_ENABLED || !AUTH0_DOMAIN.trim() || !AUTH0_CLIENT.trim()) {
    return <>{children}</>;
  }
  return <Inner>{children}</Inner>;
};
