import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';

import { EstimatesController } from './estimates.controller';
import { IfrsController } from './ifrs.controller';
import { LedgerObserverService } from './ledger-observer.service';
import { LedgerController } from './ledger.controller';
import { TreasuryController } from './treasury.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LedgerController, EstimatesController, IfrsController, TreasuryController],
  // LedgerObserverService self-registers on the domain EventBus at module init.
  // PrismaService is provided here so IfrsController and TreasuryController can inject it directly.
  providers: [LedgerObserverService, PrismaService],
})
export class LedgerModule {}
