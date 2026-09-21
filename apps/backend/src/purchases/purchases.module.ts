import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { ExpenseClaimsController } from './expense-claims.controller';
import { ProcurementController } from './procurement.controller';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';


@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController, ProcurementController, ExpenseClaimsController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
