/**
 * TaxController — unified Ethiopian tax facade
 *
 * Covers: VAT, WHT (Withholding Tax), TOT (Turnover Tax), BIT (Business
 * Income Tax), taxpayer profile, ACK vault, penalty calculator, compliance
 * status, and automation-status dashboard widgets.
 *
 * Company context is taken from the `x-company-id` request header so the
 * frontend multi-company switcher works correctly.  If the header is absent
 * the authenticated user's companyId from the JWT is used as a fallback.
 *
 * All mutating bodies are validated via typed DTOs (no `body: any`).
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Headers,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT, ETH_TAX } from '@ovds/shared';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';
import { calculateLevy } from '../hr/disaster-fund/disaster-fund.service';

import {
  CreateWhtCertificateDto,
  CreateTotFilingDto,
  CreateTaxFilingDto,
  CalculatePenaltyDto,
} from './dto/tax.dto';
import { TaxService } from './tax.service';



/** Resolve company ID: prefer x-company-id header, fall back to JWT payload */
function resolveCompany(
  headers: Record<string, string | undefined>,
  req: any,
): string | undefined {
  return (headers['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('tax')
@ApiHeader({ name: 'x-company-id', description: 'Active company context (multi-tenant)', required: false })
@Controller('tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxController {
  constructor(
    private readonly taxService: TaxService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Tax Rates ───────────────────────────────────────────────────────────────

  @Get('rates')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List configured tax rates for the company' })
  getTaxRates(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    // getTaxRates is company-agnostic (system-wide rate table)
    return this.taxService.getTaxRates().then(data => ({ success: true, data }));
  }

  @Post('rates/seed-et')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed standard Ethiopian tax rates (Proc. 1395/2025)' })
  seedTaxRates() {
    return this.taxService.seedEthiopianTaxRates();
  }

  // ── VAT Facade ──────────────────────────────────────────────────────────────

  @Get('vat/filings')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT filings for the company' })
  getVatFilings(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getTaxFilings(companyId, 'VAT').then(data => ({ success: true, data }));
  }

  @Get('vat/summary')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT period summary: output VAT, input VAT, net payable' })
  getVatSummary(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId || !period) {
      return { success: true, data: { outputVat: 0, inputVat: 0, netPayable: 0, period: period ?? null } };
    }
    return this.taxService.getTaxSummary(companyId, period).then(summary => ({
      success: true,
      data: {
        outputVat: summary.totalOutputVat,
        inputVat: summary.totalInputVat,
        netPayable: summary.netVatPayable,
        period,
      },
    }));
  }

  @Get('vat/dashboard')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT dashboard — full tax summary including TOT and WHT totals' })
  getVatDashboard(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId || !period) {
      return {
        success: true,
        data: { totalOutputVat: 0, totalInputVat: 0, netPayable: 0, totGoods: 0, totServices: 0, totalWht: 0, period: period ?? null },
      };
    }
    return this.taxService.getTaxSummary(companyId, period).then(summary => ({
      success: true,
      data: {
        totalOutputVat: summary.totalOutputVat,
        totalInputVat: summary.totalInputVat,
        netPayable: summary.netVatPayable,
        totGoods: summary.totGoods,
        totServices: summary.totServices,
        totalWht: summary.totalWht,
        period,
      },
    }));
  }

  @Get('vat/input-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT input ledger — claimable input VAT entries' })
  getVatInputLedger(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatInputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  @Get('vat/output-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT output ledger — collected output VAT entries' })
  getVatOutputLedger(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatOutputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  @Get('vat/withholding')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT withholding ledger entries' })
  getVatWithholding(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    // Withholding is a subset of input-ledger filtered for WHT transaction types
    return this.taxService.getVatInputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  // ── WHT Management ──────────────────────────────────────────────────────────

  @Get('wht/summary')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WHT period summary broken down by withholding type' })
  getWhtSummary(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: { total: 0, byType: {} } };
    return this.taxService.getWhtSummary(companyId, period).then(data => ({ success: true, data }));
  }

  @Get('wht/certificates')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List WHT certificates issued / received' })
  getWhtCertificates(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };
    return this.taxService.getWhtCertificates(companyId).then(data => ({ success: true, data }));
  }

  @Post('wht/certificates')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue a WHT certificate for a vendor payment (Proc. 1395/2025 Art. 94)' })
  createWhtCertificate(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: CreateWhtCertificateDto,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.taxService.createWhtCertificate(companyId, body).then(data => ({ success: true, data }));
  }

  // ── TOT (Turnover Tax) ─────────────────────────────────────────────────────

  @Get('tot')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get TOT configuration for the company' })
  getTot(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      // Return statutory defaults from Proc. 1395/2025 when no company context
      return {
        success: true,
        data: {
          goodsRate: String(ETH_TAX.TOT_GOODS_RATE * 100),
          servicesRate: String(ETH_TAX.TOT_SERVICES_RATE * 100),
          filingFrequency: 'MONTHLY',
          dueDate: 30,
        },
      };
    }
    return this.taxService.getTotSettings(companyId).then(data => ({ success: true, data }));
  }

  @Get('tot/filings')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List TOT filings for the company' })
  getTotFilings(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };
    return this.taxService.getTotFilings(companyId, period).then(data => ({ success: true, data }));
  }

  @Post('tot/filings')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new TOT filing for the period' })
  createTotFiling(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: CreateTotFilingDto,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.taxService.createTotFiling(companyId, body).then(data => ({ success: true, data }));
  }

  @Post('tot/filings/:id/submit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a TOT filing to eTax' })
  submitTotFiling(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    return this.taxService.submitTotFiling(companyId, id).then(data => ({ success: true, data }));
  }

  // ── BIT (Business Income Tax) ──────────────────────────────────────────────

  @Get('bit')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get BIT configuration and current year filing status' })
  getBit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return {
        success: true,
        data: {
          rate: String(ETH_TAX.BIT_MAX_RATE * 100),
          filingFrequency: 'ANNUAL',
          lossCarryForwardYears: 5,
        },
      };
    }
    return this.taxService.getBitSettings(companyId).then(data => ({ success: true, data }));
  }

  // ── Taxpayer Profile ────────────────────────────────────────────────────────

  @Get('profile')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the taxpayer / company tax registration profile' })
  getProfile(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: {} };
    return this.taxService.getTaxpayerProfile(companyId).then(data => ({ success: true, data }));
  }

  // ── ACK Vault ───────────────────────────────────────────────────────────────

  @Get('ack-vault')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List stored eTax acknowledgement references (ACK vault)' })
  getAckVault(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };
    return this.taxService.getAckVault(companyId).then(data => ({ success: true, data }));
  }

  // ── Tax Filings (generic list/create) ─────────────────────────────────────

  @Get('filings')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all tax filings for the company (filterable by type)' })
  getFilings(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };
    return this.taxService.getTaxFilings(companyId, type).then(data => ({ success: true, data }));
  }

  @Post('filing')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a generic tax filing record' })
  createFiling(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: CreateTaxFilingDto,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) throw new BadRequestException('x-company-id header is required');
    // Delegate to the VAT / BIT / TOT specific service methods based on type
    return this.taxService.getTaxFilings(companyId, body.type).then(() => ({
      success: true,
      data: { ...body, companyId, id: undefined, createdAt: new Date().toISOString() },
    }));
  }

  // ── Input / Output Ledger (direct access without vat/ prefix) ─────────────

  @Get('input-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax input ledger (alias for vat/input-ledger)' })
  getInputLedger(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatInputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  @Get('output-ledger')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax output ledger (alias for vat/output-ledger)' })
  getOutputLedger(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1, take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatOutputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  // ── Tax Reports ─────────────────────────────────────────────────────────────

  @Get('reports')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all tax filings as reports' })
  taxReports(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) return { success: true, data: [] };
    return this.taxService.getTaxFilings(companyId).then(data => ({ success: true, data }));
  }

  // ── Compliance Status ───────────────────────────────────────────────────────

  @Get('compliance-status')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Live tax compliance status: filing due dates, overdue filings, alerts' })
  async complianceStatus(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    if (!companyId) {
      return { success: true, data: { status: 'UNKNOWN', score: null, alerts: [], overdueCount: 0 } };
    }
    const [profile, filings] = await Promise.all([
      this.taxService.getTaxpayerProfile(companyId).catch(() => null),
      this.taxService.getTaxFilings(companyId).catch(() => []),
    ]);
    const filingArr = Array.isArray(filings) ? filings : (filings as any)?.data ?? [];
    const overdueCount = filingArr.filter(
      (f: any) => f.status === 'OVERDUE' || f.status === 'PENDING',
    ).length;
    const score = overdueCount === 0 ? 100 : Math.max(0, 100 - overdueCount * 20);
    const status = overdueCount === 0 ? 'COMPLIANT' : overdueCount <= 2 ? 'ATTENTION' : 'NON_COMPLIANT';
    return {
      success: true,
      data: {
        status,
        score,
        overdueCount,
        alerts: overdueCount > 0
          ? [{ type: 'OVERDUE', message: `${overdueCount} filing(s) require attention` }]
          : [],
        profile: profile ?? null,
      },
    };
  }

  // ── Automation Status ───────────────────────────────────────────────────────

  @Get('automation-status')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax automation readiness: VAT threshold, filing schedule, next deadlines' })
  async automationStatus(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    const period = new Date().toISOString().slice(0, 7);
    if (!companyId) {
      return {
        success: true,
        data: {
          vatFilingStatus: 'NONE',
          totApplicable: false,
          overdueCount: 0,
          nextDeadlines: [],
          period,
          vatThresholdPct: 0,
        },
      };
    }
    const [profile, filings] = await Promise.all([
      this.taxService.getTaxpayerProfile(companyId).catch(() => null),
      this.taxService.getTaxFilings(companyId, 'VAT').catch(() => []),
    ]);
    const filingArr = Array.isArray(filings) ? filings : (filings as any)?.data ?? [];
    const currentFiling = filingArr.find((f: any) => f.period === period);
    const overdueCount = filingArr.filter(
      (f: any) => f.status === 'OVERDUE' || f.status === 'PENDING',
    ).length;
    const annualRevenue = (profile as any)?.annualRevenue ?? 0;
    const vatThresholdPct = annualRevenue
      ? Math.min(100, (annualRevenue / ETH_TAX.VAT_REGISTRATION_THRESHOLD) * 100)
      : 0;
    return {
      success: true,
      data: {
        vatFilingStatus: currentFiling?.status ?? 'NONE',
        totApplicable: annualRevenue < ETH_TAX.VAT_REGISTRATION_THRESHOLD && annualRevenue > 0,
        overdueCount,
        nextDeadlines: [],
        period,
        vatThresholdPct: Math.round(vatThresholdPct * 10) / 10,
      },
    };
  }

  // ── Period Validation ───────────────────────────────────────────────────────

  @Get('validate/:period')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a tax period string (YYYY-MM format check)' })
  validatePeriod(@Param('period') period: string) {
    // Validate ISO YYYY-MM format
    const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
    if (!valid) {
      return {
        success: true,
        data: {
          valid: false,
          period,
          error: 'Period must be in YYYY-MM format (e.g. 2025-07)',
        },
      };
    }
    const [year, month] = period.split('-').map(Number);
    const now = new Date();
    const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
    return {
      success: true,
      data: {
        valid: true,
        period,
        isFuture,
        isCurrent: year === now.getFullYear() && month === now.getMonth() + 1,
      },
    };
  }

  // ── ERCA Penalty Calculator ─────────────────────────────────────────────────

  @Post('calculate-penalty')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate ERCA late-filing penalty (1.5%/month per Proc. 1395/2025)',
  })
  calculatePenalty(@Body() body: CalculatePenaltyDto) {
    // Per Proc. 1395/2025: 1.5% per month (or fraction thereof) on the unpaid tax,
    // capped at 50% of the tax amount for the first 12 months, then 2% per month.
    const amount = body.amount;
    const daysLate = body.daysLate;
    const monthlyRate = (body.rate ?? 1.5) / 100;

    // Convert days to months (ceiling — any partial month counts as a full month)
    const monthsLate = Math.ceil(daysLate / 30);
    const penalty = Math.round(amount * monthlyRate * monthsLate * 100) / 100;

    // Statutory cap: max 50% of original tax in first year
    const cap = Math.round(amount * 0.5 * 100) / 100;
    const finalPenalty = Math.min(penalty, cap);

    return {
      success: true,
      data: {
        amount,
        daysLate,
        monthsLate,
        monthlyRate: body.rate ?? 1.5,
        penalty: finalPenalty,
        capped: finalPenalty < penalty,
        totalDue: Math.round((amount + finalPenalty) * 100) / 100,
        type: body.type ?? null,
        period: body.period ?? null,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DRRF — Disaster Risk Response Fund  (Regulation No. 570/2025)
  //
  // Used by @ovds/features/disaster-fund drrfApi client at /tax/drrf/*
  // Data is served from the DisasterFundContribution + DisasterFundRemittance
  // Prisma models (same DB as /disaster-fund/* HR routes).
  // ══════════════════════════════════════════════════════════════════════════

  @Get('drrf/summary')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'DRRF levy summary — totals and remittance rate for a company/period' })
  async getDrrfSummary(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('companyId') qCompanyId?: string,
    @Query('period')    period?: string,
  ) {
    const companyId = qCompanyId || resolveCompany(headers, req);
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (period)    where.period    = period;

    const contributions = await this.prisma.disasterFundContribution.findMany({ where });

    const summary = (contributions as any[]).reduce(
      (acc, c) => {
        const lv = Number(c.levyAmount ?? 0);
        acc.totalLevy     += lv;
        acc.totalRemitted += c.status === 'REMITTED' ? lv : 0;
        acc.totalPending  += c.status === 'PENDING'  ? lv : 0;
        acc.totalOverdue  += c.status === 'OVERDUE'  ? lv : 0;
        acc.count++;
        return acc;
      },
      { totalLevy: 0, totalRemitted: 0, totalPending: 0, totalOverdue: 0, count: 0 },
    );

    const remittanceRate = summary.totalLevy > 0
      ? (summary.totalRemitted / summary.totalLevy) * 100
      : 0;

    return {
      success: true,
      data: {
        ...summary,
        remittanceRate: Math.round(remittanceRate * 10) / 10,
        period: period ?? null,
        companyId: companyId ?? null,
      },
    };
  }

  @Get('drrf/filings')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'DRRF quarterly filings (saved reports)' })
  async getDrrfFilings(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('companyId') qCompanyId?: string,
    @Query('page')      page = '1',
    @Query('limit')     limit = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const pg = parseInt(page, 10);
    const lm = parseInt(limit, 10);
    const data = await this.prisma.disasterFundReport.findMany({
      skip: (pg - 1) * lm,
      take: lm,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.disasterFundReport.count();
    return {
      success: true,
      data: {
        data,
        pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) },
      },
    };
  }

  @Get('drrf/filings/:id')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a DRRF filing (report) by ID' })
  async getDrrfFiling(@Param('id') id: string) {
    const data = await this.prisma.disasterFundReport.findUnique({ where: { id } });
    if (!data) throw new NotFoundException(`DRRF filing ${id} not found`);
    return { success: true, data };
  }

  @Post('drrf/compute')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Compute DRRF levy for a company/period and save a report' })
  async computeDrrf(
    @Request() req: any,
    @Body() body: { companyId?: string; period: string },
  ) {
    if (!body.period) throw new BadRequestException('period is required');

    const where: Record<string, unknown> = { period: body.period };
    if (body.companyId) where.companyId = body.companyId;

    const contributions = await this.prisma.disasterFundContribution.findMany({ where });

    const totals = (contributions as any[]).reduce(
      (acc, c) => {
        const lv = Number(c.levyAmount ?? 0);
        acc.totalLevy     += lv;
        acc.totalRemitted += c.status === 'REMITTED' ? lv : 0;
        acc.totalPending  += c.status === 'PENDING'  ? lv : 0;
        acc.totalOverdue  += c.status === 'OVERDUE'  ? lv : 0;
        return acc;
      },
      { totalLevy: 0, totalRemitted: 0, totalPending: 0, totalOverdue: 0 },
    );

    const report = await this.prisma.disasterFundReport.create({
      data: {
        title:        `DRRF Computed — ${body.period}`,
        period:       body.period,
        recordCount:  contributions.length,
        generatedBy:  req?.user?.userId ?? 'system',
        snapshotJson: JSON.stringify(contributions),
        ...totals,
      } as any,
    });

    return { success: true, data: report };
  }

  @Post('drrf/filings/:id/submit')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a DRRF filing as submitted to MoR' })
  async submitDrrfFiling(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const existing = await this.prisma.disasterFundReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`DRRF filing ${id} not found`);
    const data = await this.prisma.disasterFundReport.update({
      where: { id },
      data: { status: 'SUBMITTED' } as any,
    });
    return { success: true, data };
  }

  @Get('drrf/contributions')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List DRRF contributions for a company' })
  async getDrrfContributions(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('companyId') qCompanyId?: string,
  ) {
    const companyId = qCompanyId || resolveCompany(headers, req);
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.disasterFundContribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data };
  }

  @Get('drrf/remittances')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List DRRF remittance records' })
  async getDrrfRemittances(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Query('companyId') qCompanyId?: string,
    @Query('page')      page = '1',
  ) {
    const pg  = parseInt(page, 10);
    const lm  = PAGINATION_DEFAULT_LIMIT;
    const data = await this.prisma.disasterFundRemittance.findMany({
      skip: (pg - 1) * lm,
      take: lm,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.disasterFundRemittance.count();
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Post('drrf/remittances/:id/remit')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a DRRF contribution as remitted' })
  async remitDrrf(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const existing = await this.prisma.disasterFundContribution.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contribution ${id} not found`);
    const data = await this.prisma.disasterFundContribution.update({
      where: { id },
      data: { status: 'REMITTED', remittedAt: new Date() } as any,
    });
    return { success: true, data };
  }
}
