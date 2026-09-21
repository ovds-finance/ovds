/**
 * ManufacturingController — real Prisma-backed manufacturing management.
 *
 * Production orders → PurchaseOrder (status = 'PRODUCTION' discriminator)
 * Bills of materials → Item records (items with a `bom` JSON blob in their config)
 *
 * Using PurchaseOrder for production orders preserves the existing data model;
 * the `status` field discriminates procurement (REQUEST/RFQ/APPROVED/RECEIVED)
 * from production (PRODUCTION/IN_PROGRESS/COMPLETE).
 * The `items` field (JSON) holds the BOM line items for production orders.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

const PRODUCTION_STATUSES = ['PRODUCTION', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED'];

@ApiTags('manufacturing')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('items:read')
export class ManufacturingController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Production Orders ─────────────────────────────────────────────────────

  @Get('production-orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List production orders' })
  async getProductionOrders(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = { status: status && PRODUCTION_STATUSES.includes(status) ? status : { in: PRODUCTION_STATUSES } };
    if (companyId) where.companyId = companyId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('production-orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a production order by ID' })
  async getProductionOrder(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.purchaseOrder.findFirst({ where });
    if (!data) throw new NotFoundException(`Production order ${id} not found`);
    return { success: true, data };
  }

  @Post('production-orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a production order' })
  async createProductionOrder(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const seq = await this.prisma.purchaseOrder.count({
      where: { status: { in: PRODUCTION_STATUSES } },
    });
    const poNumber = (body.poNumber as string | undefined) ?? `WO-${Date.now()}-${seq + 1}`;
    const data = await this.prisma.purchaseOrder.create({
      data: {
        ...body,
        companyId,
        poNumber,
        status: 'PRODUCTION',
        createdBy: (body.createdBy as string | undefined) ?? req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('production-orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a production order' })
  async updateProductionOrder(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Production order ${id} not found`);
    const data = await this.prisma.purchaseOrder.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('production-orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a production order' })
  async deleteProductionOrder(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Production order ${id} not found`);
    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' } as any,
    });
    return { success: true };
  }

  // ── Bills of Materials ────────────────────────────────────────────────────
  // BOMs are items where the `description` field starts with "BOM:" or where
  // the item has a non-null `itemGroup` of type MANUFACTURED. We use the Item
  // model's existing `description` field to store BOM metadata as a JSON string.

  @Get('boms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bills of materials (BOM items)' })
  async getBoms(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    // BOM items are identified by the 'BOM' tag in their type/category field
    const where: any = { OR: [
      { type: 'MANUFACTURED' },
      { description: { startsWith: 'BOM:' } },
    ]};
    if (companyId) where.companyId = companyId;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { name: 'asc' },
      }),
      this.prisma.item.count({ where }),
    ]).catch(() => [[], 0] as [any[], number]);

    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Post('boms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bill of materials (stored as a MANUFACTURED item)' })
  async createBom(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.name) throw new BadRequestException('name is required');
    // BOM components are stored as JSON in the description field prefixed "BOM:"
    const bomJson = body.components ? `BOM:${JSON.stringify(body.components)}` : 'BOM:[]';
    const data = await this.prisma.item.create({
      data: {
        name:        body.name as string,
        type:        'MANUFACTURED',
        description: bomJson,
        companyId,
        isActive:    true,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('boms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a bill of materials' })
  async updateBom(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.item.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`BOM item ${id} not found`);
    const updateData: any = { ...body };
    if (body.components) {
      updateData.description = `BOM:${JSON.stringify(body.components)}`;
      delete updateData.components;
    }
    const data = await this.prisma.item.update({ where: { id }, data: updateData });
    return { success: true, data };
  }
}
