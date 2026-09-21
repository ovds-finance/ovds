import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';
import { CoreModule } from '../core/core.module';

import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { LoyaltyController } from './loyalty.controller';

@Module({
  imports: [PrismaModule, CoreModule],
  controllers: [CrmController, LoyaltyController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
