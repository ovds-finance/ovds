import { Module } from '@nestjs/common';
import { BankingController } from './banking.controller';
import { BankAccountsController } from './bank-accounts.controller';
import { BankTransactionsController } from './bank-transactions.controller';
import { ReconciliationController } from './reconciliation.controller';
import { BankingService } from './banking.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BankingController, BankAccountsController, BankTransactionsController, ReconciliationController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
