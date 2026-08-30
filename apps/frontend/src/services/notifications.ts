/**
 * Re-export shim — notifications API has moved to @ovds/features/notifications.
 *
 * All existing imports of '../../services/notifications' continue to work.
 * New code should import from '@ovds/features/notifications' directly.
 */
export {
  notificationsApi,
  notificationsConfigApi,
  notificationTemplatesApi,
  notificationCampaignsApi,
  type NotificationChannel,
  type IntegrationConfig,
  type NotificationTemplate,
  type NotificationCampaign,
} from '@ovds/features/notifications';
