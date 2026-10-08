import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { BalanceSheetService } from '../balance-sheet.service';
import Redis from 'ioredis';
import { Worker, Job } from 'bullmq';

interface ReportJobPayload { tenantId: string; targetDate: string; reportType: 'BALANCE_SHEET' | 'TRIAL_BALANCE'; }

@Injectable()
export class ReportProcessorWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker<ReportJobPayload>;
  private redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  constructor(private readonly balanceSheetService: BalanceSheetService) {}

  onModuleInit() {
    console.log('🤖 Initializing background accounting report processor...');
    this.worker = new Worker<ReportJobPayload>('financial-reports-queue', async (job: Job<ReportJobPayload>) => {
      const { tenantId, targetDate, reportType } = job.data;
      if (reportType === 'BALANCE_SHEET') {
        const statement = await this.balanceSheetService.generateStatement(tenantId, new Date(targetDate));
        await this.redisConnection.set(`tenant:${tenantId}:report:async:${job.id}`, JSON.stringify(statement), 'EX', 3600);
      }
    }, { connection: this.redisConnection, concurrency: 5 });
    this.worker.on('failed', (job: Job<ReportJobPayload> | undefined, err: Error) => { console.error(`🚨 Job [${job?.id}] failed:`, err.message); });
  }

  async onModuleDestroy() { await this.worker.close(); await this.redisConnection.quit(); }
}
