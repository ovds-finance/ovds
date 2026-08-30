import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('offline')
@Controller('offline')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('settings:read')
export class OfflineController {
  constructor(private readonly configService: ConfigService) {}

  @Get('capabilities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get offline capabilities' })
  getCapabilities() {
    return { 
      success: true, 
      data: { 
        enabled: true, 
        maxQueueSize: parseInt(this.configService.get('OFFLINE_MAX_QUEUE_SIZE', '1000'), 10),
        maxRetries: parseInt(this.configService.get('OFFLINE_MAX_RETRIES', '3'), 10),
      } 
    };
  }

  @Get('sla-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get offline SLA report' })
  getSlaReport() {
    return { success: true, data: { uptime: 99.9, avgLatency: 0, incidents: 0 } };
  }
}

