-- EIMS (Electronic Invoice Management System) tables for MoR/INSA compliance

CREATE TABLE IF NOT EXISTS `eims_source_system` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `systemNumber` VARCHAR(50) NOT NULL,
  `systemType` VARCHAR(20) NOT NULL DEFAULT 'ERP',
  `establishmentId` VARCHAR(100) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `clientId` VARCHAR(200) NULL,
  `clientSecret` VARCHAR(500) NULL,
  `apiKey` VARCHAR(200) NULL,
  `callbackUrl` VARCHAR(500) NULL,
  `lastAuthAt` DATETIME(3) NULL,
  `invoiceCounter` INT NOT NULL DEFAULT 0,
  `lastIrn` VARCHAR(64) NULL,
  `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `approvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `eims_source_system_companyId_systemNumber_key` (`companyId`, `systemNumber`),
  INDEX `eims_source_system_companyId_idx` (`companyId`),
  INDEX `eims_source_system_status_idx` (`status`),
  CONSTRAINT `eims_source_system_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `eims_certificate` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `sourceSystemId` VARCHAR(191) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING_CSR',
  `privateKeyEnc` LONGTEXT NULL,
  `certificatePem` LONGTEXT NULL,
  `certificateB64` LONGTEXT NULL,
  `csrPem` LONGTEXT NULL,
  `subjectTin` VARCHAR(20) NULL,
  `serialNumber` VARCHAR(50) NULL,
  `issuedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `submittedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `eims_certificate_companyId_idx` (`companyId`),
  INDEX `eims_certificate_sourceSystemId_idx` (`sourceSystemId`),
  INDEX `eims_certificate_status_idx` (`status`),
  INDEX `eims_certificate_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `eims_certificate_sourceSystemId_fkey` FOREIGN KEY (`sourceSystemId`) REFERENCES `eims_source_system`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `eims_registration` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `sourceSystemId` VARCHAR(191) NULL,
  `invoiceId` VARCHAR(36) NULL,
  `irn` VARCHAR(64) NULL,
  `documentNumber` VARCHAR(50) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `signedQr` LONGTEXT NULL,
  `signedInvoice` LONGTEXT NULL,
  `invoiceSignature` LONGTEXT NULL,
  `ackDate` DATETIME(3) NULL,
  `previousIrn` VARCHAR(64) NULL,
  `requestPayload` LONGTEXT NULL,
  `responsePayload` LONGTEXT NULL,
  `errorMessage` VARCHAR(1000) NULL,
  `attemptCount` INT NOT NULL DEFAULT 0,
  `submissionMode` VARCHAR(10) NOT NULL DEFAULT 'stub',
  `registeredAt` DATETIME(3) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `eims_registration_companyId_idx` (`companyId`),
  INDEX `eims_registration_invoiceId_idx` (`invoiceId`),
  INDEX `eims_registration_irn_idx` (`irn`),
  INDEX `eims_registration_status_idx` (`status`),
  INDEX `eims_registration_sourceSystemId_idx` (`sourceSystemId`),
  CONSTRAINT `eims_registration_sourceSystemId_fkey` FOREIGN KEY (`sourceSystemId`) REFERENCES `eims_source_system`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add EIMS fields to invoice table
ALTER TABLE `invoice` ADD COLUMN IF NOT EXISTS `eimsIrn` VARCHAR(64) NULL;
ALTER TABLE `invoice` ADD COLUMN IF NOT EXISTS `eimsStatus` VARCHAR(20) NULL DEFAULT 'NOT_REGISTERED';
ALTER TABLE `invoice` ADD COLUMN IF NOT EXISTS `eimsSignedQr` LONGTEXT NULL;
ALTER TABLE `invoice` ADD COLUMN IF NOT EXISTS `eimsRegisteredAt` DATETIME(3) NULL;

CREATE INDEX IF NOT EXISTS `Invoice_eimsIrn_idx` ON `invoice`(`eimsIrn`);
CREATE INDEX IF NOT EXISTS `Invoice_eimsStatus_idx` ON `invoice`(`eimsStatus`);

CREATE TABLE IF NOT EXISTS `eims_receipt` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `invoiceId` VARCHAR(36) NULL,
  `receiptNumber` VARCHAR(50) NOT NULL,
  `receiptType` VARCHAR(20) NOT NULL,
  `receiptIrn` VARCHAR(64) NULL,
  `collectedAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `requestPayload` LONGTEXT NULL,
  `responsePayload` LONGTEXT NULL,
  `submissionMode` VARCHAR(10) NOT NULL DEFAULT 'stub',
  `registeredAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `eims_receipt_companyId_idx` (`companyId`),
  INDEX `eims_receipt_invoiceId_idx` (`invoiceId`),
  INDEX `eims_receipt_receiptNumber_idx` (`receiptNumber`),
  INDEX `eims_receipt_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `eims_bulk_job` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NULL,
  `jobType` VARCHAR(20) NOT NULL,
  `conversationId` VARCHAR(100) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `invoiceIds` LONGTEXT NULL,
  `requestCount` INT NOT NULL DEFAULT 0,
  `successCount` INT NOT NULL DEFAULT 0,
  `failureCount` INT NOT NULL DEFAULT 0,
  `responsePayload` LONGTEXT NULL,
  `submissionMode` VARCHAR(10) NOT NULL DEFAULT 'stub',
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `eims_bulk_job_companyId_idx` (`companyId`),
  INDEX `eims_bulk_job_conversationId_idx` (`conversationId`),
  INDEX `eims_bulk_job_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
