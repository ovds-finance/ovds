/**
 * User notification preferences — stored in DB or cache.
 * The dispatcher reads this to determine which channels to activate.
 */
export interface NotificationPreferences {
  userId: string;
  email?: string;
  phone?: string;    // E.164
  fcmToken?: string;
  channels: {
    email:   boolean;
    whatsapp: boolean;
    sms:     boolean;
    push:    boolean;
    in_app:  boolean;
  };
}
