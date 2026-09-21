import { Module } from '@nestjs/common';
import { ORPCModule } from '@orpc/nest';

@Module({
  imports: [ORPCModule.forRoot({})],
  exports: [],
})
export class OrpcModule {}
