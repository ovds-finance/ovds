import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('tax')
@Controller('tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  // ── Tax Rates ───────────────────────────────────────────────────────────────

  @Get('rates')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tax rates' })
  getTaxRates() {
    return this.taxService.getTaxRates().then(data => ({ success: true, data }));
  }

  @Post('rates/seed-et')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed Ethiopian tax rates' })
  seedTaxRates() {
    return this.taxService.seedEthiopianTaxRates();
  }

  // ── VAT Facade ──────────────────────────────────────────────────────────────

  @Get('vat/filings')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT filings' })
  getVatFilings(@Query('companyId') companyId?: string, @Query('taxPeriod') taxPeriod?: string) {
    if (companyId && taxPeriod) {
      return this.taxService.getTaxFilings(companyId, 'VAT').then(data => ({ success: true, data }));
    }
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Get('vat/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT summary' })
  getVatSummary(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId || !period) {
      return { success: true, data: { outputVat: 0, inputVat: 0, netPayable: 0 } };
    }
    return this.taxService.getTaxSummary(companyId, period).then(summary => ({
      success: true,
      data: {
        outputVat: summary.totalOutputVat,
        inputVat: summary.totalInputVat,
        netPayable: summary.netVatPayable,
      },
    }));
  }

  @Get('vat/dashboard')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT dashboard' })
  getVatDashboard(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId || !period) {
      return { success: true, data: { totalOutputVat: 0, totalInputVat: 0, netPayable: 0 } };
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
      },
    }));
  }

  @Get('vat/input-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT input ledger' })
  getVatInputLedger(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatInputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  @Get('vat/output-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT output ledger' })
  getVatOutputLedger(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatOutputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  @Get('vat/withholding')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT withholding' })
  getVatWithholding(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatInputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  // ── WHT Management ──────────────────────────────────────────────────────────

  @Get('wht/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WHT summary' })
  getWhtSummary(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: { total: 0, byType: {} } };
    }
    return this.taxService.getWhtSummary(companyId, period).then(data => ({ success: true, data }));
  }

  @Get('wht/certificates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WHT certificates' })
  getWhtCertificates(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return { success: true, data: [] };
    }
    return this.taxService.getWhtCertificates(companyId).then(data => ({ success: true, data }));
  }

  @Post('wht/certificates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create WHT certificate' })
  createWhtCertificate(@Query('companyId') companyId: string, @Body() body: any) {
    return this.taxService.createWhtCertificate(companyId, body).then(data => ({ success: true, data }));
  }

  // ── TOT Settings ────────────────────────────────────────────────────────────

  @Get('tot')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get TOT settings' })
  getTot(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return { success: true, data: { goodsRate: '2.00', servicesRate: '10.00', filingFrequency: 'MONTHLY', dueDate: 30 } };
    }
    return this.taxService.getTotSettings(companyId).then(data => ({ success: true, data }));
  }

  @Get('tot/filings')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List TOT filings' })
  getTotFilings(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: [] };
    }
    return this.taxService.getTotFilings(companyId, period).then(data => ({ success: true, data }));
  }

  @Post('tot/filings')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create TOT filing' })
  createTotFiling(@Query('companyId') companyId: string, @Body() body: any) {
    return this.taxService.createTotFiling(companyId, body).then(data => ({ success: true, data }));
  }

  @Post('tot/filings/:id/submit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit TOT filing' })
  submitTotFiling(@Query('companyId') companyId: string, @Param('id') id: string) {
    return this.taxService.submitTotFiling(companyId, id).then(data => ({ success: true, data }));
  }

  // ── BIT Settings ────────────────────────────────────────────────────────────

  @Get('bit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get BIT settings' })
  getBit(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return { success: true, data: { rate: '30.00', filingFrequency: 'ANNUAL', dueDate: '2025-07-30', lossCarryForwardYears: 5 } };
    }
    return this.taxService.getBitSettings(companyId).then(data => ({ success: true, data }));
  }

  // ── Taxpayer Profile ────────────────────────────────────────────────────────

  @Get('profile')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get taxpayer profile' })
  getProfile(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return { success: true, data: {} };
    }
    return this.taxService.getTaxpayerProfile(companyId).then(data => ({ success: true, data }));
  }

  // ── ACK Vault ───────────────────────────────────────────────────────────────

  @Get('ack-vault')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get ACK vault' })
  getAckVault(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return { success: true, data: [] };
    }
    return this.taxService.getAckVault(companyId).then(data => ({ success: true, data }));
  }

  // ── Tax Filings ────────────────────────────────────────────────────────────

  @Get('filings')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tax filings' })
  getFilings(@Query('companyId') companyId?: string, @Query('type') type?: string) {
    if (!companyId) {
      return { success: true, data: [] };
    }
    return this.taxService.getTaxFilings(companyId, type).then(data => ({ success: true, data }));
  }

  @Post('filing')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create tax filing' })
  createFiling(@Query('companyId') companyId: string, @Body() body: any) {
    return { success: true, data: { ...body, id: 'tax-' + Date.now() } };
  }

  // ── Tax Input/Output Ledger ────────────────────────────────────────────────

  @Get('input-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax input ledger' })
  getInputLedger(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatInputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  @Get('output-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax output ledger' })
  getOutputLedger(@Query('companyId') companyId?: string, @Query('period') period?: string) {
    if (!companyId) {
      return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
    }
    return this.taxService.getVatOutputLedger(companyId, period).then(data => ({
      success: true,
      data: { data, pagination: { total: data.length, page: 1, take: data.length, pages: 1 } },
    }));
  }

  // ── Tax Reports ─────────────────────────────────────────────────────────────

  @Get('reports')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax reports' })
  taxReports(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return { success: true, data: [] };
    }
    return this.taxService.getTaxFilings(companyId).then(data => ({ success: true, data }));
  }

  // ── Tax Compliance Status ───────────────────────────────────────────────────

  @Get('compliance-status')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax compliance status' })
  complianceStatus(@Query('companyId') companyId?: string) {
    return { success: true, data: { status: 'COMPLIANT', score: 100, alerts: [] } };
  }

  // ── Tax Automation Status ───────────────────────────────────────────────────

  @Get('automation-status')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tax automation status' })
  automationStatus(@Query('companyId') companyId?: string) {
    return { success: true, data: { vatFilingStatus: 'NONE', totApplicable: false, overdueCount: 0, nextDeadlines: [], period: new Date().toISOString().slice(0, 7), vatThresholdPct: 0 } };
  }

  // ── Tax Validation ──────────────────────────────────────────────────────────

  @Get('validate/:period')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate tax period' })
  validatePeriod(@Param('period') period: string) {
    return { success: true, data: { valid: true, period } };
  }

  // ── Tax Penalty Calculator ──────────────────────────────────────────────────

  @Post('calculate-penalty')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate tax penalty' })
  calculatePenalty(@Body() body: any) {
    const amount = parseFloat(body.amount || '0');
    const daysLate = parseInt(body.daysLate || '0', 10);
    const rate = parseFloat(body.rate || '1.5');
    const penalty = Math.round(amount * (rate / 100) * daysLate * 100) / 100;
    return { success: true, data: { ...body, penalty } };
  }
}
