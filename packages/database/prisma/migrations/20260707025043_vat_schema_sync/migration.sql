-- Migration: vat_schema_sync
-- Brings the eight VAT Prisma models into sync with the schema.prisma definitions.
-- These columns and indexes were previously managed by VatService.onModuleInit()
-- via $executeRawUnsafe DDL calls (G8 bug). This migration replaces that runtime DDL
-- with a proper, tracked Prisma migration.
--
-- All operations are ADDITIVE — no data is dropped or modified.
-- Safe to run on a database that already had the columns added by the old DDL.
--
-- NOTE: MariaDB 10.x does not support ADD CONSTRAINT IF NOT EXISTS.
-- FK guards use DROP PROCEDURE IF EXISTS + a procedure that checks
-- information_schema.TABLE_CONSTRAINTS before adding the constraint.

-- ─── 1. vatinputledger — add companyId, annexure columns ─────────────────────
ALTER TABLE `vatinputledger`
  ADD COLUMN IF NOT EXISTS `companyId`        VARCHAR(36)   NULL AFTER `updatedAt`,
  ADD COLUMN IF NOT EXISTS `supplierVatRegNo` VARCHAR(50)   NULL AFTER `companyId`,
  ADD COLUMN IF NOT EXISTS `importDeclNo`     VARCHAR(100)  NULL AFTER `supplierVatRegNo`,
  ADD COLUMN IF NOT EXISTS `hsCode`           VARCHAR(20)   NULL AFTER `importDeclNo`,
  ADD COLUMN IF NOT EXISTS `apportionmentPct` DECIMAL(5, 4) NOT NULL DEFAULT 1.0000 AFTER `hsCode`;

CREATE INDEX IF NOT EXISTS `vatinputledger_companyId_period_idx` ON `vatinputledger` (`companyId`, `period`);

DROP PROCEDURE IF EXISTS _add_fk_vatinputledger;
CREATE PROCEDURE _add_fk_vatinputledger()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatinputledger'
      AND CONSTRAINT_NAME   = 'vatinputledger_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatinputledger`
      ADD CONSTRAINT `vatinputledger_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatinputledger();
DROP PROCEDURE IF EXISTS _add_fk_vatinputledger;

-- ─── 2. vatoutputledger — add companyId, buyerVatRegNo ────────────────────────
ALTER TABLE `vatoutputledger`
  ADD COLUMN IF NOT EXISTS `companyId`     VARCHAR(36) NULL AFTER `updatedAt`,
  ADD COLUMN IF NOT EXISTS `buyerVatRegNo` VARCHAR(50) NULL AFTER `companyId`;

CREATE INDEX IF NOT EXISTS `vatoutputledger_companyId_period_idx` ON `vatoutputledger` (`companyId`, `period`);

DROP PROCEDURE IF EXISTS _add_fk_vatoutputledger;
CREATE PROCEDURE _add_fk_vatoutputledger()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatoutputledger'
      AND CONSTRAINT_NAME   = 'vatoutputledger_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatoutputledger`
      ADD CONSTRAINT `vatoutputledger_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatoutputledger();
DROP PROCEDURE IF EXISTS _add_fk_vatoutputledger;

-- ─── 3. vatreverscharge — add companyId ──────────────────────────────────────
ALTER TABLE `vatreverscharge`
  ADD COLUMN IF NOT EXISTS `companyId` VARCHAR(36) NULL AFTER `updatedAt`;

CREATE INDEX IF NOT EXISTS `vatreverscharge_companyId_period_idx` ON `vatreverscharge` (`companyId`, `period`);

DROP PROCEDURE IF EXISTS _add_fk_vatreverscharge;
CREATE PROCEDURE _add_fk_vatreverscharge()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatreverscharge'
      AND CONSTRAINT_NAME   = 'vatreverscharge_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatreverscharge`
      ADD CONSTRAINT `vatreverscharge_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatreverscharge();
DROP PROCEDURE IF EXISTS _add_fk_vatreverscharge;

-- ─── 4. vatrefundclaim — add companyId ───────────────────────────────────────
ALTER TABLE `vatrefundclaim`
  ADD COLUMN IF NOT EXISTS `companyId` VARCHAR(36) NULL AFTER `updatedAt`;

CREATE INDEX IF NOT EXISTS `vatrefundclaim_companyId_period_idx` ON `vatrefundclaim` (`companyId`, `period`);

DROP PROCEDURE IF EXISTS _add_fk_vatrefundclaim;
CREATE PROCEDURE _add_fk_vatrefundclaim()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatrefundclaim'
      AND CONSTRAINT_NAME   = 'vatrefundclaim_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatrefundclaim`
      ADD CONSTRAINT `vatrefundclaim_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatrefundclaim();
DROP PROCEDURE IF EXISTS _add_fk_vatrefundclaim;

-- ─── 5. vatnote — add companyId ──────────────────────────────────────────────
ALTER TABLE `vatnote`
  ADD COLUMN IF NOT EXISTS `companyId` VARCHAR(36) NULL AFTER `updatedAt`;

CREATE INDEX IF NOT EXISTS `vatnote_companyId_idx` ON `vatnote` (`companyId`);

DROP PROCEDURE IF EXISTS _add_fk_vatnote;
CREATE PROCEDURE _add_fk_vatnote()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatnote'
      AND CONSTRAINT_NAME   = 'vatnote_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatnote`
      ADD CONSTRAINT `vatnote_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatnote();
DROP PROCEDURE IF EXISTS _add_fk_vatnote;

-- ─── 6. vatwithholding — add companyId, supplierVatRegNo ─────────────────────
ALTER TABLE `vatwithholding`
  ADD COLUMN IF NOT EXISTS `companyId`        VARCHAR(36) NULL AFTER `updatedAt`,
  ADD COLUMN IF NOT EXISTS `supplierVatRegNo` VARCHAR(50) NULL AFTER `companyId`;

CREATE INDEX IF NOT EXISTS `vatwithholding_companyId_period_idx` ON `vatwithholding` (`companyId`, `period`);

DROP PROCEDURE IF EXISTS _add_fk_vatwithholding;
CREATE PROCEDURE _add_fk_vatwithholding()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatwithholding'
      AND CONSTRAINT_NAME   = 'vatwithholding_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatwithholding`
      ADD CONSTRAINT `vatwithholding_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatwithholding();
DROP PROCEDURE IF EXISTS _add_fk_vatwithholding;

-- ─── 7. vatexportevidence — add companyId, exportPermitNo, freightInvoiceNo ──
ALTER TABLE `vatexportevidence`
  ADD COLUMN IF NOT EXISTS `companyId`         VARCHAR(36)  NULL AFTER `updatedAt`,
  ADD COLUMN IF NOT EXISTS `exportPermitNo`    VARCHAR(100) NULL AFTER `companyId`,
  ADD COLUMN IF NOT EXISTS `freightInvoiceNo`  VARCHAR(100) NULL AFTER `exportPermitNo`;

CREATE INDEX IF NOT EXISTS `vatexportevidence_companyId_idx` ON `vatexportevidence` (`companyId`);

DROP PROCEDURE IF EXISTS _add_fk_vatexportevidence;
CREATE PROCEDURE _add_fk_vatexportevidence()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatexportevidence'
      AND CONSTRAINT_NAME   = 'vatexportevidence_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatexportevidence`
      ADD CONSTRAINT `vatexportevidence_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatexportevidence();
DROP PROCEDURE IF EXISTS _add_fk_vatexportevidence;

-- ─── 8. vatetaxsubmission — add companyId ────────────────────────────────────
-- Note: submittedBy was already in the original CREATE TABLE, so only companyId is added here.
ALTER TABLE `vatetaxsubmission`
  ADD COLUMN IF NOT EXISTS `companyId` VARCHAR(36) NULL AFTER `updatedAt`;

CREATE INDEX IF NOT EXISTS `vatetaxsubmission_companyId_period_idx` ON `vatetaxsubmission` (`companyId`, `period`);

DROP PROCEDURE IF EXISTS _add_fk_vatetaxsubmission;
CREATE PROCEDURE _add_fk_vatetaxsubmission()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME        = 'vatetaxsubmission'
      AND CONSTRAINT_NAME   = 'vatetaxsubmission_companyId_fkey'
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE `vatetaxsubmission`
      ADD CONSTRAINT `vatetaxsubmission_companyId_fkey`
      FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
CALL _add_fk_vatetaxsubmission();
DROP PROCEDURE IF EXISTS _add_fk_vatetaxsubmission;
