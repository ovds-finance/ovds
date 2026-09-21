/**
 * AuthContext — single runtime identity + session store.
 *
 * Responsibilities:
 *  - Owns the session (token + user) in React state
 *  - Decodes JWT expiry and warns the user before it expires
 *  - Syncs logout across browser tabs via the storage event
 *  - Exposes fine-grained RBAC helpers via the RBAC policy layer
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useBusiness } from '../context/businessContext';
import { clearQueryCache } from '../hooks/useApiQuery';
import api, { bgConfig } from '../services/api';
import { isHttpOnlyAuth, setCsrfToken, clearCsrfToken } from '../utils/authMode';
import { BEARER_PREFIX } from '../utils/constants';
import { clearSession } from '../utils/storage';

import { triggerAuth0Logout } from './auth0Logout';
import { rbac, type AppRole, type Permission, type PermissionContext } from './rbac';

// -- Types ---------------------------------------------------------------------

export interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
  employeeId?: string;
  companyId?: string;
  subsidiary?: string;
  lastLoginAt?: string | null;
  /** True when this session was established via Auth0 SSO */
  isAuth0User?: boolean;
  /** Auth step-up level: 'full' (MFA completed) | 'partial' | 'none' */
  stepUp?: 'full' | 'partial' | 'none';
  /** True when the user has at least one MFA factor enrolled in Auth0 */
  mfaEnrolled?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Minutes remaining until token expires, null if unknown */
  expiresInMinutes: number | null;
  /** True when < WARN_BEFORE_MINUTES remain */
  sessionExpiring: boolean;
}

export interface AuthContextValue extends AuthState {
  login(token: string | null, user: AuthUser, csrfToken?: string): void;
  logout(): void;
  /** Re-sync user attributes from /auth/me without logging out */
  refreshUser(): Promise<void>;
  /** Dismiss the expiry warning banner */
  dismissExpiryWarning(): void;
  can(permission: Permission, context?: PermissionContext): boolean;
  /** Returns true if the user has ANY of the given permissions */
  canAny(permissions: Permission[], context?: PermissionContext): boolean;
  /** Returns true if the user has ALL of the given permissions */
  canAll(permissions: Permission[], context?: PermissionContext): boolean;
  is(...roles: AppRole[]): boolean;
  canAccessRoute(path: string): boolean;
  /** Effective VAT access level for the current user */
  vatLevel: 'none' | 'read' | 'write' | 'admin';
  /** Generic access level for any resource prefix (e.g. 'fund_transfers') */
  accessLevel(resource: string): 'none' | 'read' | 'write' | 'admin';
  /** Returns true if the current role's hierarchy weight >= target role */
  isAtLeast(...roles: AppRole[]): boolean;
  /** Returns a flat domain → access-level map for the current role */
  domainAccessMap(): Record<string, 'none' | 'read' | 'write' | 'admin'>;
  isAdmin: boolean;
  isHR: boolean;
  isOvds: boolean;
  isEmployee: boolean;
  isAuditor: boolean;
  isStaff: boolean;
  /** True when the user is an IFRS Officer (AFIS compliance) */
  isIfrsOfficer: boolean;
  /** True when the user is a Bank Liaison (banking operations) */
  isBankLiaison: boolean;
  /** True when the user is an External Auditor (statutory audit) */
  isExternalAuditor: boolean;
  /** True when the session was established via Auth0 SSO */
  isAuth0User: boolean;
  /** Auth step-up level from Auth0 MFA: 'full' | 'partial' | 'none' */
  stepUp: 'full' | 'partial' | 'none';
  /** True when the user has at least one MFA factor enrolled in Auth0 */
  mfaEnrolled: boolean;
  /** True when the user completed MFA this session (stepUp === 'full') */
  hasMfa: boolean;
}

// -- Constants -----------------------------------------------------------------

const TOKEN_KEY = 'ovds_token';
const USER_KEY = 'ovds_user';
const WARN_BEFORE = 5; // warn when ≤ 5 minutes remain
const CHECK_INTERVAL = 30_000; // check every 30 s

// -- JWT helpers ---------------------------------------------------------------

function decodeExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function minutesUntilExpiry(token: string): number | null {
  const exp = decodeExp(token);
  if (!exp) return null;
  return Math.floor((exp * 1000 - Date.now()) / 60_000);
}

function isTokenExpired(token: string): boolean {
  const mins = minutesUntilExpiry(token);
  return mins !== null && mins <= 0;
}

// -- Storage helpers -----------------------------------------------------------

function readSession(): Omit<
  AuthState,
  'expiresInMinutes' | 'sessionExpiring'
> {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return { user: null, token: null, isAuthenticated: false };

    if (isHttpOnlyAuth()) {
      const user = JSON.parse(raw) as AuthUser;
      if (!user?.id || !user?.role)
        return { user: null, token: null, isAuthenticated: false };
      return { user, token: null, isAuthenticated: true };
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { user: null, token: null, isAuthenticated: false };
    if (isTokenExpired(token)) {
      clearStorage();
      return { user: null, token: null, isAuthenticated: false };
    }
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.id || !user?.role)
      return { user: null, token: null, isAuthenticated: false };
    return { user, token, isAuthenticated: true };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
}

function writeStorage(token: string | null, user: AuthUser, csrfToken?: string): void {
  if (!isHttpOnlyAuth() && token) localStorage.setItem(TOKEN_KEY, token);
  if (!isHttpOnlyAuth() && !token) localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (csrfToken) setCsrfToken(csrfToken);
}

function clearStorage(): void {
  // HttpOnly mode: token lives in a cookie, not localStorage — don't
  // attempt to remove a key that doesn't exist in that mode.
  if (!isHttpOnlyAuth()) {
    localStorage.removeItem(TOKEN_KEY);
  }
  clearSession();   // removes all UI/session keys via the central utility
  clearCsrfToken(); // CSRF token lives in sessionStorage via authMode.ts
}

// eslint-disable-next-line react-refresh/only-export-components
export function clearAllCache(): void {
  clearStorage();
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

// -- Context -------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const base = readSession();
  const [state, setState] = useState<AuthState>({
    ...base,
    expiresInMinutes: base.token ? minutesUntilExpiry(base.token) : null,
    sessionExpiring: false,
  });
  const [warningDismissed, setWarningDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Validate stored token against /auth/me on mount -----------------------
  useEffect(() => {
    const { token, user } = readSession();
    if (!user && !token) return;
    if (!isHttpOnlyAuth() && !token) return;
    // Use the axios instance so the JWT interceptor and error handling apply
    api.get('/auth/me', bgConfig())
      .then((res: any) => {
        const data = res.data?.data ?? res.data as AuthUser;
        if (user && data) {
          const updated = { ...user, ...data };
          if (JSON.stringify(updated) !== JSON.stringify(user)) {
            writeStorage(token, updated);
            setState((prev) => ({ ...prev, user: updated }));
          }
        }
      })
      .catch((err: any) => {
        if (isHttpOnlyAuth() || err?.response?.status === 401) {
          clearStorage();
          setState({
            user: null, token: null, isAuthenticated: false,
            expiresInMinutes: null, sessionExpiring: false,
          });
        }
      });
  }, []);

  // -- Proactive token refresh before expiry -----------------------------------
  const refreshTokenIfNeeded = useCallback(async () => {
    if (isHttpOnlyAuth()) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const mins = minutesUntilExpiry(token);
    if (mins === null || mins > 5) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `${BEARER_PREFIX}${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { access_token?: string };
        if (data.access_token) {
          localStorage.setItem(TOKEN_KEY, data.access_token);
          setState((prev) => ({
            ...prev,
            token: data.access_token ?? null,
            expiresInMinutes: minutesUntilExpiry(data.access_token ?? ''),
            sessionExpiring: false,
          }));
          window.dispatchEvent(new CustomEvent('ovds:token-refreshed'));
        }
      }
    } catch {
      // silent — next tick or 401 interceptor will handle failure
    }
  }, []);

  // -- Expiry ticker ---------------------------------------------------------
  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.token) return prev;
      const mins = minutesUntilExpiry(prev.token);
      if (mins !== null && mins <= 0) {
        clearStorage();
        window.dispatchEvent(new CustomEvent('ovds:session-expired'));
        return {
          user: null,
          token: null,
          isAuthenticated: false,
          expiresInMinutes: null,
          sessionExpiring: false,
        };
      }
      return {
        ...prev,
        expiresInMinutes: mins,
        sessionExpiring: mins !== null && mins <= WARN_BEFORE,
      };
    });
    refreshTokenIfNeeded();
  }, [refreshTokenIfNeeded]);

  useEffect(() => {
    timerRef.current = setInterval(tick, CHECK_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tick]);

  // -- Cross-tab sync + in-tab token refresh notification -------------------
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        const next = readSession();
        setState((prev) => ({
          ...prev,
          ...next,
          expiresInMinutes: next.token ? minutesUntilExpiry(next.token) : null,
          sessionExpiring: false,
        }));
      }
    };
    // Custom event fired by api.ts after a successful Auth0 silent token refresh
    // (same tab — the native 'storage' event only fires in other tabs)
    const onTokenRefreshed = () => {
      const next = readSession();
      if (next.token) {
        setState((prev) => ({
          ...prev,
          ...next,
          expiresInMinutes: minutesUntilExpiry(next.token!),
          sessionExpiring: false,
        }));
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('ovds:token-refreshed', onTokenRefreshed);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ovds:token-refreshed', onTokenRefreshed);
    };
  }, []);

  // -- Actions ---------------------------------------------------------------
  const login = useCallback((token: string | null, user: AuthUser, csrfToken?: string) => {
    writeStorage(token, user, csrfToken);
    setWarningDismissed(false);
    setState({
      user,
      token,
      isAuthenticated: true,
      expiresInMinutes: token ? minutesUntilExpiry(token) : null,
      sessionExpiring: false,
    });
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget audit log — don't block UI
    const token = localStorage.getItem(TOKEN_KEY);
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY) ?? '{}');
      } catch {
        return {};
      }
    })();
    const isAuth0 = !!user?.isAuth0User;

    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: isHttpOnlyAuth() ? 'include' : 'same-origin',
      headers: token ? { Authorization: `${BEARER_PREFIX}${token}` } : {},
    }).catch(() => {});
    clearStorage();
    clearQueryCache(); // prevent stale data from a previous session being served to the next user
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresInMinutes: null,
      sessionExpiring: false,
    });

    // Dispatch custom event so BusinessProvider (and other consumers)
    // can clear state synchronously within the same tab.
    window.dispatchEvent(new CustomEvent('ovds:session-cleared'));

    if (isAuth0 && import.meta.env.VITE_AUTH0_ENABLED === 'true') {
      // Delegate to the Auth0LogoutHandler which has access to the SDK hook
      triggerAuth0Logout();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const dismissExpiryWarning = useCallback(() => setWarningDismissed(true), []);

  /** Re-sync user attributes from /auth/me (e.g. after role change, company assignment) */
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token && !isHttpOnlyAuth()) return;
    try {
      const res = await api.get('/auth/me', bgConfig());
      const data = (res.data?.data ?? res.data) as AuthUser;
      setState((prev) => {
        if (!prev.user) return prev;
        const updated = { ...prev.user, ...data };
        writeStorage(token, updated);
        return { ...prev, user: updated };
      });
    } catch {
      /* network offline — keep current user */
    }
  }, []);

  // -- Context value ---------------------------------------------------------
  const { selectedBusinessType } = useBusiness();
  const businessType = selectedBusinessType || undefined;

  const value = useMemo<AuthContextValue>(() => {
    const role = (state.user?.role ?? 'EMPLOYEE') as AppRole;
    return {
      ...state,
      sessionExpiring: state.sessionExpiring && !warningDismissed,
      login,
      logout,
      refreshUser,
      dismissExpiryWarning,
      can: (p: Permission, ctx?: PermissionContext) => rbac.can(role, p, ctx, businessType),
      canAny: (ps: Permission[], ctx?: PermissionContext) => rbac.canAny(role, ps, ctx, businessType),
      canAll: (ps: Permission[], ctx?: PermissionContext) => rbac.canAll(role, ps, ctx, businessType),
      is: (...roles: AppRole[]) => rbac.is(role, ...roles),
      canAccessRoute: (path: string) => rbac.canAccessRoute(role, path, businessType),
      vatLevel: rbac.vatLevel(role, businessType),
      accessLevel: (resource: string) => rbac.accessLevel(role, resource, businessType),
      isAtLeast: (...targets: AppRole[]) => targets.some((t) => rbac.isAtLeast(role, t)),
      domainAccessMap: () => rbac.domainAccessMap(role, businessType),
      isAdmin: role === 'ADMIN' || role === 'SPURADMIN' || role === 'SUPERADMIN',
      isHR: role === 'HR',
      isOvds: role === 'OVDS' || role === 'ACCOUNTING',
      isEmployee: role === 'EMPLOYEE',
      isAuditor: role === 'AUDITOR',
      isStaff: role !== 'EMPLOYEE' && role !== 'CLIENT' && role !== 'PARTNER',
      isIfrsOfficer: role === 'IFRS_OFFICER',
      isBankLiaison: role === 'BANK_LIAISON',
      isExternalAuditor: role === 'EXTERNAL_AUDITOR',
      isAuth0User: !!state.user?.isAuth0User,
      stepUp: (state.user?.stepUp ?? 'none') as 'full' | 'partial' | 'none',
      mfaEnrolled: !!state.user?.mfaEnrolled,
      hasMfa: state.user?.stepUp === 'full',
    };
  }, [state, warningDismissed, login, logout, refreshUser, dismissExpiryWarning, businessType]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
