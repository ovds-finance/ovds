import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('infrastructure')
@Controller('infrastructure')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('settings:write')
export class InfrastructureController {
  @Get('servers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List servers' })
  getServers() {
    return { success: true, data: [] };
  }

  @Post('servers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register server' })
  registerServer(@Body() body: any) {
    return { success: true, data: { ...body, id: 'srv-' + Date.now() } };
  }

  @Get('services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List infrastructure services' })
  getServices() {
    return { success: true, data: [] };
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create infrastructure service' })
  createService(@Body() body: any) {
    return { success: true, data: { ...body, id: 'svc-' + Date.now() } };
  }
}

