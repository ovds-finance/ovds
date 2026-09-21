import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { OrpcModule } from '../orpc/orpc.module';
import { SettingsModule } from '../settings/settings.module';

import { ExchangeTransformerService } from './exchange-transformer.service';
import { AirGappedLicenseService } from './licensing/air-gapped-license.service';
import { ModuleActivationService } from './module-activation.service';
import { ModuleBootstrapService } from './module-bootstrap.service';
import { PipelineInterceptorService } from './pipeline-interceptor.service';

@Module({
  imports: [CommonModule, AuthModule, SettingsModule, OrpcModule],
  providers: [
    ExchangeTransformerService,
    ModuleBootstrapService,
    ModuleActivationService,
    PipelineInterceptorService,
    AirGappedLicenseService,
  ],
  exports: [
    CommonModule,
    AuthModule,
    SettingsModule,
    OrpcModule,
    ExchangeTransformerService,
    ModuleBootstrapService,
    ModuleActivationService,
    PipelineInterceptorService,
    AirGappedLicenseService,
  ],
})
export class CoreModule {}
