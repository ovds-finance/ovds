import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('device-control')
@Controller('device-control')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('device_control:read')
export class DeviceControlController {
  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List devices' })
  getDevices() {
    return { success: true, data: [] };
  }

  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register device' })
  registerDevice(@Body() body: any) {
    return { success: true, data: { ...body, id: 'dev-' + Date.now() } };
  }

  @Patch('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update device' })
  updateDevice(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete device' })
  deleteDevice(@Param('id') id: string) {
    return { success: true };
  }

  @Post('devices/:id/command')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send command to device' })
  sendCommand(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { id, ...body } };
  }
}

