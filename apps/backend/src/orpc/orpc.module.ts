import { Module } from '@nestjs/common';
// @ts-expect-error @orpc/nest is ESM-only; tsx handles the interop at runtime
import { ORPCModule } from '@orpc/nest';

@Module({
  imports: [ORPCModule.forRoot({})],
  exports: [],
})
export class OrpcModule {}
