/**
 * HolidaysController — real Prisma CRUD for public/company holidays.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('holidays:read')
export class HolidaysController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List holidays' })
  async getHolidays() {
    const data = await this.prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    return { success: true, data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a holiday by ID' })
  async getHoliday(@Param('id') id: string) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
    return { success: true, data: holiday };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a holiday' })
  async createHoliday(@Body() body: Record<string, unknown>) {
    if (!body.name) throw new BadRequestException('name is required');
    if (!body.date) throw new BadRequestException('date is required');
    const data = await this.prisma.holiday.create({ data: body as any });
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a holiday' })
  async updateHoliday(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Holiday ${id} not found`);
    const data = await this.prisma.holiday.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a holiday' })
  async deleteHoliday(@Param('id') id: string) {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Holiday ${id} not found`);
    await this.prisma.holiday.delete({ where: { id } });
    return { success: true };
  }
}
