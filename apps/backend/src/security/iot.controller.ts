import { Controller, Get, Post, Put, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('iot')
@Controller('iot')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('iot:read')
export class IotController {
  @Get('sensors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IoT sensors' })
  getSensors() {
    return { success: true, data: [] };
  }

  @Post('sensors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register IoT sensor' })
  registerSensor(@Body() body: any) {
    return { success: true, data: { ...body, id: 'sensor-' + Date.now() } };
  }

  @Get('sensors/:id/readings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sensor readings' })
  getSensorReadings(@Param('id') id: string) {
    return { success: true, data: [] };
  }

  @Post('data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest IoT data' })
  ingestData(@Body() body: any) {
    return { success: true, data: { ...body, id: 'iot-' + Date.now() } };
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IoT dashboard' })
  getDashboard() {
    return { success: true, data: { activeSensors: 0, alerts: 0, uptime: 0 } };
  }

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IoT devices' })
  getDevices(@Query() query: any) {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create IoT device' })
  createDevice(@Body() body: any) {
    return { success: true, data: { ...body, id: 'iot-dev-' + Date.now() } };
  }

  @Get('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get IoT device' })
  getDevice(@Param('id') id: string) {
    return { success: true, data: { id } };
  }

  @Put('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update IoT device' })
  updateDevice(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }
}

