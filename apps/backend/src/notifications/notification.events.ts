/**
 * Strongly-typed domain events for the notification subsystem.
 * All events flow through NestJS EventEmitter → BullMQ queue → channel adapters.
 */

export const NOTIFICATION_EVENTS = {
  TASK_ASSIGNED:       'notification.task.assigned',
  TASK_STATUS_CHANGED: 'notification.task.status_changed',
  TASK_DUE_SOON:       'notification.task.due_soon',
  INVOICE_CREATED:     'notification.invoice.created',
  INVOICE_OVERDUE:     'notification.invoice.overdue',
  PAYMENT_RECEIVED:    'notification.payment.received',
  USER_REGISTERED:     'notification.user.registered',
  SYSTEM_ALERT:        'notification.system.alert',
  CUSTOM:              'notification.custom',
} as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export interface NotificationPayload {
  /** Internal userId of the recipient */
  userId: string;
  /** Optional companyId for multi-tenant scoping */
  companyId?: string;
  /** Short title, e.g. "Task assigned to you" */
  title: string;
  /** Human-readable body message */
  message: string;
  /** Deep-link url inside the app */
  link?: string;
  /** Channel routing — omit to use user preference defaults */
  channels?: Array<'email' | 'whatsapp' | 'sms' | 'push' | 'in_app'>;
  /** Any extra context the handler may need */
  metadata?: Record<string, unknown>;
}

export class NotificationEvent {
  constructor(
    public readonly type: NotificationEventType,
    public readonly payload: NotificationPayload,
  ) {}
}
