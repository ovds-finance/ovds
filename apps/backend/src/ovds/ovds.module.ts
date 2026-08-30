import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { SalesModule } from '../sales/sales.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { ItemsModule } from '../items/items.module';
import { CrmModule } from '../crm/crm.module';
import { HrModule } from '../hr/hr.module';
import { VatModule } from '../vat/vat.module';
import { BankingModule } from '../banking/banking.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { EimsModule } from '../eims/eims.module';
import { SecurityAssessmentModule } from '../security-assessment/security-assessment.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DoubleEntryService } from '@ovds/domains/double-entry';
import { OvdsController } from './ovds.controller';

@Module({
  imports: [
    PrismaModule,
    SalesModule,
    PurchasesModule,
    ItemsModule,
    CrmModule,
    HrModule,
    VatModule,
    BankingModule,
    ComplianceModule,
    EimsModule,
    SecurityAssessmentModule,
    AuditLogModule,
  ],
  controllers: [OvdsController],
  providers: [
    {
      provide: DoubleEntryService,
      useFactory: (prisma: PrismaService, audit: AuditLogService) => {
        return new DoubleEntryService(prisma as any, audit as any);
      },
      inject: [PrismaService, AuditLogService],
    },
  ],
  exports: [DoubleEntryService],
})
export class OvdsFacadeModule {}
