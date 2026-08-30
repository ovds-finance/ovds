/**
 * @ovds/features/notifications — public API
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  NotificationChannel,
  IntegrationConfig,
  NotificationTemplate,
  NotificationCampaign,
} from './services/notificationsApi';

// ── API clients ────────────────────────────────────────────────────────────────
export {
  notificationsApi,
  notificationsConfigApi,
  notificationTemplatesApi,
  notificationCampaignsApi,
} from './services/notificationsApi';

