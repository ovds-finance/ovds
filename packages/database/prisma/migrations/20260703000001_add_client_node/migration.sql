-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_client_node
-- Created:   2026-07-03
-- Purpose:   Stores workstation nodes for the hybrid Client.
--            Each row is one registered workstation under a company.
--            The raw node token is NEVER stored — only its SHA-256 hash.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE `client_node` (
  `id`           VARCHAR(64)  NOT NULL,
  `companyId`    VARCHAR(191) NOT NULL,
  `friendlyName` VARCHAR(80)  NOT NULL,
  `role`         VARCHAR(20)  NOT NULL DEFAULT 'REMOTE_TERMINAL',
  `tokenHash`    VARCHAR(64)  NOT NULL,
  `lastSeenAt`   DATETIME(3)  NULL,
  `registeredAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  -- Fast lookup by company (list nodes, assert entitlement)
  INDEX `client_node_companyId_idx` (`companyId`),

  -- Fast lookup on sync-token issuance (validate node token)
  INDEX `client_node_tokenHash_idx` (`tokenHash`),

  CONSTRAINT `client_node_companyId_fkey`
    FOREIGN KEY (`companyId`)
    REFERENCES `company` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
