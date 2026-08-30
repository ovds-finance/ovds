import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrmController, LoyaltyController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
