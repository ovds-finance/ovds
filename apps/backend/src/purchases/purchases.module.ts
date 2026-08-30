import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { ProcurementController } from './procurement.controller';
import { ExpenseClaimsController } from './expense-claims.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController, ProcurementController, ExpenseClaimsController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
