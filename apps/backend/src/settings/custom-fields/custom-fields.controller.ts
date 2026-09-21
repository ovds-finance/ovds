/**
 * CustomFieldsController — real Prisma CRUD for company-specific custom fields.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PrismaService } from '../../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('custom-fields')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('custom-fields')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('settings:read')
export class CustomFieldsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List custom fields for the company' })
  async getCustomFields(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('feature') feature?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = cid(h, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    if (feature) where.feature = feature;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);

    const [data, total] = await Promise.all([
      this.prisma.customField.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { sortOrder: 'asc' } }),
      this.prisma.customField.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a custom field by ID' })
  async getCustomField(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const field = await this.prisma.customField.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!field) throw new NotFoundException(`Custom field ${id} not found`);
    return { success: true, data: field };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom field' })
  async createCustomField(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    if (!body.feature) throw new BadRequestException('feature is required');
    if (!body.label) throw new BadRequestException('label is required');
    const data = await this.prisma.customField.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a custom field' })
  async updateCustomField(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const companyId = cid(h, req);
    const existing = await this.prisma.customField.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Custom field ${id} not found`);
    const data = await this.prisma.customField.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom field and all its values' })
  async deleteCustomField(@Headers() h: Record<string, string | undefined>, @Request() req: any, @Param('id') id: string) {
    const companyId = cid(h, req);
    const existing = await this.prisma.customField.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Custom field ${id} not found`);
    await this.prisma.customField.delete({ where: { id } });
    return { success: true };
  }
}
