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

@Module({
  providers: [ConfigService, PrismaService, SettingsService],
  exports: [ConfigService, PrismaService, SettingsService],
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
  ],
})
export class SettingsModule {}
