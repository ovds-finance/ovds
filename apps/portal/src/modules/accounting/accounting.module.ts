import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { BalancesValidator } from '@ovds/shared-domains/accounting';
import { CurrencyConverter } from '@ovds/shared-domains/accounting';
import { LedgerSyncService } from '@ovds/shared-domains/accounting';
import { PrismaClientToken } from '../../prisma/prisma.module';
import { PrismaClient } from '@ovds/database';

@Module({
  controllers: [AccountingController],
  providers: [
    AccountingService,
    {
      provide: BalancesValidator,
      useFactory: (prisma: PrismaClient) => new BalancesValidator(prisma),
      inject: [PrismaClientToken],
    },
    {
      provide: CurrencyConverter,
      useFactory: (prisma: PrismaClient) => new CurrencyConverter(prisma),
      inject: [PrismaClientToken],
    },
    {
      provide: LedgerSyncService,
      useFactory: (prisma: PrismaClient) => new LedgerSyncService(prisma),
      inject: [PrismaClientToken],
    },
  ],
  exports: [AccountingService, BalancesValidator, CurrencyConverter, LedgerSyncService],
})
export class AccountingModule {}