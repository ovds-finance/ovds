/**
 * InventoryController — real Prisma-backed CRUD for inventory items,
 * item groups, warehouses, stock levels, and stock adjustments.
 *
 * Company context is resolved from the x-company-id header first, then
 * falls back to the authenticated user's companyId from JWT.
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  Headers,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { THROTTLE_TTL_MS, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';
import { Throttle } from '../common/throttle.decorator';


function resolveCompany(headers: Record<string, string | undefined>, req: any): string | undefined {
  return (headers['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('inventory')
@ApiHeader({ name: 'x-company-id', description: 'Active company context', required: false })
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Items ─────────────────────────────────────────────────────────────────

  @Get('items')
  @Permissions('items:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List inventory items for the company' })
  async getItems(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    if (status) where.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, Math.max(1, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT));

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { name: 'asc' } }),
      this.prisma.item.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Get('items/:id')
  @Permissions('items:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single inventory item by ID' })
  async getItem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const item = await this.prisma.item.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return { success: true, data: item };
  }

  @Post('items')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Permissions('items:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new inventory item' })
  async createItem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.item.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('items/:id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Permissions('items:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an inventory item' })
  async updateItem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.item.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Item ${id} not found`);
    const data = await this.prisma.item.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('items/:id')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Permissions('items:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an inventory item' })
  async deleteItem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.item.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Item ${id} not found`);
    await this.prisma.item.delete({ where: { id } });
    return { success: true };
  }

  // ── Item Groups / Categories ───────────────────────────────────────────────

  @Get('groups')
  @Permissions('items:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List item categories/groups' })
  async getGroups(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    const data = await this.prisma.category.findMany({ where, orderBy: { name: 'asc' } });
    return { success: true, data };
  }

  @Post('groups')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an item category/group' })
  async createGroup(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.category.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('groups/:id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an item category/group' })
  async updateGroup(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.category.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
    const data = await this.prisma.category.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('groups/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an item category/group' })
  async deleteGroup(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.category.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  // ── Warehouses ────────────────────────────────────────────────────────────

  @Get('warehouses')
  @Roles('ADMIN', 'EMPLOYEE', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List warehouses for the company' })
  async getWarehouses(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    const data = await this.prisma.warehouse.findMany({ where, orderBy: { name: 'asc' } }).catch(() => []);
    return { success: true, data };
  }

  @Post('warehouses')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a warehouse' })
  async createWarehouse(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.warehouse.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('warehouses/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a warehouse' })
  async updateWarehouse(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.warehouse.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Warehouse ${id} not found`);
    const data = await this.prisma.warehouse.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('warehouses/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a warehouse' })
  async deleteWarehouse(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const existing = await this.prisma.warehouse.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } }).catch(() => null);
    if (!existing) throw new NotFoundException(`Warehouse ${id} not found`);
    await this.prisma.warehouse.delete({ where: { id } });
    return { success: true };
  }

  // ── Stock Movements ───────────────────────────────────────────────────────

  @Get('stock')
  @Roles('ADMIN', 'EMPLOYEE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List stock movements / levels' })
  async getStock(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('itemId') itemId?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    if (itemId) where.itemId = itemId;
    const data = await this.prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }).catch(() => []);
    return { success: true, data };
  }

  @Post('stock')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a stock movement' })
  async createStock(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.stockMovement.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  // ── Stock Adjustments ─────────────────────────────────────────────────────

  @Get('adjustments')
  @Roles('ADMIN', 'EMPLOYEE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List stock adjustments' })
  async getAdjustments(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = resolveCompany(headers, req);
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { ...where, type: 'ADJUSTMENT' },
        skip: (pageNum - 1) * takeNum,
        take: takeNum,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      this.prisma.stockMovement.count({
        where: { ...where, type: 'ADJUSTMENT' },
      }).catch(() => 0),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('adjustments')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a stock adjustment entry' })
  async createAdjustment(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.stockMovement.create({
      data: { ...body, companyId, type: body.type ?? 'ADJUSTMENT' } as any,
    });
    return { success: true, data };
  }
}
