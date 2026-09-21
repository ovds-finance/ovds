/**
 * TreasuryController — real Prisma-backed treasury management.
 *
 * - Cash positions: derived from BankAccount balances (live aggregation)
 * - Cash forecasts: CashForecast model (stored projections)
 * - Batches: FundTransfer records grouped as a "treasury batch" via a
 *   shared reference prefix (FundTransfer.reference starts with "BATCH-")
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AccessPolicyGuard } from '../auth/guards/access-policy.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrismaService } from '../common/prisma.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('treasury')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('treasury')
@UseGuards(JwtAuthGuard, PermissionsGuard, AccessPolicyGuard)
@Permissions('fund_transfers:read')
export class TreasuryController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Cash Positions (live from BankAccount) ────────────────────────────────

  @Get('cash-positions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cash positions — current balance per bank account' })
  async getCashPositions(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = { accountStatus: 'ACTIVE' };
    if (companyId) where.companyId = companyId;

    const accounts = await this.prisma.bankAccount.findMany({
      where,
      select: {
        id: true, name: true, bankName: true, accountNumber: true,
        balance: true, currencyCode: true, accountType: true,
      },
      orderBy: { bankName: 'asc' },
    });

    const positions = accounts.map((a: any) => ({
      accountId:    a.id,
      accountName:  a.name,
      bankName:     a.bankName,
      accountNumber: a.accountNumber,
      currency:     a.currencyCode,
      balance:      Number(a.balance),
      type:         a.accountType,
    }));

    const totalEtb = positions
      .filter((p: any) => p.currency === 'ETB')
      .reduce((s: number, p: any) => s + p.balance, 0);

    return { success: true, data: { positions, totalEtb } };
  }

  @Post('cash-positions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new bank account as a cash position' })
  async createCashPosition(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    // Creating a "cash position" means creating a BankAccount record
    const companyId = cid(h, req);
    if (!body.name || !body.bankName || !body.accountNumber) {
      throw new BadRequestException('name, bankName and accountNumber are required');
    }
    const data = await this.prisma.bankAccount.create({
      data: { ...body, companyId } as any,
    });
    return { success: true, data };
  }

  // ── Cash Forecasts ────────────────────────────────────────────────────────

  @Get('forecasts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List stored cash forecasts' })
  async getForecasts(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (period)    where.period    = period;
    const data = await this.prisma.cashForecast.findMany({
      where,
      orderBy: { period: 'desc' },
    });
    return { success: true, data };
  }

  @Post('forecasts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create / store a cash forecast for a period' })
  async createForecast(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.period) throw new BadRequestException('period (YYYY-MM) is required');
    const data = await this.prisma.cashForecast.create({
      data: { ...body, companyId } as any,
    });
    return { success: true, data };
  }

  @Post('forecast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a cash forecast from actual bank transactions' })
  async generateForecast(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { period?: string },
  ) {
    const companyId = cid(h, req);
    const period = body.period ?? new Date().toISOString().slice(0, 7);
    const where: any = {};
    if (companyId) where.companyId = companyId;

    // Aggregate last 3 months of bank transactions for projection
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const agg = await this.prisma.bankTransaction.groupBy({
      by: ['type'],
      where: { ...where, date: { gte: threeMonthsAgo } } as any,
      _sum: { amount: true },
    }).catch(() => []);

    const credits = (agg as any[]).find((r: any) => r.type === 'CREDIT')?._sum?.amount ?? 0;
    const debits  = (agg as any[]).find((r: any) => r.type === 'DEBIT')?._sum?.amount  ?? 0;
    const inflows  = Number(credits) / 3;
    const outflows = Number(debits)  / 3;
    const netCash  = inflows - outflows;

    const forecast = await this.prisma.cashForecast.upsert({
      where: { period },
      create: { period, companyId, inflows, outflows, netCash, projected: netCash, low: netCash * 0.8, high: netCash * 1.2, confidence: 70 } as any,
      update: { inflows, outflows, netCash, projected: netCash, low: netCash * 0.8, high: netCash * 1.2, confidence: 70, updatedAt: new Date() } as any,
    });
    return { success: true, data: forecast };
  }

  // ── Batches (treasury payment batches via FundTransfer) ───────────────────

  @Get('batches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List treasury payment batches' })
  async getBatches(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    // Batches are FundTransfers whose reference starts with "BATCH-"
    const where: any = { reference: { startsWith: 'BATCH-' } };
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;

    const [data, total] = await Promise.all([
      this.prisma.fundTransfer.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fundTransfer.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Post('batches')
  @Permissions('fund_transfers:write')
  @CheckPolicy('fund_transfers:approve')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a treasury payment batch (FundTransfer)' })
  async createBatch(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    if (!body.fromAccountId) throw new BadRequestException('fromAccountId is required');
    if (!body.toAccountId)   throw new BadRequestException('toAccountId is required');
    if (!body.amount)        throw new BadRequestException('amount is required');

    const batchRef = `BATCH-${Date.now()}`;
    const data = await this.prisma.fundTransfer.create({
      data: {
        ...body,
        companyId,
        reference: batchRef,
        type: 'INTERNAL',
        status: 'PENDING',
      } as any,
    });
    return { success: true, data };
  }

  @Patch('batches/:id')
  @Permissions('fund_transfers:approve')
  @CheckPolicy('fund_transfers:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a treasury batch' })
  async updateBatch(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.fundTransfer.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Batch ${id} not found`);
    const data = await this.prisma.fundTransfer.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Get('batches/:id/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export a treasury batch as CSV' })
  async exportBatch(@Param('id') id: string) {
    const batch = await this.prisma.fundTransfer.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException(`Batch ${id} not found`);
    const header = 'id,reference,amount,currency,status,createdAt';
    const row = [
      batch.id,
      batch.reference ?? '',
      batch.amount,
      batch.currencyCode,
      batch.status,
      batch.createdAt.toISOString(),
    ].join(',');
    return { success: true, data: [header, row].join('\n') };
  }
}
