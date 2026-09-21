/**
 * ProcurementController — real Prisma-backed procurement management.
 *
 * Procurement requests → PurchaseOrder (status = 'REQUEST' discriminator)
 * RFQs                → PurchaseOrder (status = 'RFQ' discriminator)
 * The PurchaseOrder model is the canonical record for both; status discriminates them.
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

@ApiTags('procurement')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('bills:read')
export class ProcurementController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Procurement Requests (PurchaseOrder with type=REQUEST) ────────────────

  @Get('requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List procurement requests' })
  async getRequests(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = { status: status ?? 'REQUEST' };
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

  @Get('requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a procurement request by ID' })
  async getRequest(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.purchaseOrder.findFirst({ where });
    if (!data) throw new NotFoundException(`Procurement request ${id} not found`);
    return { success: true, data };
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a procurement request' })
  async createRequest(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const seq = await this.prisma.purchaseOrder.count({ where: companyId ? { companyId } : {} });
    const poNumber = (body.poNumber as string | undefined) ?? `PR-${Date.now()}-${seq + 1}`;
    const data = await this.prisma.purchaseOrder.create({
      data: {
        ...body,
        companyId,
        poNumber,
        status: 'REQUEST',
        createdBy: (body.createdBy as string | undefined) ?? req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a procurement request' })
  async updateRequest(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.purchaseOrder.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Procurement request ${id} not found`);
    const data = await this.prisma.purchaseOrder.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Patch('requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a procurement request' })
  async approveRequest(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Procurement request ${id} not found`);
    const data = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: req?.user?.userId ?? 'system', approvedAt: new Date() } as any,
    });
    return { success: true, data };
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a procurement request (DRAFT/REQUEST only)' })
  async deleteRequest(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.purchaseOrder.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Procurement request ${id} not found`);
    if (!['REQUEST', 'DRAFT'].includes((existing as any).status)) {
      throw new BadRequestException('Only REQUEST or DRAFT procurement records can be deleted');
    }
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return { success: true };
  }

  // ── RFQs (PurchaseOrder with status = 'RFQ') ──────────────────────────────

  @Get('rfqs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List RFQs (Request for Quotations)' })
  async getRfqs(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = { status: 'RFQ' };
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

  @Post('rfqs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an RFQ' })
  async createRfq(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const seq = await this.prisma.purchaseOrder.count({ where: { status: 'RFQ' } });
    const poNumber = (body.poNumber as string | undefined) ?? `RFQ-${Date.now()}-${seq + 1}`;
    const data = await this.prisma.purchaseOrder.create({
      data: {
        ...body,
        companyId,
        poNumber,
        status: 'RFQ',
        createdBy: (body.createdBy as string | undefined) ?? req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('rfqs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an RFQ' })
  async updateRfq(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.purchaseOrder.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`RFQ ${id} not found`);
    const data = await this.prisma.purchaseOrder.update({ where: { id }, data: body as any });
    return { success: true, data };
  }
}
