import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma.module';

import { CyberAuditController } from './cyber-audit.controller';
import { CyberAuditService } from './cyber-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [CyberAuditController],
  providers: [CyberAuditService],
  exports: [CyberAuditService],
})
export class CyberAuditModule {}
