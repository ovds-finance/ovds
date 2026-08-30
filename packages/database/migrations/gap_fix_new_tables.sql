-- ============================================================================
-- Gap Fix Migration — New tables for accounting completeness
-- Run this against your MySQL database.
-- Generated for OVDS IFRS + Ethiopian Tax completeness update.
-- ============================================================================

-- WHT Certificate (Withholding Tax) — Proclamation No. 1395/2025
CREATE TABLE IF NOT EXISTS `wht_certificate` (
  `id`            VARCHAR(36)  NOT NULL,
  `certNo`        VARCHAR(50)  NOT NULL UNIQUE,
  `companyId`     VARCHAR(36)  NULL,
  `whtType`       VARCHAR(20)  NOT NULL DEFAULT 'GOODS',
  `issueDate`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `period`        VARCHAR(7)   NOT NULL,
  `agentName`     VARCHAR(200) NOT NULL,
  `agentTin`      VARCHAR(15)  NULL,
  `supplierName`  VARCHAR(200) NOT NULL,
  `supplierTin`   VARCHAR(15)  NULL,
  `grossAmount`   DECIMAL(18,2) NOT NULL DEFAULT 0,
  `whtRate`       DECIMAL(8,6)  NOT NULL DEFAULT 0.03,
  `whtAmount`     DECIMAL(18,2) NOT NULL DEFAULT 0,
  `netPayable`    DECIMAL(18,2) NOT NULL DEFAULT 0,
  `billId`        VARCHAR(36)  NULL,
  `billReference` VARCHAR(100) NULL,
  `remitted`      TINYINT(1)   NOT NULL DEFAULT 0,
  `remittedAt`    DATETIME(3)  NULL,
  `ercaReference` VARCHAR(100) NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `notes`         TEXT         NULL,
  `createdBy`     VARCHAR(100) NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `wht_cert_companyId_idx` (`companyId`),
  INDEX `wht_cert_period_idx`    (`period`),
  INDEX `wht_cert_status_idx`    (`status`),
  INDEX `wht_cert_tin_idx`       (`supplierTin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PAYE Declaration — Monthly PIT + DRRF to ERCA
CREATE TABLE IF NOT EXISTS `paye_declaration` (
  `id`               VARCHAR(36)   NOT NULL,
  `companyId`        VARCHAR(36)   NULL,
  `period`           VARCHAR(7)    NOT NULL,
  `employeeCount`    INT           NOT NULL DEFAULT 0,
  `totalGrossSalary` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalPit`         DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalEmpPension`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalEmpRPension` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalDrrf`        DECIMAL(18,2) NOT NULL DEFAULT 0,
  `netPayableErca`   DECIMAL(18,2) NOT NULL DEFAULT 0,
  `netPayablePfsa`   DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status`           VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
  `dueDate`          DATETIME(3)   NULL,
  `submittedAt`      DATETIME(3)   NULL,
  `ercaReference`    VARCHAR(100)  NULL,
  `paidAt`           DATETIME(3)   NULL,
  `paymentReference` VARCHAR(200)  NULL,
  `notes`            TEXT          NULL,
  `createdBy`        VARCHAR(100)  NULL,
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `paye_decl_company_period` (`companyId`, `period`),
  INDEX `paye_decl_period_idx` (`period`),
  INDEX `paye_decl_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pension Remittance — Monthly contributions to PFSA
CREATE TABLE IF NOT EXISTS `pension_remittance` (
  `id`                      VARCHAR(36)   NOT NULL,
  `companyId`               VARCHAR(36)   NULL,
  `period`                  VARCHAR(7)    NOT NULL,
  `employeeCount`           INT           NOT NULL DEFAULT 0,
  `totalInsurableEarnings`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `employeeContrib`         DECIMAL(18,2) NOT NULL DEFAULT 0,
  `employerContrib`         DECIMAL(18,2) NOT NULL DEFAULT 0,
  `totalContrib`            DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status`                  VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
  `dueDate`                 DATETIME(3)   NULL,
  `submittedAt`             DATETIME(3)   NULL,
  `pfsaReference`           VARCHAR(100)  NULL,
  `paidAt`                  DATETIME(3)   NULL,
  `paymentReference`        VARCHAR(200)  NULL,
  `bankName`                VARCHAR(100)  NULL,
  `notes`                   TEXT          NULL,
  `createdBy`               VARCHAR(100)  NULL,
  `createdAt`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pension_rem_company_period` (`companyId`, `period`),
  INDEX `pension_rem_period_idx` (`period`),
  INDEX `pension_rem_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Depreciation Schedule — Persistent IAS 16 depreciation record per asset per period
CREATE TABLE IF NOT EXISTS `depreciation_schedule` (
  `id`              VARCHAR(36)   NOT NULL,
  `assetId`         VARCHAR(36)   NOT NULL,
  `companyId`       VARCHAR(36)   NULL,
  `period`          VARCHAR(7)    NOT NULL,
  `openingCarrying` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `depreciationAmt` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `closingCarrying` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `accumulatedDepr` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `method`          VARCHAR(30)   NOT NULL DEFAULT 'STRAIGHT_LINE',
  `journalEntryId`  VARCHAR(36)   NULL,
  `status`          VARCHAR(20)   NOT NULL DEFAULT 'SCHEDULED',
  `notes`           VARCHAR(300)  NULL,
  `createdAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `depr_schedule_asset_period` (`assetId`, `period`),
  INDEX `depr_schedule_companyId_idx` (`companyId`),
  INDEX `depr_schedule_period_idx`    (`period`),
  INDEX `depr_schedule_status_idx`    (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Accrual / Prepayment — IAS 1 / IAS 37 deferred costs
CREATE TABLE IF NOT EXISTS `accrual_prepayment` (
  `id`               VARCHAR(36)   NOT NULL,
  `companyId`        VARCHAR(36)   NULL,
  `type`             VARCHAR(20)   NOT NULL DEFAULT 'ACCRUAL',
  `description`      VARCHAR(500)  NOT NULL,
  `accountId`        VARCHAR(36)   NULL,
  `counterAccountId` VARCHAR(36)   NULL,
  `amount`           DECIMAL(18,2) NOT NULL DEFAULT 0,
  `startDate`        DATETIME(3)   NOT NULL,
  `endDate`          DATETIME(3)   NOT NULL,
  `totalMonths`      INT           NOT NULL DEFAULT 1,
  `amortisedMonths`  INT           NOT NULL DEFAULT 0,
  `monthlyAmount`    DECIMAL(18,2) NOT NULL DEFAULT 0,
  `remainingAmount`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status`           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  `notes`            TEXT          NULL,
  `createdBy`        VARCHAR(100)  NULL,
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `accrual_companyId_idx` (`companyId`),
  INDEX `accrual_status_idx`    (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Accrual Posting — Monthly amortisation entries
CREATE TABLE IF NOT EXISTS `accrual_posting` (
  `id`             VARCHAR(36)   NOT NULL,
  `accrualId`      VARCHAR(36)   NOT NULL,
  `period`         VARCHAR(7)    NOT NULL,
  `amount`         DECIMAL(18,2) NOT NULL,
  `journalEntryId` VARCHAR(36)   NULL,
  `status`         VARCHAR(20)   NOT NULL DEFAULT 'POSTED',
  `createdAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `accrual_posting_accrualId_idx` (`accrualId`),
  INDEX `accrual_posting_period_idx`    (`period`),
  CONSTRAINT `fk_accrual_posting_accrual` FOREIGN KEY (`accrualId`) REFERENCES `accrual_prepayment`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stock Valuation Layer — IAS 2 FIFO/AVCO cost layers
CREATE TABLE IF NOT EXISTS `stock_valuation_layer` (
  `id`               VARCHAR(36)   NOT NULL,
  `itemId`           VARCHAR(36)   NOT NULL,
  `companyId`        VARCHAR(36)   NULL,
  `warehouseId`      VARCHAR(36)   NULL,
  `transactionType`  VARCHAR(20)   NOT NULL DEFAULT 'RECEIPT',
  `valuationMethod`  VARCHAR(10)   NOT NULL DEFAULT 'AVCO',
  `date`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `quantity`         DECIMAL(18,4) NOT NULL,
  `unitCost`         DECIMAL(18,4) NOT NULL,
  `totalCost`        DECIMAL(18,4) NOT NULL,
  `remainingQty`     DECIMAL(18,4) NOT NULL DEFAULT 0,
  `runningAvco`      DECIMAL(18,4) NULL,
  `runningQty`       DECIMAL(18,4) NULL,
  `runningValue`     DECIMAL(18,4) NULL,
  `reference`        VARCHAR(100)  NULL,
  `journalEntryId`   VARCHAR(36)   NULL,
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `stock_val_itemId_idx`    (`itemId`),
  INDEX `stock_val_companyId_idx` (`companyId`),
  INDEX `stock_val_date_idx`      (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Intercompany Elimination — IFRS 10.B86
CREATE TABLE IF NOT EXISTS `intercompany_elimination` (
  `id`               VARCHAR(36)   NOT NULL,
  `fromCompanyId`    VARCHAR(36)   NOT NULL,
  `toCompanyId`      VARCHAR(36)   NOT NULL,
  `intercompanyTxId` VARCHAR(36)   NULL,
  `period`           VARCHAR(7)    NOT NULL,
  `eliminationType`  VARCHAR(20)   NOT NULL DEFAULT 'RECEIVABLE',
  `amount`           DECIMAL(18,2) NOT NULL,
  `journalEntryId`   VARCHAR(36)   NULL,
  `status`           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  `notes`            TEXT          NULL,
  `createdBy`        VARCHAR(100)  NULL,
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `icoe_fromCompany_idx`  (`fromCompanyId`),
  INDEX `icoe_toCompany_idx`    (`toCompanyId`),
  INDEX `icoe_period_idx`       (`period`),
  INDEX `icoe_status_idx`       (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bank Payroll Export — bulk salary file generation
CREATE TABLE IF NOT EXISTS `bank_payroll_export` (
  `id`            VARCHAR(36)   NOT NULL,
  `companyId`     VARCHAR(36)   NULL,
  `period`        VARCHAR(7)    NOT NULL,
  `bankFormat`    VARCHAR(20)   NOT NULL DEFAULT 'GENERIC',
  `employeeCount` INT           NOT NULL DEFAULT 0,
  `totalAmount`   DECIMAL(18,2) NOT NULL DEFAULT 0,
  `fileName`      VARCHAR(255)  NULL,
  `fileData`      LONGTEXT      NULL,
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'GENERATED',
  `generatedBy`   VARCHAR(100)  NULL,
  `sentAt`        DATETIME(3)   NULL,
  `confirmedAt`   DATETIME(3)   NULL,
  `notes`         TEXT          NULL,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `bpe_companyId_idx` (`companyId`),
  INDEX `bpe_period_idx`    (`period`),
  INDEX `bpe_status_idx`    (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
