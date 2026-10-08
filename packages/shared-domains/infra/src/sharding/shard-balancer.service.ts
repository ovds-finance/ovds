import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import Redis from 'ioredis';

interface ShardMigrationDto { tenantId: string; sourceShardHostId: string; targetShardHostId: string; targetConnectionString: string; }

@Injectable()
export class ShardBalancerService {
  private readonly logger = new Logger(ShardBalancerService.name);
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private controlPlanePrisma = new PrismaClient();

  async executeLiveMigration(command: ShardMigrationDto): Promise<boolean> {
    this.logger.warn(`🚨 RE-SHARDING: Moving Tenant [${command.tenantId}] from ${command.sourceShardHostId} to ${command.targetShardHostId}`);
    await this.redis.set(`tenant:${command.tenantId}:write_lock`, 'true', 'EX', 600);
    try {
      const sourcePrisma = new PrismaClient();
      const targetPrisma = new PrismaClient();
      await sourcePrisma.$connect(); await targetPrisma.$connect();

      const tenantData = await sourcePrisma.$transaction(async (tx: any) => {
        const accounts = await (tx as any).account.findMany({ where: { tenantId: command.tenantId } });
        const entries = await (tx as any).journalEntry.findMany({ where: { tenantId: command.tenantId }, include: { lines: true } });
        return { accounts, entries };
      });

      await targetPrisma.$transaction(async (tx: any) => {
        await tx.account.createMany({ data: tenantData.accounts });
        for (const entry of tenantData.entries) {
          await tx.journalEntry.create({ data: { id: entry.id, tenantId: command.tenantId, reference: entry.reference, description: entry.description, postedAt: entry.postedAt } });
          await tx.journalLine.createMany({ data: entry.lines });
        }
      });

      await this.controlPlanePrisma.$executeRawUnsafe(`UPDATE "TenantShardMapping" SET "shardHostId" = '${command.targetShardHostId}' WHERE "tenantId" = '${command.tenantId}'`);
      await this.redis.del(`infra:shard:routing:tenant:${command.tenantId}`);
      await sourcePrisma.$transaction(async (tx: any) => {
        await tx.journalLine.deleteMany({ where: { journalEntry: { tenantId: command.tenantId } } });
        await tx.journalEntry.deleteMany({ where: { tenantId: command.tenantId } });
        await tx.account.deleteMany({ where: { tenantId: command.tenantId } });
      });
      await sourcePrisma.$disconnect(); await targetPrisma.$disconnect();
      this.logger.log(`✅ Re-sharding complete for Tenant [${command.tenantId}]`);
      return true;
    } catch (err: unknown) { this.logger.error(`❌ SHARD MIGRATION FAULT: ${(err as Error).message}`); return false; }
    finally { await this.redis.del(`tenant:${command.tenantId}:write_lock`); }
  }
}