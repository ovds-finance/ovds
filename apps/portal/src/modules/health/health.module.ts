import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaClientToken } from '../../prisma/prisma.module';
import { PrismaClient } from '@ovds/database';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    {
      provide: 'PRISMA_HEALTH',
      useFactory: (prisma: PrismaClient) => prisma,
      inject: [PrismaClientToken],
    },
  ],
})
export class HealthModule {}