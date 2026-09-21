import { type AuthProvider, type CheckResponse } from "@refinedev/core";

import { BEARER_PREFIX } from '../utils/constants';

/** Auth-specific localStorage/sessionStorage keys owned by this app. */
const AUTH_STORAGE_KEYS = [
  "ovds_token",
  "auth0_token",
  "ovds_user",
  "selectedCompanyId",
  "ovds_refresh_token",
];

/**
 * Remove only auth-related keys from storage.
 * Using localStorage.clear() would wipe unrelated data from third-party
 * widgets, PWA caches, and other browser tabs — avoid it.
 */
function clearAuthStorage(): void {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem("auth0_token");
    sessionStorage.removeItem("auth0_user");
  } catch {
    // ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

function readToken(): string | null {
  try {
    return (
      localStorage.getItem("ovds_token") ||
      localStorage.getItem("auth0_token") ||
      sessionStorage.getItem("auth0_token")
    );
  } catch {
    return null;
  }
}

function readUser(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem("ovds_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const refineAuthProvider: AuthProvider = {
  login: async () => {
    return { success: true };
  },

  logout: async () => {
    const token = readToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `${BEARER_PREFIX}${token}` },
          credentials: "include",
        });
      } catch {
        // ignore logout errors — storage must still be cleared
      }
    }
    clearAuthStorage();
    window.location.href = "/login";
    return { success: true };
  },

  check: async (): Promise<CheckResponse> => {
    const token = readToken();
    if (!token) {
      return { authenticated: false, redirectTo: "/login" };
    }
    return { authenticated: true };
  },

  onError: async (error: any) => {
    if ((error as any)?.response?.status === 401) {
      clearAuthStorage();
      return { redirectTo: "/login", logout: true };
    }
    return {};
  },

  getPermissions: async () => {
    const user = readUser();
    return user?.role ?? null;
  },

  getIdentity: async () => {
    const user = readUser();
    if (!user) return null;
    return {
      ...user,
      name: user.username || user.email,
      avatar: user.picture || user.avatar,
    };
  },

  register: async () => ({ success: false }),
  forgotPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
};

export { refineAuthProvider };
