import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../common/prisma.service';
import { AirGappedLicenseService } from '../core/licensing/air-gapped-license.service';

import { BusinessRegistrationController } from './business-registration/business-registration.controller';
import { BusinessRegistrationService } from './business-registration/business-registration.service';
import { CostCentersController } from './cost-centers/cost-centers.controller';
import { CurrencyController } from './currency/currency.controller';
import { CustomFieldsController } from './custom-fields/custom-fields.controller';
import { FiscalController } from './fiscal/fiscal.controller';
import { LicensingController } from './licensing/licensing.controller';
import { OnboardingController } from './onboarding/onboarding.controller';
import { PeriodsController } from './periods/periods.controller';
import { RbacController } from './rbac/rbac.controller';
import { RbacService } from './rbac/rbac.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SetupController } from './setup/setup.controller';
import { SetupService } from './setup/setup.service';


@Module({
  imports: [AuthModule],
  providers: [ConfigService, PrismaService, SettingsService, SetupService, BusinessRegistrationService, RbacService, AirGappedLicenseService],
  exports:   [ConfigService, PrismaService, SettingsService, SetupService, RbacService],
  controllers: [
    SettingsController,
    CurrencyController,
    PeriodsController,
    FiscalController,
    CustomFieldsController,
    CostCentersController,
    OnboardingController,
    BusinessRegistrationController,
    LicensingController,
    SetupController,
    RbacController,
  ],
})
export class SettingsModule {}
