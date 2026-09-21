/**
 * IfrsController — real Prisma-backed IFRS standards management.
 * Queries the `ifrsstandard` model (lowercase, maps to `ifrsstandard` table).
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';

@ApiTags('ifrs')
@Controller('ifrs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ifrs:read')
export class IfrsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('standards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IFRS standards' })
  async getStandards(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    const where: any = {};
    if (type)               where.type     = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const data = await this.prisma.ifrsstandard.findMany({
      where,
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
    return { success: true, data };
  }

  @Get('standards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an IFRS standard by ID or code' })
  async getStandard(@Param('id') id: string) {
    const data = await this.prisma.ifrsstandard.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!data) throw new NotFoundException(`IFRS standard ${id} not found`);
    return { success: true, data };
  }

  @Post('standards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an IFRS standard entry' })
  async createStandard(@Body() body: Record<string, unknown>) {
    if (!body.code) throw new BadRequestException('code is required');
    if (!body.name) throw new BadRequestException('name is required');
    if (!body.type) throw new BadRequestException('type is required');
    const data = await this.prisma.ifrsstandard.create({ data: body as any });
    return { success: true, data };
  }

  @Patch('standards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an IFRS standard' })
  async updateStandard(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.ifrsstandard.findFirst({ where: { OR: [{ id }, { code: id }] } });
    if (!existing) throw new NotFoundException(`IFRS standard ${id} not found`);
    const data = await this.prisma.ifrsstandard.update({ where: { id: existing.id }, data: body as any });
    return { success: true, data };
  }

  @Delete('standards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an IFRS standard' })
  async deleteStandard(@Param('id') id: string) {
    const existing = await this.prisma.ifrsstandard.findFirst({ where: { OR: [{ id }, { code: id }] } });
    if (!existing) throw new NotFoundException(`IFRS standard ${id} not found`);
    await this.prisma.ifrsstandard.delete({ where: { id: existing.id } });
    return { success: true };
  }
}
