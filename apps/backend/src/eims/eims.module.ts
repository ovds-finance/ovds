import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma.module';
import { EimsController } from './eims.controller';
import { EimsService } from './eims.service';
import { EimsCertificateService } from './eims-certificate.service';
import { CertificateEncryptionService } from './certificate-encryption.service';

/**
 * EIMS (MoR Electronic Invoice Management System) integration module.
 *
 * Provides the backend proxy the OVDS frontend calls at /eims/* — it forwards
 * invoice/receipt submissions to the MoR core API (see MorEimsClient), applies
 * RBAC at the controller boundary, and persists every attempt in the database
 * so submissions are auditable and idempotent (invoiceId is unique per
 * registration; bulk jobs are keyed by the MoR conversationId).
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [EimsController],
  providers: [EimsService, EimsCertificateService, CertificateEncryptionService],
  exports: [EimsService],
})
export class EimsModule {}
