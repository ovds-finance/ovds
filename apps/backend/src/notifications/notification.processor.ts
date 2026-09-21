/**
 * BullMQ processor — routes each queued notification job to the correct channel.
 *
 * The DISPATCH job fans out into per-channel child jobs.
 * Each channel job (EMAIL, WHATSAPP, SMS, PUSH, IN_APP) calls the matching adapter.
 *
 * Concurrency is deliberately low (2) so a spike doesn't overwhelm external APIs.
 * Increase per channel in production according to Twilio / FCM rate limits.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queue } from 'bullmq';

import { PrismaService } from '../common/prisma.service';

import { EmailChannel }   from './channels/email.channel';
import { InAppChannel }   from './channels/in-app.channel';
import { PushChannel }    from './channels/push.channel';
import { SmsChannel }     from './channels/sms.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_JOB,
  type DispatchJobData,
  type EmailJobData,
  type WhatsAppJobData,
  type SmsJobData,
  type PushJobData,
  type InAppJobData,
  type CleanupJobData,
} from './notification.jobs';

@Processor(NOTIFICATION_QUEUE, { concurrency: 2 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
    private readonly email: EmailChannel,
    private readonly whatsapp: WhatsAppChannel,
    private readonly sms: SmsChannel,
    private readonly push: PushChannel,
    private readonly inApp: InAppChannel,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {

      case NOTIFICATION_JOB.DISPATCH:
        await this.handleDispatch(job as Job<DispatchJobData>);
        break;

      case NOTIFICATION_JOB.EMAIL:
        await this.email.send(job.data as EmailJobData);
        break;

      case NOTIFICATION_JOB.WHATSAPP:
        await this.whatsapp.send(job.data as WhatsAppJobData);
        break;

      case NOTIFICATION_JOB.SMS:
        await this.sms.send(job.data as SmsJobData);
        break;

      case NOTIFICATION_JOB.PUSH:
        await this.push.send(job.data as PushJobData);
        break;

      case NOTIFICATION_JOB.IN_APP:
        await this.inApp.send(job.data as InAppJobData);
        break;

      case NOTIFICATION_JOB.CLEANUP:
        await this.handleCleanup(job as Job<CleanupJobData>);
        break;

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  /**
   * Fan-out: resolve user contact details and enqueue per-channel jobs.
   */
  private async handleDispatch(job: Job<DispatchJobData>): Promise<void> {
    const { userId, companyId, title, message, link, channels, metadata } = job.data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fcmToken: true } as any,
    }) as { email: string | null; fcmToken?: string | null } | null;

    for (const ch of channels) {
      try {
        switch (ch) {
          case 'email':
            if (user?.email) {
              await this.queue.add(NOTIFICATION_JOB.EMAIL, {
                to:      user.email,
                subject: title,
                html:    this.buildEmailHtml(title, message, link),
                userId,
              } satisfies EmailJobData, this.jobOpts());
            } else {
              this.logger.warn(`email channel skipped — no email on user ${userId}`);
            }
            break;

          case 'whatsapp': {
            const phone = (metadata?.phone as string) ?? null;
            if (phone) {
              await this.queue.add(NOTIFICATION_JOB.WHATSAPP, {
                to:             phone,
                templateName:   (metadata?.whatsappTemplate as string) ?? 'notification_generic',
                templateParams: [title, message],
                userId,
              } satisfies WhatsAppJobData, this.jobOpts());
            } else {
              this.logger.warn(`whatsapp channel skipped — no phone in metadata for user ${userId}`);
            }
            break;
          }

          case 'sms': {
            const phone = (metadata?.phone as string) ?? null;
            if (phone) {
              await this.queue.add(NOTIFICATION_JOB.SMS, {
                to:     phone,
                body:   `${title}: ${message}`,
                userId,
              } satisfies SmsJobData, this.jobOpts());
            } else {
              this.logger.warn(`sms channel skipped — no phone in metadata for user ${userId}`);
            }
            break;
          }

          case 'push': {
            const fcmToken = (metadata?.fcmToken as string) ?? (user as any)?.fcmToken ?? null;
            if (fcmToken) {
              await this.queue.add(NOTIFICATION_JOB.PUSH, {
                fcmToken,
                title,
                body:   message,
                data:   link ? { link } : {},
                userId,
              } satisfies PushJobData, this.jobOpts());
            } else {
              this.logger.warn(`push channel skipped — no FCM token for user ${userId}`);
            }
            break;
          }

          case 'in_app':
            await this.queue.add(NOTIFICATION_JOB.IN_APP, {
              userId,
              companyId,
              title,
              message,
              link,
            } satisfies InAppJobData, this.jobOpts());
            break;
        }
      } catch (err) {
        this.logger.error(`Failed to enqueue "${ch}" job for user ${userId}`, err);
      }
    }

    this.logger.debug(`Dispatch complete for user ${userId} (${channels.join(',')})`);
  }

  /**
   * Cleanup old notifications beyond retention period.
   * Scheduled daily — see NotificationScheduler.
   */
  private async handleCleanup(job: Job<CleanupJobData>): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - job.data.retentionDays);

    const { count } = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        isRead: true,            // keep unread notifications
      },
    });

    this.logger.log(`Notification cleanup: deleted ${count} rows older than ${job.data.retentionDays}d`);
  }

  private jobOpts() {
    return {
      attempts:          3,
      backoff:           { type: 'exponential' as const, delay: 3000 },
      removeOnComplete:  { count: 200 },
      removeOnFail:      { count: 100 },
    };
  }

  private buildEmailHtml(title: string, message: string, link?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family:system-ui,sans-serif;padding:32px;background:#f9f9fb">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
            <h2 style="margin:0 0 12px;color:#1f2937">${title}</h2>
            <p style="color:#4b5563;line-height:1.6">${message}</p>
            ${link ? `<a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#4FBA6F;color:#fff;border-radius:8px;text-decoration:none">View details</a>` : ''}
            <p style="margin-top:32px;font-size:12px;color:#9ca3af">OVDS · Ethiopia 🇪🇹</p>
          </div>
        </body>
      </html>
    `;
  }
}
