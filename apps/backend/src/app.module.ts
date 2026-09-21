import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { ModuleSubscriptionGuard } from './auth/guards/module-subscription.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BankingModule } from './banking/banking.module';
import { OnPremiseMigrationBootstrapper } from './bootstrap/on-premise-migration.bootstrapper';
import { CommonModule } from './common/common.module';
import { CorsService } from './common/cors.service';
import { CustomThrottlerGuard } from './common/custom-throttler.guard';
import { DataCleanupService } from './common/data-cleanup.service';
import { StatusCodeAbuseGuard } from './common/guards/status-code-abuse.guard';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { PrismaService } from './common/prisma.service';
import { ZodValidationPipe } from './common/zod-validation.pipe';
import { ComplianceModule } from './compliance/compliance.module';
import { CoreModule } from './core/core.module';
import { CrmModule } from './crm/crm.module';
import { CyberAuditModule } from './cyber-audit/cyber-audit.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { EimsModule } from './eims/eims.module';
import { HrModule } from './hr/hr.module';
import { ItemsModule } from './items/items.module';
import { LedgerModule } from './ledger/ledger.module';
import { MonetizationModule } from './monetization/monetization.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrpcModule } from './orpc/orpc.module';
import { OvdsFacadeModule } from './ovds/ovds.module';
import { PlatformModule } from './platform/platform.module';
import { ProjectsModule } from './projects/projects.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';
import { SecurityModule } from './security/security.module';
import { SecurityAssessmentModule } from './security-assessment/security-assessment.module';
import { AccreditationModule } from './settings/accreditation/accreditation.module';
import { SettingsModule } from './settings/settings.module';
import { TaxModule } from './tax/tax.module';
import { TradeModule } from './trade/trade.module';

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
      imports: [],
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
    // ComplianceModule now owns: ComplianceController, MasterComplianceController,
    // AgmController, GovernanceController — no root-level duplication.
    ComplianceModule,
    SecurityAssessmentModule,
    CyberAuditModule,
    AccreditationModule,
    EimsModule,
    TaxModule,
    OvdsFacadeModule,
    LedgerModule,
    ProjectsModule,
    // SecurityModule owns: SecurityController, DeviceControlController, IotController,
    // NodesController, InfrastructureController, HoneypotController
    SecurityModule,
    PlatformModule,
    NotificationsModule,
    MonetizationModule,
    TradeModule,
    AuditLogModule,
  ],
  // Only controllers that have NO owning feature module belong here.
  // Feature-module controllers (Settings, Tax, Security, SecurityAssessment,
  // CyberAudit, Agm, Governance) must NOT be listed here — doing so causes
  // NestJS to register them twice, creating duplicate route handlers.
  controllers: [
    AppController,
    DashboardController,
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
    // Guard execution order (first registered runs first):
    //  1. CustomThrottlerGuard   — hard request-rate cap per IP+route
    //  2. StatusCodeAbuseGuard   — blocks IPs generating 404/403 storms
    //  3. PermissionsGuard       — RBAC permission check
    //  4. ModuleSubscriptionGuard — feature-module entitlement check
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: StatusCodeAbuseGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ModuleSubscriptionGuard,
    },
    OnPremiseMigrationBootstrapper,
  ],
})
export class AppModule {}
