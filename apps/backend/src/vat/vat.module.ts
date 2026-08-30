import { Module } from '@nestjs/common';
import { VatService } from '@ovds/domains/vat';
import { PrismaModule } from '../common/prisma.module';

/**
 * VatModule — thin adapter that wires the domain-layer VatService
 * (from @ovds/domains/vat) into the NestJS DI container and exposes it
 * to importing modules such as OvdsFacadeModule and TaxModule.
 */
@Module({
  imports: [PrismaModule],
  providers: [VatService],
  exports: [VatService],
})
export class VatModule {}
