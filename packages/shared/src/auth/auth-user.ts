/**
 * AuthUser — the authenticated user shape returned by the session endpoint.
 * Single source of truth — shared between frontend and backend.
 *
 * This is the minimal JWT/session payload. The full React context
 * (with RBAC helpers, stepUp, mfaEnrolled) lives in apps/frontend/src/rbac/AuthContext.tsx.
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  companyId: string | null;
  employeeId: string | null;
  hasAuth0: boolean;
}
