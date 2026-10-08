import { Controller, Get, Put, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { ModuleCode } from '@ovds/database';

@ApiTags('tenant')
@Controller('tenant')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant info' })
  async getCurrent(@Request() req: any) {
    return this.tenantService.getCurrentTenant(req.user.tenantId);
  }

  @Get('active-modules')
  @ApiOperation({ summary: 'Get active modules for tenant' })
  async getActiveModules(@Request() req: any) {
    return this.tenantService.getActiveModules(req.user.tenantId);
  }

  @Put('modules/:moduleCode')
  @ApiOperation({ summary: 'Update module configuration' })
  async updateModule(
    @Request() req: any,
    @Param('moduleCode') moduleCode: string,
    @Body() body: { enabled: boolean; config?: any },
  ) {
    return this.tenantService.updateModule(req.user.tenantId, moduleCode as ModuleCode, body.enabled, body.config);
  }
}