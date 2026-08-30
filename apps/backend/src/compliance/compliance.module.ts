import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { MasterComplianceController } from './master-compliance.controller';
import { MasterComplianceService } from './master-compliance.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController, MasterComplianceController],
  providers: [ComplianceService, MasterComplianceService],
  exports: [ComplianceService, MasterComplianceService],
})
export class ComplianceModule {}
