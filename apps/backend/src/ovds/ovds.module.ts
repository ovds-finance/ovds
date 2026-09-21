import { Module } from '@nestjs/common';
import { DoubleEntryService } from '@ovds/domains-double-entry';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BankingModule } from '../banking/banking.module';
import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';
import { ComplianceModule } from '../compliance/compliance.module';
import { CrmModule } from '../crm/crm.module';
import { EimsModule } from '../eims/eims.module';
import { HrModule } from '../hr/hr.module';
import { ItemsModule } from '../items/items.module';
import { InvoiceLedgerListener } from '../ledger/invoice-ledger.listener';
import { PurchasesModule } from '../purchases/purchases.module';
import { SalesModule } from '../sales/sales.module';
import { SecurityAssessmentModule } from '../security-assessment/security-assessment.module';
import { TaxModule } from '../tax/tax.module';


import { OvdsController } from './ovds.controller';
import { VandvController } from './vandv.controller';


// ── Modular VAT Declaration subsystem ────────────────────────────────────────
import { OvdsVatModule } from './vat/ovds-vat.module';

@Module({
  imports: [
    PrismaModule,
    SalesModule,
    PurchasesModule,
    ItemsModule,
    CrmModule,
    HrModule,
    TaxModule,
    BankingModule,
    ComplianceModule,
    EimsModule,
    SecurityAssessmentModule,
    AuditLogModule,
    // Pluggable VAT Declaration engine — country modules registered inside
    OvdsVatModule,
  ],
  controllers: [OvdsController, VandvController],
  providers: [
    {
      provide: DoubleEntryService,
      useFactory: (prisma: PrismaService, audit: AuditLogService) => {
        return new DoubleEntryService(prisma as any, audit as any);
      },
      inject: [PrismaService, AuditLogService],
    },
    InvoiceLedgerListener,
  ],
  exports: [DoubleEntryService, InvoiceLedgerListener],
})
export class OvdsFacadeModule {}
