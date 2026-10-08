import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

export const PrismaClientToken = 'PRISMA_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClientToken,
      useFactory: () => {
        const client = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
        return client;
      },
    },
  ],
  exports: [PrismaClientToken],
})
export class PrismaModule {}