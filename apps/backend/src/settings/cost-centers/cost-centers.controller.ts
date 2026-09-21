/**
 * CostCentersController — real Prisma CRUD for cost centers.
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

@ApiTags('cost-centers')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('cost-centers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class CostCentersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cost centers' })
  async getCostCenters(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.costCenter.findMany({ where, orderBy: { name: 'asc' } });
    return { success: true, data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cost center by ID' })
  async getCostCenter(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const cc = await this.prisma.costCenter.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!cc) throw new NotFoundException(`Cost center ${id} not found`);
    return { success: true, data: cc };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create cost center' })
  async createCostCenter(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.costCenter.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cost center' })
  async updateCostCenter(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    const existing = await this.prisma.costCenter.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Cost center ${id} not found`);
    const data = await this.prisma.costCenter.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete cost center' })
  async deleteCostCenter(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.costCenter.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Cost center ${id} not found`);
    await this.prisma.costCenter.delete({ where: { id } });
    return { success: true };
  }
}
