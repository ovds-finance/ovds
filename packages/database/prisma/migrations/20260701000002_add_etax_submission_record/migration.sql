-- CreateTable: etax_submission_record
-- Tracks VAT declaration submissions to the Ministry of Revenues (MoR) e-Tax portal.
-- Extends VatFiling with e-service submission metadata.

CREATE TABLE IF NOT EXISTS `etax_submission_record` (
  `id`               VARCHAR(191) NOT NULL,
  `companyId`        VARCHAR(191) NULL,
  `vatFilingId`      VARCHAR(36)  NULL,
  `submissionType`   VARCHAR(30)  NOT NULL DEFAULT 'VAT_RETURN',
  `period`           VARCHAR(7)   NOT NULL,
  `payloadJson`      LONGTEXT     NULL,
  `responseJson`     LONGTEXT     NULL,
  `ercaReferenceNo`  VARCHAR(100) NULL,
  `ercaAckXml`       LONGTEXT     NULL,
  `totalPayable`     DECIMAL(18, 2) NOT NULL DEFAULT 0,
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `mode`             VARCHAR(10)  NOT NULL DEFAULT 'stub',
  `submittedAt`      DATETIME(3)  NULL,
  `acceptedAt`       DATETIME(3)  NULL,
  `rejectedAt`       DATETIME(3)  NULL,
  `rejectionReason`  VARCHAR(1000) NULL,
  `submittedBy`      VARCHAR(100) NULL,
  `createdAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `etax_submission_record_companyId_idx` (`companyId`),
  INDEX `etax_submission_record_period_idx` (`period`),
  INDEX `etax_submission_record_status_idx` (`status`),
  INDEX `etax_submission_record_submissionType_idx` (`submissionType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
