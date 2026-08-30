CREATE TABLE IF NOT EXISTS `ledgermappingrule` (
  `id` VARCHAR(36) NOT NULL,
  `companyId` VARCHAR(36) NULL,
  `name` VARCHAR(200) NOT NULL,
  `priority` INT NOT NULL DEFAULT 100,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `matchType` VARCHAR(20) NOT NULL,
  `matchValue` VARCHAR(500) NOT NULL,
  `debitAccountId` VARCHAR(36) NOT NULL,
  `creditAccountId` VARCHAR(36) NOT NULL,
  `taxType` VARCHAR(50) NULL,
  `costCenterId` VARCHAR(36) NULL,
  `description` TEXT NULL,
  `minAmount` DECIMAL(18,2) NULL,
  `maxAmount` DECIMAL(18,2) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `ledgermappingrule_companyId_idx` (`companyId`),
  INDEX `ledgermappingrule_companyId_isActive_idx` (`companyId`, `isActive`),
  INDEX `ledgermappingrule_matchType_idx` (`matchType`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fiscalyear` (
  `id` VARCHAR(36) NOT NULL,
  `companyId` VARCHAR(36) NULL,
  `year` INT NOT NULL,
  `startDate` VARCHAR(10) NOT NULL,
  `endDate` VARCHAR(10) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  `isCurrent` BOOLEAN NOT NULL DEFAULT false,
  `closedAt` DATETIME(3) NULL,
  `closedBy` VARCHAR(36) NULL,
  `closingEntryId` VARCHAR(36) NULL,
  `openingEntryId` VARCHAR(36) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `fiscalyear_companyId_year_key` (`companyId`, `year`),
  INDEX `fiscalyear_companyId_idx` (`companyId`),
  INDEX `fiscalyear_companyId_status_idx` (`companyId`, `status`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `journalentry` ADD COLUMN `closingEntryId` VARCHAR(36) NULL, ADD COLUMN `openingEntryId` VARCHAR(36) NULL;
ALTER TABLE `journalentry` ADD CONSTRAINT `journalentry_closingEntryId_fkey` FOREIGN KEY (`closingEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `journalentry` ADD CONSTRAINT `journalentry_openingEntryId_fkey` FOREIGN KEY (`openingEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
