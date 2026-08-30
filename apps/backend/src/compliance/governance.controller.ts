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

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GovernanceController {
  constructor(private readonly prisma: PrismaService) {}

  private getCompanyId(req: Request): string {
    return req.headers['x-company-id'] as string;
  }

  @Get('governance')
  @Roles('ADMIN', 'FINANCE', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List governance records for the company' })
  async list(@Req() req: Request) {
    const companyId = this.getCompanyId(req);
    const records = await this.prisma.settingValue.findMany({
      where: { key: { startsWith: 'governance.' }, companyId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: records };
  }

  @Get('governance/:key')
  @Roles('ADMIN', 'FINANCE', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific governance setting by key' })
  async get(@Req() req: Request, @Param('key') key: string) {
    const companyId = this.getCompanyId(req);
    const record = await this.prisma.settingValue.findFirst({
      where: { key: `governance.${key}`, companyId },
    });
    if (!record) throw new NotFoundException('Governance record not found');
    return { success: true, data: record };
  }

  @Post('governance')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update a governance record' })
  async create(@Req() req: Request, @Body() dto: SettingValueDto) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `governance.${dto.key}`, companyId },
    });
    if (existing) {
      const record = await this.prisma.settingValue.update({
        where: { id: existing.id },
        data: { value: dto.value },
      });
      return { success: true, data: record };
    }
    const record = await this.prisma.settingValue.create({
      data: { key: `governance.${dto.key}`, value: dto.value, companyId, scope: dto.scope || 'company' },
    });
    return { success: true, data: record };
  }

  @Put('governance/:key')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a governance record' })
  async update(@Req() req: Request, @Param('key') key: string, @Body() dto: SettingValueDto) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `governance.${key}`, companyId },
    });
    if (!existing) throw new NotFoundException('Governance record not found');
    const record = await this.prisma.settingValue.update({
      where: { id: existing.id },
      data: { value: dto.value },
    });
    return { success: true, data: record };
  }

  @Delete('governance/:key')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a governance record' })
  async remove(@Req() req: Request, @Param('key') key: string) {
    const companyId = this.getCompanyId(req);
    const existing = await this.prisma.settingValue.findFirst({
      where: { key: `governance.${key}`, companyId },
    });
    if (!existing) throw new NotFoundException('Governance record not found');
    await this.prisma.settingValue.delete({ where: { id: existing.id } });
    return { success: true };
  }
}
