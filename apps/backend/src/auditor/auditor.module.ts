import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CommonModule } from '../common/common.module';
import { FraudDetectionService } from './fraud-detection.service';
import { MorController } from './mor.controller';
import { OverviewController } from './overview.controller';
import { AuditorTenantInterceptor } from './auditor-tenant.interceptor';

@Module({
  imports: [CommonModule],
  controllers: [OverviewController, MorController],
  providers: [
    FraudDetectionService,
    AuditorTenantInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: AuditorTenantInterceptor,
    },
  ],
  exports: [FraudDetectionService, AuditorTenantInterceptor],
})
export class AuditorPlatformModule {}
