/**
 * useRouteGuard — programmatic route-level RBAC guard.
 *
 * Checks whether the current user can access a given path and
 * returns the redirect target if not. Useful for imperative
 * navigation guards inside page components or layout wrappers.
 *
 * Usage:
 *   // In a page component — redirect away if not allowed
 *   const { allowed, redirectTo } = useRouteGuard('/hr/payroll-administration');
 *   if (!allowed) return <Navigate to={redirectTo} replace />;
 *
 *   // Check multiple routes at once
 *   const { canAccess } = useRouteGuard();
 *   if (canAccess('/vat-administration')) { ... }
 */
import { Role } from '@ovds/ui';
import { useMemo } from 'react';

import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { rbac } from '../rbac/rbac';

export interface RouteGuardResult {
  /** True when the current user can access the given path */
  allowed: boolean;
  /** Where to redirect when not allowed — defaults to '/forbidden' */
  redirectTo: string;
  /** Imperative check for any path */
  canAccess(path: string): boolean;
  /** Default landing route for the current role */
  defaultRoute: string;
}

export function useRouteGuard(path?: string): RouteGuardResult {
  const { user, isAuthenticated } = useAuth();
  const { selectedBusinessType } = useBusiness();

  return useMemo(() => {
    const role = user?.role ?? Role.EMPLOYEE;
    const businessType = selectedBusinessType || undefined;
    const defaultRoute = rbac.defaultRoute(role);

    const canAccess = (p: string): boolean => {
      if (!isAuthenticated || !user) return false;
      return rbac.canAccessRoute(role, p, businessType);
    };

    const allowed = path ? canAccess(path) : true;
    const redirectTo = !isAuthenticated ? '/login' : '/forbidden';

    return { allowed, redirectTo, canAccess, defaultRoute };
  }, [user, isAuthenticated, path, selectedBusinessType]);
}
