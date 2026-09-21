import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus, Query, Request } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT } from '@ovds/shared';

import { AccessPolicyService } from '../auth/access-policy/access-policy.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Throttle } from '../common/throttle.decorator';


import { SaveSecurityPolicyDto, TestSecurityPolicyDto } from './dto/security-policy.dto';
import { SettingsService } from './settings.service';



@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly accessPolicyService: AccessPolicyService,
  ) {}

  @Get()
  @Permissions('settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  @Throttle(THROTTLE_TTL_MS, 10)
  @Permissions('settings:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save system settings' })
  async saveSettings(@Body() body: Record<string, unknown>) {
    return this.settingsService.saveSettings(body);
  }

  @Get('export')
  @Permissions('settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export full system backup' })
  async exportSettings() {
    return this.settingsService.exportSettings();
  }

  @Get('catalog')
  @Permissions('settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get settings catalog' })
  async getCatalog() {
    return this.settingsService.getCatalog();
  }

  @Get('modules')
  @Permissions('settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get module settings' })
  async getModules() {
    return this.settingsService.getModules();
  }

  @Get('roles')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role settings' })
  async getRoles() {
    return this.settingsService.getRoles();
  }

  @Get('inputs')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get setting inputs' })
  async getInputs() {
    return this.settingsService.getInputs();
  }

  @Get('templates')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get setting templates' })
  async getTemplates() {
    return this.settingsService.getTemplates();
  }

  @Get('profile')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get company profile settings' })
  async getProfile() {
    return this.settingsService.getProfile();
  }

  @Get('central-control-panel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get central control panel settings' })
  async getCentralControlPanel() {
    return this.settingsService.getCentralControlPanel();
  }

  @Get('unified-control-node')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unified control node settings' })
  async getUnifiedControlNode(@Query() query: Record<string, string>) {
    return this.settingsService.getUnifiedControlNode(query);
  }

  @Get('email')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get email settings' })
  async getEmailSettings() {
    return this.settingsService.getEmailSettings();
  }

  @Patch('email')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save email settings' })
  async saveEmailSettings(@Body() body: Record<string, unknown>) {
    return this.settingsService.saveEmailSettings(body);
  }

  @Post('email/test')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test email settings' })
  async testEmailSettings(@Body() body: Record<string, unknown>) {
    return this.settingsService.testEmailSettings(body);
  }

  @Get('merge-sources')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get merge sources' })
  async getMergeSources() {
    return this.settingsService.getMergeSources();
  }

  // ── Security Policy (ABAC per-tenant config) ─────────────────────────────

  @Get('security-policy')
  @Permissions('settings:read', 'role_permissions:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the tenant ABAC security policy' })
  async getSecurityPolicy(@Query('companyId') companyId?: string) {
    return this.settingsService.getSecurityPolicy(companyId);
  }

  @Patch('security-policy')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Permissions('settings:write', 'role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the tenant ABAC security policy' })
  async saveSecurityPolicy(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) body: SaveSecurityPolicyDto,
    @Request() req: any,
  ) {
    const actor = { userId: req.user?.userId, role: req.user?.role };
    return this.settingsService.saveSecurityPolicy(body, actor);
  }

  @Get('security-policy/history')
  @Permissions('settings:read', 'role_permissions:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get policy change history and recent access-denial events' })
  async getSecurityPolicyHistory(
    @Query('companyId') companyId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.settingsService.getSecurityPolicyHistory(companyId, limit ? parseInt(limit, 10) : 20);
  }

  @Post('security-policy/test')
  @Throttle(THROTTLE_TTL_MS, 20)
  @Permissions('settings:read', 'role_permissions:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate ABAC policy enforcement against a test payload' })
  async testSecurityPolicy(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) body: TestSecurityPolicyDto,
  ) {
    return this.settingsService.testSecurityPolicy(body);
  }

  @Get('security-policy/all')
  @Roles('SPURADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super-admin: list all companies with their policy summary and denial counts' })
  async getAllSecurityPolicies() {
    return this.settingsService.getAllSecurityPolicies();
  }

  @Delete('security-policy')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Permissions('settings:write', 'role_permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset (clear) the entire security policy for a company' })
  async resetSecurityPolicy(
    @Query('companyId') companyId?: string,
    @Request() req: any = {},
  ) {
    const actor = { userId: req.user?.userId, role: req.user?.role };
    return this.settingsService.resetSecurityPolicy(companyId, actor);
  }

  @Post('security-policy/check-role')
  @Throttle(THROTTLE_TTL_MS, 30)
  @Permissions('settings:read', 'role_permissions:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full ABAC enforcement decision chain for a (role, permissions, context) triple',
  })
  async checkRoleAccess(
    @Body() body: {
      role: string;
      permissions?: string[];
      companyId?: string | null;
      ipAddress?: string;
      requestTime?: string;
      mfaVerified?: boolean;
      mfaEnrolled?: boolean;
      resourceOwnerId?: string;
      requestorUserId?: string;
    },
  ) {
    const result = await this.accessPolicyService.checkRoleAccess({ ...body, permissions: body.permissions ?? [] });
    return { success: true, data: result };
  }
}
