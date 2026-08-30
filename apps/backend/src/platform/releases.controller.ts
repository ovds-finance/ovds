import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PAGINATION_DEFAULT_LIMIT, LATEST_RELEASES_LIMIT } from '@ovds/shared';

@ApiTags('releases')
@Controller('releases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReleasesController {
  constructor(private readonly configService?: ConfigService) {}

  @Get('available')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available releases' })
  getAvailable() {
    return { success: true, data: [] };
  }

  @Get('settings')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get update settings for current company' })
  getSettings() {
    return { success: true, data: { currentVersion: null, autoUpdate: false, environment: this.configService?.get('NODE_ENV', 'production') ?? 'production' } };
  }

  @Patch('settings')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update update settings for current company' })
  updateSettings(@Body() body: { autoUpdate: boolean }) {
    return { success: true, data: { currentVersion: null, autoUpdate: body.autoUpdate, environment: this.configService?.get('NODE_ENV', 'production') ?? 'production' } };
  }

  @Get('pending-mandatory')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check for pending mandatory releases' })
  getPendingMandatory() {
    return { success: true, data: null };
  }

  @Post('apply')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply a release to current company' })
  applyRelease(@Body() body: { releaseId: string }) {
    return { success: true, data: { id: 'cr-' + Date.now(), companyId: '', releaseId: body.releaseId, status: 'APPLIED', appliedAt: new Date().toISOString(), release: { id: body.releaseId, version: '1.0.0', changelog: '', isMandatory: false, releasedAt: new Date().toISOString(), status: 'RELEASED', type: this.configService?.get('NODE_ENV', 'production') ?? 'production' } } };
  }

  @Get('history')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get release history for current company' })
  getHistory() {
    return { success: true, data: [] };
  }

  @Get('flags')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get feature flags for current company' })
  getFlags() {
    return { success: true, data: [] };
  }

  @Post('flags')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new feature flag' })
  createFlag(@Body() body: { name: string; description?: string }) {
    return { success: true, data: { id: 'flag-' + Date.now(), name: body.name, description: body.description, isActive: true, isEnabled: false } };
  }

  @Patch('flags/toggle')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle a feature flag for a company' })
  toggleFlag(@Body() body: { companyId: string; flagId: string; isEnabled: boolean }) {
    return { success: true, data: { id: body.flagId, companyId: body.companyId, isEnabled: body.isEnabled } };
  }

  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List releases' })
  getReleases() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create release' })
  createRelease(@Body() body: any) {
    return { success: true, data: { ...body, id: 'rel-' + Date.now() } };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update release' })
  updateRelease(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete release' })
  deleteRelease(@Param('id') id: string) {
    return { success: true };
  }

  @Get('export')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export releases as CSV' })
  exportReleases() {
    return { success: true, data: 'id,name,version,status\n' };
  }
}


