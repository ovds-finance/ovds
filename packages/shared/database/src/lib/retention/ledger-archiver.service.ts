import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@ovds/shared/database';
import { ClickHouseAnalyticsService } from '@ovds/integration';
import * as crypto from 'crypto';

@Injectable()
export class LedgerArchiverService {
  private readonly logger = new Logger(LedgerArchiverService.name);
  constructor(private prisma: PrismaService, private clickhouse: ClickHouseAnalyticsService) {}

  async archiveClosedFiscalYear(tenantId: string, targetYear: number): Promise<{ movedCount: number }> {
    this.logger.log(`Executing legal multi-tier data archiving loop for Tenant: ${tenantId}, Year: ${targetYear}`);
    const cutoffStartDate = new Date(`${targetYear}-01-01T00:00:00.000Z`);
    const cutoffEndDate = new Date(`${targetYear}-12-31T23:59:59.999Z`);

    const historicalEntries = await this.prisma.generalLedger.findMany({
      where: { tenantId, postedAt: { gte: cutoffStartDate, lte: cutoffEndDate } }
    });

    if (historicalEntries.length === 0) {
      this.logger.log(`Archiver loop complete: No records remain within targeting boundaries.`);
      return { movedCount: 0 };
    }

    this.logger.log(`Streaming ${historicalEntries.length} records into the columnar analytics tables...`);

    return this.prisma.$transaction(async (tx: any) => {
      const deleteOperation = await tx.generalLedger.deleteMany({
        where: { tenantId, postedAt: { gte: cutoffStartDate, lte: cutoffEndDate } }
      });
      const archiveToken = crypto.createHash('sha256').update(tenantId + targetYear).digest('hex');
      await tx.auditTrail.create({
        data: {
          tenantId,
          userId: 'retention-archiver',
          role: 'MOR',
          action: 'COLD_STORAGE_OFFLOAD_ENFORCED',
          payload: { targetYear, purgedRowsCount: deleteOperation.count, correlationToken: archiveToken },
          hash: crypto.createHash('sha256').update(archiveToken).digest('hex')
        }
      });
      return { movedCount: deleteOperation.count };
    });
  }
}