/**
 * useRoleRedirect — redirects the user to their role's default landing route
 * when they land on a page they shouldn't be on.
 *
 * Usage:
 *   // In a page that should only be accessible to specific roles:
 *   useRoleRedirect({ allow: ['ADMIN', 'SPURADMIN'] });
 *
 *   // Redirect to a specific path instead of the default route:
 *   useRoleRedirect({ allow: ['ovds', 'ACCOUNTING'], fallback: '/accounting' });
 *
 *   // Redirect if user lacks a permission:
 *   useRoleRedirect({ requirePermission: 'payroll:admin' });
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../rbac/AuthContext';
import { rbac, type AppRole, type Permission } from '../rbac';

interface UseRoleRedirectOptions {
  /** Roles that are allowed — redirect everyone else */
  allow?: AppRole[];
  /** Roles that are blocked — redirect these roles */
  block?: AppRole[];
  /** Permission required — redirect if user lacks it */
  requirePermission?: Permission;
  /** Where to redirect — defaults to the user's default route */
  fallback?: string;
  /** Skip the redirect entirely */
  skip?: boolean;
}

export function useRoleRedirect(options: UseRoleRedirectOptions = {}) {
  const { allow, block, requirePermission, fallback, skip = false } = options;
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (skip || !isAuthenticated || !user) return;

    const role = user.role;
    let shouldRedirect = false;

    if (allow && allow.length > 0 && !allow.includes(role)) {
      shouldRedirect = true;
    }
    if (block && block.length > 0 && block.includes(role)) {
      shouldRedirect = true;
    }
    if (requirePermission && !rbac.can(role, requirePermission)) {
      shouldRedirect = true;
    }

    if (shouldRedirect) {
      const target = fallback ?? rbac.defaultRoute(role);
      navigate(target, { replace: true });
    }
  }, [user, isAuthenticated, allow, block, requirePermission, fallback, skip, navigate]);
}

