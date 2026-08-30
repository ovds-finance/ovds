import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { CurrencyController } from './currency/currency.controller';
import { PeriodsController } from './periods/periods.controller';
import { FiscalController } from './fiscal/fiscal.controller';
import { CustomFieldsController } from './custom-fields/custom-fields.controller';
import { CostCentersController } from './cost-centers/cost-centers.controller';
import { OnboardingController } from './onboarding/onboarding.controller';
import { BusinessRegistrationController } from './business-registration/business-registration.controller';
import { LicensingController } from './licensing/licensing.controller';
import { SetupController } from './setup/setup.controller';
import { SetupService } from './setup/setup.service';

@Module({
  providers: [ConfigService, PrismaService, SettingsService, SetupService],
  exports: [ConfigService, PrismaService, SettingsService, SetupService],
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
  ],
})
export class SettingsModule {}
