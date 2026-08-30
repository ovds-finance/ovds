/**
 * auth0TokenRefresh — thin wrapper used by the api.ts 401 interceptor.
 * Dynamically imported to avoid loading Auth0 SDK when it's disabled.
 */
import { getAuth0Token } from '../rbac/auth0Client';
import { BEARER_PREFIX } from '../utils/constants';

export async function refreshAuth0Token(): Promise<string | null> {
  try {
    const auth0Token = await getAuth0Token();
    if (!auth0Token) return null;

    // Exchange Auth0 token for a fresh local JWT
    const res = await fetch('/api/auth/auth0/session', {
      method: 'POST',
      headers: { Authorization: `${BEARER_PREFIX}${auth0Token}` },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

