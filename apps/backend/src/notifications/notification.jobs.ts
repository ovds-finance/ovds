/**
 * BullMQ job name constants and typed job data interfaces.
 * Keeps queue definitions in one place so producers & consumers stay in sync.
 */

export const NOTIFICATION_QUEUE = 'notifications';

export const NOTIFICATION_JOB = {
  DISPATCH:   'dispatch',
  EMAIL:      'send_email',
  WHATSAPP:   'send_whatsapp',
  SMS:        'send_sms',
  PUSH:       'send_push',
  IN_APP:     'send_in_app',
  CLEANUP:    'cleanup_old',
} as const;

export type NotificationJobName =
  (typeof NOTIFICATION_JOB)[keyof typeof NOTIFICATION_JOB];

export interface DispatchJobData {
  userId: string;
  companyId?: string;
  title: string;
  message: string;
  link?: string;
  channels: Array<'email' | 'whatsapp' | 'sms' | 'push' | 'in_app'>;
  metadata?: Record<string, unknown>;
  /** ISO timestamp — used for dedup / ordering */
  enqueuedAt: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  userId: string;
}

export interface WhatsAppJobData {
  to: string;       // E.164 phone, e.g. +251912345678
  templateName: string;
  templateParams: string[];
  userId: string;
}

export interface SmsJobData {
  to: string;
  body: string;
  userId: string;
}

export interface PushJobData {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  userId: string;
}

export interface InAppJobData {
  userId: string;
  companyId?: string;
  title: string;
  message: string;
  link?: string;
}

export interface CleanupJobData {
  retentionDays: number;
}
