/**
 * DeviceControlController — real Prisma-backed device policy management.
 *
 * devices (list/register/update/delete) → IotDevice (physical device registry)
 * policies                              → DeviceControlPolicy (enforced org policies)
 * change requests                       → DeviceControlChangeRequest (maker-checker flow)
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
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

@ApiTags('device-control')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('device-control')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('device_control:read')
export class DeviceControlController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Physical devices (IotDevice) ──────────────────────────────────────────

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List registered devices' })
  async getDevices(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;

    const [data, total] = await Promise.all([
      this.prisma.iotDevice.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.iotDevice.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a device' })
  async registerDevice(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name)         throw new BadRequestException('name is required');
    if (!body.serialNumber) throw new BadRequestException('serialNumber is required');
    const data = await this.prisma.iotDevice.create({
      data: { ...body, companyId, status: 'ACTIVE', createdBy: req?.user?.userId ?? null } as any,
    });
    return { success: true, data };
  }

  @Patch('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a device record' })
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
    if (!existing) throw new NotFoundException(`Device ${id} not found`);
    const data = await this.prisma.iotDevice.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decommission (soft-delete) a device' })
  async deleteDevice(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Device ${id} not found`);
    await this.prisma.iotDevice.update({
      where: { id },
      data: { status: 'DECOMMISSIONED' } as any,
    });
    return { success: true };
  }

  @Post('devices/:id/command')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a command to a device (logged as IotAlert trigger)' })
  async sendCommand(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const device = await this.prisma.iotDevice.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!device) throw new NotFoundException(`Device ${id} not found`);

    // Log command as an audit alert entry
    const alert = await this.prisma.iotAlert.create({
      data: {
        deviceId:  id,
        companyId: device.companyId,
        alertType: 'CUSTOM',
        severity:  'WARNING',
        title:     `Command: ${body.command ?? 'unknown'}`,
        message:   JSON.stringify(body),
        status:    'ACKNOWLEDGED',
        acknowledgedBy: req?.user?.userId ?? 'system',
        acknowledgedAt: new Date(),
      } as any,
    });
    return { success: true, data: { deviceId: id, commandLogId: alert.id, ...body } };
  }

  // ── Policies (DeviceControlPolicy) ───────────────────────────────────────

  @Get('policies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List enforced device control policies for the company' })
  async getPolicies(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.deviceControlPolicy.findMany({
      where,
      orderBy: { enforcedAt: 'desc' },
    });
    return { success: true, data };
  }

  // ── Change Requests (DeviceControlChangeRequest) ──────────────────────────

  @Get('change-requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List device control change requests' })
  async getChangeRequests(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    const data = await this.prisma.deviceControlChangeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data };
  }

  @Post('change-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a device control policy change request' })
  async createChangeRequest(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req) ?? (body.companyId as string);
    if (!companyId)   throw new BadRequestException('companyId is required');
    if (!body.category) throw new BadRequestException('category is required');
    if (!body.settings) throw new BadRequestException('settings is required');
    const data = await this.prisma.deviceControlChangeRequest.create({
      data: {
        ...body,
        companyId,
        status:    'DRAFT',
        makerId:   req?.user?.userId ?? null,
        makerName: req?.user?.name   ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('change-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a change request and enforce the policy' })
  async approveChangeRequest(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const cr = await this.prisma.deviceControlChangeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException(`Change request ${id} not found`);
    if ((cr as any).status !== 'PENDING') {
      throw new BadRequestException('Only PENDING change requests can be approved');
    }

    // Enforce policy: upsert DeviceControlPolicy for this category
    const policy = await this.prisma.deviceControlPolicy.upsert({
      where: { companyId_category: { companyId: (cr as any).companyId, category: (cr as any).category } },
      create: {
        companyId:       (cr as any).companyId,
        category:        (cr as any).category,
        settings:        (cr as any).settings,
        changeRequestId: id,
        enforcedById:    req?.user?.userId ?? null,
      } as any,
      update: {
        settings:        (cr as any).settings,
        version:         { increment: 1 } as any,
        changeRequestId: id,
        enforcedById:    req?.user?.userId ?? null,
        enforcedAt:      new Date(),
      } as any,
    });

    const updated = await this.prisma.deviceControlChangeRequest.update({
      where: { id },
      data: {
        status:            'APPROVED',
        checkerId:         req?.user?.userId ?? null,
        checkerName:       req?.user?.name   ?? null,
        reviewedAt:        new Date(),
        resultingPolicyId: policy.id,
      } as any,
    });
    return { success: true, data: { changeRequest: updated, policy } };
  }
}
