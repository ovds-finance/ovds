# 12 — Notification System Architecture

## 1. Notification Channels

The system supports three notification channels:

| Channel | Technology | Use Cases |
|---------|-----------|-----------|
| In-App | WebSocket / Server-Sent Events + React Query cache invalidation | Real-time updates, status changes |
| Email | Nodemailer / SendGrid / Mailgun | Compliance reminders, submission confirmations, password resets |
| Push | Web Push API (VAPID) | Browser notifications for due dates |

## 2. Notification Model

```prisma
model Notification {
  id             String   @id @default(cuid())
  organizationId String
  userId         String?
  type           String   // "vat_return_due", "submission_success", "submission_failed", "payment_due"
  title          String
  message        String
  data           Json?    // { "returnId": "...", "amount": 100.00 }
  readAt         DateTime?
  priority       String   @default("normal") // low, normal, high, urgent
  channel        String   @default("in_app") // in_app, email, push, all
  createdAt      DateTime @default(now())

  @@index([organizationId, userId, readAt])
  @@index([createdAt])
}
```

## 3. Notification Service

```typescript
// notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly eventBus: EventBusService,
  ) {}

  async send(params: SendNotificationParams): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
        priority: params.priority || 'normal',
        channel: params.channel || 'in_app',
      },
    });

    if (params.channel === 'email' || params.channel === 'all') {
      await this.emailService.send(notification);
    }

    if (params.channel === 'push' || params.channel === 'all') {
      await this.pushService.send(notification);
    }

    await this.eventBus.emit(new NotificationCreatedEvent(notification.id));
    return notification;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, orgId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, organizationId: orgId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async listUnread(userId: string, orgId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId, organizationId: orgId, readAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

## 4. Email Service

```typescript
// notifications/services/email.service.ts
@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly templateService: TemplateService,
  ) {}

  async send(notification: Notification): Promise<void> {
    const user = await this.usersService.findById(notification.userId!);
    const organization = await this.organizationsService.findById(notification.organizationId);

    const html = await this.templateService.render(notification.type, {
      userName: user.firstName,
      organizationName: organization.name,
      ...notification.data,
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: notification.title,
      html,
      text: stripHtml(html),
    });
  }
}
```

## 5. Push Notifications (Web Push)

```typescript
// notifications/services/push.service.ts
@Injectable()
export class PushService {
  private readonly vapidKeys: VapidKeys;

  constructor(private readonly webPush: WebPushService) {
    this.vapidKeys = {
      subject: 'mailto:support@vat-saas.com',
      publicKey: process.env.VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!,
    };
  }

  async send(notification: Notification): Promise<void> {
    const subscriptions = await this.getUserSubscriptions(notification.userId!);

    const pushPayload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: notification.data,
    });

    await Promise.allSettled(
      subscriptions.map((subscription) =>
        this.webPush.sendNotification(subscription, pushPayload, {
          vapidDetails: this.vapidKeys,
          TTL: 24 * 60 * 60,
        }),
      ),
    );
  }
}
```

## 6. WebSocket Server (Real-Time)

```typescript
// notifications/gateways/notifications.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN },
  namespace: '/notifications',
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { organizationId: string; userId: string }) {
    client.join(`org:${payload.organizationId}`);
    client.join(`user:${payload.userId}`);
    return { event: 'subscribed' };
  }

  async sendToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  async sendToOrganization(orgId: string, notification: Notification) {
    this.server.to(`org:${orgId}`).emit('notification', notification);
  }
}
```

## 7. React Integration

```typescript
// features/notifications/hooks/use-notifications.ts
export function useNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsService.listUnread(),
    refetchInterval: 30000, // Poll every 30s as fallback
  });

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/notifications`);
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      queryClient.setQueryData(['notifications', 'unread'], (old: Notification[]) => [
        notification,
        ...old,
      ]);
    };
    return () => ws.close();
  }, [queryClient]);

  return { notifications, isLoading };
}
```

## 8. Notification Preferences

```typescript
// notifications/preferences.service.ts
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    vatReturnDue: boolean;
    submissionSuccess: boolean;
    submissionFailed: boolean;
    paymentDue: boolean;
  };
}

@Injectable()
export class NotificationPreferencesService {
  async get(userId: string, orgId: string): Promise<NotificationPreferences> {
    const org = await this.organizationsService.findById(orgId);
    return org.settings?.notificationPreferences || defaultPreferences;
  }

  async update(userId: string, orgId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const current = await this.get(userId, orgId);
    const updated = deepMerge(current, preferences);
    await this.organizationsService.updateSettings(orgId, { notificationPreferences: updated });
  }
}
```

## 9. Notification Types and Templates

| Type | Title | Channel | Trigger |
|------|-------|---------|---------|
| `vat_return_due` | VAT Return Due Soon | email + push + in_app | 7 days before deadline |
| `vat_return_overdue` | VAT Return Overdue | email + push | On due date |
| `submission_success` | VAT Return Submitted | email + in_app | After successful submission |
| `submission_failed` | VAT Return Submission Failed | email + in_app + push | On submission failure |
| `integration_expired` | Integration Token Expired | email | Token expiry detected |
| `payment_due` | Payment Due | email | Invoice due date |
| `user_invited` | You've been invited | email | User invitation sent |
| `password_changed` | Password Changed | email | Password change |

## 10. Rate Limiting

Notifications are rate-limited per organization to prevent abuse:

```typescript
// notifications/rate-limiter.service.ts
@Injectable()
export class NotificationRateLimiterService {
  private readonly limits = new Map<string, { count: number; resetAt: Date }>();

  async checkLimit(orgId: string, type: string): Promise<boolean> {
    const key = `${orgId}:${type}`;
    const now = new Date();
    const limit = this.getLimit(type);

    if (this.limits.has(key)) {
      const entry = this.limits.get(key)!;
      if (now > entry.resetAt) {
        this.limits.set(key, { count: 1, resetAt: new Date(now.getTime() + limit.windowMs) });
        return true;
      }
      if (entry.count >= limit.max) {
        return false;
      }
      entry.count++;
    } else {
      this.limits.set(key, { count: 1, resetAt: new Date(now.getTime() + limit.windowMs) });
    }
    return true;
  }
}
```
