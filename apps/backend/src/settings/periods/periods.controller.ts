/**
 * PeriodsController — real Prisma CRUD for accounting periods (PeriodClose).
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { CheckPolicy } from '../../auth/decorators/check-policy.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AccessPolicyGuard } from '../../auth/guards/access-policy.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PrismaService } from '../../common/prisma.service';

function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('accounting')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('periods')
@UseGuards(JwtAuthGuard, PermissionsGuard, AccessPolicyGuard)
@Permissions('period_close:read')
export class PeriodsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List accounting periods for the company' })
  async getPeriods(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.periodClose.findMany({ where, orderBy: { period: 'desc' } }).catch(() => []);
    return { success: true, data };
  }

  @Get('locked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List locked accounting periods' })
  async getLockedPeriods(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = { ...(companyId ? { companyId } : {}), status: 'CLOSED' };
    const data = await this.prisma.periodClose.findMany({ where, orderBy: { period: 'desc' } }).catch(() => []);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an accounting period close record' })
  async createPeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    if (!body.period) throw new BadRequestException('period (YYYY-MM) is required');
    const data = await this.prisma.periodClose.create({ data: { ...body, companyId, status: body.status ?? 'OPEN' } as any });
    return { success: true, data };
  }

  @Post(':id/lock')
  @Permissions('period_close:write')
  @CheckPolicy('period_close:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock (close) an accounting period' })
  async lockPeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.periodClose.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Period ${id} not found`);
    const data = await this.prisma.periodClose.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closedBy: req?.user?.userId ?? null } as any });
    return { success: true, data };
  }

  @Post(':id/unlock')
  @Permissions('period_close:write')
  @CheckPolicy('period_close:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-open a locked accounting period' })
  async unlockPeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.periodClose.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Period ${id} not found`);
    const data = await this.prisma.periodClose.update({ where: { id }, data: { status: 'OPEN', closedAt: null, closedBy: null } as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an accounting period record' })
  async deletePeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.periodClose.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Period ${id} not found`);
    await this.prisma.periodClose.delete({ where: { id } });
    return { success: true };
  }
}
