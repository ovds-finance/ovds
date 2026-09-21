/**
 * Core dispatch service — converts a NotificationEvent into one or more
 * BullMQ jobs (one per channel) based on user preferences.
 *
 * When Redis is disabled (REDIS_ENABLED !== 'true') the queue injection
 * resolves to null via @Optional(). In that case dispatch() logs a warning
 * and returns early so the rest of the application continues to function.
 */
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PrismaService } from '../common/prisma.service';

import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_JOB,
  type DispatchJobData,
} from './notification.jobs';

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    @Optional() @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue | null,
    private readonly prisma: PrismaService,
  ) {
    if (!queue) {
      this.logger.warn(
        'Redis is disabled — notification dispatch is running in no-op mode. ' +
        'Set REDIS_ENABLED=true and start Redis to enable queued notifications.',
      );
    }
  }

  /**
   * Enqueue a notification for dispatch.
   * Resolves user preferences from DB and fans-out to the appropriate channels.
   * No-ops silently when the queue is unavailable (Redis disabled).
   */
  async dispatch(data: Omit<DispatchJobData, 'enqueuedAt'>) {
    if (!this.queue) {
      this.logger.debug(
        `Notification skipped (no queue) for user ${data.userId}: ${data.title}`,
      );
      return;
    }

    const preferences = await this.resolveChannels(data.userId, data.channels);

    if (preferences.length === 0) {
      this.logger.warn(`No channels resolved for user ${data.userId} — skipping dispatch`);
      return;
    }

    const jobData: DispatchJobData = {
      ...data,
      channels: preferences,
      enqueuedAt: new Date().toISOString(),
    };

    await this.queue.add(NOTIFICATION_JOB.DISPATCH, jobData, {
      attempts:    3,
      backoff:     { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 500 },
      removeOnFail:     { count: 200 },
    });

    this.logger.debug(
      `Queued notification for user ${data.userId} on channels: ${preferences.join(', ')}`,
    );
  }

  /**
   * Resolve which channels to use.
   * If caller specifies channels, honour them; otherwise fall back to user defaults.
   */
  private async resolveChannels(
    userId: string,
    requested?: Array<'email' | 'whatsapp' | 'sms' | 'push' | 'in_app'>,
  ): Promise<Array<'email' | 'whatsapp' | 'sms' | 'push' | 'in_app'>> {
    if (requested && requested.length > 0) return requested;

    // Default: in_app always; email if user has one stored; others off by default
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const channels: Array<'email' | 'whatsapp' | 'sms' | 'push' | 'in_app'> = ['in_app'];
    if (user?.email) channels.push('email');
    return channels;
  }
}
