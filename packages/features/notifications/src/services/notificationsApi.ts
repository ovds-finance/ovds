/**
 * @ovds/features/notifications — API client
 *
 * Re-exports the full platform implementation so the NotificationSettings page
 * and any feature module can import from '@ovds/features/notifications'.
 */
export type {
  NotificationChannel,
  IntegrationConfig,
  NotificationTemplate,
  NotificationCampaign,
} from '../../../platform/src/services/notificationsApi';

export {
  notificationsApi,
  notificationsConfigApi,
  notificationTemplatesApi,
  notificationCampaignsApi,
} from '../../../platform/src/services/notificationsApi';
