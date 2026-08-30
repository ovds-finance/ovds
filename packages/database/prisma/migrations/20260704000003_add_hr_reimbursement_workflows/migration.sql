-- Migration: add_hr_reimbursement_workflows
-- Adds HR Reimbursement Workflow A (Corporate Agency invoice) and
-- Workflow B (Worker/Candidate Cost Recovery) fields to existing models,
-- and creates a standalone DebitNote model for the /ovds/debit-notes CRUD UI.
-- Date: 2026-07-04

-- ─── 1. ReimbursementClaim — add workflowType, candidateName, recoveryClause, advanceLinkId ───
ALTER TABLE `reimbursementclaim`
  ADD COLUMN `workflowType`   VARCHAR(50)   NULL DEFAULT 'EMPLOYEE_EXPENSE'   AFTER `type`,
  ADD COLUMN `candidateName`  VARCHAR(200)  NULL                               AFTER `workflowType`,
  ADD COLUMN `recoveryClause` TINYINT(1)    NOT NULL DEFAULT 0                 AFTER `candidateName`,
  ADD COLUMN `advanceLinkId`  VARCHAR(36)   NULL                               AFTER `recoveryClause`;

CREATE INDEX `ReimbursementClaim_workflowType_idx` ON `reimbursementclaim` (`workflowType`);

-- ─── 2. LoanRequest — add candidateName for recruitment advances ────────────
ALTER TABLE `loanrequest`
  ADD COLUMN `candidateName` VARCHAR(200) NULL AFTER `purpose`;

CREATE INDEX `LoanRequest_category_idx` ON `loanrequest` (`category`);

-- ─── 3. Bill — add agency placement fields ──────────────────────────────────
ALTER TABLE `bill`
  ADD COLUMN `guaranteePeriodDays` INT          NULL AFTER `notes`,
  ADD COLUMN `placementDate`       DATETIME     NULL AFTER `guaranteePeriodDays`,
  ADD COLUMN `linkedEmployeeId`    VARCHAR(36)  NULL AFTER `placementDate`;

CREATE INDEX `Bill_linkedEmployeeId_idx` ON `bill` (`linkedEmployeeId`);

-- ─── 4. DebitNote — standalone model for /ovds/debit-notes CRUD ──────────
CREATE TABLE `debitnote` (
  `id`              VARCHAR(36)   NOT NULL,
  `debitNoteNumber` VARCHAR(100)  NOT NULL,
  `billId`          VARCHAR(36)   NULL,
  `billNumber`      VARCHAR(100)  NULL,
  `vendorId`        VARCHAR(36)   NULL,
  `vendorName`      VARCHAR(200)  NULL,
  `debitDate`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason`          VARCHAR(500)  NULL,
  `subtotal`        DECIMAL(30,0) NOT NULL DEFAULT 0,
  `taxAmount`       DECIMAL(30,0) NOT NULL DEFAULT 0,
  `total`           DECIMAL(30,0) NOT NULL DEFAULT 0,
  `notes`           TEXT          NULL,
  `status`          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
  `companyId`       VARCHAR(36)   NULL,
  `createdAt`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `DebitNote_debitNoteNumber_key` (`debitNoteNumber`),
  INDEX `DebitNote_companyId_idx`   (`companyId`),
  INDEX `DebitNote_billId_idx`      (`billId`),
  INDEX `DebitNote_vendorId_idx`    (`vendorId`),
  INDEX `DebitNote_status_idx`      (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
