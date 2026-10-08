import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LedgerModule, PRISMA_CLIENT } from '@ovds/ledger';
import { createM2mAuthModule } from '@ovds/shared-domains/infra';

import { OfflineSyncProcessor } from './offline-sync.processor';
import { PrismaService } from './prisma.service';
import { SyncController } from './sync.controller';

// The ingest zone authenticates machine callers against the m2m_api_key table
// through the shared guard, so ovds-sync and cloud-api can never drift on how a
// key is read, hashed, or scoped.
const m2mAuth = createM2mAuthModule({ prismaToken: PRISMA_CLIENT });

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LedgerModule,
    m2mAuth.module,
  ],
  controllers: [SyncController],
  providers: [
    PrismaService,
    // LedgerModule and the M2M store both resolve Prisma through this token.
    { provide: PRISMA_CLIENT, useExisting: PrismaService },
    OfflineSyncProcessor,
  ],
})
export class OfflineSyncModule {}
