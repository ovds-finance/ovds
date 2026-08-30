export type NotificationChannel = 'email' | 'slack' | 'intercom';

/** In-app notification priority */
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

/** In-app notification category */
export type NotificationCategory =
  | 'INVOICE'
  | 'BILL'
  | 'PAYROLL'
  | 'TAX'
  | 'HR'
  | 'COMPLIANCE'
  | 'SYSTEM'
  | 'AUDIT'
  | 'PAYMENT'
  | 'SECURITY';

/** In-app notification record */
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  /** Deep-link URL within the app */
  actionUrl?: string;
  actionLabel?: string;
  companyId?: string;
  userId?: string;
  createdAt: string;
  /** ISO timestamp when the notification expires (auto-dismiss) */
  expiresAt?: string;
  /** Reference to the entity this notification relates to */
  entityId?: string;
  entityType?: string;
}

/** Notification preference per channel/category */
export interface NotificationPreference {
  category: NotificationCategory;
  email: boolean;
  inApp: boolean;
  slack: boolean;
}

export interface IntegrationConfig {
  slack?: {
    webhookUrl: string;
    channel?: string;
    active: boolean;
  };
  intercom?: {
    appId: string;
    active: boolean;
  };
  email?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    active: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  type: NotificationChannel;
  targets: string[]; // employeeIds, role, dept
  scheduledAt?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED';
}

/** Notification summary counts — used by bell icon badge */
export interface NotificationSummary {
  unread: number;
  urgent: number;
  total:  number;
}
