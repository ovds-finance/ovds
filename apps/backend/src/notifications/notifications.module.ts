import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../common/prisma.module';


// Gateway
// Channels
import { EmailChannel }                 from './channels/email.channel';
import { InAppChannel }                 from './channels/in-app.channel';
import { PushChannel }                  from './channels/push.channel';
import { SmsChannel }                   from './channels/sms.channel';
import { WhatsAppChannel }              from './channels/whatsapp.channel';
// Core services
import { NotificationAdminService }     from './notification-admin.service';
import { NotificationDispatchService }  from './notification-dispatch.service';
import { NotificationEventListener }    from './notification-event.listener';
import { NotificationController }       from './notification.controller';
import { NotificationGateway }          from './notification.gateway';
import { NOTIFICATION_QUEUE } from './notification.jobs';
import { NotificationProcessor }        from './notification.processor';
import { NotificationScheduler }        from './notification.scheduler';
import { NotificationService }          from './notification.service';
import { RealtimeGateway }              from './realtime.gateway';

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
    RealtimeGateway,
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
  exports: [NotificationService, RealtimeGateway],
})
export class NotificationsModule {}
