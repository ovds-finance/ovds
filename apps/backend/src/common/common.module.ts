import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma.module';
import { TenantContextService } from './tenant-context.service';

@Module({
  imports: [PrismaModule],
  providers: [TenantContextService],
  exports: [PrismaModule, TenantContextService],
})
export class CommonModule {}
