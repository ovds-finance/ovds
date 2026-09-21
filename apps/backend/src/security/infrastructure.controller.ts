/**
 * InfrastructureController — real Prisma-backed infrastructure node registry.
 *
 * "Servers"  → IotDevice records with deviceType = 'SERVER'  or 'POS_TERMINAL'
 * "Services" → IotDevice records with deviceType = 'CAMERA'  or 'OTHER'
 *
 * Using IotDevice as the unified physical asset registry avoids a new model.
 * The `configJson` field stores arbitrary server/service metadata.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';

function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

const SERVER_TYPES  = ['SERVER', 'POS_TERMINAL'];
const SERVICE_TYPES = ['CAMERA', 'OTHER'];

@ApiTags('infrastructure')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('infrastructure')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('settings:write')
export class InfrastructureController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Servers ───────────────────────────────────────────────────────────────

  @Get('servers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List registered infrastructure servers' })
  async getServers(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { deviceType: { in: SERVER_TYPES } };
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    const data = await this.prisma.iotDevice.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  @Post('servers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an infrastructure server' })
  async registerServer(
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
        deviceType: (body.deviceType as string | undefined) ?? 'SERVER',
        status:     'ACTIVE',
        createdBy:  req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('servers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a server record' })
  async updateServer(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: SERVER_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Server ${id} not found`);
    const data = await this.prisma.iotDevice.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('servers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decommission a server' })
  async deleteServer(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: SERVER_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Server ${id} not found`);
    await this.prisma.iotDevice.update({
      where: { id },
      data: { status: 'DECOMMISSIONED' } as any,
    });
    return { success: true };
  }

  // ── Services ──────────────────────────────────────────────────────────────

  @Get('services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List registered infrastructure services' })
  async getServices(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { deviceType: { in: SERVICE_TYPES } };
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    const data = await this.prisma.iotDevice.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an infrastructure service' })
  async createService(
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
        deviceType: (body.deviceType as string | undefined) ?? 'OTHER',
        status:     'ACTIVE',
        createdBy:  req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a service record' })
  async updateService(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: SERVICE_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Service ${id} not found`);
    const data = await this.prisma.iotDevice.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decommission a service' })
  async deleteService(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.iotDevice.findFirst({
      where: { id, deviceType: { in: SERVICE_TYPES }, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Service ${id} not found`);
    await this.prisma.iotDevice.update({
      where: { id },
      data: { status: 'DECOMMISSIONED' } as any,
    });
    return { success: true };
  }
}
