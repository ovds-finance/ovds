/**
 * ExpenseClaimsController — real Prisma-backed expense claim management.
 * Queries the ExpenseClaim model which is tenant-scoped via companyId.
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

@ApiTags('expense-claims')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('expense-claims')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('expenses:read')
export class ExpenseClaimsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List expense claims' })
  async getClaims(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;
    if (category)  where.category  = category;

    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expenseClaim.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expense claim statistics' })
  async getStats(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const [total, pending, approved, totalAmtAgg] = await Promise.all([
      this.prisma.expenseClaim.count({ where }),
      this.prisma.expenseClaim.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.expenseClaim.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.expenseClaim.aggregate({ where, _sum: { amount: true } }),
    ]);
    return {
      success: true,
      data: {
        total, pending, approved,
        totalAmount: Number(totalAmtAgg._sum.amount ?? 0),
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an expense claim by ID' })
  async getClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.expenseClaim.findFirst({ where });
    if (!data) throw new NotFoundException(`Expense claim ${id} not found`);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an expense claim' })
  async createClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.title)    throw new BadRequestException('title is required');
    if (!body.category) throw new BadRequestException('category is required');
    const data = await this.prisma.expenseClaim.create({
      data: {
        ...body,
        companyId,
        submittedBy: (body.submittedBy as string | undefined) ?? req?.user?.userId ?? 'system',
        status: 'PENDING',
      } as any,
    });
    return { success: true, data };
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve an expense claim' })
  async approveClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.expenseClaim.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Expense claim ${id} not found`);
    const data = await this.prisma.expenseClaim.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: req?.user?.userId ?? 'system', approvedAt: new Date() } as any,
    });
    return { success: true, data };
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject an expense claim' })
  async rejectClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.expenseClaim.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Expense claim ${id} not found`);
    const data = await this.prisma.expenseClaim.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: req?.user?.userId ?? 'system', approvedAt: new Date() } as any,
    });
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an expense claim' })
  async updateClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.expenseClaim.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Expense claim ${id} not found`);
    const data = await this.prisma.expenseClaim.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense claim (PENDING only)' })
  async deleteClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.expenseClaim.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!existing) throw new NotFoundException(`Expense claim ${id} not found`);
    if ((existing as any).status !== 'PENDING') {
      throw new BadRequestException('Only PENDING claims can be deleted');
    }
    await this.prisma.expenseClaim.delete({ where: { id } });
    return { success: true };
  }
}
