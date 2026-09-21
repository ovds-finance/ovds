import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { EstimatesService } from './estimates.service';
import { InvoiceDomainEventService } from './invoice-domain-event.service';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';


@Module({
  imports: [PrismaModule],
  controllers: [SalesController],
  providers: [SalesService, EstimatesService, InvoiceDomainEventService],
  exports: [SalesService, EstimatesService],
})
export class SalesModule {}
