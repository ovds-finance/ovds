/**
 * Thin event listener — bridges NestJS EventEmitter domain events to the BullMQ queue.
 * Keeps domain event handlers decoupled from queue internals.
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationEvent, NOTIFICATION_EVENTS } from './notification.events';

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(private readonly dispatch: NotificationDispatchService) {}

  @OnEvent(NOTIFICATION_EVENTS.TASK_ASSIGNED)
  @OnEvent(NOTIFICATION_EVENTS.TASK_STATUS_CHANGED)
  @OnEvent(NOTIFICATION_EVENTS.TASK_DUE_SOON)
  @OnEvent(NOTIFICATION_EVENTS.INVOICE_CREATED)
  @OnEvent(NOTIFICATION_EVENTS.INVOICE_OVERDUE)
  @OnEvent(NOTIFICATION_EVENTS.PAYMENT_RECEIVED)
  @OnEvent(NOTIFICATION_EVENTS.USER_REGISTERED)
  @OnEvent(NOTIFICATION_EVENTS.SYSTEM_ALERT)
  @OnEvent(NOTIFICATION_EVENTS.CUSTOM)
  async handleNotificationEvent(event: NotificationEvent) {
    const { payload } = event;
    try {
      await this.dispatch.dispatch({
        userId:    payload.userId,
        companyId: payload.companyId,
        title:     payload.title,
        message:   payload.message,
        link:      payload.link,
        channels:  payload.channels ?? ['in_app'],
        metadata:  payload.metadata,
      });
    } catch (err) {
      this.logger.error(
        `Failed to dispatch notification event "${event.type}" for user ${payload.userId}`,
        err,
      );
    }
  }
}
