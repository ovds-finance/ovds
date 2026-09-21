/**
 * ShiftsController — real Prisma CRUD for work shifts.
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

@ApiTags('shifts')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('shifts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('shifts:read')
export class ShiftsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List shifts for the company' })
  async getShifts(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    const data = await this.prisma.shift.findMany({ where, orderBy: { name: 'asc' } });
    return { success: true, data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a shift by ID' })
  async getShift(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const shift = await this.prisma.shift.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    return { success: true, data: shift };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shift' })
  async createShift(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.shift.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a shift' })
  async updateShift(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    const existing = await this.prisma.shift.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Shift ${id} not found`);
    const data = await this.prisma.shift.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a shift' })
  async deleteShift(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.shift.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Shift ${id} not found`);
    await this.prisma.shift.delete({ where: { id } });
    return { success: true };
  }
}
