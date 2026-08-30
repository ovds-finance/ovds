-- ============================================================================
-- Migration: device_control_tables
-- Device Control Governance — org-wide maker-checker controls
--
-- Creates the enforced policy table and the maker-checker change-request table
-- for four high-impact control categories (encryption, app permissions,
-- network policies, enforcement rules). A change request must be approved by a
-- second person before the policy is enforced org-wide.
--
-- Validates: org-wide controls with immediate, centralized, far-reaching
-- enforcement via maker-checker review.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `device_control_policy` (
  `id`                VARCHAR(36)  NOT NULL,
  `companyId`         VARCHAR(191) NOT NULL,
  `category`          ENUM('ENCRYPTION', 'APP_PERMISSION', 'NETWORK_POLICY', 'ENFORCEMENT_RULE') NOT NULL,
  `version`           INT          NOT NULL DEFAULT 1,
  `settings`          LONGTEXT     NOT NULL,
  `changeRequestId`   VARCHAR(36)  NULL,
  `enforcedAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `enforcedById`      VARCHAR(191) NULL,
  `createdAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_device_control_policy_company_category` (`companyId`, `category`),
  KEY `idx_device_control_policy_company` (`companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enforced org-wide device control policy per company + category';

CREATE TABLE IF NOT EXISTS `device_control_change_request` (
  `id`                 VARCHAR(36)  NOT NULL,
  `companyId`          VARCHAR(191) NOT NULL,
  `category`           ENUM('ENCRYPTION', 'APP_PERMISSION', 'NETWORK_POLICY', 'ENFORCEMENT_RULE') NOT NULL,
  `settings`           LONGTEXT     NOT NULL,
  `reason`             TEXT         NULL,
  `status`             ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `makerId`            VARCHAR(191) NULL,
  `makerName`          VARCHAR(191) NULL,
  `submittedAt`        DATETIME(3)  NULL,
  `checkerId`          VARCHAR(191) NULL,
  `checkerName`        VARCHAR(191) NULL,
  `reviewedAt`         DATETIME(3)  NULL,
  `reviewNote`         TEXT         NULL,
  `resultingPolicyId`  VARCHAR(36)  NULL,
  `createdAt`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_device_control_cr_company_status` (`companyId`, `status`),
  KEY `idx_device_control_cr_company_category` (`companyId`, `category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maker-checker change request for an org-wide device control policy';
