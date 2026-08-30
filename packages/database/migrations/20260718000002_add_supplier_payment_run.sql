-- ============================================================================
-- Supplier Payment Run Migration — PaymentBatch and PaymentBatchItem enhancements
-- Run this against your MySQL database.
-- ============================================================================

-- PaymentBatch — add supplier payment run fields
ALTER TABLE `paymentbatch`
  ADD COLUMN `paymentRunDate`     DATETIME(3)   NULL,
  ADD COLUMN `paymentMethod`      VARCHAR(50)   NULL,
  ADD COLUMN `bankAccountId`      VARCHAR(36)   NULL,
  ADD COLUMN `approvedBy`         VARCHAR(100)  NULL,
  ADD COLUMN `approvedAt`         DATETIME(3)   NULL,
  ADD COLUMN `submittedBy`        VARCHAR(100)  NULL,
  ADD COLUMN `submittedAt`        DATETIME(3)   NULL,
  ADD COLUMN `chequeNumber`       VARCHAR(100)  NULL,
  ADD COLUMN `paymentReference`   VARCHAR(200)  NULL,
  ADD COLUMN `dueDateFrom`        DATETIME(3)   NULL,
  ADD COLUMN `dueDateTo`          DATETIME(3)   NULL,
  ADD COLUMN `includeWht`         TINYINT(1)    NOT NULL DEFAULT 1,
  ADD COLUMN `minAmount`          DECIMAL(18,2) NULL,
  ADD COLUMN `maxAmount`          DECIMAL(18,2) NULL,
  ADD COLUMN `vendorIds`          LONGTEXT      NULL,
  ADD COLUMN `priority`           VARCHAR(20)   NOT NULL DEFAULT 'DUE_DATE',
  ADD COLUMN `cashDiscount`       TINYINT(1)    NOT NULL DEFAULT 0,
  ADD COLUMN `cashDiscountPct`    DECIMAL(5,2)  NULL;

-- PaymentBatchItem — add supplier payment run fields
ALTER TABLE `paymentbatchitem`
  ADD COLUMN `paymentMethod` VARCHAR(50)   NULL,
  ADD COLUMN `reference`     VARCHAR(200)  NULL,
  ADD COLUMN `bankAccountId` VARCHAR(36)   NULL,
  ADD COLUMN `chequeNumber`  VARCHAR(100)  NULL,
  ADD COLUMN `dueDate`       DATETIME(3)   NULL,
  ADD COLUMN `isPriority`    TINYINT(1)    NOT NULL DEFAULT 0,
  ADD COLUMN `cashDiscount`  DECIMAL(18,2) NULL,
  ADD COLUMN `whtAmount`     DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN `netPayable`    DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN `status`        VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `paidAt`        DATETIME(3)   NULL,
  ADD COLUMN `vendorName`    VARCHAR(200)  NULL;
