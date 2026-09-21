/**
 * Auth0LogoutHandler — mounts inside Auth0Provider and registers two listeners:
 *  1. Logout listener — lets AuthContext trigger a full Auth0 session logout
 *  2. Refresh listener — lets auth0Client.getAuth0Token() use the React SDK's
 *     getAccessTokenSilently (which has the refresh token) instead of the raw client
 *
 * Renders nothing. Mounted once inside Auth0Provider via Auth0ProviderWrapper.
 */
import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect } from 'react';

import { registerAuth0RefreshListener } from './auth0Client';
import { registerAuth0LogoutListener } from './auth0Logout';

export const Auth0LogoutHandler: React.FC = () => {
  const { logout, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const unregisterLogout = registerAuth0LogoutListener(() => {
      logout({ logoutParams: { returnTo: `${window.location.origin}/login` } });
    });

    const unregisterRefresh = registerAuth0RefreshListener(async () => {
      try {
        return await getAccessTokenSilently({ cacheMode: 'off' });
      } catch {
        return null;
      }
    });

    return () => {
      unregisterLogout();
      unregisterRefresh();
    };
  }, [logout, getAccessTokenSilently]);

  return null;
};
