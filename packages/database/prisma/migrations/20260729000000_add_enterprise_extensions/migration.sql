-- Enterprise Extensions: Multi-Entity, Offline Resilience, and Business Operations
-- Migration: 20260729000000_add_enterprise_extensions

-- Entity (multi-entity hierarchy)
CREATE TABLE IF NOT EXISTS `entity` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `companyId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `parentId` VARCHAR(36) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `entity_companyId_idx` (`companyId`),
  UNIQUE INDEX `entity_companyId_code_key` (`companyId`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- StockMovement (inventory tracking)
CREATE TABLE IF NOT EXISTS `stock_movement` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `companyId` VARCHAR(36) NOT NULL,
  `itemId` VARCHAR(36) NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `quantity` DECIMAL(19,4) NOT NULL,
  `unitCost` DECIMAL(19,4) NOT NULL,
  `reference` VARCHAR(200) NULL,
  `warehouseFrom` VARCHAR(100) NULL,
  `warehouseTo` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `stock_movement_companyId_idx` (`companyId`),
  INDEX `stock_movement_itemId_idx` (`itemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PurchaseReceipt (goods receipt tracking)
CREATE TABLE IF NOT EXISTS `purchase_receipt` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `companyId` VARCHAR(36) NOT NULL,
  `purchaseOrderId` VARCHAR(36) NULL,
  `vendorId` VARCHAR(36) NOT NULL,
  `receiptNumber` VARCHAR(100) NOT NULL,
  `items` LONGTEXT NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `purchase_receipt_companyId_idx` (`companyId`),
  UNIQUE INDEX `purchase_receipt_companyId_receiptNumber_key` (`companyId`, `receiptNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BankStatementLine (reconciliation)
CREATE TABLE IF NOT EXISTS `bank_statement_line` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `bankAccountId` VARCHAR(36) NOT NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `description` VARCHAR(500) NOT NULL,
  `amount` DECIMAL(19,4) NOT NULL,
  `type` VARCHAR(10) NOT NULL,
  `matched` TINYINT(1) NOT NULL DEFAULT 0,
  `matchedEntryId` VARCHAR(36) NULL,
  `companyId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `bank_statement_line_bankAccountId_idx` (`bankAccountId`),
  INDEX `bank_statement_line_companyId_matched_idx` (`companyId`, `matched`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SyncQueue (offline-first resilience)
CREATE TABLE IF NOT EXISTS `sync_queue` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `companyId` VARCHAR(36) NOT NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` VARCHAR(36) NOT NULL,
  `action` VARCHAR(20) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `attempts` INT NOT NULL DEFAULT 0,
  `lastError` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `sync_queue_companyId_status_idx` (`companyId`, `status`),
  INDEX `sync_queue_entityType_entityId_idx` (`entityType`, `entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enums (stored as strings, no native ENUM for MySQL compatibility)
-- StockMovementType: IN, OUT, ADJUSTMENT, TRANSFER
-- BankTxnType: CREDIT, DEBIT
-- SyncStatus: PENDING, SYNCING, COMPLETED, FAILED

-- Add entityId to existing models for multi-entity support
ALTER TABLE `invoice` ADD COLUMN `entityId` VARCHAR(36) NULL AFTER `companyId`;
ALTER TABLE `bill` ADD COLUMN `entityId` VARCHAR(36) NULL AFTER `companyId`;
ALTER TABLE `journalentry` ADD COLUMN `entityId` VARCHAR(36) NULL AFTER `companyId`;

-- Indexes for entityId columns
CREATE INDEX `invoice_entityId_idx` ON `invoice` (`entityId`);
CREATE INDEX `bill_entityId_idx` ON `bill` (`entityId`);
CREATE INDEX `journalentry_entityId_idx` ON `journalentry` (`entityId`);
