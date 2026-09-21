/**
 * DisasterFundController
 *
 * Full REST surface for the Disaster Risk Management Fund module.
 * Delegates business logic to DisasterFundService; uses PrismaService
 * directly only for the simpler pass-through routes that existed before.
 *
 * Route groups
 * ──────────────────────────────────────────────────────────────────────
 *  Root contributions (frontend uses /disaster-fund, not /contributions)
 *  Dashboard stats
 *  Year summary / analytics
 *  Schedules
 *  Targets
 *  Compliance score / upcoming dues / rules / multi-year / heatmap
 *  Levy calculation (single + batch + auto-generate + import)
 *  Bulk operations (remit / status / flag-overdue)
 *  Reports (list / generate / delete)
 *  Remittances (per-contribution list + create + delete)
 *  Notes (per-contribution list + create + delete)
 *  Audit logs (per-contribution)
 *  ERCA submissions (preview / prepare / submit / acknowledge /
 *                    bulk-generate-prepare / list / compliance-history)
 *
 * ⚠  ORDERING MATTERS in NestJS: static path segments must appear before
 *    parameterised segments at the same nesting level.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Delete,
  Param,
  Headers,
  Request,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions }        from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard }       from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard }   from '../../auth/guards/permissions.guard';
import { PrismaService }       from '../../common/prisma.service';

import { DisasterFundService } from './disaster-fund.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}
function uid(req: any): string | undefined {
  return req?.user?.userId as string | undefined;
}

@ApiTags('disaster-fund')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('disaster-fund')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('disaster_fund:read')
export class DisasterFundController {
  constructor(
    private readonly svc: DisasterFundService,
    private readonly prisma: PrismaService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOT CONTRIBUTIONS  (frontend calls /disaster-fund, not /contributions)
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List disaster fund contributions' })
  async list(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page')     page     = '1',
    @Query('take')     take     = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status')   status?:   string,
    @Query('category') category?: string,
    @Query('period')   period?:   string,
    @Query('search')   search?:   string,
    @Query('companyId') qCompanyId?: string,
  ) {
    const companyId = qCompanyId || cid(h, req);
    const result = await this.svc.listContributions({
      companyId,
      status,
      category,
      period,
      search,
      page:  parseInt(page, 10),
      take:  parseInt(take, 10),
    });
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a disaster fund contribution' })
  async create(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const data = await this.svc.createContribution(
      { ...body, ...(companyId ? { companyId } : {}) },
      uid(req),
    );
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a contribution' })
  async update(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.svc.updateContribution(id, body, cid(h, req), uid(req));
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a contribution (PENDING only)' })
  async remove(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    await this.svc.deleteContribution(id, cid(h, req));
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD STATS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('dashboard-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dashboard summary, trends, upcoming dues and forecast' })
  async dashboardStats(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('companyId') qCompanyId?: string,
  ) {
    const companyId = qCompanyId || cid(h, req);
    const data = await this.svc.getDashboardStats(companyId);
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — year summary / multi-year / monthly heatmap
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('year-summary/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annual breakdown by quarter' })
  async yearSummary(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('year') year: string,
  ) {
    const data = await this.svc.getYearSummary(parseInt(year, 10), cid(h, req));
    return { success: true, data };
  }

  @Get('multi-year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare multiple years' })
  async multiYear(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('years') yearsParam?: string,
  ) {
    const cur = new Date().getFullYear();
    const years = yearsParam
      ? yearsParam.split(',').map((y) => parseInt(y.trim(), 10)).filter(Boolean)
      : [cur - 2, cur - 1, cur];
    const data = await this.svc.getMultiYear(years, cid(h, req));
    return { success: true, data };
  }

  @Get('analytics/monthly-heatmap/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Monthly heatmap for a given year' })
  async monthlyHeatmap(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('year') year: string,
  ) {
    const data = await this.svc.getMonthlyHeatmap(parseInt(year, 10), cid(h, req));
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE — score / upcoming dues / rules
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('compliance-score/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compliance score and grade for a year' })
  async complianceScore(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('year') year: string,
  ) {
    const data = await this.svc.getComplianceScore(parseInt(year, 10), cid(h, req));
    return { success: true, data };
  }

  @Get('upcoming-dues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Contributions due within N days' })
  async upcomingDues(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('days') days = '30',
  ) {
    const data = await this.svc.getUpcomingDues(parseInt(days, 10), cid(h, req));
    return { success: true, data };
  }

  @Get('rules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Levy rules table (Regulation 570/2025)' })
  getRules() {
    return { success: true, data: this.svc.getRules() };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('schedule/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment schedule for a year' })
  async getSchedule(@Param('year') year: string) {
    const data = await this.svc.getScheduleForYear(parseInt(year, 10));
    return { success: true, data };
  }

  @Post('schedule/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Auto-generate schedule entries for a year' })
  async generateSchedule(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { year?: number },
  ) {
    const year = body.year ?? new Date().getFullYear();
    const data = await this.svc.generateSchedule(year, cid(h, req));
    return { success: true, data };
  }

  @Patch('schedule/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a schedule entry status' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.svc.updateScheduleEntry(id, body);
    return { success: true, data };
  }

  // ── Legacy schedules routes (keep for backward compat) ───────────────────

  @Get('schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List payment schedules (legacy)' })
  async getSchedules(@Query('year') year?: string) {
    const where: Record<string, unknown> = {};
    if (year) where.year = parseInt(year, 10);
    const data = await this.prisma.disasterFundSchedule.findMany({
      where,
      orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
    });
    return { success: true, data };
  }

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment schedule entry (legacy)' })
  async createSchedule(@Body() body: Record<string, unknown>) {
    if (!body.year)    throw new BadRequestException('year is required');
    if (!body.quarter) throw new BadRequestException('quarter is required');
    if (!body.dueDate) throw new BadRequestException('dueDate is required');
    const data = await this.prisma.disasterFundSchedule.create({ data: body as any });
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TARGETS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('targets/:year/vs-actual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Targets vs actual contributions for a year' })
  async targetsVsActual(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('year') year: string,
  ) {
    const data = await this.svc.getTargetsVsActual(parseInt(year, 10), cid(h, req));
    return { success: true, data };
  }

  @Get('targets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List contribution targets per year/category' })
  async getTargets(@Query('year') year?: string) {
    const where: Record<string, unknown> = {};
    if (year) where.year = parseInt(year, 10);
    const data = await this.prisma.disasterFundTarget.findMany({
      where,
      orderBy: [{ year: 'desc' }],
    });
    return { success: true, data };
  }

  /** Upsert — frontend sends PUT for both create and update */
  @Put('targets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert a contribution target' })
  async upsertTarget(@Body() body: Record<string, unknown>) {
    const data = await this.svc.upsertTarget(body);
    return { success: true, data };
  }

  @Post('targets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a contribution target' })
  async createTarget(@Body() body: Record<string, unknown>) {
    const data = await this.svc.upsertTarget(body);
    return { success: true, data };
  }

  @Delete('targets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a contribution target' })
  async deleteTarget(@Param('id') id: string) {
    await this.svc.deleteTarget(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVY CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('calculate-levy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate levy for a single category + base amount' })
  async calculateLevy(@Body() body: { category: string; baseAmount: number }) {
    if (!body.category) throw new BadRequestException('category is required');
    const levyAmount = this.svc.calcLevy(body.category as any, Number(body.baseAmount ?? 0));
    return { success: true, data: { category: body.category, baseAmount: body.baseAmount, levyAmount } };
  }

  @Post('batch-calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch levy calculation for multiple line items' })
  async batchCalculate(
    @Body() body: { items: Array<{ category: string; baseAmount: number; label?: string }> },
  ) {
    if (!Array.isArray(body.items)) throw new BadRequestException('items array is required');
    const data = await this.svc.batchCalculate(body.items as any);
    return { success: true, data };
  }

  @Post('auto-generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Auto-generate contributions from source amounts' })
  async autoGenerate(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: {
      period: string;
      sources: Record<string, number>;
      preview?: boolean;
    },
  ) {
    if (!body.period)  throw new BadRequestException('period is required');
    if (!body.sources) throw new BadRequestException('sources is required');
    const data = await this.svc.autoGenerate({
      period:    body.period,
      sources:   body.sources,
      companyId: cid(h, req),
      userId:    uid(req),
      preview:   body.preview ?? false,
    });
    return { success: true, data };
  }

  @Post('import-csv')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk import contributions from parsed CSV rows' })
  async importCsv(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { rows: Array<Record<string, unknown>> },
  ) {
    if (!Array.isArray(body.rows)) throw new BadRequestException('rows array is required');
    const data = await this.svc.importCsv(body.rows, cid(h, req), uid(req));
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @Patch('bulk-remit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple contributions as REMITTED' })
  async bulkRemit(
    @Request() req: any,
    @Body() body: { ids: string[] },
  ) {
    if (!body.ids?.length) return { success: true, data: { processed: 0 } };
    const data = await this.svc.bulkRemit(body.ids, uid(req));
    return { success: true, data };
  }

  @Post('bulk-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set status on multiple contributions' })
  async bulkStatus(
    @Request() req: any,
    @Body() body: { ids: string[]; status: string },
  ) {
    if (!body.ids?.length) return { success: true, data: { processed: 0 } };
    if (!body.status)      throw new BadRequestException('status is required');
    const data = await this.svc.bulkStatus(body.ids, body.status, uid(req));
    return { success: true, data };
  }

  @Patch('flag-overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag all past-due PENDING contributions as OVERDUE' })
  async flagOverdue(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const data = await this.svc.flagOverdue(cid(h, req));
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('reports')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List disaster fund reports' })
  async getReports(@Query('year') year?: string) {
    const where: Record<string, unknown> = {};
    if (year) where.year = parseInt(year, 10);
    const data = await this.prisma.disasterFundReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data };
  }

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate and save a disaster fund report' })
  async generateReport(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { year?: number; period?: string; title?: string },
  ) {
    const companyId = cid(h, req);
    const year = body.year ?? new Date().getFullYear();
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    if (body.period) where.period = body.period;

    const contributions = await this.prisma.disasterFundContribution.findMany({ where });
    const totals = contributions.reduce(
      (acc, c: any) => {
        acc.totalLevy     += Number(c.levyAmount ?? 0);
        acc.totalRemitted += c.status === 'REMITTED' ? Number(c.levyAmount ?? 0) : 0;
        acc.totalPending  += c.status === 'PENDING'  ? Number(c.levyAmount ?? 0) : 0;
        acc.totalOverdue  += c.status === 'OVERDUE'  ? Number(c.levyAmount ?? 0) : 0;
        return acc;
      },
      { totalLevy: 0, totalRemitted: 0, totalPending: 0, totalOverdue: 0 },
    );

    const report = await this.prisma.disasterFundReport.create({
      data: {
        title:        body.title ?? `Disaster Fund Report — ${year}${body.period ? ' / ' + body.period : ''}`,
        year,
        period:       body.period,
        recordCount:  contributions.length,
        generatedBy:  uid(req) ?? 'system',
        snapshotJson: JSON.stringify(contributions),
        ...totals,
      } as any,
    });
    return { success: true, data: report };
  }

  /** Legacy alias kept for backward compatibility */
  @Post('reports/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a disaster fund report (legacy alias)' })
  generateReportLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { year?: number; period?: string; title?: string },
  ) {
    return this.generateReport(h, req, body);
  }

  @Delete('reports/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved report' })
  async deleteReport(@Param('id') id: string) {
    await this.svc.deleteReport(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERCA SUBMISSIONS
  // Static ERCA paths must be ordered before /:id sub-routes.
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('erca/submissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List ERCA submissions, optionally filtered by year' })
  async ercaSubmissions(@Query('year') year?: string) {
    const data = await this.svc.getErcaSubmissions(year ? parseInt(year, 10) : 0);
    return { success: true, data };
  }

  @Get('erca/compliance-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ERCA compliance history by year' })
  async ercaComplianceHistory(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const data = await this.svc.getErcaComplianceHistory(cid(h, req));
    return { success: true, data };
  }

  @Get('erca/preview/:period')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview ERCA submission payload for a period' })
  async ercaPreview(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('period') period: string,
  ) {
    const data = await this.svc.previewErcaSubmission(period, cid(h, req));
    return { success: true, data };
  }

  @Post('erca/prepare')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Prepare (save draft) an ERCA submission for a period' })
  async ercaPrepare(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { period: string },
  ) {
    if (!body.period) throw new BadRequestException('period is required');
    const data = await this.svc.prepareErcaSubmission(body.period, cid(h, req), uid(req));
    return { success: true, data };
  }

  @Post('erca/submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit ERCA declaration for a period' })
  async ercaSubmit(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: {
      period: string;
      paymentMethod?: string;
      bankName?: string;
      paymentReference?: string;
      notes?: string;
    },
  ) {
    if (!body.period) throw new BadRequestException('period is required');
    const data = await this.svc.submitErcaSubmission(body, cid(h, req), uid(req));
    return { success: true, data };
  }

  @Post('erca/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record ERCA acknowledgement for a submission' })
  async ercaAcknowledge(
    @Request() req: any,
    @Body() body: { submissionId: string; ercaReferenceNo: string },
  ) {
    if (!body.submissionId)    throw new BadRequestException('submissionId is required');
    if (!body.ercaReferenceNo) throw new BadRequestException('ercaReferenceNo is required');
    const data = await this.svc.acknowledgeErcaSubmission(
      body.submissionId,
      body.ercaReferenceNo,
      uid(req),
    );
    return { success: true, data };
  }

  @Post('erca/bulk-generate-prepare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check readiness and prepare ERCA bulk generation for a period' })
  async ercaBulkGeneratePrepare(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { period: string; businessType?: string },
  ) {
    if (!body.period) throw new BadRequestException('period is required');
    const data = await this.svc.bulkGeneratePrepare(body.period, body.businessType, cid(h, req));
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PER-CONTRIBUTION SUB-RESOURCES  (:id must come after all static paths)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Audit logs ────────────────────────────────────────────────────────────

  @Get(':id/audit-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Audit log entries for a contribution' })
  async getAuditLogs(@Param('id') id: string) {
    const data = await this.svc.getAuditLogs(id);
    return { success: true, data };
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  @Get(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notes attached to a contribution' })
  async getNotes(@Param('id') id: string) {
    const data = await this.svc.getNotes(id);
    return { success: true, data };
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a note to a contribution' })
  async createNote(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    if (!body.content?.trim()) throw new BadRequestException('content is required');
    const authorName = (req?.user?.name ?? req?.user?.email ?? undefined) as string | undefined;
    const data = await this.svc.createNote(id, body.content.trim(), authorName);
    return { success: true, data };
  }

  @Delete('notes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a note by ID' })
  async deleteNote(@Param('id') id: string) {
    await this.svc.deleteNote(id);
    return { success: true };
  }

  // ── Remittances ───────────────────────────────────────────────────────────

  @Get(':id/remittances')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remittance records for a contribution' })
  async getRemittances(@Param('id') id: string) {
    const data = await this.svc.getRemittances(id);
    return { success: true, data };
  }

  @Post(':id/remittances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a remittance payment for a contribution' })
  async createRemittance(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { amount: number; bankName?: string; referenceNo?: string; notes?: string },
  ) {
    if (body.amount === undefined) throw new BadRequestException('amount is required');
    const data = await this.svc.createRemittance(id, body, uid(req));
    return { success: true, data };
  }

  @Delete('remittances/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a remittance record by ID' })
  async deleteRemittance(@Param('id') id: string) {
    await this.svc.deleteRemittance(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY /contributions/* routes (kept for backward-compat with any existing
  // API consumers; they delegate to the same service methods)
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('contributions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List contributions (legacy path)' })
  listLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page')     page     = '1',
    @Query('take')     take     = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status')   status?:   string,
    @Query('category') category?: string,
    @Query('period')   period?:   string,
  ) {
    return this.list(h, req, page, take, status, category, period, undefined, undefined);
  }

  @Get('contributions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a contribution by ID (legacy path)' })
  async getContributionLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const companyId = cid(h, {} as any);
    const where: Record<string, unknown> = { id };
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.disasterFundContribution.findFirst({ where });
    if (!data) throw new NotFoundException(`Contribution ${id} not found`);
    return { success: true, data };
  }

  @Post('contributions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a contribution (legacy path)' })
  createLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    return this.create(h, req, body);
  }

  @Patch('contributions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a contribution (legacy path)' })
  updateLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.update(h, req, id, body);
  }

  @Patch('contributions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a contribution' })
  async approveContribution(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const data = await this.svc.updateContribution(
      id,
      { status: 'APPROVED' },
      cid(h, req),
      uid(req),
    );
    return { success: true, data };
  }

  @Patch('contributions/:id/remit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a contribution as remitted (legacy)' })
  async remitContributionLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { bankName?: string; referenceNo?: string; amount?: number },
  ) {
    const companyId = cid(h, req);
    const existing = await this.prisma.disasterFundContribution.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Contribution ${id} not found`);

    const [updated] = await Promise.all([
      this.prisma.disasterFundContribution.update({
        where: { id },
        data: { status: 'REMITTED', remittedAt: new Date() } as any,
      }),
      this.prisma.disasterFundRemittance.create({
        data: {
          contributionId: id,
          amount:      body.amount ?? (existing as any).levyAmount,
          bankName:    body.bankName,
          referenceNo: body.referenceNo,
          remittedBy:  uid(req) ?? 'system',
        } as any,
      }),
    ]);
    return { success: true, data: updated };
  }

  @Delete('contributions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a contribution (legacy path)' })
  deleteLegacy(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.remove(h, req, id);
  }
}
