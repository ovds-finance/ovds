import { Module } from '@nestjs/common';
import { CyberAuditController } from './cyber-audit.controller';
import { CyberAuditService } from './cyber-audit.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CyberAuditController],
  providers: [CyberAuditService],
  exports: [CyberAuditService],
})
export class CyberAuditModule {}
