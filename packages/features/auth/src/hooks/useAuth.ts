import { useState, useCallback } from 'react';
import { authApi } from '../services/authApi';

export function useAuthMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setLoading(true); setError(null);
    try { return await fn(); }
    catch (e: any) { setError(e?.message ?? 'Auth operation failed'); return null; }
    finally { setLoading(false); }
  }
  return {
    loading, error,
    login:          (creds: { username: string; password: string }) => run(() => authApi.login(creds)),
    logout:         () => run(() => authApi.logout()),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      run(() => authApi.changePassword(data)),
    resetPassword:  (token: string, newPassword: string) =>
      run(() => authApi.resetPassword(token, newPassword)),
  };
}
