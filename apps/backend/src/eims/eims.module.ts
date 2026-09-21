import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../common/prisma.module';

import { CertificateEncryptionService } from './certificate-encryption.service';
import { EimsCertificateService } from './eims-certificate.service';
import { EimsDataRegistryService } from './eims-data-registry.service';
import { EimsController } from './eims.controller';
import { EimsService } from './eims.service';

/**
 * EIMS (MoR Electronic Invoice Management System) integration module.
 *
 * Provides the backend proxy the OVDS frontend calls at /eims/* — it forwards
 * invoice/receipt submissions to the MoR core API (see MorEimsClient), applies
 * RBAC at the controller boundary, and persists every attempt in the database
 * so submissions are auditable and idempotent (invoiceId is unique per
 * registration; bulk jobs are keyed by the MoR conversationId).
 *
 * EimsDataRegistryService — centralized data-mapping registry exposing:
 *   • OVDS ↔ MoR field registry (GET /eims/registry)
 *   • Invoice summary compiler (compileSummaryReport)
 *   • Ethiopian tax-law compliance pre-flight (runCompliancePreFlight)
 *   • MoR receipt cryptographic verification hook (verifyMorReceipt)
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [EimsController],
  providers: [
    EimsService,
    EimsCertificateService,
    CertificateEncryptionService,
    EimsDataRegistryService,
  ],
  exports: [EimsService, EimsDataRegistryService],
})
export class EimsModule {}
