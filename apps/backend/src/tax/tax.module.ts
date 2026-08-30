import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { VatController } from './vat.controller';
import { VatService } from '@ovds/domains/vat';
import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuditLogService } from '../audit-log/audit-log.service';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [TaxController, VatController],
  providers: [
    TaxService,
    {
      provide: VatService,
      useFactory: (prisma: PrismaService) => {
        return new VatService(prisma as any);
      },
      inject: [PrismaService],
    },
  ],
  exports: [TaxService, VatService],
})
export class TaxModule {}
