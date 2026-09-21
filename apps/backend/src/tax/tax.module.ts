import { Module } from '@nestjs/common';
import { VatService } from '@ovds/domains-vat';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';

import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { VatController } from './vat.controller';

@Module({
  imports: [PrismaModule, AuditLogModule, AuthModule],
  controllers: [TaxController, VatController],
  providers: [
    TaxService,
    PrismaService,
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
