/**
 * Notification types — scoped re-export from @ovds/shared.
 *
 * Only notification-specific types are exported here.
 * Do NOT use `export * from '@ovds/shared'` — that pollutes the namespace.
 */
export type {
  NotificationChannel,
  IntegrationConfig,
  NotificationTemplate,
  NotificationCampaign,
} from '@ovds/shared';

