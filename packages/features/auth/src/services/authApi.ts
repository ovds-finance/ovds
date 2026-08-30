/**
 * Auth domain API client — @ovds/features/auth
 */

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}
function headers(auth = true): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) || (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}
async function req<T>(url: string, method = 'GET', body?: unknown, authRequired = true): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, { method, headers: headers(authRequired), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!res.ok) { const text = await res.text().catch(() => res.statusText); throw new Error(`${res.status}: ${text}`); }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}

export const authApi = {
  login:          (credentials: { username: string; password: string }) =>
    req<any>('/auth/login', 'POST', credentials, false),
  register:       (data: any) => req<any>('/auth/register', 'POST', data, false),
  me:             () => req<any>('/auth/me'),
  refresh:        () => req<any>('/auth/refresh', 'POST'),
  logout:         () => req<any>('/auth/logout', 'DELETE'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    req<any>('/auth/change-password', 'POST', data),
  forgotPassword: (email: string) =>
    req<any>('/auth/forgot-password', 'POST', { email }, false),
  resetPassword:  (token: string, newPassword: string) =>
    req<any>('/auth/reset-password', 'POST', { token, newPassword }, false),
  verifyMfa:      (code: string) => req<any>('/auth/mfa/verify', 'POST', { code }),
  enrollMfa:      () => req<any>('/auth/mfa/enroll', 'POST'),
  users:          (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set('page',   String(params.page));
    if (params?.limit)  q.set('limit',  String(params.limit));
    if (params?.search) q.set('search', params.search);
    const s = q.toString();
    return req<any>(`/auth/users${s ? `?${s}` : ''}`);
  },
  updateUser:  (id: string, data: any) => req<any>(`/auth/users/${id}`, 'PATCH', data),
  deleteUser:  (id: string) => req<any>(`/auth/users/${id}`, 'DELETE'),
};

