-- Migration: 20260701000001_add_iot_tables
-- Creates all IoT & Smart Management tables that were present in the Prisma
-- schema but missing from the database, causing P2022 errors on every IoT page.

-- ── iot_device ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `iot_device` (
  `id`               VARCHAR(36)    NOT NULL,
  `companyId`        VARCHAR(36)    NULL,
  `name`             VARCHAR(200)   NOT NULL,
  `serialNumber`     VARCHAR(100)   NOT NULL,
  `externalRef`      VARCHAR(100)   NULL,
  `deviceType`       VARCHAR(30)    NOT NULL DEFAULT 'SENSOR',
  `location`         VARCHAR(300)   NULL,
  `firmwareVersion`  VARCHAR(50)    NULL,
  `hardwareVersion`  VARCHAR(50)    NULL,
  `manufacturer`     VARCHAR(100)   NULL,
  `model`            VARCHAR(100)   NULL,
  `status`           VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
  `lastSeenAt`       DATETIME(3)    NULL,
  `batteryLevel`     INT            NULL,
  `uptimeHours`      DECIMAL(12,2)  NULL,
  `connectionString` VARCHAR(500)   NULL,
  `protocol`         VARCHAR(20)    NULL,
  `configJson`       LONGTEXT       NULL,
  `customerId`       VARCHAR(36)    NULL,
  `fixedAssetId`     VARCHAR(36)    NULL,
  `notes`            TEXT           NULL,
  `createdBy`        VARCHAR(100)   NULL,
  `createdAt`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)    NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `iot_device_companyId_idx`  (`companyId`),
  INDEX `iot_device_status_idx`     (`status`),
  INDEX `iot_device_deviceType_idx` (`deviceType`),
  INDEX `iot_device_customerId_idx` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── iot_telemetry ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `iot_telemetry` (
  `id`          VARCHAR(36)     NOT NULL,
  `deviceId`    VARCHAR(36)     NOT NULL,
  `companyId`   VARCHAR(36)     NULL,
  `metricKey`   VARCHAR(50)     NOT NULL,
  `value`       DECIMAL(18,6)   NOT NULL,
  `unit`        VARCHAR(20)     NULL,
  `recordedAt`  DATETIME(3)     NOT NULL,
  `quality`     VARCHAR(10)     NOT NULL DEFAULT 'NORMAL',
  `rawPayload`  LONGTEXT        NULL,
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `iot_telemetry_deviceId_idx`   (`deviceId`),
  INDEX `iot_telemetry_metricKey_idx`  (`metricKey`),
  INDEX `iot_telemetry_recordedAt_idx` (`recordedAt`),
  INDEX `iot_telemetry_companyId_idx`  (`companyId`),

  CONSTRAINT `iot_telemetry_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `iot_device` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── iot_alert ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `iot_alert` (
  `id`               VARCHAR(36)    NOT NULL,
  `deviceId`         VARCHAR(36)    NOT NULL,
  `companyId`        VARCHAR(36)    NULL,
  `alertType`        VARCHAR(30)    NOT NULL,
  `severity`         VARCHAR(10)    NOT NULL DEFAULT 'WARNING',
  `title`            VARCHAR(300)   NOT NULL,
  `message`          TEXT           NOT NULL,
  `metricKey`        VARCHAR(50)    NULL,
  `thresholdValue`   DECIMAL(18,6)  NULL,
  `actualValue`      DECIMAL(18,6)  NULL,
  `status`           VARCHAR(20)    NOT NULL DEFAULT 'OPEN',
  `acknowledgedBy`   VARCHAR(100)   NULL,
  `acknowledgedAt`   DATETIME(3)    NULL,
  `resolvedAt`       DATETIME(3)    NULL,
  `linkedInvoiceId`  VARCHAR(36)    NULL,
  `createdAt`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)    NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `iot_alert_deviceId_idx`   (`deviceId`),
  INDEX `iot_alert_status_idx`     (`status`),
  INDEX `iot_alert_alertType_idx`  (`alertType`),
  INDEX `iot_alert_companyId_idx`  (`companyId`),

  CONSTRAINT `iot_alert_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `iot_device` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ota_update_job ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ota_update_job` (
  `id`              VARCHAR(36)    NOT NULL,
  `deviceId`        VARCHAR(36)    NOT NULL,
  `companyId`       VARCHAR(36)    NULL,
  `targetVersion`   VARCHAR(50)    NOT NULL,
  `fromVersion`     VARCHAR(50)    NULL,
  `packageUrl`      VARCHAR(500)   NULL,
  `status`          VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
  `progress`        INT            NOT NULL DEFAULT 0,
  `scheduledAt`     DATETIME(3)    NULL,
  `startedAt`       DATETIME(3)    NULL,
  `completedAt`     DATETIME(3)    NULL,
  `errorMessage`    VARCHAR(1000)  NULL,
  `rollbackReason`  VARCHAR(500)   NULL,
  `initiatedBy`     VARCHAR(100)   NULL,
  `releaseNotes`    TEXT           NULL,
  `createdAt`       DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)    NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `ota_update_job_deviceId_idx`   (`deviceId`),
  INDEX `ota_update_job_status_idx`     (`status`),
  INDEX `ota_update_job_companyId_idx`  (`companyId`),

  CONSTRAINT `ota_update_job_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `iot_device` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── iot_billing_trigger ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `iot_billing_trigger` (
  `id`                  VARCHAR(36)    NOT NULL,
  `deviceId`            VARCHAR(36)    NOT NULL,
  `companyId`           VARCHAR(36)    NULL,
  `customerId`          VARCHAR(36)    NULL,
  `triggerType`         VARCHAR(30)    NOT NULL,
  `metricKey`           VARCHAR(50)    NULL,
  `thresholdValue`      DECIMAL(18,6)  NULL,
  `actualValue`         DECIMAL(18,6)  NULL,
  `lineItemDescription` VARCHAR(500)   NOT NULL,
  `billableAmount`      DECIMAL(18,2)  NOT NULL DEFAULT 0,
  `currencyCode`        VARCHAR(3)     NOT NULL DEFAULT 'ETB',
  `invoiced`            TINYINT(1)     NOT NULL DEFAULT 0,
  `linkedInvoiceId`     VARCHAR(36)    NULL,
  `linkedInvoiceNo`     VARCHAR(100)   NULL,
  `invoicedAt`          DATETIME(3)    NULL,
  `snapshotJson`        LONGTEXT       NULL,
  `createdAt`           DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3)    NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `iot_billing_trigger_deviceId_idx`   (`deviceId`),
  INDEX `iot_billing_trigger_companyId_idx`  (`companyId`),
  INDEX `iot_billing_trigger_customerId_idx` (`customerId`),
  INDEX `iot_billing_trigger_invoiced_idx`   (`invoiced`),

  CONSTRAINT `iot_billing_trigger_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `iot_device` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── iot_dashboard_widget ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `iot_dashboard_widget` (
  `id`          VARCHAR(36)   NOT NULL,
  `companyId`   VARCHAR(36)   NULL,
  `userId`      VARCHAR(36)   NULL,
  `widgetType`  VARCHAR(50)   NOT NULL,
  `title`       VARCHAR(200)  NOT NULL,
  `configJson`  LONGTEXT      NOT NULL,
  `posX`        INT           NOT NULL DEFAULT 0,
  `posY`        INT           NOT NULL DEFAULT 0,
  `width`       INT           NOT NULL DEFAULT 2,
  `height`      INT           NOT NULL DEFAULT 2,
  `isVisible`   TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `iot_dashboard_widget_companyId_idx` (`companyId`),
  INDEX `iot_dashboard_widget_userId_idx`    (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
