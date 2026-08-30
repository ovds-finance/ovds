-- ═══════════════════════════════════════════════════════════════════════════════
-- Ethiopian Tax Rule-Based Tax Module — Enhanced TaxRate Schema
-- Adds: calculationType, isInclusive, isCompound, compoundParentId,
--       specificAmount, roundingRule to tax_rate table.
-- Supports: NORMAL, INCLUSIVE, COMPOUND, FIXED calculation methods.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add new enum values for tax calculation type
ALTER TABLE `tax_rate`
  ADD COLUMN `calculationType` ENUM('NORMAL','INCLUSIVE','COMPOUND','FIXED','WITHHOLDING') NOT NULL DEFAULT 'NORMAL' AFTER `type`,
  ADD COLUMN `isInclusive` TINYINT(1) NOT NULL DEFAULT 0 AFTER `calculationType`,
  ADD COLUMN `isCompound` TINYINT(1) NOT NULL DEFAULT 0 AFTER `isInclusive`,
  ADD COLUMN `compoundParentId` VARCHAR(36) NULL AFTER `isCompound`,
  ADD COLUMN `specificAmount` DECIMAL(18,2) NULL AFTER `compoundParentId`,
  ADD COLUMN `roundingRule` VARCHAR(20) NOT NULL DEFAULT 'HALF_UP' AFTER `specificAmount`,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `roundingRule`,
  ADD INDEX `idx_taxrate_calc_type` (`calculationType`),
  ADD INDEX `idx_taxrate_compound_parent` (`compoundParentId`);

-- Self-referencing FK for compound tax chaining
ALTER TABLE `tax_rate`
  ADD CONSTRAINT `TaxRate_compoundParentId_fk`
  FOREIGN KEY (`compoundParentId`) REFERENCES `tax_rate`(`id`) ON DELETE SET NULL;
