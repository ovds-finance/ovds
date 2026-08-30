import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { EstimatesController } from './estimates.controller';
import { IfrsController } from './ifrs.controller';
import { TreasuryController } from './treasury.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EstimatesController, IfrsController, TreasuryController],
})
export class LedgerModule {}
