-- ============================================================================
-- Acknowledgement Vault — ackPayload column
-- OVDS ovds — MoR e-Tax immutable receipt vault (blueprint §7.2.2, §28.1)
-- ============================================================================
-- Adds `ackPayload` (LongText) to `mor_acknowledgement_receipt` to persist the
-- canonical JSON used as the SHA-256 documentHash input, enabling tamper-evident
-- verification (AcknowledgementVaultService.verifyReceipt).
--
-- Safe to re-run: guarded by IF NOT EXISTS (information_schema introspection).
-- ============================================================================

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name   = 'mor_acknowledgement_receipt'
    AND column_name  = 'ackPayload'
);

SET @sql = IF(
  @col_exists = 0,
  "ALTER TABLE `mor_acknowledgement_receipt`
     ADD COLUMN `ackPayload` LONGTEXT NULL COMMENT 'Canonical JSON hash input for documentHash (tamper-evident)'",
  "SELECT 'ackPayload column already exists' AS note"
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
