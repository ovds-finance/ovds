import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Throttle } from '../common/throttle.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT } from '@ovds/shared';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

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
    return this.settingsService.testEmailSettings();
  }

  @Get('merge-sources')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get merge sources' })
  async getMergeSources() {
    return this.settingsService.getMergeSources();
  }
}
