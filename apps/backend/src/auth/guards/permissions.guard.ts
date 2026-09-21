import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  hasPermission,
  isSuperUser,
  Role,
  RolePermissionOverride,
  Permission,
  PermissionContext,
} from '@ovds/shared';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * PermissionsGuard — RBAC + contextual-rule enforcement.
 *
 * Layer 2 of 3 in the authorization chain:
 *   1. JwtAuthGuard  — who is the user?
 *   2. PermissionsGuard — do they have the permission? (this guard)
 *   3. AccessPolicyGuard — ABAC: IP, time-window, resource ownership
 *
 * What changed from the original:
 *   • Builds a PermissionContext from the live request so that
 *     CONTEXTUAL_RULES in @ovds/shared are actually evaluated.
 *     Previously ctx was always `undefined`, making amount-gated and
 *     status-gated rules dead code.
 *   • The context is also attached to `request.permissionContext` so
 *     AccessPolicyGuard (and service-layer callers) can read it without
 *     re-extracting from the raw request.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.reflector) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<any>();
    const { user } = request;

    if (!user) {
      // Not yet authenticated — defer to JwtAuthGuard (avoids 403 before 401).
      return true;
    }

    const userRole = (
      typeof user.role === 'string' ? user.role.toUpperCase() : user.role
    ) as Role;

    if (!userRole) throw new ForbiddenException('No role assigned');
    if (isSuperUser(userRole)) return true;

    const businessType: string | undefined =
      user.businessType ?? user.company?.businessType;
    const overrides: RolePermissionOverride[] = user.permissionOverrides ?? [];

    // ── Build PermissionContext from the live request ───────────────────────
    // Merge body, params, and query so contextual rules receive the data they
    // need regardless of where the caller placed it (body for mutations,
    // params for resource-scoped reads, query for filters).
    const raw: Record<string, unknown> = {
      ...(request.query  ?? {}),
      ...(request.params ?? {}),
      ...(request.body   ?? {}),
    };

    const permCtx: PermissionContext = {
      // Numeric amount for approval-limit rules (payroll, fund transfers)
      amount: raw.amount !== undefined ? Number(raw.amount) : undefined,
      // Document lifecycle status (DRAFT, POSTED, SENT …)
      status: typeof raw.status === 'string' ? raw.status : undefined,
      // Cross-tenant boundary check
      companyId: user.companyId ?? undefined,
      // Ownership: true when the resource's createdBy/ownerId matches the JWT user
      isOwner:
        raw.ownerId  === user.userId ||
        raw.createdBy === user.userId ||
        raw.userId   === user.userId ||
        undefined,
      // Current wall-clock time for time-bound access rules
      time: new Date(),
    };

    // Attach to request so downstream guards and services can reuse it
    request.permissionContext = permCtx;

    const hasRequired = requiredPermissions.some((permission) =>
      hasPermission(
        userRole,
        permission as Permission,
        businessType,
        permCtx,
        overrides,
      ),
    );

    if (!hasRequired) {
      throw new ForbiddenException(
        `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
