import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { BankAccountsController } from './bank-accounts.controller';
import { BankTransactionsController } from './bank-transactions.controller';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { ReconciliationController } from './reconciliation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BankingController, BankAccountsController, BankTransactionsController, ReconciliationController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
