import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type FraudAlertStatus, type Prisma } from '@ovds/database';

import { PrismaService } from '../common/prisma.service';

export interface FraudScanResult {
  alertsCreated: number;
  flaggedTransactions: number;
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    riskScore: number;
    ruleTriggered: string;
    status: string;
  }>;
}

export interface TransactionRecord {
  id: string;
  referenceNumber?: string;
  type?: string;
  amount: number;
  description?: string;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detects round-number anomalies using Benford's Law heuristic.
   * Flags transactions where the amount ends in zero and exceeds a threshold,
   * which may indicate fabricated journal entries.
   */
  async scanRoundNumberAnomalies(
    tenantId: string,
    engagementId: string,
    transactions: TransactionRecord[],
  ): Promise<FraudScanResult> {
    this.logger.log(
      `Starting round-number fraud scan for Tenant: ${tenantId}, Engagement: ${engagementId}`,
    );

    const anomalyThreshold = 10000;
    const flaggedTransactions = transactions.filter(
      (tx) => tx.amount > anomalyThreshold && tx.amount % 1000 === 0,
    );

    const alertsCreated: FraudScanResult['alerts'] = [];

    if (flaggedTransactions.length > 0) {
      const fraudAlert = await this.prisma.fraudAlert.create({
        data: {
          tenantId,
          engagementId,
          title: 'High Materiality Round Number Clusters',
          description: `Detected ${flaggedTransactions.length} items ending in precise thousands values. Potential structural journal entry override.`,
          riskScore: 78.5,
          ruleTriggered: 'ROUND_NUMBER_DUPLICATION',
          status: 'SUSPECTED',
          metaData: {
            flaggedCount: flaggedTransactions.length,
            threshold: anomalyThreshold,
            transactions: flaggedTransactions,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      alertsCreated.push({
        id: fraudAlert.id,
        title: fraudAlert.title,
        description: fraudAlert.description,
        riskScore: fraudAlert.riskScore,
        ruleTriggered: fraudAlert.ruleTriggered,
        status: fraudAlert.status,
      });

      this.logger.warn(
        `Fraud Alert created for Tenant ${tenantId}: ${flaggedTransactions.length} anomalies detected. Alert ID: ${fraudAlert.id}`,
      );
    }

    return {
      alertsCreated: alertsCreated.length,
      flaggedTransactions: flaggedTransactions.length,
      alerts: alertsCreated,
    };
  }

  /**
   * Detects duplicate invoice/reference numbers across transactions,
   * which may indicate fraudulent duplicate submissions.
   */
  async scanDuplicateReferences(
    tenantId: string,
    engagementId: string,
    transactions: TransactionRecord[],
  ): Promise<FraudScanResult> {
    const refCounts = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.referenceNumber) {
        refCounts.set(tx.referenceNumber, (refCounts.get(tx.referenceNumber) ?? 0) + 1);
      }
    }

    const duplicates = Array.from(refCounts.entries()).filter(([_, count]) => count > 1);

    const alertsCreated: FraudScanResult['alerts'] = [];

    if (duplicates.length > 0) {
      const dupRefs = duplicates.map(([ref, count]) => ({ referenceNumber: ref, occurrences: count }));
      const fraudAlert = await this.prisma.fraudAlert.create({
        data: {
          tenantId,
          engagementId,
          title: 'Duplicate Invoice Reference Detected',
          description: `Found ${duplicates.length} duplicate reference numbers across ${transactions.length} transactions.`,
          riskScore: 62.0,
          ruleTriggered: 'DUPLICATE_REFERENCE',
          status: 'SUSPECTED',
          metaData: { duplicates: dupRefs } as unknown as Prisma.InputJsonValue,
        },
      });

      alertsCreated.push({
        id: fraudAlert.id,
        title: fraudAlert.title,
        description: fraudAlert.description,
        riskScore: fraudAlert.riskScore,
        ruleTriggered: fraudAlert.ruleTriggered,
        status: fraudAlert.status,
      });

      this.logger.warn(
        `Duplicate reference alert for Tenant ${tenantId}: ${duplicates.length} duplicates found`,
      );
    }

    return {
      alertsCreated: alertsCreated.length,
      flaggedTransactions: duplicates.length,
      alerts: alertsCreated,
    };
  }

  /**
   * Runs a comprehensive fraud scan combining multiple rules.
   */
  async runFullAuditScan(
    tenantId: string,
    engagementId: string,
    transactions: TransactionRecord[],
  ): Promise<FraudScanResult> {
    await this.validateEngagement(tenantId, engagementId);

    const roundNumberResult = await this.scanRoundNumberAnomalies(tenantId, engagementId, transactions);
    const duplicateResult = await this.scanDuplicateReferences(tenantId, engagementId, transactions);

    return {
      alertsCreated: roundNumberResult.alertsCreated + duplicateResult.alertsCreated,
      flaggedTransactions: roundNumberResult.flaggedTransactions + duplicateResult.flaggedTransactions,
      alerts: [...roundNumberResult.alerts, ...duplicateResult.alerts],
    };
  }

  private async validateEngagement(tenantId: string, engagementId: string): Promise<void> {
    const engagement = await this.prisma.auditorEngagement.findFirst({
      where: { id: engagementId, tenantId },
    });
    if (!engagement) {
      throw new NotFoundException(
        `Audit engagement [${engagementId}] not found for tenant [${tenantId}]`,
      );
    }
  }
}
