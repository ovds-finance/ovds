/**
 * Public facade for the notification system.
 * Domain modules (sales, HR, projects, etc.) import this and call notify().
 * They never touch the queue, channels, or gateway directly.
 */
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../common/prisma.service';

import { NotificationDispatchService } from './notification-dispatch.service';
import {
  NotificationEvent,
  NOTIFICATION_EVENTS,
  type NotificationPayload,
  type NotificationEventType,
} from './notification.events';

@Injectable()
export class NotificationService {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly dispatch: NotificationDispatchService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Emit a typed domain event.
   * The event listener (NotificationEventListener) will enqueue the dispatch job.
   */
  async notify(type: NotificationEventType, payload: NotificationPayload): Promise<void> {
    await (this.emitter as any).emitAsync(type, new NotificationEvent(type, payload));
  }

  /** Convenience: task assigned notification */
  taskAssigned(payload: NotificationPayload) {
    this.notify(NOTIFICATION_EVENTS.TASK_ASSIGNED, payload);
  }

  /** Convenience: invoice overdue */
  invoiceOverdue(payload: NotificationPayload) {
    this.notify(NOTIFICATION_EVENTS.INVOICE_OVERDUE, payload);
  }

  /** Convenience: payment received */
  paymentReceived(payload: NotificationPayload) {
    this.notify(NOTIFICATION_EVENTS.PAYMENT_RECEIVED, payload);
  }

  /** REST: get paginated in-app notifications for a user */
  async getForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, unreadTotal] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, page, limit, unreadTotal };
  }

  /** REST: mark one notification as read */
  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where:  { id, userId },
      data:   { isRead: true },
    });
  }

  /** REST: mark all as read */
  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });
  }

  /** REST: delete a notification */
  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({ where: { id, userId } });
  }

  /** Direct dispatch (bypasses event bus) — for programmatic use */
  async dispatchDirect(payload: NotificationPayload) {
    await this.dispatch.dispatch({
      userId:    payload.userId,
      companyId: payload.companyId,
      title:     payload.title,
      message:   payload.message,
      link:      payload.link,
      channels:  payload.channels ?? ['in_app'],
      metadata:  payload.metadata,
    });
  }
}
