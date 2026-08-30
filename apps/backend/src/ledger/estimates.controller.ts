import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../common/prisma.service';

interface SettingValueDto {
  key: string;
  value: string;
  scope?: string;
}

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstimatesController {
  constructor(private readonly prisma: PrismaService) {}

  private getCompanyId(req: Request): string {
    return req.headers['x-company-id'] as string;
  }

  @Get('estimates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List accounting estimates for the company' })
  async list(@Req() req: Request) {
    const companyId = this.getCompanyId(req);
    const records = await this.prisma.settingValue.findMany({
      where: { key: { startsWith: 'estimates.' }, companyId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: records };
  }

  @Get('estimates/:key')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific estimate by key' })
  async get(@Req() req: Request, @Param('key') key: string) {
    const companyId = this.getCompanyId(req);
    const record = await this.prisma.settingValue.findFirst({
      where: { key: `estimates.${key}`, companyId },
    });
    if (!record) throw new NotFoundException('Estimate record not found');
    return { success: true, data: record };
  }

  @Post('estimates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update an accounting estimate' })
  async create(@Req() req: Request, @Body() dto: SettingValueDto) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `estimates.${dto.key}`, companyId },
    });
    if (existing) {
      const record = await this.prisma.settingValue.update({
        where: { id: existing.id },
        data: { value: dto.value },
      });
      return { success: true, data: record };
    }
    const record = await this.prisma.settingValue.create({
      data: { key: `estimates.${dto.key}`, value: dto.value, companyId, scope: dto.scope || 'company' },
    });
    return { success: true, data: record };
  }

  @Put('estimates/:key')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an accounting estimate' })
  async update(@Req() req: Request, @Param('key') key: string, @Body() dto: SettingValueDto) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `estimates.${key}`, companyId },
    });
    if (!existing) throw new NotFoundException('Estimate record not found');
    const record = await this.prisma.settingValue.update({
      where: { id: existing.id },
      data: { value: dto.value },
    });
    return { success: true, data: record };
  }

  @Delete('estimates/:key')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an accounting estimate' })
  async remove(@Req() req: Request, @Param('key') key: string) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `estimates.${key}`, companyId },
    });
    if (!existing) throw new NotFoundException('Estimate record not found');
    await this.prisma.settingValue.delete({ where: { id: existing.id } });
    return { success: true };
  }
}
