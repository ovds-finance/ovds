/**
 * Admin service for notification management.
 * Handles integration config, templates, and campaigns.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationDispatchService } from './notification-dispatch.service';

@Injectable()
export class NotificationAdminService {
  private readonly logger = new Logger(NotificationAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatch: NotificationDispatchService,
  ) {}

  /* ─── Integration Config ─────────────────────────────────────────────── */

  async getConfig(companyId: string): Promise<Record<string, unknown>> {
    const config = await (this.prisma as any).notificationConfig?.findUnique({
      where: { companyId },
    });
    return config ?? {};
  }

  async setConfig(
    companyId: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const config = await (this.prisma as any).notificationConfig?.upsert({
      where:  { companyId },
      update: { config: data },
      create: { companyId, config: data },
    });
    this.logger.log(`Notification config updated for company ${companyId}`);
    return config ?? {};
  }

  /* ─── Test Channel ───────────────────────────────────────────────────── */

  async testChannel(
    channel: 'email' | 'slack' | 'intercom',
    userId: string,
  ): Promise<void> {
    await this.dispatch.dispatch({
      userId,
      title:    `Test notification (${channel})`,
      message:  `This is a test notification sent via the ${channel} channel.`,
      channels: channel === 'email' ? ['email'] : ['in_app'],
    });
    this.logger.log(`Test notification dispatched on channel "${channel}" for user ${userId}`);
  }

  /* ─── Templates ──────────────────────────────────────────────────────── */

  async listTemplates(companyId: string): Promise<unknown[]> {
    return (
      (await (this.prisma as any).notificationTemplate?.findMany({
        where:   { companyId },
        orderBy: { createdAt: 'desc' },
      })) ?? []
    );
  }

  async createTemplate(
    companyId: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return (this.prisma as any).notificationTemplate?.create({
      data: { ...data, companyId },
    });
  }

  async updateTemplate(
    id: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    const existing = await (this.prisma as any).notificationTemplate?.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);

    return (this.prisma as any).notificationTemplate?.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await (this.prisma as any).notificationTemplate?.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);

    await (this.prisma as any).notificationTemplate?.delete({ where: { id } });
    this.logger.log(`Notification template ${id} deleted`);
  }

  /* ─── Campaigns ──────────────────────────────────────────────────────── */

  async listCampaigns(companyId: string): Promise<unknown[]> {
    return (
      (await (this.prisma as any).notificationCampaign?.findMany({
        where:   { companyId },
        orderBy: { createdAt: 'desc' },
      })) ?? []
    );
  }

  async createCampaign(
    companyId: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return (this.prisma as any).notificationCampaign?.create({
      data: { ...data, companyId },
    });
  }

  async sendCampaign(id: string, triggeredByUserId: string): Promise<unknown> {
    const campaign = await (this.prisma as any).notificationCampaign?.findUnique({
      where: { id },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);

    // Dispatch to each targeted user
    const userIds: string[] = campaign.userIds ?? [];
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        this.dispatch.dispatch({
          userId,
          title:    campaign.title,
          message:  campaign.message,
          link:     campaign.link ?? undefined,
          channels: campaign.channels ?? ['in_app'],
          metadata: { campaignId: id, triggeredBy: triggeredByUserId },
        }),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(
        `Campaign ${id}: ${failed}/${userIds.length} dispatches failed`,
      );
    }

    this.logger.log(
      `Campaign ${id} dispatched to ${userIds.length - failed}/${userIds.length} users`,
    );
    return { dispatched: userIds.length - failed, failed, total: userIds.length };
  }
}
