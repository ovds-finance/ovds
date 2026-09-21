import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { MonetizationController } from './monetization.controller';
import { MonetizationService } from './monetization.service';

@Module({
  imports: [PrismaModule],
  controllers: [MonetizationController],
  providers: [MonetizationService],
  exports: [MonetizationService],
})
export class MonetizationModule {}
