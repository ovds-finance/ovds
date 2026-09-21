/**
 * VatController — real Prisma-backed VAT module endpoints.
 *
 * All write operations persist to the database instead of returning fake
 * Date.now() IDs. Company context comes from the x-company-id header first,
 * then falls back to the authenticated user's companyId from the JWT.
 *
 * The VatService (from @ovds/domains-vat) handles VAT declarations; the
 * ledger-level reads/writes go directly through PrismaService.
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
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { VatService, SubmitVatDeclarationDto } from '@ovds/domains-vat';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccessPolicyGuard } from '../auth/guards/access-policy.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EthiopianTinPipe } from '../common/ethiopian-tin.pipe';
import { PrismaService } from '../common/prisma.service';
import { TaxSerializationInterceptor } from '../common/tax-serialization.interceptor';


function resolveCompany(headers: Record<string, string | undefined>, req: any): string | undefined {
  return (headers['x-company-id'] as string | undefined) || req?.user?.companyId;
}

function paginateWhere(
  companyId: string | undefined,
  period: string | undefined,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(companyId ? { companyId } : {}),
    ...(period ? { period } : {}),
    ...(extra ?? {}),
  };
}

@ApiTags('vat')
@ApiHeader({ name: 'x-company-id', description: 'Active company context', required: false })
@Controller('vat')
@UseGuards(JwtAuthGuard, RolesGuard, AccessPolicyGuard)
@UseInterceptors(TaxSerializationInterceptor)
export class VatController {
  constructor(
    private readonly vatService: VatService,
    private readonly prisma: PrismaService,
  ) {}

  // ── VAT Filings ────────────────────────────────────────────────────────────

  @Get('filings')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT filings for the company' })
  async getFilings(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatFiling.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { period: 'desc' } }),
      this.prisma.vatFiling.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('filings/calculate')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate and upsert a VAT filing for a period' })
  async calculateFiling(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { period: string; notes?: string },
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    if (!body.period) throw new BadRequestException('period is required');

    // Aggregate output VAT from invoices and input VAT from bills for the period.
    const [outputRows, inputRows] = await Promise.all([
      this.prisma.vatOutputLedger.findMany({ where: { companyId: cid, period: body.period } }),
      this.prisma.vatInputLedger.findMany({ where: { companyId: cid, period: body.period } }),
    ]);

    const outputVat = outputRows.reduce((s, r) => s + Number(r.vatAmount ?? 0), 0);
    const inputVat = inputRows.reduce((s, r) => s + Number(r.vatAmount ?? 0), 0);
    const netPayable = Math.max(0, outputVat - inputVat);

    const filing = await this.prisma.vatFiling.upsert({
      where: { companyId_period: { companyId: cid, period: body.period } },
      create: { companyId: cid, period: body.period, outputVat, inputVat, netPayable, notes: body.notes },
      update: { outputVat, inputVat, netPayable, notes: body.notes },
    });
    return { success: true, data: filing };
  }

  @Get('summary')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT summary for a period' })
  async getSummary(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid || !period) {
      return { success: true, data: { totalOutputVat: 0, totalInputVat: 0, netPayable: 0 } };
    }
    const filing = await this.prisma.vatFiling.findFirst({ where: { companyId: cid, period } });
    return {
      success: true,
      data: {
        totalOutputVat: Number(filing?.outputVat ?? 0),
        totalInputVat:  Number(filing?.inputVat  ?? 0),
        netPayable:     Number(filing?.netPayable ?? 0),
        period,
      },
    };
  }

  @Get('dashboard')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT dashboard aggregates' })
  async getDashboard(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const cid = resolveCompany(h, req);
    const currentPeriod = period ?? new Date().toISOString().slice(0, 7);
    if (!cid) return { success: true, data: { totalOutputVat: 0, totalInputVat: 0, netPayable: 0 } };
    const filing = await this.prisma.vatFiling.findFirst({ where: { companyId: cid, period: currentPeriod } });
    return {
      success: true,
      data: {
        totalOutputVat: Number(filing?.outputVat ?? 0),
        totalInputVat:  Number(filing?.inputVat  ?? 0),
        netPayable:     Number(filing?.netPayable ?? 0),
        period: currentPeriod,
      },
    };
  }

  @Post('filings/:filingId/lock')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock a VAT filing period (prevents further mutations)' })
  async lockFiling(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('filingId') filingId: string,
  ) {
    const cid = resolveCompany(h, req);
    const filing = await this.prisma.vatFiling.findFirst({ where: { id: filingId, ...(cid ? { companyId: cid } : {}) } });
    if (!filing) throw new NotFoundException(`VAT filing ${filingId} not found`);
    const updated = await this.prisma.vatFiling.update({
      where: { id: filingId },
      data: { periodLockedAt: new Date(), periodLockedBy: req?.user?.userId ?? null },
    });
    return { success: true, data: updated };
  }

  @Patch('filings/:filingId/apportionment')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update VAT filing input apportionment percentage' })
  async updateApportionment(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('filingId') filingId: string,
    @Body() body: { inputApportionmentPct: number },
  ) {
    const cid = resolveCompany(h, req);
    const filing = await this.prisma.vatFiling.findFirst({ where: { id: filingId, ...(cid ? { companyId: cid } : {}) } });
    if (!filing) throw new NotFoundException(`VAT filing ${filingId} not found`);
    const updated = await this.prisma.vatFiling.update({
      where: { id: filingId },
      data: { inputApportionmentPct: body.inputApportionmentPct },
    });
    return { success: true, data: updated };
  }

  @Get('filings/:filingId/apportionment')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get VAT filing apportionment details' })
  async getFilingApportionment(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('filingId') filingId: string,
  ) {
    const cid = resolveCompany(h, req);
    const filing = await this.prisma.vatFiling.findFirst({ where: { id: filingId, ...(cid ? { companyId: cid } : {}) } });
    if (!filing) throw new NotFoundException(`VAT filing ${filingId} not found`);
    const inputVat = Number(filing.inputVat ?? 0);
    const pct = Number(filing.inputApportionmentPct ?? 1);
    return {
      success: true,
      data: {
        filingId,
        apportionmentPct: pct,
        totalInputVat: inputVat,
        claimableInputVat: Math.round(inputVat * pct * 100) / 100,
        nonClaimableInputVat: Math.round(inputVat * (1 - pct) * 100) / 100,
        periodLocked: !!filing.periodLockedAt,
      },
    };
  }

  // ── VAT Input Ledger ───────────────────────────────────────────────────────

  @Get('input-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT input ledger entries' })
  async getInputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatInputLedger.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { date: 'desc' } }),
      this.prisma.vatInputLedger.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('input-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT input ledger entry' })
  async createInputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatInputLedger.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Patch('input-ledger/:id')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a VAT input ledger entry' })
  async updateInputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatInputLedger.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Input ledger entry ${id} not found`);
    const data = await this.prisma.vatInputLedger.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('input-ledger/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT input ledger entry' })
  async deleteInputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatInputLedger.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Input ledger entry ${id} not found`);
    await this.prisma.vatInputLedger.delete({ where: { id } });
    return { success: true };
  }

  // ── VAT Output Ledger ──────────────────────────────────────────────────────

  @Get('output-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT output ledger entries' })
  async getOutputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatOutputLedger.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { date: 'desc' } }),
      this.prisma.vatOutputLedger.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('output-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT output ledger entry' })
  async createOutputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatOutputLedger.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Patch('output-ledger/:id')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a VAT output ledger entry' })
  async updateOutputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatOutputLedger.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Output ledger entry ${id} not found`);
    const data = await this.prisma.vatOutputLedger.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('output-ledger/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT output ledger entry' })
  async deleteOutputLedger(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatOutputLedger.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Output ledger entry ${id} not found`);
    await this.prisma.vatOutputLedger.delete({ where: { id } });
    return { success: true };
  }

  // ── VAT Withholding ────────────────────────────────────────────────────────

  @Get('withholding')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT withholding entries' })
  async getWithholding(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatWithholding.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { createdAt: 'desc' } }),
      this.prisma.vatWithholding.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('withholding')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT withholding entry' })
  async createWithholding(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatWithholding.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Patch('withholding/:id/toggle-remitted')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle VAT withholding remitted status' })
  async toggleWithholding(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const entry = await this.prisma.vatWithholding.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!entry) throw new NotFoundException(`Withholding entry ${id} not found`);
    const updated = await this.prisma.vatWithholding.update({
      where: { id },
      data: { remitted: !(entry as any).remitted } as any,
    });
    return { success: true, data: updated };
  }

  @Delete('withholding/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT withholding entry' })
  async deleteWithholding(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatWithholding.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Withholding entry ${id} not found`);
    await this.prisma.vatWithholding.delete({ where: { id } });
    return { success: true };
  }

  // ── VAT Reverse Charges ───────────────────────────────────────────────────

  @Get('reverse-charges')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT reverse charge entries' })
  async getReverseCharges(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatReverseCharge.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { createdAt: 'desc' } }),
      this.prisma.vatReverseCharge.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('reverse-charges')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT reverse charge entry' })
  async createReverseCharge(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatReverseCharge.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Delete('reverse-charges/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT reverse charge entry' })
  async deleteReverseCharge(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatReverseCharge.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Reverse charge ${id} not found`);
    await this.prisma.vatReverseCharge.delete({ where: { id } });
    return { success: true };
  }

  // ── VAT Refund Claims ──────────────────────────────────────────────────────

  @Get('refund-claims')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT refund claims' })
  async getRefundClaims(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatRefundClaim.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { createdAt: 'desc' } }),
      this.prisma.vatRefundClaim.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('refund-claims')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT refund claim' })
  async createRefundClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatRefundClaim.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Patch('refund-claims/:id/status')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update VAT refund claim status' })
  async updateRefundClaimStatus(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatRefundClaim.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Refund claim ${id} not found`);
    const data = await this.prisma.vatRefundClaim.update({
      where: { id },
      data: { status: body.status, notes: body.notes } as any,
    });
    return { success: true, data };
  }

  @Delete('refund-claims/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT refund claim' })
  async deleteRefundClaim(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatRefundClaim.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Refund claim ${id} not found`);
    await this.prisma.vatRefundClaim.delete({ where: { id } });
    return { success: true };
  }

  // ── VAT Notes ─────────────────────────────────────────────────────────────

  @Get('notes')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT notes' })
  async getNotes(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where: Record<string, unknown> = cid ? { companyId: cid } : {};
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatNote.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { date: 'desc' } }),
      this.prisma.vatNote.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('notes')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT note' })
  async createNote(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatNote.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Delete('notes/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT note' })
  async deleteNote(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatNote.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`VAT note ${id} not found`);
    await this.prisma.vatNote.delete({ where: { id } });
    return { success: true };
  }

  // ── VAT Export Evidence ───────────────────────────────────────────────────

  @Get('export-evidence')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT export evidence records' })
  async getExportEvidence(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where: Record<string, unknown> = cid ? { companyId: cid } : {};
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatExportEvidence.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { exportDate: 'desc' } }),
      this.prisma.vatExportEvidence.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('export-evidence')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a VAT export evidence record' })
  async createExportEvidence(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatExportEvidence.create({ data: { ...body, companyId: cid } as any });
    return { success: true, data };
  }

  @Patch('export-evidence/:id/cycle/:field')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cycle a document status field (missing → partial → present)' })
  async cycleExportEvidence(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Param('field') field: string,
  ) {
    const cid = resolveCompany(h, req);
    const ALLOWED = ['customsDecl', 'billOfLading', 'bankReceipt'];
    if (!ALLOWED.includes(field)) throw new BadRequestException(`Field ${field} cannot be cycled`);
    const existing = await this.prisma.vatExportEvidence.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Export evidence ${id} not found`);
    const CYCLE: Record<string, string> = { missing: 'partial', partial: 'present', present: 'missing' };
    const currentVal = String((existing as any)[field] ?? 'missing');
    const nextVal = CYCLE[currentVal] ?? 'partial';
    const data = await this.prisma.vatExportEvidence.update({ where: { id }, data: { [field]: nextVal } as any });
    return { success: true, data };
  }

  @Delete('export-evidence/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a VAT export evidence record' })
  async deleteExportEvidence(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const cid = resolveCompany(h, req);
    const existing = await this.prisma.vatExportEvidence.findFirst({ where: { id, ...(cid ? { companyId: cid } : {}) } });
    if (!existing) throw new NotFoundException(`Export evidence ${id} not found`);
    await this.prisma.vatExportEvidence.delete({ where: { id } });
    return { success: true };
  }

  // ── eTax Submissions ──────────────────────────────────────────────────────

  @Get('etax-submissions')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List eTax submission records' })
  async getEtaxSubmissions(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const takeNum = Math.min(200, parseInt(take, 10) || PAGINATION_DEFAULT_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.vatETaxSubmission.findMany({ where, skip: (pageNum - 1) * takeNum, take: takeNum, orderBy: { submittedAt: 'desc' } }),
      this.prisma.vatETaxSubmission.count({ where }),
    ]);
    return { success: true, data: { data, pagination: { total, page: pageNum, take: takeNum, pages: Math.ceil(total / takeNum) } } };
  }

  @Post('etax-submissions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record an eTax return submission' })
  async submitEtax(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const cid = resolveCompany(h, req);
    if (!cid) throw new BadRequestException('x-company-id header is required');
    const data = await this.prisma.vatETaxSubmission.create({
      data: {
        ...body,
        companyId: cid,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      } as any,
    });
    return { success: true, data };
  }

  // ── Period Summary ────────────────────────────────────────────────────────

  @Get('period-summary/:period')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full VAT period summary including all sub-ledgers' })
  async getPeriodSummary(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('period') period: string,
  ) {
    const cid = resolveCompany(h, req);
    const where = paginateWhere(cid, period);

    const [filing, withholding, reverseCharge, refundClaims, inputLedger, outputLedger] = await Promise.all([
      this.prisma.vatFiling.findFirst({ where }),
      this.prisma.vatWithholding.findMany({ where }),
      this.prisma.vatReverseCharge.findMany({ where }),
      this.prisma.vatRefundClaim.findMany({ where }),
      this.prisma.vatInputLedger.findMany({ where }),
      this.prisma.vatOutputLedger.findMany({ where }),
    ]);

    const totalOutputVat = outputLedger.reduce((s, r) => s + Number(r.vatAmount ?? 0), 0);
    const totalInputVat  = inputLedger.reduce((s, r) => s + Number(r.vatAmount ?? 0), 0);
    const claimableInputVat = inputLedger.filter(r => r.claimable).reduce((s, r) => s + Number(r.vatAmount ?? 0), 0);
    const totalWithheld  = withholding.reduce((s: number, r: any) => s + Number(r.vatAmount ?? 0), 0);
    const totalReverseCharge = reverseCharge.reduce((s: number, r: any) => s + Number(r.vatAmount ?? 0), 0);
    const pendingRefunds = refundClaims.filter((r: any) => r.status === 'submitted').reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const unremittedWithholding = (withholding as any[]).filter(r => !r.remitted).reduce((s, r) => s + Number(r.vatAmount ?? 0), 0);

    return {
      success: true,
      data: {
        period,
        totalOutputVat: Math.round(totalOutputVat * 100) / 100,
        totalInputVat:  Math.round(totalInputVat  * 100) / 100,
        claimableInputVat: Math.round(claimableInputVat * 100) / 100,
        netPayable: Math.round(Math.max(0, totalOutputVat - claimableInputVat) * 100) / 100,
        totalWithheld: Math.round(totalWithheld * 100) / 100,
        totalReverseCharge: Math.round(totalReverseCharge * 100) / 100,
        pendingRefunds: Math.round(pendingRefunds * 100) / 100,
        unremittedWithholding: Math.round(unremittedWithholding * 100) / 100,
        filingStatus: filing?.status ?? null,
        periodLocked: !!filing?.periodLockedAt,
        withholding,
        reverseCharge,
        refundClaims,
        inputLedger,
        outputLedger,
      },
    };
  }

  // ── IRN Records ───────────────────────────────────────────────────────────

  @Get('irn')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS IRN registrations' })
  async getIrn(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const cid = resolveCompany(h, req);
    const where: Record<string, unknown> = cid ? { companyId: cid } : {};
    const data = await this.prisma.eimsRegistration.findMany({ where, orderBy: { registeredAt: 'desc' }, take: 200 }).catch(() => []);
    return { success: true, data };
  }

  @Get('irn/:invoiceId')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get IRN for a specific invoice' })
  async getIrnForInvoice(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('invoiceId') invoiceId: string,
  ) {
    const cid = resolveCompany(h, req);
    const reg = await this.prisma.eimsRegistration.findFirst({
      where: { invoiceId, ...(cid ? { companyId: cid } : {}) },
      orderBy: { registeredAt: 'desc' },
    }).catch(() => null);
    return { success: true, data: { invoiceId, irn: reg?.irn ?? null, status: reg?.status ?? 'NOT_REGISTERED', registration: reg } };
  }

  // ── VAT Declarations (VatService delegations) ─────────────────────────────

  @Post('declarations/submit')
  @Roles('ADMIN', 'FINANCE')
  @Permissions('vat:file')
  @CheckPolicy('vat:file')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a VAT declaration to the MoR' })
  async submitDeclaration(@Body(EthiopianTinPipe) dto: SubmitVatDeclarationDto) {
    const result = await this.vatService.processAndPersistDeclaration(dto);
    return { success: true, data: result };
  }

  @Get('declarations/:id')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a VAT declaration with its line items' })
  async getDeclaration(@Param('id') id: string) {
    const result = await this.vatService.getDeclarationWithDetails(id);
    return { success: true, data: result };
  }

  @Get('declarations')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT declarations by company and period' })
  async getDeclarations(@Query() query: { companyId: string; taxPeriod: string }) {
    const result = await this.vatService.getDeclarationsByPeriod(query.companyId, query.taxPeriod);
    return { success: true, data: result };
  }
}
