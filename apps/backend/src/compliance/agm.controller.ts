import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

interface SettingValueDto {
  key: string;
  value: string;
  scope?: string;
}

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgmController {
  constructor(private readonly prisma: PrismaService) {}

  private getCompanyId(req: any): string {
    return req.headers['x-company-id'] as string;
  }

  @Get('agm')
  @Roles('ADMIN', 'FINANCE', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List AGM records for the company' })
  async list(@Req() req: any) {
    const companyId = this.getCompanyId(req);
    const records = await this.prisma.settingValue.findMany({
      where: { key: { startsWith: 'agm.' }, companyId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: records };
  }

  @Get('agm/:key')
  @Roles('ADMIN', 'FINANCE', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific AGM setting by key' })
  async get(@Req() req: any, @Param('key') key: string) {
    const companyId = this.getCompanyId(req);
    const record = await this.prisma.settingValue.findFirst({
      where: { key: `agm.${key}`, companyId },
    });
    if (!record) throw new NotFoundException('AGM record not found');
    return { success: true, data: record };
  }

  @Post('agm')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update an AGM record' })
  async create(@Req() req: any, @Body() dto: SettingValueDto) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `agm.${dto.key}`, companyId },
    });
    if (existing) {
      const record = await this.prisma.settingValue.update({
        where: { id: existing.id },
        data: { value: dto.value },
      });
      return { success: true, data: record };
    }
    const record = await this.prisma.settingValue.create({
      data: { key: `agm.${dto.key}`, value: dto.value, companyId, scope: dto.scope || 'company' },
    });
    return { success: true, data: record };
  }

  @Put('agm/:key')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an AGM record' })
  async update(@Req() req: any, @Param('key') key: string, @Body() dto: SettingValueDto) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `agm.${key}`, companyId },
    });
    if (!existing) throw new NotFoundException('AGM record not found');
    const record = await this.prisma.settingValue.update({
      where: { id: existing.id },
      data: { value: dto.value },
    });
    return { success: true, data: record };
  }

  @Delete('agm/:key')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an AGM record' })
  async remove(@Req() req: any, @Param('key') key: string) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `agm.${key}`, companyId },
    });
    if (!existing) throw new NotFoundException('AGM record not found');
    await this.prisma.settingValue.delete({ where: { id: existing.id } });
    return { success: true };
  }
}
