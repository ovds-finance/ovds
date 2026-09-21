-- CreateTable: vat_module_manifest
-- Global catalogue of country VAT modules installed on this OVDS instance.
-- One row per country module package, populated by VatDeclarationOrchestrator at bootstrap.
CREATE TABLE `vat_module_manifest` (
    `id`                VARCHAR(191) NOT NULL,
    `countryCode`       VARCHAR(2)   NOT NULL,
    `countryName`       VARCHAR(100) NOT NULL,
    `modulePackageName` VARCHAR(150) NOT NULL,
    `moduleVersion`     VARCHAR(20)  NOT NULL,
    `displayName`       VARCHAR(200) NOT NULL,
    `authorityName`     VARCHAR(200) NOT NULL,
    `authorityAbbrev`   VARCHAR(20)  NOT NULL,
    `currency`          VARCHAR(3)   NOT NULL,
    `ruleSetVersion`    VARCHAR(20)  NOT NULL,
    `filingFrequencies` VARCHAR(200) NOT NULL,
    `authoritySpec`     LONGTEXT     NOT NULL,
    `reportTemplates`   LONGTEXT     NOT NULL,
    `filingForms`       LONGTEXT     NOT NULL,
    `isActive`          BOOLEAN      NOT NULL DEFAULT true,
    `installedAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`         DATETIME(3)  NOT NULL,
    UNIQUE INDEX `vat_module_manifest_countryCode_key`(`countryCode`),
    INDEX `vat_module_manifest_countryCode_idx`(`countryCode`),
    INDEX `vat_module_manifest_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: tenant_vat_module
-- Per-tenant activation state for each country VAT module.
CREATE TABLE `tenant_vat_module` (
    `id`            VARCHAR(191) NOT NULL,
    `tenantId`      VARCHAR(36)  NOT NULL,
    `countryCode`   VARCHAR(2)   NOT NULL,
    `isActive`      BOOLEAN      NOT NULL DEFAULT true,
    `activatedBy`   VARCHAR(100) NULL,
    `activatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deactivatedAt` DATETIME(3)  NULL,
    `settingsJson`  LONGTEXT     NULL,
    `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`     DATETIME(3)  NOT NULL,
    INDEX `tenant_vat_module_tenantId_idx`(`tenantId`),
    INDEX `tenant_vat_module_countryCode_idx`(`countryCode`),
    INDEX `tenant_vat_module_isActive_idx`(`isActive`),
    UNIQUE INDEX `tenant_vat_module_tenantId_countryCode_key`(`tenantId`, `countryCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tenant_vat_module`
    ADD CONSTRAINT `tenant_vat_module_countryCode_fkey`
    FOREIGN KEY (`countryCode`) REFERENCES `vat_module_manifest`(`countryCode`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: vat_filing_record
CREATE TABLE `vat_filing_record` (
    `id`              VARCHAR(191) NOT NULL,
    `tenantId`        VARCHAR(36)  NOT NULL,
    `countryCode`     VARCHAR(2)   NOT NULL,
    `periodKey`       VARCHAR(20)  NOT NULL,
    `status`          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    `currency`        VARCHAR(3)   NOT NULL,
    `outputVat`       DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `inputVat`        DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `netVatPayable`   DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `returnDraftJson` LONGTEXT     NOT NULL,
    `complianceJson`  LONGTEXT     NULL,
    `submittedAt`     DATETIME(3)  NULL,
    `submittedBy`     VARCHAR(100) NULL,
    `ackNumber`       VARCHAR(200) NULL,
    `ackReceivedAt`   DATETIME(3)  NULL,
    `ackPayloadJson`  LONGTEXT     NULL,
    `dueDate`         DATETIME(3)  NULL,
    `amendmentOf`     VARCHAR(36)  NULL,
    `notes`           TEXT         NULL,
    `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`       DATETIME(3)  NOT NULL,
    INDEX `vat_filing_record_tenantId_idx`(`tenantId`),
    INDEX `vat_filing_record_tenantId_countryCode_idx`(`tenantId`, `countryCode`),
    INDEX `vat_filing_record_tenantId_countryCode_periodKey_idx`(`tenantId`, `countryCode`, `periodKey`),
    INDEX `vat_filing_record_status_idx`(`status`),
    INDEX `vat_filing_record_dueDate_idx`(`dueDate`),
    UNIQUE INDEX `vat_filing_record_tenantId_countryCode_periodKey_status_key`(`tenantId`, `countryCode`, `periodKey`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: vat_filing_event
CREATE TABLE `vat_filing_event` (
    `id`          VARCHAR(191) NOT NULL,
    `filingId`    VARCHAR(36)  NOT NULL,
    `tenantId`    VARCHAR(36)  NOT NULL,
    `eventType`   VARCHAR(30)  NOT NULL,
    `fromStatus`  VARCHAR(30)  NULL,
    `toStatus`    VARCHAR(30)  NOT NULL,
    `actorId`     VARCHAR(100) NULL,
    `payloadJson` LONGTEXT     NULL,
    `occurredAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `vat_filing_event_filingId_idx`(`filingId`),
    INDEX `vat_filing_event_tenantId_idx`(`tenantId`),
    INDEX `vat_filing_event_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: vat_report_artifact
CREATE TABLE `vat_report_artifact` (
    `id`            VARCHAR(191) NOT NULL,
    `tenantId`      VARCHAR(36)  NOT NULL,
    `filingId`      VARCHAR(36)  NULL,
    `countryCode`   VARCHAR(2)   NOT NULL,
    `periodKey`     VARCHAR(20)  NOT NULL,
    `templateId`    VARCHAR(100) NOT NULL,
    `format`        VARCHAR(10)  NOT NULL,
    `storageUrl`    VARCHAR(500) NOT NULL,
    `fileSizeBytes` INTEGER      NULL,
    `mimeType`      VARCHAR(100) NULL,
    `generatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `generatedBy`   VARCHAR(100) NULL,
    `expiresAt`     DATETIME(3)  NULL,
    INDEX `vat_report_artifact_tenantId_countryCode_periodKey_idx`(`tenantId`, `countryCode`, `periodKey`),
    INDEX `vat_report_artifact_filingId_idx`(`filingId`),
    INDEX `vat_report_artifact_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
