import { Module } from '@nestjs/common';

import { PRISMA_CLIENT } from '@ovds/ledger';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  controllers: [PaymentGatewayController],
  providers: [
    PrismaService,
    PaymentGatewayService,
    { provide: PRISMA_CLIENT, useExisting: PrismaService },
  ],
  exports: [PrismaService, PaymentGatewayService],
})
export class BankingModule {}
