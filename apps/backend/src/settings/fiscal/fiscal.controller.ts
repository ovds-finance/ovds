/**
 * FiscalController — real Prisma CRUD for fiscal years.
 */
import {
  Controller, Get, Post, Body, Patch, Param,
  Headers, Request, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PrismaService } from '../../common/prisma.service';

function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('fiscal')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('fiscal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class FiscalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('periods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List fiscal years for the company' })
  async getPeriods(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.fiscalYear.findMany({ where, orderBy: { year: 'desc' } }).catch(() => []);
    return { success: true, data };
  }

  @Post('periods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a fiscal year record' })
  async createPeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    if (!body.year) throw new BadRequestException('year is required');
    const data = await this.prisma.fiscalYear.create({
      data: { ...body, companyId, status: body.status ?? 'OPEN' } as any,
    });
    return { success: true, data };
  }

  @Patch('periods/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a fiscal year' })
  async closePeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.fiscalYear.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Fiscal year ${id} not found`);
    const data = await this.prisma.fiscalYear.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedBy: req?.user?.userId ?? null, isCurrent: false } as any,
    });
    return { success: true, data };
  }

  @Patch('periods/:id/set-current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a fiscal year as current' })
  async setCurrentPeriod(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.fiscalYear.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Fiscal year ${id} not found`);
    // Unset current from all others first
    if (companyId) {
      await this.prisma.fiscalYear.updateMany({ where: { companyId, isCurrent: true }, data: { isCurrent: false } });
    }
    const data = await this.prisma.fiscalYear.update({ where: { id }, data: { isCurrent: true, status: 'OPEN' } });
    return { success: true, data };
  }
}
