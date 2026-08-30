-- Add ReconciliationPeriod, BankFeed, and ReconciliationReport tables
-- Migration: 20260717203000_add_reconciliation_and_bankfeed_models

-- Create ReconciliationPeriod table
CREATE TABLE IF NOT EXISTS `reconciliation_period` (
  `id` VARCHAR(36) NOT NULL,
  `bankAccountId` VARCHAR(36) NOT NULL,
  `companyId` VARCHAR(36) NULL,
  `statementDate` DATETIME(3) NOT NULL,
  `openingBalance` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `closingBalance` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `reconciledBalance` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `discrepancy` DECIMAL(65,30) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  `notes` TEXT NULL,
  `reconciledBy` VARCHAR(100) NULL,
  `reconciledAt` DATETIME(3) NULL,
  `approvedBy` VARCHAR(100) NULL,
  `approvedAt` DATETIME(3) NULL,
  `bankAccountName` VARCHAR(200) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `ReconciliationPeriod_companyId_idx` (`companyId`),
  INDEX `ReconciliationPeriod_bankAccountId_idx` (`bankAccountId`),
  INDEX `ReconciliationPeriod_status_idx` (`status`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create BankFeed table
CREATE TABLE IF NOT EXISTS `bankfeed` (
  `id` VARCHAR(36) NOT NULL,
  `bankAccountId` VARCHAR(36) NOT NULL,
  `companyId` VARCHAR(36) NULL,
  `provider` VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING_AUTH',
  `lastSyncAt` DATETIME(3) NULL,
  `institutionId` VARCHAR(100) NULL,
  `institutionName` VARCHAR(200) NULL,
  `errorMessage` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `BankFeed_companyId_idx` (`companyId`),
  INDEX `BankFeed_bankAccountId_idx` (`bankAccountId`),
  INDEX `BankFeed_status_idx` (`status`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ReconciliationReport table
CREATE TABLE IF NOT EXISTS `reconciliation_report` (
  `id` VARCHAR(36) NOT NULL,
  `periodId` VARCHAR(36) NOT NULL,
  `companyId` VARCHAR(36) NULL,
  `reportType` VARCHAR(50) NOT NULL DEFAULT 'STATEMENT',
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `generatedBy` VARCHAR(100) NULL,
  `approvedBy` VARCHAR(100) NULL,
  `approvedAt` DATETIME(3) NULL,
  `fileUrl` VARCHAR(500) NULL,
  `fileFormat` VARCHAR(20) NULL,
  `notes` TEXT NULL,
  INDEX `ReconciliationReport_periodId_idx` (`periodId`),
  INDEX `ReconciliationReport_companyId_idx` (`companyId`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys
ALTER TABLE `reconciliation_period` ADD CONSTRAINT `ReconciliationPeriod_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bankfeed` ADD CONSTRAINT `BankFeed_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reconciliation_report` ADD CONSTRAINT `ReconciliationReport_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `reconciliation_period`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
