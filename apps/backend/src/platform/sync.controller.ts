/**
 * SyncController — real Prisma-backed offline sync queue management.
 * Queries the SyncQueue model (status: PENDING | SYNCING | COMPLETED | FAILED).
 */
import {
  Controller, Get, Post, Body, Patch, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException,
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

/** Ethiopian regulated sectors as a static reference list. */
const REGULATED_SECTORS = [
  { code: 'BANKING',        name: 'Banking & Financial Services' },
  { code: 'INSURANCE',      name: 'Insurance' },
  { code: 'TELECOMS',       name: 'Telecommunications' },
  { code: 'ENERGY',         name: 'Energy & Utilities' },
  { code: 'HEALTHCARE',     name: 'Healthcare & Pharmaceuticals' },
  { code: 'EDUCATION',      name: 'Education' },
  { code: 'MANUFACTURING',  name: 'Manufacturing & Industry' },
  { code: 'AGRI',           name: 'Agriculture & Food Processing' },
  { code: 'TRANSPORT',      name: 'Transport & Logistics' },
  { code: 'CONSTRUCTION',   name: 'Construction & Real Estate' },
  { code: 'GOVERNMENT',     name: 'Government & Public Sector' },
  { code: 'NGO',            name: 'NGO & Non-Profit' },
];

@ApiTags('sync')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('settings:read')
export class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('regulated-sectors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get regulated sectors reference list' })
  getRegulatedSectors() {
    return { success: true, data: REGULATED_SECTORS };
  }

  @Get('queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sync queue status counts' })
  async getQueue(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    if (!companyId) return { success: true, data: { pending: 0, processing: 0, failed: 0, completed: 0 } };

    const [pending, processing, failed, completed] = await Promise.all([
      this.prisma.syncQueue.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.syncQueue.count({ where: { companyId, status: 'SYNCING' } }),
      this.prisma.syncQueue.count({ where: { companyId, status: 'FAILED' } }),
      this.prisma.syncQueue.count({ where: { companyId, status: 'COMPLETED' } }),
    ]);
    return { success: true, data: { pending, processing, failed, completed } };
  }

  @Post('queue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enqueue a sync operation' })
  async addToQueue(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req) ?? (body.companyId as string);
    if (!companyId)      throw new NotFoundException('companyId is required');
    if (!body.entityType) throw new NotFoundException('entityType is required');
    if (!body.entityId)   throw new NotFoundException('entityId is required');
    if (!body.action)     throw new NotFoundException('action (CREATE|UPDATE|DELETE) is required');

    const item = await this.prisma.syncQueue.create({
      data: {
        companyId,
        entityType: body.entityType as string,
        entityId:   body.entityId   as string,
        action:     body.action     as string,
        payload:    body.payload ? JSON.stringify(body.payload) : '{}',
        status:     'PENDING',
        attempts:   0,
      } as any,
    });
    return { success: true, data: item };
  }

  @Get('engines')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync engine status (entityType breakdown of queue)' })
  async getEngines(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    if (!companyId) return { success: true, data: [] };

    const engines = await this.prisma.syncQueue.groupBy({
      by: ['entityType'],
      where: { companyId, status: { in: ['PENDING', 'SYNCING', 'FAILED'] } },
      _count: { _all: true },
    }).catch(() => []);
    return { success: true, data: engines };
  }

  @Get('conflicts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List failed sync items (potential conflicts)' })
  async getConflicts(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = { status: 'FAILED' };
    if (companyId) where.companyId = companyId;

    const [data, total] = await Promise.all([
      this.prisma.syncQueue.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.syncQueue.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Patch('conflicts/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a sync conflict by resetting it to PENDING' })
  async resolveConflict(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.syncQueue.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Sync item ${id} not found`);
    const data = await this.prisma.syncQueue.update({
      where: { id },
      data: { status: 'PENDING', attempts: 0, lastError: null, ...body } as any,
    });
    return { success: true, data };
  }

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IoT devices registered for offline sync' })
  async getDevices(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.iotDevice.findMany({
      where,
      select: {
        id: true, name: true, serialNumber: true, deviceType: true,
        status: true, lastSeenAt: true, firmwareVersion: true,
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
    });
    return { success: true, data };
  }
}
