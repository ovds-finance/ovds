import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';

@Module({
  imports: [PrismaModule],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
