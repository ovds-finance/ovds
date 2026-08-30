import { Controller, Get, HttpCode, HttpStatus, All, ExecutionContext, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ModuleBootstrap } from '@ovds/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check — returns 200 if app is running' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Ready to accept traffic' })
  getReady() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  getLive() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('health/detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detailed health check with module status' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async getDetailedHealth() {
    const bootstrapResult = await ModuleBootstrap.getInstance().bootstrap({ runHealthChecks: true });
    const unhealthy = bootstrapResult.healthResults?.filter((h) => h.status === 'unhealthy') ?? [];
    return {
      status: unhealthy.length === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      modules: bootstrapResult.names,
      healthResults: bootstrapResult.healthResults ?? [],
      errors: bootstrapResult.errors,
      unhealthyCount: unhealthy.length,
    };
  }

  @Get('modules/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Module health status' })
  @ApiResponse({ status: 200, description: 'Module health results' })
  async getModuleHealth() {
    const result = await ModuleBootstrap.getInstance().bootstrap({ runHealthChecks: true });
    return {
      modules: result.names,
      healthResults: result.healthResults ?? [],
      errors: result.errors,
    };
  }
}
