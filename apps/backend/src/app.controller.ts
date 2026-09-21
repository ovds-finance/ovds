import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ModuleBootstrap } from '@ovds/core';
import { EventBus } from '@ovds/core';

import { AppService } from './app.service';
import { Roles } from './auth/decorators/roles.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Health check — returns 200 if app is running' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  @SkipThrottle()
  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Ready to accept traffic' })
  getReady() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @SkipThrottle()
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
    const unhealthy = bootstrapResult.healthResults?.filter((h: { status: string }) => h.status === 'unhealthy') ?? [];
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

  @Get('health/eventbus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'EventBus health and listener diagnostics' })
  @ApiResponse({ status: 200, description: 'EventBus status' })
  async getEventBusHealth() {
    const eventBus = EventBus.getInstance();
    const listeners = eventBus.getAllListeners();
    const history = eventBus.getHistory();

    const listenerCount = listeners.length;
    const eventTypes = new Set(listeners.map(l => l.eventName));
    const recentEventCount = Math.min(history.length, 20);

    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      summary: {
        registeredListeners: listenerCount,
        distinctEventTypes: eventTypes.size,
        recentEventsInHistory: recentEventCount,
        historyMaxSize: 1000,
      },
      listeners: listeners.map(l => ({
        eventName: l.eventName,
        priority: l.priority,
        source: l.handler?.name || 'anonymous',
      })),
      recentEvents: history.slice(-recentEventCount).map(e => ({
        name: e.name,
        timestamp: e.timestamp,
        source: e.source,
        payloadVersion: e.payloadVersion,
      })),
    };
  }
}
