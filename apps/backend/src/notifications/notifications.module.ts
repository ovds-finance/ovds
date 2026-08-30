import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../common/prisma.module';
import { NOTIFICATION_QUEUE } from './notification.jobs';

// Gateway
import { NotificationGateway }          from './notification.gateway';
// Channels
import { EmailChannel }                 from './channels/email.channel';
import { WhatsAppChannel }              from './channels/whatsapp.channel';
import { SmsChannel }                   from './channels/sms.channel';
import { PushChannel }                  from './channels/push.channel';
import { InAppChannel }                 from './channels/in-app.channel';
// Core services
import { NotificationDispatchService }  from './notification-dispatch.service';
import { NotificationService }          from './notification.service';
import { NotificationProcessor }        from './notification.processor';
import { NotificationEventListener }    from './notification-event.listener';
import { NotificationScheduler }        from './notification.scheduler';
import { NotificationController }       from './notification.controller';
import { NotificationAdminService }     from './notification-admin.service';

/** Injection token so services can check at runtime whether Redis is available. */
export const REDIS_ENABLED_TOKEN = 'REDIS_ENABLED';

const redisEnabled = process.env['REDIS_ENABLED'] === 'true';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    // Register the BullMQ queue only when Redis is actually available.
    // When disabled the queue token resolves to null (via @Optional()) in consumers.
    ...(redisEnabled ? [BullModule.registerQueue({ name: NOTIFICATION_QUEUE })] : []),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [
    // Let consumers know whether the queue is available
    { provide: REDIS_ENABLED_TOKEN, useValue: redisEnabled },
    // Gateway (WebSocket)
    NotificationGateway,
    // Channels
    EmailChannel,
    WhatsAppChannel,
    SmsChannel,
    PushChannel,
    InAppChannel,
    // Services
    NotificationDispatchService,
    NotificationService,
    // Only register the BullMQ processor worker when Redis is enabled;
    // otherwise NestJS/BullMQ would throw trying to connect on startup.
    ...(redisEnabled ? [NotificationProcessor] : []),
    NotificationEventListener,
    NotificationScheduler,
    NotificationAdminService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
