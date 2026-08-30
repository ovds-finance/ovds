import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_PIPE, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ModuleBootstrap } from '@ovds/core';
import { ZodValidationPipe } from './common/zod-validation.pipe';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { PrismaService } from './common/prisma.service';
import { CorsService } from './common/cors.service';
import { CustomThrottlerGuard } from './common/custom-throttler.guard';
import { DataCleanupService } from './common/data-cleanup.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { OrpcModule } from './orpc/orpc.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { BankingModule } from './banking/banking.module';
import { ItemsModule } from './items/items.module';
import { HrModule } from './hr/hr.module';
import { CrmModule } from './crm/crm.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SecurityAssessmentModule } from './security-assessment/security-assessment.module';
import { CyberAuditModule } from './cyber-audit/cyber-audit.module';
import { AccreditationModule } from './settings/accreditation/accreditation.module';
import { EimsModule } from './eims/eims.module';
import { SettingsController } from './settings/settings.controller';
import { OvdsFacadeModule } from './ovds/ovds.module';
import { LedgerModule } from './ledger/ledger.module';
import { ProjectsModule } from './projects/projects.module';
import { SecurityModule } from './security/security.module';
import { PlatformModule } from './platform/platform.module';
import { TaxController } from './tax/tax.controller';
import { TaxModule } from './tax/tax.module';
import { AgmController } from './compliance/agm.controller';
import { GovernanceController } from './compliance/governance.controller';
import { SecurityController } from './security/security.controller';
import { SecurityAssessmentController } from './security-assessment/security-assessment.controller';
import { CyberAuditController } from './cyber-audit/cyber-audit.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    // BullMQ / Redis — loaded only when REDIS_ENABLED=true
    ...(process.env['REDIS_ENABLED'] === 'true'
      ? [
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              connection: {
                host:              configService.get('REDIS_HOST', 'localhost'),
                port:              parseInt(configService.get('REDIS_PORT', '6379'), 10),
                password:          configService.get('REDIS_PASSWORD', '') || undefined,
                lazyConnect:       true,
                enableOfflineQueue: false,
                connectTimeout:    5000,
              },
            }),
          }),
        ]
      : []),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([
        {
          ttl: parseInt(configService.get('THROTTLE_TTL_MS', '60000'), 10),
          limit: parseInt(configService.get('THROTTLE_LIMIT', '100'), 10),
        },
      ]),
    }),
    CommonModule,
    CoreModule,
    AuthModule,
    SettingsModule,
    OrpcModule,
    SalesModule,
    PurchasesModule,
    BankingModule,
    ItemsModule,
    HrModule,
    CrmModule,
    ComplianceModule,
    SecurityAssessmentModule,
    CyberAuditModule,
    AccreditationModule,
    EimsModule,
    TaxModule,
    OvdsFacadeModule,
    LedgerModule,
    ProjectsModule,
    SecurityModule,
    PlatformModule,
    NotificationsModule,
  ],
  controllers: [
    SettingsController,
    TaxController,
    SecurityController,
    SecurityAssessmentController,
    CyberAuditController,
    AppController,
    AgmController,
    GovernanceController,
  ],
  providers: [
    AppService,
    CorsService,
    RolesGuard,
    PermissionsGuard,
    PrismaService,
    DataCleanupService,
    {
      provide: CustomThrottlerGuard,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
