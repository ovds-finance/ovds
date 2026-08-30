-- ============================================================================
-- Migration: add_local_nodes_table
-- Module 2 — Cloud Privilege Assignment (Invoice Hybrid Download)
--
-- Creates the local_nodes table to persist registered on-premise invoice
-- module installations under cloud accounts.
--
-- Validates: Requirements 2.3, 2.4
-- ============================================================================

CREATE TABLE IF NOT EXISTS `local_nodes` (
  `node_id`                VARCHAR(36)  NOT NULL,
  `cloud_account_id`       VARCHAR(36)  NOT NULL,
  `privilege_level`        ENUM('READ_ONLY', 'STANDARD', 'ADMIN')
                                        NOT NULL DEFAULT 'STANDARD',
  `registration_timestamp` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_seen_timestamp`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revoked`                TINYINT(1)   NOT NULL DEFAULT 0,

  PRIMARY KEY (`node_id`),

  INDEX `idx_local_nodes_cloud_account` (`cloud_account_id`),
  INDEX `idx_local_nodes_revoked`       (`revoked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registered on-premise invoice module nodes linked to cloud accounts';
