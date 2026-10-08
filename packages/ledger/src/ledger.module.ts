import { Module } from '@nestjs/common';
import { LedgerEngineService } from './domain/ledger-engine.service';
import { PRISMA_CLIENT } from './tokens';

@Module({
  providers: [LedgerEngineService],
  exports: [LedgerEngineService],
})
export class LedgerModule {}