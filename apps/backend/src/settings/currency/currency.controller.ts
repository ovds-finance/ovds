/**
 * CurrencyController — real Prisma CRUD for FX rates and currency configuration.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
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

@ApiTags('currency')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('currency')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class CurrencyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List FX rates for the company' })
  async getRates(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.fxRate.findMany({ where, orderBy: [{ asOf: 'desc' }] }).catch(() => []);
    return { success: true, data };
  }

  @Post('rates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an FX rate entry' })
  async createRate(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    if (!body.fromCurrency || !body.toCurrency || !body.rate) {
      throw new BadRequestException('fromCurrency, toCurrency, and rate are required');
    }
    const data = await this.prisma.fxRate.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('rates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an FX rate entry' })
  async updateRate(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    const existing = await this.prisma.fxRate.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`FX rate ${id} not found`);
    const data = await this.prisma.fxRate.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('rates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an FX rate entry' })
  async deleteRate(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.fxRate.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`FX rate ${id} not found`);
    await this.prisma.fxRate.delete({ where: { id } });
    return { success: true };
  }

  @Get('fx')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current FX rates (alias for /rates)' })
  async getFx(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    return this.getRates(h, req);
  }
}
