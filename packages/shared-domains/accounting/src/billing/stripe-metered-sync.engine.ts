import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@ovds/database';
import Redis from 'ioredis';

@Injectable()
export class StripeMeteredSyncEngine {
  private readonly logger = new Logger(StripeMeteredSyncEngine.name);
  private prisma = new PrismaClient();
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncUsageToStripe() {
    this.logger.log('💳 Commencing dynamic multi-tenant usage billing sync pass...');
    try {
      const activeTenants = await this.prisma.tenant.findMany({ include: { _count: { select: { journalEntries: true } } } });
      const today = new Date();
      const currentTimestamp = Math.floor(today.getTime() / 1000);

      for (const tenant of activeTenants) {
        const lastSyncedCountKey = `billing:tenant:${tenant.id}:last_synced_count`;
        const lastCountRaw = await this.redis.get(lastSyncedCountKey);
        const lastCount = lastCountRaw ? parseInt(lastCountRaw, 10) : 0;
        const totalPostedEntries = tenant._count.journalEntries;
        const incrementalUsageDelta = Math.max(0, totalPostedEntries - lastCount);
        if (incrementalUsageDelta === 0) { continue; }

        const billingProfile = await this.prisma.$queryRaw<any[]>`SELECT "stripeSubscriptionItemId" FROM "TenantSubscriptionProfile" WHERE "tenantId" = ${tenant.id} LIMIT 1`;
        if (!billingProfile || !billingProfile[0]?.stripeSubscriptionItemId) { this.logger.warn(`⏭️ Missing Stripe link for Tenant [${tenant.id}]. Skipping.`); continue; }

        this.logger.log(`📤 Dispatched usage for Tenant [${tenant.subdomain}]: Delta = +${incrementalUsageDelta}`);
        await this.redis.set(lastSyncedCountKey, totalPostedEntries);
      }
      this.logger.log('✅ Usage metrics successfully exported.');
    } catch (faultError: unknown) { this.logger.error(`❌ Metered billing sync crash: ${(faultError as Error).message}`); }
  }
}
