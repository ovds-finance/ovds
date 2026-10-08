import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseAnalyticsService } from '@ovds/integration';
import { PrismaService } from '@ovds/database';
import { Big } from 'big.js';

export interface ThresholdEvaluationResult {
  tenantId: string;
  trailingTwelveMonthRevenueCents: bigint;
  thresholdLimitCents: bigint;
  hasBreachedThreshold: boolean;
  mandatoryFilingFrequency: 'QUARTERLY' | 'MONTHLY_REALTIME';
}

@Injectable()
export class ThresholdMonitorService {
  private readonly logger = new Logger(ThresholdMonitorService.name);

  constructor(
    private clickhouse: ClickHouseAnalyticsService,
    private prisma: PrismaService
  ) {}

  async evaluateComplianceThreshold(tenantId: string, jurisdiction: string): Promise<ThresholdEvaluationResult> {
    const thresholdLimitCents = 1000000000n;
    const currentYear = new Date().getFullYear();
    const rawAnalytics = await this.clickhouse.getRegionalVatAggregates(currentYear);

    const tenantAggregate = rawAnalytics.find(row => row.tenantId === tenantId);
    const trailingRevenueCents = tenantAggregate ? BigInt(tenantAggregate.totalCents) : 0n;
    const hasBreached = trailingRevenueCents >= thresholdLimitCents;
    const determinedFrequency = hasBreached ? 'MONTHLY_REALTIME' : 'QUARTERLY';

    if (hasBreached) {
      this.logger.warn(`COMPLIANCE NOTICE: Tenant ${tenantId} has breached the trailing tax threshold limit.`);
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {}
      });
    }

    return {
      tenantId,
      trailingTwelveMonthRevenueCents: trailingRevenueCents,
      thresholdLimitCents,
      hasBreachedThreshold: hasBreached,
      mandatoryFilingFrequency: determinedFrequency
    };
  }
}