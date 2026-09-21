/**
 * IotController — real Prisma-backed IoT device & telemetry management.
 *
 * devices   → IotDevice
 * sensors   → IotDevice (deviceType = SENSOR/SMART_METER)
 * readings  → IotTelemetry
 * data      → IotTelemetry (ingest endpoint)
 * alerts    → IotAlert
 * dashboard → aggregated counts from IotDevice + IotAlert
 */
import {
  Controller, Get, Post, Put, Body, Patch, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('iot')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('iot')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('iot:read')
export class IotController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IoT dashboard — live device and alert counts' })
  async getDashboard(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = companyId ? { companyId } : {};

    const [total, active, offline, openAlerts, criticalAlerts] = await Promise.all([
      this.prisma.iotDevice.count({ where }),
      this.prisma.iotDevice.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.iotDevice.count({ where: { ...where, status: 'OFFLINE' } }),
      this.prisma.iotAlert.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.iotAlert.count({ where: { ...where, status: 'OPEN', severity: 'CRITICAL' } }),
    ]);

    return {
      success: true,
      data: {
        totalDevices: total,
        activeSensors: active,
        offlineDevices: offline,
        alerts: openAlerts,
        criticalAlerts,
        uptime: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
      },
    };
  }

  // ── Devices (IotDevice) ───────────────────────────────────────────────────

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IoT devices' })
  async getDevices(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
    @Query('deviceType') deviceType?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId)  where.companyId  = companyId;
    if (status)     where.status     = status;
    if (deviceType) where.deviceType = deviceType;

    const [data, total] = await Promise.all([
      this.prisma.iotDevice.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { alerts: true, telemetry: true } },
        },
      }),
      this.prisma.iotDevice.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get IoT device by ID' })
  async getDevice(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.iotDevice.findFirst({
      where,
      include: {
        alerts: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { telemetry: true, alerts: true } },
      },
    });
    if (!data) throw new NotFoundException(`IoT device ${id} not found`);
    return { success: true, data };
  }

  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an IoT device' })
  async createDevice(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name)         throw new BadRequestException('name is required');
    if (!body.serialNumber) throw new BadRequestException('serialNumber is required');
    const data = await this.prisma.iotDevice.create({
      data: {
        ...body,
        companyId,
        deviceType: (body.deviceType as string | undefined) ?? 'SENSOR',
        status:     'ACTIVE',
        createdBy:  (body.createdBy as string | undefined) ?? req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Put('devices/:id')
  @Patch('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an IoT device' })
  async updateDevice(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`IoT device ${id} not found`);
    const data = await this.prisma.iotDevice.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  // ── Sensors (IotDevice with SENSOR / SMART_METER type) ───────────────────

  @Get('sensors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List sensor-type IoT devices' })
  async getSensors(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = { deviceType: { in: ['SENSOR', 'SMART_METER'] } };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.iotDevice.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  @Post('sensors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a sensor (IotDevice with type=SENSOR)' })
  async registerSensor(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name)         throw new BadRequestException('name is required');
    if (!body.serialNumber) throw new BadRequestException('serialNumber is required');
    const data = await this.prisma.iotDevice.create({
      data: {
        ...body,
        companyId,
        deviceType: (body.deviceType as string | undefined) ?? 'SENSOR',
        status: 'ACTIVE',
        createdBy: req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Get('sensors/:id/readings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get telemetry readings for a sensor' })
  async getSensorReadings(
    @Param('id') id: string,
    @Query('metricKey') metricKey?: string,
    @Query('limit') limit = '50',
  ) {
    const where: any = { deviceId: id };
    if (metricKey) where.metricKey = metricKey;
    const data = await this.prisma.iotTelemetry.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: parseInt(limit, 10),
    });
    return { success: true, data };
  }

  // ── Telemetry ingest ──────────────────────────────────────────────────────

  @Post('data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest a telemetry reading from a device' })
  async ingestData(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    if (!body.deviceId)    throw new BadRequestException('deviceId is required');
    if (!body.metricKey)   throw new BadRequestException('metricKey is required');
    if (body.value === undefined) throw new BadRequestException('value is required');

    const companyId = cid(h, req) ?? (body.companyId as string | undefined);
    const data = await this.prisma.iotTelemetry.create({
      data: {
        deviceId:   body.deviceId as string,
        companyId,
        metricKey:  body.metricKey as string,
        value:      body.value,
        unit:       body.unit as string | undefined,
        recordedAt: body.recordedAt ? new Date(body.recordedAt as string) : new Date(),
        quality:    (body.quality as string | undefined) ?? 'NORMAL',
        rawPayload: body.rawPayload ? JSON.stringify(body.rawPayload) : null,
      } as any,
    });
    return { success: true, data };
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IoT alerts' })
  async getAlerts(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    if (severity)  where.severity  = severity;
    const data = await this.prisma.iotAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data };
  }

  @Patch('alerts/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge an IoT alert' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const existing = await this.prisma.iotAlert.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`IoT alert ${id} not found`);
    const data = await this.prisma.iotAlert.update({
      where: { id },
      data: {
        status:          'ACKNOWLEDGED',
        acknowledgedBy:  req?.user?.userId ?? 'system',
        acknowledgedAt:  new Date(),
      } as any,
    });
    return { success: true, data };
  }
}
