import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isSuperUser } from '@ovds/shared';

import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — checks that the authenticated user carries one of the roles
 * declared via @Roles() on the handler or controller class.
 *
 * Role matching is case-insensitive to bridge the gap between existing JWT
 * tokens that may carry the legacy lowercase 'ovds' value and the canonical
 * uppercase 'OVDS' constant. After the next database migration all tokens
 * will carry uppercase values, and this normalisation can be removed.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No user context available');
    }

    const userRoles: string[] = (
      Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean)
    ).map((r: string) => r.toUpperCase());

    // Super-users (SPURADMIN, SUPERADMIN, DEVELOPER) bypass all role checks,
    // matching the same bypass logic in PermissionsGuard.
    if (userRoles.some((r) => isSuperUser(r))) {
      return true;
    }

    const hasRole = requiredRoles.some((role) =>
      userRoles.includes(role.toUpperCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
