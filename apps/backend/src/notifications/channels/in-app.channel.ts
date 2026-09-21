/**
 * In-app channel: persists a Notification row and broadcasts it over
 * the WebSocket gateway so the React client receives it in real time.
 */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma.service';
import { NotificationGateway } from '../notification.gateway';
import type { InAppJobData } from '../notification.jobs';

import type { INotificationChannel } from './notification-channel.interface';

@Injectable()
export class InAppChannel implements INotificationChannel<InAppJobData> {
  readonly channelName = 'in_app';
  private readonly logger = new Logger(InAppChannel.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async send(payload: InAppJobData): Promise<void> {
    // Persist to DB
    const notification = await this.prisma.notification.create({
      data: {
        userId:    payload.userId,
        companyId: payload.companyId,
        title:     payload.title,
        message:   payload.message,
        link:      payload.link,
        type:      'INFO',
      },
    });

    // Push to connected WebSocket clients
    this.gateway.sendToUser(payload.userId, 'notification', {
      id:        notification.id,
      title:     notification.title,
      message:   notification.message,
      link:      notification.link,
      isRead:    notification.isRead,
      createdAt: notification.createdAt,
    });

    this.logger.debug(`In-app notification ${notification.id} sent to user ${payload.userId}`);
  }
}
