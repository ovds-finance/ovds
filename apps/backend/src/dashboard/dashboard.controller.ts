import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

/**
 * DashboardController — aggregated stats consumed by the main dashboard page.
 *
 * All endpoints require authentication but no specific role — the
 * PermissionsGuard (global APP_GUARD) handles fine-grained access, and
 * super-users bypass both guards automatically.
 *
 * Endpoints return sensible zero-values when data is missing so the
 * frontend never breaks on a fresh / empty company.
 */
@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);
  constructor(private readonly prisma: PrismaService) {}

  // ── /dashboard/stats ──────────────────────────────────────────────────────
  // Fields consumed by the frontend:
  //   totalEmployees, presentToday, lateToday, absentToday, onLeaveToday
  //   payroll.pending, reimbursement.pending
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aggregated dashboard statistics' })
  async getStats(@Query('companyId') companyId?: string) {
    const where = companyId ? { companyId } : {};
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalEmployees,
      presentToday,
      lateToday,
      onLeaveToday,
      pendingPayroll,
      pendingReimbursements,
    ] = await Promise.all([
      // Total active employees
      this.prisma.employee.count({ where }).catch(() => 0),

      // Checked-in today (attendance records with a checkIn but no verified-absent status)
      this.prisma.attendance.count({
        where: {
          ...(companyId ? { employee: { companyId } } : {}),
          checkIn: { gte: startOfDay, lt: endOfDay },
        },
      }).catch(() => 0),

      // Late arrivals — checked in after 09:00 local time
      this.prisma.attendance.count({
        where: {
          ...(companyId ? { employee: { companyId } } : {}),
          checkIn: {
            gte: new Date(startOfDay.getTime() + 9 * 60 * 60 * 1000),
            lt:  endOfDay,
          },
        },
      }).catch(() => 0),

      // On approved leave today
      this.prisma.leave.count({
        where: {
          ...(companyId ? { employee: { companyId } } : {}),
          status: 'APPROVED',
          startDate: { lte: today },
          endDate:   { gte: today },
        },
      }).catch(() => 0),

      // Payroll records pending approval
      this.prisma.payrollRecord.count({
        where: {
          ...(companyId ? { companyId } : {}),
          status: 'PENDING',
        },
      }).catch(() => 0),

      // Reimbursement claims pending approval
      this.prisma.reimbursementClaim.count({
        where: {
          ...(companyId ? { companyId } : {}),
          status: 'PENDING',
        },
      }).catch(() => 0),
    ]);

    const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

    return {
      success: true,
      data: {
        totalEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeaveToday,
        payroll: { pending: pendingPayroll },
        reimbursement: { pending: pendingReimbursements },
      },
    };
  }

  // ── /dashboard/reports ────────────────────────────────────────────────────
  // The frontend uses reportsData.weeklyTrend (number[7]) to render the
  // 7-day revenue sparkline. Falls back gracefully when data is absent.
  @Get('reports')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dashboard 7-day trend and summary reports' })
  async getReports(@Query('companyId') companyId?: string) {
    const today = new Date();
    // Build array of 7 day-start boundaries (Mon → Sun of current week)
    const weeklyTrend: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Sum invoice amounts issued on this day
      const agg = await this.prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
          ...(companyId ? { companyId } : {}),
          date: { gte: dayStart, lt: dayEnd },
          status: { not: 'CANCELLED' },
        },
      }).catch(() => ({ _sum: { totalAmount: null } }));

      weeklyTrend.push(Number(agg._sum?.totalAmount ?? 0));
    }

    return {
      success: true,
      data: { weeklyTrend },
    };
  }

  // ── /dashboard/strategic-insights ─────────────────────────────────────────
  // Consumed only by ADMIN / SPURADMIN / SUPERADMIN. Returns high-level KPIs.
  @Get('strategic-insights')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN', 'FINANCE', 'OVDS')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Strategic insights for admin / executive view' })
  async getStrategicInsights(
    @Query('companyId') companyId?: string,
    @Request() req?: any,
  ) {
    const where = companyId ? { companyId } : {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalEmployees,
      totalPayrollThisMonth,
    ] = await Promise.all([
      this.prisma.invoice.count({ where }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...where, status: 'PAID'    } }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }).catch(() => 0),
      this.prisma.employee.count({ where }).catch(() => 0),

      this.prisma.payrollRecord.aggregate({
        _sum: { netPay: true },
        where: {
          ...(companyId ? { companyId } : {}),
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }).then((r: any) => Number(r._sum?.netPay ?? 0)).catch(() => 0),
    ]);

    return {
      success: true,
      data: {
        invoices: {
          total:   totalInvoices,
          paid:    paidInvoices,
          overdue: overdueInvoices,
        },
        totalEmployees,
        payroll: { totalThisMonth: totalPayrollThisMonth },
      },
    };
  }

  // ── /dashboard/migration-status ────────────────────────────────────────────
  // Returns the applied migration count and latest migration timestamp from
  // the Prisma _prisma_migrations table.  Useful for:
  //   - Cloud: verifying all tenants share the same migration version
  //   - On-premise: confirming the embedded bootstrapper succeeded
  //   - CI/CD: gating deployments on migration freshness
  @Get('migration-status')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Prisma migration status for the current database' })
  async getMigrationStatus() {
    try {
      const migrations = await (this.prisma as any).$queryRaw`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        ORDER BY finished_at DESC
        LIMIT 20
      `;

      const appliedCount = await (this.prisma as any).$queryRaw`
        SELECT COUNT(*)::int AS count FROM _prisma_migrations
      `;

      const count = Array.isArray(appliedCount) && appliedCount[0]?.count != null
        ? appliedCount[0].count
        : (migrations as any[]).length;

      const latest = migrations[0] || null;

      return {
        success: true,
        data: {
          appliedCount: count,
          latestMigration: latest,
          recentMigrations: (migrations as any[]).slice(0, 5),
          deploymentMode: process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS',
        },
      };
    } catch (err: any) {
      // Do not expose the raw database error message to the client
      this.logger.error('migration-status query failed', err instanceof Error ? err.stack : String(err));
      return {
        success: false,
        data: {
          error: 'Unable to retrieve migration status.',
          deploymentMode: process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS',
        },
      };
    }
  }
}

