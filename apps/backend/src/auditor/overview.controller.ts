import { Controller, Get, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FraudAlertStatus } from '@ovds/database';

import { PrismaService } from '../common/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

export interface OverviewMetrics {
  totalRegisteredTenants: number;
  activeEngagements: number;
  pendingReview: number;
  totalFindings: number;
  criticalFindings: number;
  suspectedFraudAlerts: number;
  confirmedFraudAlerts: number;
}

@ApiTags('auditor/overview')
@Controller('api/v1/auditor/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OverviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  @Roles('AABE_SUPERVISOR', 'GLOBAL_ADMIN')
  @ApiOperation({ summary: 'Cross-tenant audit system metrics for oversight supervisors' })
  @ApiResponse({ status: 200, description: 'Returns aggregated auditor platform metrics' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter metrics to a specific tenant' })
  async getGlobalOverview(@Query('tenantId') tenantId?: string): Promise<OverviewMetrics> {
    if (tenantId && !this.isValidUuid(tenantId)) {
      throw new BadRequestException('Invalid tenantId format');
    }

    const whereClause = tenantId ? { tenantId } : {};

    const [
      totalTenants,
      activeEngagements,
      underReviewEngagements,
      totalFindings,
      criticalFindings,
      suspectedAlerts,
      confirmedAlerts,
    ] = await this.prisma.$transaction([
      this.prisma.auditTenant.count(),
      this.prisma.auditorEngagement.count({
        where: { status: { in: ['PLANNING', 'FIELDWORK', 'REVIEW', 'REPORTING'] } },
      }),
      this.prisma.auditorEngagement.count({ where: { status: 'REVIEW' } }),
      this.prisma.auditorFinding.count(),
      this.prisma.auditorFinding.count({ where: { severity: 'CRITICAL' } }),
      this.prisma.fraudAlert.count({
        where: { status: 'SUSPECTED', ...whereClause },
      }),
      this.prisma.fraudAlert.count({
        where: { status: 'CONFIRMED', ...whereClause },
      }),
    ]);

    return {
      totalRegisteredTenants: totalTenants,
      activeEngagements,
      pendingReview: underReviewEngagements,
      totalFindings,
      criticalFindings,
      suspectedFraudAlerts: suspectedAlerts,
      confirmedFraudAlerts: confirmedAlerts,
    };
  }

  @Get('fraud-alerts')
  @Roles('AABE_SUPERVISOR', 'GLOBAL_ADMIN')
  @ApiOperation({ summary: 'List fraud alerts across all tenants (for oversight)' })
  @ApiResponse({ status: 200, description: 'Returns paginated fraud alerts' })
  @ApiQuery({ name: 'status', required: false, enum: ['SUSPECTED', 'UNDER_INVESTIGATION', 'CLEARED', 'CONFIRMED'] })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getFraudAlerts(
    @Query('status') status?: FraudAlertStatus,
    @Query('limit') limit = 50,
  ) {
    const where = status ? { status } : {};

    const alerts = await this.prisma.fraudAlert.findMany({
      where,
      take: Math.min(limit, 200),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        engagementId: true,
        findingId: true,
        title: true,
        description: true,
        riskScore: true,
        ruleTriggered: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { alerts, count: alerts.length };
  }

  private isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
}
