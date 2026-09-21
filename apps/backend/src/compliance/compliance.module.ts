import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { AgmController } from './agm.controller';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { GovernanceController } from './governance.controller';
import { MasterComplianceController } from './master-compliance.controller';
import { MasterComplianceService } from './master-compliance.service';


@Module({
  imports: [PrismaModule],
  controllers: [
    ComplianceController,
    MasterComplianceController,
    AgmController,
    GovernanceController,
  ],
  providers: [ComplianceService, MasterComplianceService],
  exports: [ComplianceService, MasterComplianceService],
})
export class ComplianceModule {}
