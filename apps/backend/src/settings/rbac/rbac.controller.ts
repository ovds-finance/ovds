/**
 * RbacController — REST CRUD for Permission and RoleDefinition entities.
 *
 * Base: /settings/rbac
 *
 * Permissions:
 *   GET    /settings/rbac/permissions              list (filterable)
 *   GET    /settings/rbac/permissions/:id          get one
 *   POST   /settings/rbac/permissions              create
 *   PATCH  /settings/rbac/permissions/:id          update
 *   PATCH  /settings/rbac/permissions/:id/toggle   enable / disable
 *   DELETE /settings/rbac/permissions/:id          delete
 *   POST   /settings/rbac/permissions/seed         seed from @ovds/shared
 *
 * Roles:
 *   GET    /settings/rbac/roles                    list (filterable)
 *   GET    /settings/rbac/roles/:id                get one
 *   POST   /settings/rbac/roles                    create
 *   PATCH  /settings/rbac/roles/:id                update
 *   PATCH  /settings/rbac/roles/:id/toggle         enable / disable
 *   DELETE /settings/rbac/roles/:id                delete
 *   PUT    /settings/rbac/roles/:id/permissions    replace permission list
 *   DELETE /settings/rbac/roles/:id/permissions/:permissionId  remove single
 *   POST   /settings/rbac/roles/seed               seed system roles
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CheckPolicy }       from '../../auth/decorators/check-policy.decorator';
import { Permissions }       from '../../auth/decorators/permissions.decorator';
import { AccessPolicyGuard } from '../../auth/guards/access-policy.guard';
import { JwtAuthGuard }      from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard }  from '../../auth/guards/permissions.guard';
import { RolesGuard }        from '../../auth/guards/roles.guard';

import { RbacService }       from './rbac.service';

@ApiTags('settings-rbac')
@Controller('settings/rbac')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, AccessPolicyGuard)
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  // ── Permissions ──────────────────────────────────────────────────────────

  @Get('permissions')
  @Permissions('role_permissions:read', 'settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List permissions' })
  listPermissions(
    @Query('companyId') companyId?: string,
    @Query('category')  category?:  string,
    @Query('isActive')  isActive?:  string,
  ) {
    return this.rbac.listPermissions({
      companyId,
      category,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('permissions/seed')
  @Permissions('role_permissions:write', 'settings:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dry-run: preview seed count' })
  async previewSeed(@Query('companyId') companyId?: string) {
    // lightweight count — does not insert
    const existing = await this.rbac.listPermissions({ companyId });
    return { existing: existing.length };
  }

  @Post('permissions/seed')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed canonical permissions from @ovds/shared' })
  seedPermissions(@Body() body: { companyId?: string }) {
    return this.rbac.seedPermissions(body.companyId);
  }

  @Get('permissions/:id')
  @Permissions('role_permissions:read', 'settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one permission' })
  getPermission(@Param('id') id: string) {
    return this.rbac.getPermission(id);
  }

  @Post('permissions')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a permission' })
  createPermission(
    @Body() body: {
      name: string;
      description?: string;
      category?: string;
      isActive?: boolean;
      companyId?: string;
    },
  ) {
    return this.rbac.createPermission(body);
  }

  @Patch('permissions/:id')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a permission' })
  updatePermission(
    @Param('id') id: string,
    @Body() body: { description?: string; category?: string; isActive?: boolean },
  ) {
    return this.rbac.updatePermission(id, body);
  }

  @Patch('permissions/:id/toggle')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle permission active status' })
  togglePermission(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.rbac.togglePermission(id, body.isActive);
  }

  @Delete('permissions/:id')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a permission' })
  deletePermission(@Param('id') id: string) {
    return this.rbac.deletePermission(id);
  }

  // ── Roles ────────────────────────────────────────────────────────────────

  @Get('roles')
  @Permissions('role_permissions:read', 'settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List role definitions' })
  listRoles(
    @Query('companyId') companyId?: string,
    @Query('isActive')  isActive?:  string,
    @Query('isSystem')  isSystem?:  string,
  ) {
    return this.rbac.listRoles({
      companyId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      isSystem: isSystem === undefined ? undefined : isSystem === 'true',
    });
  }

  @Post('roles/seed')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed system role definitions' })
  seedRoles(@Body() body: { companyId?: string }) {
    return this.rbac.seedRoles(body.companyId);
  }

  @Get('roles/:id')
  @Permissions('role_permissions:read', 'settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one role definition' })
  getRole(@Param('id') id: string) {
    return this.rbac.getRole(id);
  }

  @Post('roles')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a role definition' })
  createRole(
    @Body() body: {
      name: string;
      description?: string;
      isActive?: boolean;
      apiAccess?: boolean;
      companyId?: string;
    },
  ) {
    return this.rbac.createRole(body);
  }

  @Patch('roles/:id')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a role definition' })
  updateRole(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isActive?: boolean; apiAccess?: boolean },
  ) {
    return this.rbac.updateRole(id, body);
  }

  @Patch('roles/:id/toggle')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle role active status' })
  toggleRole(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.rbac.toggleRole(id, body.isActive);
  }

  @Delete('roles/:id')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role definition' })
  deleteRole(@Param('id') id: string) {
    return this.rbac.deleteRole(id);
  }

  @Put('roles/:id/permissions')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replace all permissions on a role' })
  assignPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.rbac.assignPermissions(id, body.permissionIds);
  }

  @Delete('roles/:id/permissions/:permissionId')
  @Permissions('role_permissions:write', 'settings:write')
  @CheckPolicy('role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove one permission from a role' })
  removePermission(
    @Param('id')           id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbac.removePermissionFromRole(id, permissionId);
  }

  // ── Hierarchy ────────────────────────────────────────────────────────────

  @Get('hierarchy')
  @Permissions('role_permissions:read', 'settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get full role hierarchy with permission counts, groups, and active security-policy enforcement status per role',
  })
  getHierarchy(@Query('companyId') companyId?: string) {
    return this.rbac.getHierarchy(companyId);
  }
}
