In a highly structured system using an Nx Monorepo, React, NestJS, Prisma, and Domain-Driven Design (DDD), notifications are decoupled from core business logic using an event-driven architectural approach. Core domains should never care how a message is sent; they simply emit domain events. [1] 

------------------------------
## 1. Where to Place the Code (Nx Monorepo & DDD Structure)
To enforce DDD principles, separate your system into three distinct spaces within your Nx workspace: [1] 
## Domain & Application Layer (libs/shared/domain & libs/core/notification)

* Domain Events: Placed inside your specific business domains (e.g., libs/auth/domain/src/events/otp-generated.event.ts).
* Notification Ports (Interfaces): Define abstract interfaces for sending notifications here. The domain layer depends only on these interfaces, remaining agnostic of specific external vendors. [1, 2] 

## Infrastructure Layer (libs/infrastructure/notification)

* Adapters: This is where you implement concrete provider wrappers (e.g., Twilio for SMS, SendGrid for Email, FCM for Push).
* Prisma Mappers: Code responsible for persisting in-app notifications and logging delivery statuses into your database via [Prisma](https://www.prisma.io/docs/guides/frameworks/nestjs). [1, 3, 4, 5, 6] 

## Presentation Layer (apps/api & apps/web)

* NestJS Consumers/Gateways: Handlers that listen to queues or events to trigger notifications.
* React Frontend: Components that consume in-app feeds (via WebSockets/SSE) or collect notification preference configurations. [1, 7, 8] 

------------------------------
## 2. Implementation Guide for Notification Channels
To manage high volume and prevent slow third-party API calls from blocking your primary API, always route notification dispatches through an asynchronous background queue (like Redis-backed BullMQ or Kafka). [1, 5] 

[Domain Event] ──> [Notification Service] ──> [BullMQ/Kafka Queue] ──> [Channel Workers] ──> External APIs

## 📧 Email

* Infrastructure Provider: [Twilio SendGrid](https://sendgrid.com/) or [Amazon SES](https://aws.amazon.com/ses/).
* How to use: Use nodemailer or official SDKs. Pass dynamic data into pre-built templates. [5, 9, 10] 

## 💬 SMS & WhatsApp

* Infrastructure Provider: [Twilio SMS / Twilio WhatsApp Business API](https://www.twilio.com/).
* How to use: Format destination strings in E.164 standard syntax (e.g., +1234567890). WhatsApp requires pre-approved message templates from the Meta Business Dashboard before broadcasting automated notifications. [9, 11] 

## 📱 Mobile / Web Push

* Infrastructure Provider: [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging). [9, 12] 
* How to use:
1. The React app requests browser/device permissions, obtains an unique FCM device token, and sends it to NestJS to persist via Prisma.
   2. The NestJS backend calls firebase-admin to target that device token. [4, 13, 14] 

## 🔔 In-App Notifications

* Infrastructure Provider: Built natively using NestJS WebSockets (@nestjs/websockets) or Server-Sent Events (SSE). [7, 8] 
* How to use:
1. Save the notification payload to the database via Prisma (marking it isRead: false).
   2. Emit the payload live to active frontend connections. [5, 8, 15] 

## 🤖 Telegram

* Infrastructure Provider: Telegram Bot API (telegraf npm package).
* How to use: Users must initiate a conversation with your bot to generate a chatId. Store this ID alongside the user profile using Prisma to route future direct alerts.

------------------------------
## 3. Handling One-Time Passwords (OTP)
OTP pipelines require high speed, short lifetimes, and guaranteed delivery, bypassing standard batch queues. [16, 17] 

   1. Generation: When a user requests an OTP, generate a cryptographically secure 6-digit string using the Node.js crypto library.
   2. Persistence: Save a hashed version of the OTP along with an expiration timestamp (typically 3–5 minutes) in a fast-access cache like Redis or directly in your Prisma database.
   3. Dispatch: Trigger the SMS, Email, or WhatsApp channel adapters using a designated high-priority queue queue to avoid delay from low-priority marketing campaigns. [17, 18] 
   4. Verification: The React client submits the user input. NestJS verifies it against the active record, deleting or invalidating the token immediately upon a match.

------------------------------
## 4. Integrating with Social Media
Social media integration generally refers to two distinct patterns:
## Social Authentication (OAuth)

* Strategy: Use @nestjs/passport along with individual social strategies (e.g., passport-google-oauth20, passport-facebook).
* Data Flow: The user authenticates on the social platform. NestJS processes the returning callback to extract profile info (such as verified emails or profile photos), and passes this data to Prisma to register or log in the user.

## Social Sharing / Content Posting

* Strategy: Directly call developer APIs (such as the Meta Graph API for Facebook/Instagram or the X API).
* Data Flow: Request specific publish_actions scopes from the user during authentication. Use the retrieved access tokens within background workers to post system updates, achievements, or programmatic messages directly to their social feeds. [11] 

------------------------------
## 5. Concrete Code Blueprint (DDD Style)
Here is how you implement this pattern in a decoupled NestJS structure:
## Domain Event (libs/auth/domain)

export class UserOtpGeneratedEvent {
  constructor(
    public readonly userId: string,
    public readonly code: string,
    public readonly targetChannel: 'SMS' | 'EMAIL'
  ) {}
}

## Notification Port / Interface (libs/core/notification)

export interface ISmsAdapter {
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
}export const ISmsAdapter = Symbol('ISmsAdapter');

## Twilio Infrastructure Adapter (libs/infrastructure/notification)

import { Injectable } from '@nestjs/common';import { ISmsAdapter } from '@app/core/notification';import { Twilio } from 'twilio';

@Injectable()export class TwilioSmsAdapter implements ISmsAdapter {
  private client = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    const res = await this.client.messages.create({ body: message, to: phoneNumber, from: process.env.TWILIO_NUMBER });
    return !!res.sid;
  }
}

## Application Handler / Consumer (apps/api)

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';import { UserOtpGeneratedEvent } from '@app/auth/domain';import { Inject } from '@nestjs/common';import { ISmsAdapter } from '@app/core/notification';

@EventsHandler(UserOtpGeneratedEvent)export class UserOtpGeneratedHandler implements IEventHandler<UserOtpGeneratedEvent> {
  constructor(
    @Inject(ISmsAdapter) private readonly smsAdapter: ISmsAdapter
  ) {}

  async handle(event: UserOtpGeneratedEvent) {
    if (event.targetChannel === 'SMS') {
      // In production, offload this to a BullMQ worker instead of awaiting inline
      await this.smsAdapter.sendSms('+123456789', `Your security code is: ${event.code}`);
    }
  }
}

If you would like to proceed with the configuration, tell me:

* Which specific social media platforms you intend to publish content to?
* Do you prefer WebSockets or Server-Sent Events (SSE) for your React in-app notification feed?
* Are you setting up your message queues with BullMQ (Redis) or Kafka? [1, 5, 7, 8] 

I can provide the boilerplate code or architecture layout for your choice.

[1] [https://github.com](https://github.com/kaikyMoura/notification_service)
[2] [https://github.com](https://github.com/sinuoslabs/nestjs-notification)
[3] [https://dev.to](https://dev.to/matt_frank_usa/building-a-scalable-notification-system-push-email-and-sms-2ga6)
[4] [https://medium.com](https://medium.com/@alexawp121109/full-guide-integrating-push-notifications-in-react-native-nestjs-using-firebase-notifee-c611a82f98e2)
[5] [https://designgurus.substack.com](https://designgurus.substack.com/p/system-design-case-study-how-to-design-75c)
[6] [https://www.prisma.io](https://www.prisma.io/docs/guides/frameworks/nestjs)
[7] [https://medium.com](https://medium.com/@adegbemile/real-time-notifications-with-nestjs-react-and-redux-toolkit-query-7fc278b876b3)
[8] [https://kracik.sk](https://kracik.sk/articles/real-time-notifications-in-nestjs-a-simpler-alternative-to-websockets-with-server-sent-events)
[9] [https://novu.co](https://novu.co/blog/a-developers-guide-to-choosing-the-best-notification-platform/)
[10] [https://dev.to](https://dev.to/naimulkarim/building-a-multi-channel-notification-service-in-net-8-38bk)
[11] [https://medium.com](https://medium.com/@pramodghimire180/building-a-multi-channel-notification-system-in-nestjs-part-3-whatsapp-with-twilio-5f33fa1654dd)
[12] [https://medium.com](https://medium.com/@ghulamhussainjoyo.gh/mastering-react-native-push-notifications-a-comprehensive-guide-part-1-229069034a82)
[13] [https://dev.to](https://dev.to/gr8soln/building-web-push-notification-server-with-nest-js-and-fcm-5gc9)
[14] [https://medium.com](https://medium.com/@boladebode/unlocking-the-power-of-web-push-notifications-with-nestjs-react-and-firebase-part-2-e1680f304bd4)
[15] [https://medium.com](https://medium.com/@marufpulok98/building-a-production-ready-real-time-notification-system-in-nestjs-websockets-redis-offline-6cc2f1bd0b05)
[16] [https://www.youtube.com](https://www.youtube.com/watch?v=Yv9q8d11Y7k&t=35)
[17] [https://medium.com](https://medium.com/@anshulkahar2211/designing-a-scalable-notification-system-email-sms-push-from-hld-to-lld-reliability-to-d5b883d936d8)
[18] [https://medium.com](https://medium.com/codetodeploy/building-a-scalable-event-driven-notification-system-with-aws-sqs-and-nestjs-5860f11464e1)


To build out a production-ready notification infrastructure, we will implement a fully decoupled, type-safe architecture using BullMQ for queue management, WebSockets for real-time React feeds, and an abstract multi-channel routing pattern.
Here is the step-by-step implementation blueprint across your Nx Monorepo layers.

------------------------------
## 1. Database Schema (Prisma)
Your database should store device registration tokens for push notifications, record in-app notifications, and maintain user preferences.

// apps/api/prisma/schema.prisma

model User {
  id                  String               @id @default(uuid())
  email               String               @unique
  phoneNumber         String?              @unique
  telegramChatId      String?
  pushTokens          PushToken[]
  notifications       InAppNotification[]
  preferences         NotificationPreference?
}

model PushToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model InAppNotification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  body      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model NotificationPreference {
  id         String  @id @default(uuid())
  userId     String  @unique
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  emailEnabled  Boolean @default(true)
  smsEnabled    Boolean @default(true)
  pushEnabled   Boolean @default(true)
  inAppEnabled  Boolean @default(true)
}

------------------------------
## 2. High-Priority OTP Flow (Bypassing Standard Queues)
OTP delivery cannot wait in a standard queue behind bulk marketing notifications. We create a dedicated high-priority workflow that safely handles delivery failure without choking application resources.

// libs/core/notification/src/interfaces/otp-dispatcher.interface.tsexport interface IOtpDispatcher {
  dispatchOtp(userId: string, code: string, channel: 'SMS' | 'EMAIL' | 'WHATSAPP'): Promise<void>;
}export const IOtpDispatcher = Symbol('IOtpDispatcher');

// libs/infrastructure/notification/src/services/otp-dispatcher.service.tsimport { Injectable, Inject } from '@nestjs/common';import { IOtpDispatcher } from '@app/core/notification';import { PrismaService } from '@app/infrastructure/prisma';import { ISmsAdapter, IEmailAdapter } from '../interfaces'; 

@Injectable()export class OtpDispatcherService implements IOtpDispatcher {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ISmsAdapter) private readonly smsAdapter: ISmsAdapter,
    @Inject(IEmailAdapter) private readonly emailAdapter: IEmailAdapter
  ) {}

  async dispatchOtp(userId: string, code: string, channel: 'SMS' | 'EMAIL' | 'WHATSAPP'): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const message = `Your Verification Code is: ${code}. Valid for 5 minutes.`;

    // Direct executing with inline fallback/retry mechanism for sub-second delivery
    try {
      if (channel === 'SMS' && user.phoneNumber) {
        await this.smsAdapter.sendSms(user.phoneNumber, message);
      } else if (channel === 'EMAIL') {
        await this.emailAdapter.sendEmail(user.email, 'Your Secure OTP', message);
      }
    } catch (error) {
      // Immediately log critical failure to monitoring system (e.g., Sentry)
      console.error(`Failed to send OTP via ${channel}:`, error);
      throw new Error('OTP delivery failed');
    }
  }
}

------------------------------
## 3. Background Job Queue (BullMQ Worker for Multichannel Distribution)
For standard asynchronous notifications, we drop payloads into BullMQ. The system consumer parses the request and distributes it dynamically across enabled channels.

// libs/core/notification/src/types/notification.types.tsexport interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'TELEGRAM')[];
}

// libs/infrastructure/notification/src/workers/notification.worker.tsimport { Processor, WorkerHost } from '@nestjs/bullmq';import { Job } from 'bullmq';import { NotificationPayload } from '@app/core/notification';import { PrismaService } from '@app/infrastructure/prisma';import { NotificationGateway } from '../gateways/notification.gateway';

@Processor('notification-queue')export class NotificationWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: NotificationGateway
  ) {}

  async process(job: Job<NotificationPayload>): Promise<void> {
    const { userId, title, body, channels } = job.data;

    // 1. Fetch preferences and user routing channels
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, pushTokens: true }
    });
    if (!user) return;

    // 2. Map and route channels based on user opt-in flags
    const prefs = user.preferences;

    for (const channel of channels) {
      if (channel === 'IN_APP' && (!prefs || prefs.inAppEnabled)) {
        // Persist notification record
        await this.prisma.inAppNotification.create({
          data: { userId, title, body }
        });
        // Push over active WebSocket stream
        this.wsGateway.sendNotificationToUser(userId, { title, body });
      }

      if (channel === 'EMAIL' && (!prefs || prefs.emailEnabled)) {
        // Trigger Email Adapter (e.g., SendGrid SDK)
      }

      if (channel === 'SMS' && (!prefs || prefs.smsEnabled) && user.phoneNumber) {
        // Trigger SMS Adapter (e.g., Twilio SDK)
      }

      if (channel === 'PUSH' && (!prefs || prefs.pushEnabled) && user.pushTokens.length > 0) {
        // Trigger Firebase Cloud Messaging Adapter using user.pushTokens
      }
    }
  }
}

------------------------------
## 4. Live Real-Time Feed (NestJS WebSocket Gateway)
This component connects directly with our custom React dashboard via a WebSocket adapter, ensuring fast delivery of contextual events without page reloads.

// libs/infrastructure/notification/src/gateways/notification.gateway.tsimport { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';import { Server, Socket } from 'socket.io';import { UseGuards } from '@nestjs/common';import { WsJwtGuard } from '@app/auth/guards'; // Custom Guard to decode JWT tokens from WS handshake

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  
  // Track open connections dynamically mapped to User IDs
  private activeConnections = new Map<string, string>(); 

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string; // Extract securely in production using Auth tokens
    if (userId) {
      this.activeConnections.set(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.activeConnections.entries()) {
      if (socketId === client.id) {
        this.activeConnections.delete(userId);
        break;
      }
    }
  }

  sendNotificationToUser(userId: string, payload: { title: string; body: string }) {
    const socketId = this.activeConnections.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new-notification', payload);
    }
  }
}

------------------------------
## 5. Frontend UI Consumer (React Integration)
A foundational React Hook setup to connect to the backend namespace, receive live events, and render immediate pop-ups or update localized notification lists.

// apps/web/src/hooks/useNotifications.tsimport { useEffect, useState } from 'react';import { io, Socket } from 'socket.io-client';
interface InAppAlert {
  title: string;
  body: string;
}
export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<InAppAlert[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io('http://localhost:3000/notifications', {
      query: { userId }
    });

    socketInstance.on('new-notification', (data: InAppAlert) => {
      setNotifications((prev) => [data, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return { notifications, socket };
};

If you want to flesh out more edge cases, let me know:

* Would you like the complete architectural code mapping out Firebase Cloud Messaging web service worker setups for background push notifications?
* Do you want to see the specific setup for handling Twilio WhatsApp message template callbacks?
* Should we design the database configuration for archiving/deleting read notifications to prevent table bloat over time?


We will now implement the final critical production pieces: Firebase Web Service Workers, Twilio WhatsApp template workflows, and database cleanup optimization strategies to ensure your platform handles enterprise throughput safely.
------------------------------
## 1. Web Push Architecture (React Web Push & Firebase Service Worker)
To support background push notifications even when the user has closed your React app tab, you must register a Service Worker and feed browser endpoints back to your NestJS layer.
## Public Directory Configuration
Create this file exactly in your React app's static public assets directory:

// apps/web/public/firebase-messaging-sw.js
importScripts('https://gstatic.com');
importScripts('https://gstatic.com');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
const messaging = firebase.messaging();
// Handle background notifications securely
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Static asset fallback
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

## React Token Registration Client
Use this inside your client entry logic to request runtime browser permissions and register tokens to your NestJS server via Prisma.

// apps/web/src/services/push-notification.service.tsimport { initializeApp } from 'firebase/app';import { getMessaging, getToken } from 'firebase/messaging';import axios from 'axios';
const firebaseConfig = { /* ... paste credentials ... */ };const app = initializeApp(firebaseConfig);const messaging = getMessaging(app);
export const registerWebPush = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Fetch the device registration token from Firebase Cloud Messaging
    const token = await getToken(messaging, { 
      vapidKey: 'YOUR_PUBLIC_VAPID_KEY' 
    });

    if (token) {
      // Sync device registration target with backend Prisma storage
      await axios.post('http://localhost:3000/api/notifications/register-token', {
        userId,
        token
      });
    }
  } catch (error) {
    console.error('Failed to sync browser push token:', error);
  }
};

------------------------------
## 2. Twilio WhatsApp Hook & Template Integration
WhatsApp rules prohibit arbitrary text messaging. Outbound messages must use pre-registered templates configured inside your Meta Developer Dashboard.
## NestJS Infrastructure WhatsApp Adapter

// libs/infrastructure/notification/src/adapters/whatsapp.adapter.tsimport { Injectable } from '@nestjs/common';import { Twilio } from 'twilio';

@Injectable()export class WhatsAppAdapter {
  private client = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  async sendTemplateOtp(phoneNumber: string, otpCode: string): Promise<void> {
    await this.client.messages.create({
      // WhatsApp endpoints require the exact whatsapp: prefix
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      // The body string structure must explicitly match your Meta approved template pattern
      body: `Your verification code is ${otpCode}. It expires in 5 minutes.`
    });
  }
}

------------------------------
## 3. Database Maintenance (Prisma Partitioning Optimization)
In-app notification database tables grow incredibly fast. Allowing InAppNotification records to compile indefinitely degrades your query indexing and bloats compute resources.
To mitigate this, implement an automated dual mitigation system:

   1. Run a lightweight cron loop targeting unneeded records.
   2. Build single-query atomic markers to toggle read values rapidly.

## NestJS Database Optimizing Service

// apps/api/src/modules/notification/notification-cleaner.service.tsimport { Injectable } from '@nestjs/common';import { Cron, CronExpression } from '@nestjs/schedule';import { PrismaService } from '@app/infrastructure/prisma';

@Injectable()export class NotificationCleanerService {
  constructor(private readonly prisma: PrismaService) {}

  // Atomically flush read updates safely
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  // Automatic scheduler routine running every night at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeStaleNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Hard purge system logs and read in-app alerts older than 30 days
    const pruned = await this.prisma.inAppNotification.deleteMany({
      where: {
        OR: [
          { isRead: true, createdAt: { lt: thirtyDaysAgo } },
          // Keep database lean by wiping unread alerts older than 90 days automatically
          { isRead: false, createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    console.log(`[Database Engine Purge]: Cleared out ${pruned.count} legacy notification records.`);
  }
}

------------------------------
## 4. Consolidated Module Layout (The DDD Domain Mapping)
Tie the system components cleanly into your NestJS structure by keeping adapters encapsulated directly inside your infrastructure layer.

// libs/infrastructure/notification/src/notification-infrastructure.module.tsimport { Module } from '@nestjs/common';import { BullModule } from '@nestjs/bullmq';import { PrismaModule } from '@app/infrastructure/prisma';import { NotificationGateway } from './gateways/notification.gateway';import { NotificationWorker } from './workers/notification.worker';import { WhatsAppAdapter } from './adapters/whatsapp.adapter';import { ISmsAdapter } from '@app/core/notification';import { TwilioSmsAdapter } from './adapters/twilio-sms.adapter';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
  ],
  providers: [
    NotificationGateway,
    NotificationWorker,
    WhatsAppAdapter,
    {
      provide: ISmsAdapter,
      useClass: TwilioSmsAdapter,
    },
  ],
  exports: [BullModule, NotificationGateway, WhatsAppAdapter],
})export class NotificationInfrastructureModule {}

If you would like to proceed with refinement, let me know:

* Do you want to wire up a dead-letter queue (DLQ) inside BullMQ to track failed notification jobs?
* Would you like the complete NestJS passport controllers to handle OAuth token verification for social channel posting?
* Should we set up custom RxJS multi-cast operators in React to handle notification alerts smoothly?


