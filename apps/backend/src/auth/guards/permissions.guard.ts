import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { hasPermission, isSuperUser, Role, RolePermissionOverride, Permission } from '@ovds/shared';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.reflector) {
      return true;
    }
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No user context available');
    }

    // Normalise to uppercase for consistent matching with Role constants
    const userRole = (typeof user.role === 'string' ? user.role.toUpperCase() : user.role) as Role;
    if (!userRole) {
      throw new ForbiddenException('No role assigned');
    }

    if (isSuperUser(userRole)) {
      return true;
    }

    const businessType = user.businessType || user.company?.businessType;
    const overrides: RolePermissionOverride[] = user.permissionOverrides || [];

    const hasRequiredPermission = requiredPermissions.some((permission) =>
      hasPermission(userRole, permission as Permission, businessType, undefined, overrides)
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}
